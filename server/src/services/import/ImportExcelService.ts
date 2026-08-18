/**
 * ImportExcelService
 *
 * Orchestrates the full import pipeline: parse → match → version → log.
 *
 * Responsibilities:
 *   1. parseFile(buffer) — auto-detects the source file format and parses it
 *      into ImportRow[]:
 *
 *      a. Multi-sheet files (Informes_Convenios_Deudas.xlsx):
 *         One worksheet per Prisma table. Headers vary per sheet and are
 *         matched through a normalized alias map (lowercase, accent-stripped,
 *         whitespace-free). Each row is tagged with its target `table_name`
 *         (and `person_id` for Type2 person tables, resolved from the Person
 *         registry by alias) so the pipeline can skip cross-table matching.
 *         SALDO cells are Excel formula objects; the numeric value is taken
 *         from `.result` when present, otherwise computed as
 *         Monto − Pago Parcial (the universal formula pattern in these files).
 *         Sheets without a mapped Prisma table are skipped (warned or silent).
 *
 *      b. Positional informe diario (INFORME DIARIO - <persona>.xlsx):
 *         Single sheet; title row 5, empty row 6, data from row 7.
 *         Column 1 = fecha, column 15 = beneficiary name, column 16 = detalle,
 *         column 17 = monto. Rows are resolved by beneficiary name through
 *         MatchingService against the Person tables.
 *
 *      c. Generic single-sheet (legacy INFORME DIARIO layout): header row
 *         detected as the first row with ≥ 2 non-empty cells; columns mapped
 *         case/alias-insensitively. Preserved for backward compatibility.
 *
 *   2. importFile(buffer, importDate, sourceFileName, opts?) — processes rows in
 *      chunks of 100; for each row individually wrapped in try/catch so one
 *      bad row never aborts the entire import; calls the version → audit
 *      pipeline (matching is skipped for parse-tagged rows); builds and
 *      returns an ImportResult summary. `opts.nro_expediente`/`opts.fecha_carga`
 *      enable eventual mode (es_eventual tagging + summary counter).
 *
 * Dependencies (injected via constructor):
 *   - PrismaClient            (passed through to sub-services)
 *   - MatchingService         (dual-criteria match across 14 tables)
 *   - VersioningService       (Type1 upsert / Type2 create)
 *   - ReportesHistoricoService (immutable audit log; never throws)
 *   - NameNormalizationService (used for header name normalization during parse)
 *
 * ExcelJS note:
 *   workbook.xlsx.load() expects a Buffer (Node.js).
 *   row.values is a 1-indexed sparse array; index 0 is always undefined.
 */

import ExcelJS from 'exceljs';
import type { PrismaClient } from '@prisma/client';
import type { ImportRow, ImportResult, TableType, VersionedRowResult, ImportFileOptions } from './types.js';
import type { MatchingService } from './MatchingService.js';
import type { VersioningService } from './VersioningService.js';
import type { ReportesHistoricoService } from './ReportesHistoricoService.js';
import type { NameNormalizationService } from './NameNormalizationService.js';
import { GENERIC_TABLES, PERSON_TABLES } from './types.js';
import { ExpedienteNormalizationService } from './ExpedienteNormalizationService.js';
import { extractMunicipio } from '../../utils/ReferenteParser.js';
import { normalizeMunicipio } from '../../utils/MunicipioNormalizer.js';

// ─── Format / Sheet constants ─────────────────────────────────────────────────

/** Real-file sheet name → Prisma table mapping (Informes_Convenios_Deudas.xlsx). */
const SHEET_TABLE_MAP: Record<string, { table_name: string; table_type: TableType }> = {
  Expedientes:    { table_name: 'expedientes',    table_type: 'Type1' },
  CONVENIOSMunic: { table_name: 'conveniosMunic', table_type: 'Type1' },
  DeudasEXPTES:   { table_name: 'deudasEXPTES',   table_type: 'Type1' },
  Instituciones:  { table_name: 'instituciones',  table_type: 'Type1' },
  Intendentes026: { table_name: 'intendentes026', table_type: 'Type1' },
  Diputados:      { table_name: 'diputados',      table_type: 'Type1' },
  PiniHerrera:    { table_name: 'piniHerrera',    table_type: 'Type2' },
  GabiPedrali:    { table_name: 'gabiPedrali',    table_type: 'Type2' },
  TeresitaMadera: { table_name: 'teresitaMadera', table_type: 'Type2' },
  FlorenciaLopez: { table_name: 'florenciaLopez', table_type: 'Type2' },
  GuryCaceres:    { table_name: 'guryCaceres',    table_type: 'Type2' },
  Dirigentes:     { table_name: 'dirigentes',     table_type: 'Type2' },
  Romina:         { table_name: 'romina',         table_type: 'Type2' },
  Misael:         { table_name: 'misael',         table_type: 'Type2' },
};

/** Sheets with data but no Prisma model — skipped WITH a warning. */
const WARN_SKIP_SHEETS = new Set(['Comp_Especiales', 'FernandoRejal', 'PiniHerrera2', 'Rendiciones']);

/** Auxiliary/empty sheets — skipped silently. */
const SILENT_SKIP_SHEETS = new Set(['Intendentes', 'ÍNDICE', 'Pendientes', 'PCF-Dirigentes']);

/** Normalized header alias → ImportRow field. Keys are lowercase, accent-stripped, whitespace-free. */
const HEADER_ALIASES: Record<string, keyof ImportRow> = {
  // expediente
  expediente:    'expediente',
  numerodeexpte: 'expediente',
  'n°deexpte':   'expediente',
  nrodeexpte:    'expediente',
  // fecha
  fecha: 'fecha',
  // nombre
  apellidoynombre: 'nombre',
  nombreyapellido: 'nombre',
  nombre:          'nombre',
  // referente
  referenteysolicitante: 'referente',
  referente:             'referente',
  diputadoda:            'referente',
  intendentes:           'referente',
  referenteoinstitucion: 'referente',
  // detalle
  motivoodetalle: 'detalle',
  motivo:         'detalle',
  detalle:        'detalle',
  // montos
  montototal:     'monto_total',
  monto_total:    'monto_total',
  monto:          'monto_total',
  pagoparcial:    'monto_parcial',
  monto_parcial:  'monto_parcial',
  // saldo
  saldo: 'saldo',
};

/** Per-sheet extra header aliases (sheet name → alias → field). */
const SHEET_EXTRA_ALIASES: Record<string, Record<string, keyof ImportRow>> = {
  // Intendentes026: its first column ("Columna 1") is really the date.
  Intendentes026: { columna1: 'fecha' },
};

// ─── Parse configuration ──────────────────────────────────────────────────────

/** Rows processed per batch iteration. */
const CHUNK_SIZE = 100;

/** Minimum non-empty cells in a row to be considered a header row. */
const HEADER_THRESHOLD = 2;

/** Positional informe diario layout (1-indexed columns). */
const POSITIONAL_DATA_START_ROW = 7;
const POSITIONAL_COL_FECHA   = 1;
const POSITIONAL_COL_NOMBRE  = 15;
const POSITIONAL_COL_DETALLE = 16;
const POSITIONAL_COL_MONTO   = 17;
const MIN_POSITIONAL_COLUMNS = 15;

// ─── Cell / header helpers (exported for direct unit testing) ─────────────────

/**
 * Normalizes an Excel header: lowercase, strip accents (NFD), remove ALL
 * whitespace/newlines. E.g. "Monto \nTOTAL" → "montototal",
 * "Nùmero de EXPTE" → "numerodeexpte", "Apellido y  Nombre" → "apellidoynombre".
 */
export function normalizeHeader(input: unknown): string {
  return String(input)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

/**
 * Extracts a number from an Excel cell value.
 * - number → itself
 * - formula object with numeric `result` → `.result`
 * - string → Number()
 * - anything else (null, undefined, boolean, Date, result-less formulas) → 0
 */
export function cellToNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'boolean') return 0;
  if (val instanceof Date) return 0;
  if (typeof val === 'object') {
    const result = (val as { result?: unknown }).result;
    if (typeof result === 'number' && !isNaN(result)) return result;
    return 0;
  }
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/**
 * Extracts the numeric value of a SALDO cell, which in the real files is often
 * an Excel formula object:
 *   { formula: "MINUS(E2,F2)", result: 9619343, ... }  → 9619343
 *   { sharedFormula: "G2" } (no cached result)         → montoTotal − montoParcial
 *
 * The subtraction fallback mirrors the universal formula pattern in these files
 * (SALDO = Monto − Pago Parcial). It only applies when the cell IS a formula
 * object that carries no numeric result — plain values are used verbatim.
 */
export function extractSaldo(val: unknown, montoTotal: number, montoParcial: number): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'boolean') return 0;
  if (val instanceof Date) return 0;
  if (typeof val === 'object') {
    const obj = val as { result?: unknown; formula?: unknown; sharedFormula?: unknown };
    if (typeof obj.result === 'number' && !isNaN(obj.result)) return obj.result;
    if (obj.formula !== undefined || obj.sharedFormula !== undefined) {
      return montoTotal - montoParcial;
    }
    return 0;
  }
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/** Extracts a Date from an Excel cell (Date object, formula-result Date, or date string). */
export function cellToDate(val: unknown): Date | undefined {
  if (val === null || val === undefined) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === 'object') {
    return cellToDate((val as { result?: unknown }).result);
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

/** Trims a cell to a non-empty string, or returns undefined. */
function toStringOrUndefined(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  return s === '' ? undefined : s;
}

// ─── Format detection ─────────────────────────────────────────────────────────

type ParseFormatName = 'multi-sheet' | 'positional-informe' | 'generic';

interface ParseResult {
  rows: ImportRow[];
  warnings: string[];
}

/** Per-row write context (eventual mode) threaded through to _toRowData. */
interface RowWriteContext {
  fecha_carga: Date;
  es_eventual: boolean;
}

export class ImportExcelService {
  /** Person registry cache: table_name_alias → id. Filled lazily on first Type2 sheet. */
  private personIdCache: Map<string, number> | null = null;

  /** Monotonic counter for last-resort synthetic expediente keys. */
  private fallbackKeyCounter = 0;

  private readonly expedienteNormalizer = new ExpedienteNormalizationService();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly matchingService: MatchingService,
    private readonly versioningService: VersioningService,
    private readonly historicoService: ReportesHistoricoService,
    private readonly nameService: NameNormalizationService,
  ) {}

  // ─── parseFile ─────────────────────────────────────────────────────────────

  /**
   * Parses an .xlsx buffer into a structured ImportRow array plus any
   * non-fatal parse warnings (e.g. unmapped sheets that were skipped).
   *
   * Format detection:
   *   - ≥ 2 worksheets with ≥ 2 non-empty columns → multi-sheet mode.
   *   - Single worksheet with ≥ 15 columns, title-like row 5, empty row 6 →
   *     positional informe diario mode.
   *   - Otherwise → generic single-sheet mode (legacy behavior preserved).
   */
  async parseFile(buffer: Buffer): Promise<ParseResult> {
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);

    const { format, worksheet } = this._detectFormat(workbook);

    switch (format) {
      case 'multi-sheet':
        return this._parseMultiSheet(workbook);
      case 'positional-informe':
        return this._parsePositionalInforme(worksheet ?? workbook.worksheets[0]);
      case 'generic':
      default:
        return this._parseGenericSheet(worksheet ?? workbook.worksheets[0]);
    }
  }

  // ─── importFile ────────────────────────────────────────────────────────────

  /**
   * Runs the full import pipeline for an uploaded Excel buffer.
   *
   * Flow per row:
   *   1. Parse-tagged rows (multi-sheet): skip MatchingService, write directly
   *      to the tagged table (Type1 upsert / Type2 versioned insert).
   *   2. Untagged rows (positional / generic): matchingService.match() →
   *      expediente_exact | name_exact | ambiguous | no_match.
   *   3. version()        → create or upsert DB row when written.
   *   4. historico.log()  → ALWAYS fires, regardless of outcome.
   *
   * Optional `opts` (eventual mode): rows whose parsed expediente equals nro_expediente
   * (trim, case-insensitive) persist es_eventual=true; fecha_carga overrides the date.
   *
   * One bad row never aborts the import (individual try/catch per row).
   * Rows are processed in CHUNK_SIZE batches for memory efficiency.
   */
  async importFile(
    buffer: Buffer,
    importDate: Date,
    sourceFileName: string,
    opts?: ImportFileOptions,
  ): Promise<ImportResult> {
    const { rows, warnings } = await this.parseFile(buffer);

    // Normalized eventual key: only non-empty nro_expediente enables eventual mode.
    // The form expediente is normalized to canonical form ONCE: lowercased for the
    // eventual-key comparison, and canonical (preserved case) reused as a fallback
    // expediente when a parsed row carries none (e.g. positional informe diario,
    // which has no expediente column in the source file).
    const formExpedienteCanonical =
      opts?.nro_expediente !== undefined && opts.nro_expediente.trim() !== ''
        ? (this.expedienteNormalizer.normalize(opts.nro_expediente.trim()) ??
          opts.nro_expediente.trim())
        : undefined;
    const eventualKey = formExpedienteCanonical
      ? formExpedienteCanonical.toLowerCase()
      : undefined;

    const result: ImportResult = {
      success: true,
      summary: {
        total_rows:              rows.length,
        matched_by_expediente:   0,
        matched_by_name:         0,
        unmatched:               0,
        ambiguous:               0,
        ...(eventualKey !== undefined ? { eventual_matched: 0 } : {}),
        warnings:                [...warnings],
      },
      updated_rows: [],
      errors:       [],
    };

    // Spec decision: effective fecha_carga = opts.fecha_carga ?? importDate.
    const effectiveFechaCarga = opts?.fecha_carga ?? importDate;

    // Process in chunks of CHUNK_SIZE
    for (let chunkStart = 0; chunkStart < rows.length; chunkStart += CHUNK_SIZE) {
      const chunk = rows.slice(chunkStart, chunkStart + CHUNK_SIZE);

      for (const row of chunk) {
        const esEventual =
          eventualKey !== undefined &&
          row.expediente !== undefined &&
          row.expediente.trim().toLowerCase() === eventualKey;
      await this._processRow(
        row,
        importDate,
        sourceFileName,
        result,
        { fecha_carga: effectiveFechaCarga, es_eventual: esEventual },
        formExpedienteCanonical,
      );
      }
    }

    return result;
  }

  // ─── Format detection ──────────────────────────────────────────────────────

  private _detectFormat(workbook: ExcelJS.Workbook): {
    format: ParseFormatName;
    worksheet?: ExcelJS.Worksheet;
  } {
    const worksheets = workbook.worksheets;
    if (worksheets.length === 0) return { format: 'generic' };

    // Multi-sheet: ≥ 2 worksheets that each have ≥ 2 non-empty columns
    const substantial = worksheets.filter(ws => this._countColumns(ws) >= HEADER_THRESHOLD);
    if (substantial.length >= 2) return { format: 'multi-sheet' };

    const candidate = substantial[0] ?? worksheets[0];

    // Positional informe diario: wide sheet (≥ 15 cols) with title row 5, empty row 6
    if (this._countColumns(candidate) >= MIN_POSITIONAL_COLUMNS) {
      const row5 = candidate.getRow(5);
      const row6 = candidate.getRow(6);
      if (this._rowHasAnyValue(row5) && !this._rowHasAnyValue(row6)) {
        return { format: 'positional-informe', worksheet: candidate };
      }
    }

    return { format: 'generic', worksheet: candidate };
  }

  /** Highest 1-indexed column containing any non-empty cell in the worksheet. */
  private _countColumns(ws: ExcelJS.Worksheet): number {
    let maxCol = 0;
    ws.eachRow({ includeEmpty: false }, (row) => {
      const values = row.values as (ExcelJS.CellValue | undefined)[];
      for (let i = values.length - 1; i > 0; i--) {
        if (values[i] !== null && values[i] !== undefined && values[i] !== '') {
          if (i > maxCol) maxCol = i;
          break;
        }
      }
    });
    return maxCol;
  }

  private _rowHasAnyValue(row: ExcelJS.Row): boolean {
    const values = row.values as (ExcelJS.CellValue | undefined)[];
    return values.some(v => v !== null && v !== undefined && v !== '');
  }

  // ─── Multi-sheet parse (Informes_Convenios_Deudas.xlsx) ────────────────────

  private async _parseMultiSheet(workbook: ExcelJS.Workbook): Promise<ParseResult> {
    const rows: ImportRow[] = [];
    const warnings: string[] = [];

    for (const ws of workbook.worksheets) {
      const mapped = SHEET_TABLE_MAP[ws.name];

      if (!mapped) {
        const hasData = this._countColumns(ws) >= HEADER_THRESHOLD && ws.rowCount >= 2;
        const shouldWarn =
          WARN_SKIP_SHEETS.has(ws.name) ||
          (hasData && !SILENT_SKIP_SHEETS.has(ws.name));
        if (shouldWarn) {
          warnings.push(`Sheet '${ws.name}' skipped (no mapped table)`);
        }
        continue;
      }

      // Resolve the Person registry id once per Type2 sheet
      let personId: number | undefined;
      if (mapped.table_type === 'Type2') {
        personId = await this._getPersonIdByAlias(mapped.table_name);
      }

      const aliases = {
        ...HEADER_ALIASES,
        ...(SHEET_EXTRA_ALIASES[ws.name] ?? {}),
      };

      const sheetRows = this._parseHeaderSheetRows(ws, aliases);
      for (const row of sheetRows) {
        row.table_name = mapped.table_name;
        if (personId !== undefined) row.person_id = personId;
        rows.push(row);
      }
    }

    return { rows, warnings };
  }

  /** Resolves a Person registry id by `table_name_alias`, cached per service instance. */
  private async _getPersonIdByAlias(alias: string): Promise<number | undefined> {
    if (this.personIdCache === null) {
      try {
        const persons = await this.prisma.person.findMany({
          select: { id: true, table_name_alias: true },
        });
        this.personIdCache = new Map(persons.map(p => [p.table_name_alias, p.id]));
      } catch (err) {
        console.error('[ImportExcelService] Failed to load Person registry:', err);
        this.personIdCache = new Map();
      }
    }
    return this.personIdCache.get(alias);
  }

  // ─── Positional informe diario parse ───────────────────────────────────────

  private _parsePositionalInforme(ws: ExcelJS.Worksheet | undefined): ParseResult {
    const rows: ImportRow[] = [];
    if (!ws) return { rows, warnings: [] };

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < POSITIONAL_DATA_START_ROW) return;

      const values = row.values as (ExcelJS.CellValue | undefined)[];
      const nombre = toStringOrUndefined(values[POSITIONAL_COL_NOMBRE]);
      const detalle = toStringOrUndefined(values[POSITIONAL_COL_DETALLE]);
      const montoTotal = cellToNumber(values[POSITIONAL_COL_MONTO]);
      const fecha = cellToDate(values[POSITIONAL_COL_FECHA]);

      // Skip rows with no data in any mapped position
      if (!nombre && !detalle && !fecha && montoTotal === 0) return;

      rows.push({
        nombre,
        detalle,
        monto_total:    montoTotal,
        monto_parcial:  0,
        saldo:          0,
        fecha,
        raw: {
          fecha:   values[POSITIONAL_COL_FECHA],
          nombre:  values[POSITIONAL_COL_NOMBRE],
          detalle: values[POSITIONAL_COL_DETALLE],
          monto:   values[POSITIONAL_COL_MONTO],
        },
      });
    });

    return { rows, warnings: [] };
  }

  // ─── Generic single-sheet parse (legacy) ───────────────────────────────────

  private _parseGenericSheet(ws: ExcelJS.Worksheet | undefined): ParseResult {
    if (!ws) return { rows: [], warnings: [] };
    return { rows: this._parseHeaderSheetRows(ws, HEADER_ALIASES), warnings: [] };
  }

  /**
   * Parses a header-driven worksheet: first row with ≥ 2 non-empty cells is the
   * header; columns are mapped through the normalized alias map; subsequent
   * rows are parsed into ImportRow objects (untagged — resolved by matching).
   */
  private _parseHeaderSheetRows(
    ws: ExcelJS.Worksheet,
    aliases: Record<string, keyof ImportRow>,
  ): ImportRow[] {
    let headerRowNumber = -1;
    const columnMap = new Map<keyof ImportRow, number>();
    const headerIndexes: { normalized: string; index: number }[] = [];

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (headerRowNumber !== -1) return; // header already found

      const values = row.values as (ExcelJS.CellValue | undefined)[];
      const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');

      if (nonEmpty.length >= HEADER_THRESHOLD) {
        headerRowNumber = rowNumber;
        values.forEach((cellValue, colIndex) => {
          if (colIndex === 0 || cellValue === null || cellValue === undefined || cellValue === '') {
            return;
          }
          const normalized = normalizeHeader(cellValue);
          headerIndexes.push({ normalized, index: colIndex });
          const field = aliases[normalized];
          if (field) columnMap.set(field, colIndex);
        });
      }
    });

    if (headerRowNumber === -1) return [];

    const rows: ImportRow[] = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return; // skip header and rows above it

      const built = this._buildRow(row.values as (ExcelJS.CellValue | undefined)[], columnMap, headerIndexes);
      if (built) rows.push(built);
    });

    return rows;
  }

  /**
   * Maps one worksheet row through a field → column index map into an ImportRow.
   * Returns null for rows with no data in any mapped field.
   */
  private _buildRow(
    values: (ExcelJS.CellValue | undefined)[],
    columnMap: Map<keyof ImportRow, number>,
    headerIndexes: { normalized: string; index: number }[],
  ): ImportRow | null {
    const get = (field: keyof ImportRow): unknown => {
      const idx = columnMap.get(field);
      return idx !== undefined ? values[idx] : undefined;
    };

    const rawExpediente = toStringOrUndefined(get('expediente'));
    const expediente = rawExpediente
      ? (this.expedienteNormalizer.normalize(rawExpediente) ?? undefined)
      : undefined;
    const nombre     = toStringOrUndefined(get('nombre'));
    const referente  = toStringOrUndefined(get('referente'));
    const municipio  = normalizeMunicipio(extractMunicipio(referente));
    const detalle    = toStringOrUndefined(get('detalle'));
    const montoTotal = cellToNumber(get('monto_total'));
    const montoParcial = cellToNumber(get('monto_parcial'));
    const saldo      = extractSaldo(get('saldo'), montoTotal, montoParcial);
    const fecha      = cellToDate(get('fecha'));

    // Skip rows with no data in any mapped field
    if (
      !expediente && !nombre && !referente && !detalle && !fecha &&
      montoTotal === 0 && montoParcial === 0 && saldo === 0
    ) {
      return null;
    }

    // Raw audit record: original header name → original cell value
    const raw: Record<string, unknown> = {};
    for (const h of headerIndexes) {
      raw[h.normalized] = values[h.index];
    }

    return {
      expediente,
      nombre,
      referente,
      municipio,
      detalle,
      monto_total:    montoTotal,
      monto_parcial:  montoParcial,
      saldo,
      fecha,
      raw,
    };
  }

  // ─── Pipeline ──────────────────────────────────────────────────────────────

  /**
   * Processes a single row through the version → log pipeline.
   * Mutates `result` in-place. Never throws — errors are caught and recorded.
   */
  private async _processRow(
    row: ImportRow,
    importDate: Date,
    sourceFileName: string,
    result: ImportResult,
    ctx: RowWriteContext,
    formExpediente?: string,
  ): Promise<void> {
    let versionResult: VersionedRowResult | null = null;
    let warnings: string | undefined;

    try {
      const outcome = row.table_name
        ? await this._processTaggedRow(row, importDate, result, ctx)
        : await this._processMatchedRow(row, importDate, result, ctx);

      versionResult = outcome.versionResult;
      warnings = outcome.warnings;

      // Eventual counter: only rows actually persisted with es_eventual=true.
      if (ctx.es_eventual && versionResult !== null) {
        result.summary.eventual_matched = (result.summary.eventual_matched ?? 0) + 1;
      }

      // ── Audit log (ALWAYS — for every row, every outcome) ────────────────
      await this.historicoService.log({
        expediente:            row.expediente ?? formExpediente ?? undefined,
        nombre:                row.nombre,
        referente:             row.referente,
        monto_total:           row.monto_total,
        monto_parcial:         row.monto_parcial,
        saldo:                 row.saldo,
        import_source_file:    sourceFileName,
        matched_table_type:    versionResult?.table_type ?? undefined,
        matched_table_name:    versionResult?.table_name ?? undefined,
        matched_by_expediente: versionResult?.matched_by === 'expediente_exact',
        matched_by_name:       versionResult?.matched_by === 'name_exact',
        version_created:       versionResult?.version_created,
        warnings,
        fecha_importacion:     importDate,
      });

    } catch (err) {
      const msg = `Error processing row expediente='${row.expediente ?? ''}' nombre='${row.nombre ?? ''}': ${String(err)}`;
      result.errors.push(msg);

      // Best-effort audit log even on row error
      await this.historicoService.log({
        expediente:            row.expediente ?? formExpediente ?? undefined,
        nombre:                row.nombre,
        referente:             row.referente,
        monto_total:           row.monto_total,
        monto_parcial:         row.monto_parcial,
        saldo:                 row.saldo,
        import_source_file:    sourceFileName,
        matched_by_expediente: false,
        matched_by_name:       false,
        warnings:              JSON.stringify(['row_processing_error', String(err)]),
        fecha_importacion:     importDate,
      });
    }
  }

  /**
   * Parse-tagged row (multi-sheet file): the table is already known, so
   * cross-table MatchingService is skipped.
   *  - Type1 → upsertGenericRow (expediente @unique), matched_by='expediente_exact'.
   *  - Type2 → person_id known; same-day duplicate guard → latest version →
   *            createVersionedRow; matched_by='expediente_exact' when the row
   *            carries an expediente, else 'name_exact'.
   */
  private async _processTaggedRow(
    row: ImportRow,
    importDate: Date,
    result: ImportResult,
    ctx: RowWriteContext,
  ): Promise<{ versionResult: VersionedRowResult | null; warnings?: string }> {
    const tableName = row.table_name!;

    if ((GENERIC_TABLES as readonly string[]).includes(tableName)) {
      // ── Type1: upsert in-place (expediente is @unique) ───────────────────
      if (!row.expediente || row.expediente.trim() === '') {
        result.summary.unmatched++;
        result.summary.warnings.push(`Missing expediente for Type1 row in ${tableName}`);
        return { versionResult: null, warnings: JSON.stringify(['missing_expediente']) };
      }

      const { id, version } = await this.versioningService.upsertGenericRow(
        tableName,
        row.expediente,
        this._toRowData(row, ctx),
      );
      const versionResult = this.versioningService.buildResult(
        tableName,
        'Type1',
        id,
        row.expediente,
        version,
        'expediente_exact',
        importDate,
      );
      result.summary.matched_by_expediente++;
      result.updated_rows.push(versionResult);
      return { versionResult };
    }

    if ((PERSON_TABLES as readonly string[]).includes(tableName)) {
      // ── Type2: INSERT new row (unless same-day duplicate) ────────────────
      if (row.person_id === undefined) {
        result.summary.unmatched++;
        result.summary.warnings.push(`Person record not found for table '${tableName}' — row skipped`);
        return { versionResult: null, warnings: JSON.stringify(['person_not_found']) };
      }

      const matchedBy = row.expediente ? 'expediente_exact' : 'name_exact';
      const expediente = row.expediente ?? this._fallbackExpedienteKey(row);

      const isDup = await this.versioningService.isDuplicate(
        tableName,
        expediente,
        row.person_id,
        importDate,
      );

      if (isDup) {
        result.summary.warnings.push(
          `Duplicate (same day): expediente '${expediente}' in ${tableName}`,
        );
        return { versionResult: null, warnings: JSON.stringify(['duplicate_import_same_day']) };
      }

      const latestVersion = await this.versioningService.getLatestVersion(
        tableName,
        expediente,
        row.person_id,
      );
      const { id, version } = await this.versioningService.createVersionedRow(
        tableName,
        { ...this._toRowData(row, ctx), expediente, person_id: row.person_id },
        latestVersion + 1,
        'INFORME_DIARIO',
      );
      const versionResult = this.versioningService.buildResult(
        tableName,
        'Type2',
        id,
        expediente,
        version,
        matchedBy,
        importDate,
      );
      if (matchedBy === 'expediente_exact') result.summary.matched_by_expediente++;
      else result.summary.matched_by_name++;
      result.updated_rows.push(versionResult);
      return { versionResult };
    }

    // Unknown tag (should not happen with the current sheet map)
    result.summary.unmatched++;
    return { versionResult: null, warnings: JSON.stringify(['unknown_table']) };
  }

  /**
   * Untagged row (positional / generic file): resolve table + person via
   * MatchingService, then write.
   */
  private async _processMatchedRow(
    row: ImportRow,
    importDate: Date,
    result: ImportResult,
    ctx: RowWriteContext,
  ): Promise<{ versionResult: VersionedRowResult | null; warnings?: string }> {
    const match = await this.matchingService.match(row);

    switch (match.match_type) {
      // ── Expediente exact ─────────────────────────────────────────────────
      case 'expediente_exact': {
        if (match.table_type === 'Type1' && match.table_name) {
          // Type1: upsert in-place (expediente is @unique)
          const { id, version } = await this.versioningService.upsertGenericRow(
            match.table_name,
            row.expediente!,
            this._toRowData(row, ctx),
          );
          const versionResult = this.versioningService.buildResult(
            match.table_name,
            'Type1',
            id,
            row.expediente,
            version,
            'expediente_exact',
            importDate,
          );
          result.summary.matched_by_expediente++;
          result.updated_rows.push(versionResult);
          return { versionResult };

        } else if (match.table_type === 'Type2' && match.table_name && match.matched_row) {
          // Type2: INSERT new row (unless same-day duplicate)
          const personId = match.matched_row.person_id as number | null ?? null;
          const isDup = await this.versioningService.isDuplicate(
            match.table_name,
            row.expediente!,
            personId,
            importDate,
          );

          if (isDup) {
            result.summary.warnings.push(
              `Duplicate (same day): expediente '${row.expediente}' in ${match.table_name}`,
            );
            return { versionResult: null, warnings: JSON.stringify(['duplicate_import_same_day']) };
          }

          const latestVersion = await this.versioningService.getLatestVersion(
            match.table_name,
            row.expediente!,
            personId ?? undefined,
          );
          const { id, version } = await this.versioningService.createVersionedRow(
            match.table_name,
            { ...this._toRowData(row, ctx), person_id: personId },
            latestVersion + 1,
            'INFORME_DIARIO',
          );
          const versionResult = this.versioningService.buildResult(
            match.table_name,
            'Type2',
            id,
            row.expediente,
            version,
            'expediente_exact',
            importDate,
          );
          result.summary.matched_by_expediente++;
          result.updated_rows.push(versionResult);
          return { versionResult };
        }
        return { versionResult: null };
      }

      // ── Name exact ──────────────────────────────────────────────────────
      case 'name_exact': {
        if (match.table_name && match.matched_row) {
          const personId = match.matched_row.person_id as number | null ?? null;
          const expediente = row.expediente ?? this._fallbackExpedienteKey(row);

          const isDup = await this.versioningService.isDuplicate(
            match.table_name,
            expediente,
            personId,
            importDate,
          );

          if (isDup) {
            result.summary.warnings.push(
              `Duplicate (same day): nombre '${row.nombre}' in ${match.table_name}`,
            );
            return { versionResult: null, warnings: JSON.stringify(['duplicate_import_same_day']) };
          }

          const latestVersion = await this.versioningService.getLatestVersion(
            match.table_name,
            expediente,
            personId ?? undefined,
          );
          const { id, version } = await this.versioningService.createVersionedRow(
            match.table_name,
            { ...this._toRowData(row, ctx), expediente, person_id: personId },
            latestVersion + 1,
            'INFORME_DIARIO',
          );
          const versionResult = this.versioningService.buildResult(
            match.table_name,
            'Type2',
            id,
            row.expediente,
            version,
            'name_exact',
            importDate,
          );
          result.summary.matched_by_name++;
          result.updated_rows.push(versionResult);
          return { versionResult };
        }
        return { versionResult: null };
      }

      // ── Ambiguous ───────────────────────────────────────────────────────
      case 'ambiguous': {
        result.summary.ambiguous++;
        result.summary.warnings.push(
          `Ambiguous match for expediente '${row.expediente ?? row.nombre}' (${match.candidates?.length ?? '?'} candidates)`,
        );
        return { versionResult: null, warnings: JSON.stringify(['ambiguous_match']) };
      }

      // ── No match ────────────────────────────────────────────────────────
      case 'no_match':
      default: {
        result.summary.unmatched++;
        return { versionResult: null, warnings: JSON.stringify(['no_match_found']) };
      }
    }
  }

  /**
   * Builds a deterministic synthetic expediente key for Type2 rows that carry
   * no expediente (e.g. Misael sheet, informe diario rows). Content-based so
   * re-imports of the same data hit the same-day duplicate guard; last-resort
   * timestamp+counter key for fully empty rows.
   */
  private _fallbackExpedienteKey(row: ImportRow): string {
    const joined = [
      row.nombre,
      row.detalle,
      String(row.monto_total),
      String(row.monto_parcial),
      String(row.saldo),
    ].filter(v => v !== undefined && v !== null && v !== '')
      .join('|');

    if (joined !== '') {
      const key = this.nameService.normalize(joined).replace(/[^A-Z0-9|]/g, '-');
      return `NAME-${key.slice(0, 80)}`;
    }
    return `NAME-${Date.now()}-${this.fallbackKeyCounter++}`;
  }

  /**
   * Converts an ImportRow into a plain data object suitable for Prisma create/upsert.
   * Excludes `fecha`, `raw`, `table_name` and `person_id` (pipeline-internal fields).
   * `ctx` carries the effective `fecha_carga` and the `es_eventual` flag to persist.
   */
  private _toRowData(row: ImportRow, ctx: RowWriteContext): Record<string, unknown> {
    return {
      expediente:   row.expediente,
      nombre:       row.nombre   ?? null,
      referente:    row.referente ?? null,
      detalle:      row.detalle  ?? null,
      monto_total:  row.monto_total,
      monto_parcial: row.monto_parcial,
      saldo:        row.saldo,
      fecha_carga:  ctx.fecha_carga,
      es_eventual:  ctx.es_eventual,
    };
  }
}
