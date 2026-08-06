/**
 * ImportExcelService
 *
 * Orchestrates the full import pipeline: parse → match → version → log.
 *
 * Responsibilities:
 *   1. parseFile(buffer)  — reads an .xlsx buffer with ExcelJS; auto-detects
 *      the header row (first row with >= 2 non-empty cells); maps columns
 *      case-insensitively to ImportRow fields.
 *
 *   2. importFile(buffer, importDate, sourceFileName) — processes rows in
 *      chunks of 100; for each row individually wrapped in try/catch so one
 *      bad row never aborts the entire import; calls match → version → audit
 *      pipeline; builds and returns an ImportResult summary.
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
import type { ImportRow, ImportResult, VersionedRowResult } from './types.js';
import type { MatchingService } from './MatchingService.js';
import type { VersioningService } from './VersioningService.js';
import type { ReportesHistoricoService } from './ReportesHistoricoService.js';
import type { NameNormalizationService } from './NameNormalizationService.js';

/** Column header names to look for in the Excel file (normalized, lowercase). */
const KNOWN_COLUMNS = [
  'fecha',
  'expediente',
  'nombre',
  'referente',
  'detalle',
  'monto_total',
  'monto_parcial',
  'saldo',
] as const;

type KnownColumn = (typeof KNOWN_COLUMNS)[number];

/** Minimum non-empty cells in a row to be considered a header row. */
const HEADER_THRESHOLD = 2;

/** Rows processed per batch iteration. */
const CHUNK_SIZE = 100;

export class ImportExcelService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly matchingService: MatchingService,
    private readonly versioningService: VersioningService,
    private readonly historicoService: ReportesHistoricoService,
    private readonly nameService: NameNormalizationService,
  ) {}

  // ─── parseFile ─────────────────────────────────────────────────────────────

  /**
   * Parses an .xlsx buffer into a structured ImportRow array.
   *
   * Header detection:
   *   - Iterates rows from the top of sheet 1.
   *   - The first row containing at least HEADER_THRESHOLD (2) non-empty cells
   *     is treated as the header row.
   *   - Column headers are matched case-insensitively against KNOWN_COLUMNS.
   *   - All subsequent rows are parsed into ImportRow objects; empty rows
   *     (all KNOWN_COLUMNS undefined/null) are skipped.
   */
  async parseFile(buffer: Buffer): Promise<ImportRow[]> {
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    // ── Detect header row ────────────────────────────────────────────────────
    let headerRowNumber = -1;
    const columnMap: Partial<Record<KnownColumn, number>> = {};

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (headerRowNumber !== -1) return; // already found

      // row.values is 1-indexed; index 0 is undefined
      const values = row.values as (ExcelJS.CellValue | undefined)[];
      const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');

      if (nonEmpty.length >= HEADER_THRESHOLD) {
        headerRowNumber = rowNumber;
        // Build column index map
        values.forEach((cellValue, colIndex) => {
          if (!cellValue) return;
          const normalized = String(cellValue).toLowerCase().trim() as KnownColumn;
          if ((KNOWN_COLUMNS as readonly string[]).includes(normalized)) {
            columnMap[normalized] = colIndex;
          }
        });
      }
    });

    if (headerRowNumber === -1) return []; // No usable header found

    // ── Parse data rows ──────────────────────────────────────────────────────
    const rows: ImportRow[] = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return; // skip header and rows above it

      const raw = row.values as (ExcelJS.CellValue | undefined)[];

      const get = (col: KnownColumn): ExcelJS.CellValue | undefined => {
        const idx = columnMap[col];
        return idx !== undefined ? raw[idx] : undefined;
      };

      // Parse numeric fields with fallback to 0
      const toNumber = (val: ExcelJS.CellValue | undefined): number => {
        if (val === null || val === undefined) return 0;
        const n = Number(val);
        return isNaN(n) ? 0 : n;
      };

      // Build raw record for audit purposes
      const rawRecord: Record<string, unknown> = {};
      for (const col of KNOWN_COLUMNS) {
        rawRecord[col] = get(col);
      }

      const expediente = get('expediente');
      const nombre     = get('nombre');
      const referente  = get('referente');
      const detalle    = get('detalle');
      const fechaRaw   = get('fecha');

      // Skip entirely empty rows (no expediente AND no nombre)
      if (!expediente && !nombre) return;

      let fecha: Date | undefined;
      if (fechaRaw) {
        const d = fechaRaw instanceof Date ? fechaRaw : new Date(String(fechaRaw));
        if (!isNaN(d.getTime())) fecha = d;
      }

      rows.push({
        expediente: expediente ? String(expediente).trim() : undefined,
        nombre:     nombre     ? String(nombre).trim()     : undefined,
        referente:  referente  ? String(referente).trim()  : undefined,
        detalle:    detalle    ? String(detalle).trim()    : undefined,
        monto_total:    toNumber(get('monto_total')),
        monto_parcial:  toNumber(get('monto_parcial')),
        saldo:          toNumber(get('saldo')),
        fecha,
        raw: rawRecord,
      });
    });

    return rows;
  }

  // ─── importFile ────────────────────────────────────────────────────────────

  /**
   * Runs the full import pipeline for an uploaded Excel buffer.
   *
   * Flow per row:
   *   1. match()          → MatchResult (expediente_exact | name_exact | ambiguous | no_match)
   *   2. version()        → create or upsert DB row if matched
   *   3. historico.log()  → ALWAYS fires, regardless of match outcome
   *
   * One bad row never aborts the import (individual try/catch per row).
   * Rows are processed in CHUNK_SIZE batches for memory efficiency.
   */
  async importFile(
    buffer: Buffer,
    importDate: Date,
    sourceFileName: string,
  ): Promise<ImportResult> {
    const rows = await this.parseFile(buffer);

    const result: ImportResult = {
      success: true,
      summary: {
        total_rows:              rows.length,
        matched_by_expediente:   0,
        matched_by_name:         0,
        unmatched:               0,
        ambiguous:               0,
        warnings:                [],
      },
      updated_rows: [],
      errors:       [],
    };

    // Process in chunks of CHUNK_SIZE
    for (let chunkStart = 0; chunkStart < rows.length; chunkStart += CHUNK_SIZE) {
      const chunk = rows.slice(chunkStart, chunkStart + CHUNK_SIZE);

      for (const row of chunk) {
        await this._processRow(row, importDate, sourceFileName, result);
      }
    }

    return result;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  /**
   * Processes a single row through the match → version → log pipeline.
   * Mutates `result` in-place. Never throws — errors are caught and recorded.
   */
  private async _processRow(
    row: ImportRow,
    importDate: Date,
    sourceFileName: string,
    result: ImportResult,
  ): Promise<void> {
    let versionResult: VersionedRowResult | null = null;
    let warnings: string | undefined;

    try {
      const match = await this.matchingService.match(row);

      switch (match.match_type) {
        // ── Expediente exact ────────────────────────────────────────────────
        case 'expediente_exact': {
          if (match.table_type === 'Type1' && match.table_name) {
            // Type1: upsert in-place (expediente is @unique)
            const { id, version } = await this.versioningService.upsertGenericRow(
              match.table_name,
              row.expediente!,
              this._toRowData(row),
            );
            versionResult = this.versioningService.buildResult(
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
              warnings = JSON.stringify(['duplicate_import_same_day']);
              result.summary.warnings.push(
                `Duplicate (same day): expediente '${row.expediente}' in ${match.table_name}`,
              );
            } else {
              const latestVersion = await this.versioningService.getLatestVersion(
                match.table_name,
                row.expediente!,
                personId ?? undefined,
              );
              const { id, version } = await this.versioningService.createVersionedRow(
                match.table_name,
                { ...this._toRowData(row), person_id: personId },
                latestVersion + 1,
                'INFORME_DIARIO',
              );
              versionResult = this.versioningService.buildResult(
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
            }
          }
          break;
        }

        // ── Name exact ──────────────────────────────────────────────────────
        case 'name_exact': {
          if (match.table_name && match.matched_row) {
            const personId = match.matched_row.person_id as number | null ?? null;
            const expediente = row.expediente ?? `NAME-${Date.now()}`; // fallback key

            const isDup = await this.versioningService.isDuplicate(
              match.table_name,
              expediente,
              personId,
              importDate,
            );

            if (isDup) {
              warnings = JSON.stringify(['duplicate_import_same_day']);
              result.summary.warnings.push(
                `Duplicate (same day): nombre '${row.nombre}' in ${match.table_name}`,
              );
            } else {
              const latestVersion = await this.versioningService.getLatestVersion(
                match.table_name,
                expediente,
                personId ?? undefined,
              );
              const { id, version } = await this.versioningService.createVersionedRow(
                match.table_name,
                { ...this._toRowData(row), expediente, person_id: personId },
                latestVersion + 1,
                'INFORME_DIARIO',
              );
              versionResult = this.versioningService.buildResult(
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
            }
          }
          break;
        }

        // ── Ambiguous ───────────────────────────────────────────────────────
        case 'ambiguous': {
          warnings = JSON.stringify(['ambiguous_match']);
          result.summary.ambiguous++;
          result.summary.warnings.push(
            `Ambiguous match for expediente '${row.expediente ?? row.nombre}' (${match.candidates?.length ?? '?'} candidates)`,
          );
          break;
        }

        // ── No match ────────────────────────────────────────────────────────
        case 'no_match':
        default: {
          warnings = JSON.stringify(['no_match_found']);
          result.summary.unmatched++;
          break;
        }
      }

      // ── Audit log (ALWAYS — for every row, every outcome) ────────────────
      await this.historicoService.log({
        expediente:            row.expediente,
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
        expediente:            row.expediente,
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
   * Converts an ImportRow into a plain data object suitable for Prisma create/upsert.
   * Excludes `fecha` and `raw` (pipeline-internal fields).
   */
  private _toRowData(row: ImportRow): Record<string, unknown> {
    return {
      expediente:   row.expediente,
      nombre:       row.nombre   ?? null,
      referente:    row.referente ?? null,
      detalle:      row.detalle  ?? null,
      monto_total:  row.monto_total,
      monto_parcial: row.monto_parcial,
      saldo:        row.saldo,
    };
  }
}
