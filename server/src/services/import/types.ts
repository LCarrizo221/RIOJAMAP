/**
 * TypeScript interfaces for the Excel Import service layer.
 * These types are used internally by ImportExcelService, MatchingService,
 * VersioningService, and ReportesHistoricoService.
 *
 * Zod runtime schemas live in server/src/schemas/import.ts.
 */

// ─── Table Name Unions ─────────────────────────────────────────────────────────

export type GenericTableName =
  | 'expedientes'
  | 'conveniosMunic'
  | 'deudasEXPTES'
  | 'instituciones'
  | 'intendentes026'
  | 'diputados';

export type PersonTableName =
  | 'piniHerrera'
  | 'gabiPedrali'
  | 'teresitaMadera'
  | 'florenciaLopez'
  | 'guryCaceres'
  | 'dirigentes'
  | 'romina'
  | 'misael';

/** All 6 generic Type1 table names in search-priority order. */
export const GENERIC_TABLES: GenericTableName[] = [
  'expedientes',
  'conveniosMunic',
  'deudasEXPTES',
  'instituciones',
  'intendentes026',
  'diputados',
];

/** All 8 person-specific Type2 table names. */
export const PERSON_TABLES: PersonTableName[] = [
  'piniHerrera',
  'gabiPedrali',
  'teresitaMadera',
  'florenciaLopez',
  'guryCaceres',
  'dirigentes',
  'romina',
  'misael',
];

// ─── Match / Versioning Discriminant Types ────────────────────────────────────

/** All possible outcomes from the matching algorithm. */
export type MatchType = 'expediente_exact' | 'name_exact' | 'ambiguous' | 'no_match';

/** Distinguishes generic (Type1) tables from person-specific (Type2) tables. */
export type TableType = 'Type1' | 'Type2';

// ─── Import Row ───────────────────────────────────────────────────────────────

/**
 * A single row parsed from an Excel import file.
 * `raw` carries the original row data for audit purposes.
 *
 * Two origins are possible:
 *  - Multi-sheet files (Informes_Convenios_Deudas.xlsx): rows are tagged at
 *    parse time with `table_name` (and `person_id` for Type2 person tables),
 *    so the pipeline skips cross-table matching and writes directly.
 *  - Positional / generic single-sheet files: rows carry no tag and are
 *    resolved through MatchingService.
 */
export interface ImportRow {
  expediente?: string;
  nombre?: string;
  referente?: string;
  detalle?: string;
  monto_total: number;
  monto_parcial: number;
  saldo: number;
  fecha?: Date;
  /** Target Prisma table, set at parse time for multi-sheet files. */
  table_name?: string;
  /** Person registry FK, set at parse time for Type2 rows in multi-sheet files. */
  person_id?: number;
  raw?: Record<string, unknown>;
}

// ─── Matching ─────────────────────────────────────────────────────────────────

/**
 * Result returned by MatchingService.match().
 * `matched_row` is the existing DB row (version info needed for versioning).
 */
export interface MatchResult {
  match_type: MatchType;
  table_type?: TableType;
  table_name?: string;
  matched_row?: { id: number; version: number; [key: string]: unknown };
  candidates?: unknown[];
}

// ─── Versioning ───────────────────────────────────────────────────────────────

/**
 * What VersioningService.createVersionedRow() returns per successful row.
 * Serialized as ISO string for JSON transport.
 */
export interface VersionedRowResult {
  table_type: TableType;
  table_name: string;
  row_id: number;
  expediente?: string;
  version_created: number;
  matched_by: MatchType;
  created_at: string;
}

// ─── Import Options (eventual mode) ───────────────────────────────────────────

/**
 * Optional mode for importFile: when `nro_expediente` is present, rows whose
 * parsed `expediente` equals it (trimmed, case-insensitive) persist with
 * `es_eventual=true`; all others persist `es_eventual=false`.
 * `fecha_carga` overrides the effective load date (defaults to importDate).
 */
export interface ImportFileOptions {
  nro_expediente?: string;
  fecha_carga?: Date;
}

// ─── Import Result ────────────────────────────────────────────────────────────

export interface ImportSummary {
  total_rows: number;
  matched_by_expediente: number;
  matched_by_name: number;
  unmatched: number;
  ambiguous: number;
  /** Rows tagged es_eventual=true during an eventual import (nro_expediente mode). */
  eventual_matched?: number;
  warnings: string[];
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  updated_rows: VersionedRowResult[];
  errors: string[];
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

/**
 * Input shape for ReportesHistoricoService.log().
 * Maps directly to the ReportesHistorico Prisma model.
 * Note: expediente is optional — some unmatched rows may lack it.
 */
export interface ReportesHistoricoEntry {
  expediente?: string;
  nombre?: string;
  referente?: string;
  monto_total: number;
  monto_parcial: number;
  saldo: number;
  import_source_file?: string;
  matched_table_type?: string;
  matched_table_name?: string;
  matched_by_expediente: boolean;
  matched_by_name: boolean;
  version_created?: number;
  warnings?: string;
  fecha_importacion: Date;
}
