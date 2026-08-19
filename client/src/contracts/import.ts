/**
 * Client-side Zod schemas mirroring server/src/schemas/import.ts
 * Last synced with backend: 2026-08-14
 *
 * These schemas are used for runtime validation of API responses.
 * Keep in sync with server schemas — contract tests will catch drift.
 *
 * Design note: dates arrive as ISO strings in JSON; use z.string() here,
 * not z.coerce.date(). Uses .strict() on all response shapes for drift detection.
 */

import { z } from 'zod';

// ─── Import Response Contract ─────────────────────────────────────────────────

const importSummaryContract = z
  .object({
    total_rows: z.number(),
    matched_by_expediente: z.number(),
    matched_by_name: z.number(),
    unmatched: z.number(),
    ambiguous: z.number(),
    /** Rows persisted with es_eventual=true during an eventual import — optional. */
    eventual_matched: z.number().optional(),
    warnings: z.array(z.string()),
  })
  .strict();

const updatedRowContract = z
  .object({
    table_type: z.string(),
    table_name: z.string(),
    row_id: z.number(),
    expediente: z.string().optional(),
    version_created: z.number(),
    matched_by: z.string(),
  })
  .strict();

/**
 * Mirrors server's importResponseSchema.
 * Uses .strict() to reject unexpected fields (server drift detection).
 */
export const ImportResponseContract = z
  .object({
    success: z.boolean(),
    summary: importSummaryContract,
    updated_rows: z.array(updatedRowContract),
    errors: z.array(z.string()).optional(),
  })
  .strict();

// ─── ReportesHistorico Contract ───────────────────────────────────────────────

/**
 * Mirrors server's reportesHistoricoSchema.
 * Note: dates serialized as ISO strings; expediente is nullable.
 */
export const ReportesHistoricoContract = z
  .object({
    id: z.number().optional(),
    fecha_importacion: z.string().optional(),
    expediente: z.string().nullable().optional(),
    nombre: z.string().nullable().optional(),
    referente: z.string().nullable().optional(),
    monto_total: z.number(),
    monto_parcial: z.number(),
    saldo: z.number(),
    import_source_file: z.string().nullable().optional(),
    matched_table_type: z.string().nullable().optional(),
    matched_table_name: z.string().nullable().optional(),
    matched_by_expediente: z.boolean(),
    matched_by_name: z.boolean(),
    version_created: z.number().nullable().optional(),
    warnings: z.string().nullable().optional(),
    createdAt: z.string().optional(),
  })
  .strict();

// ─── Version History Contract ─────────────────────────────────────────────────

const versionHistoryEntryContract = z
  .object({
    version: z.number(),
    table_name: z.string(),
    imported_from: z.string(),
    monto_total: z.number(),
    monto_parcial: z.number(),
    saldo: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

/**
 * Mirrors server's versionHistoryResponseSchema.
 * Covers both expediente-based and person-based history endpoints.
 */
export const VersionHistoryContract = z
  .object({
    expediente: z.string().optional(),
    person_id: z.number().optional(),
    table_name: z.string(),
    versions: z.array(versionHistoryEntryContract),
  })
  .strict();

// ─── Table Whitelists (mirror of server/src/services/import/types.ts) ─────────

/** 7 generic Type1 tables (expediente @unique — upsert on re-import). */
export const TYPE1_TABLES = [
  'expedientes', 'conveniosMunic', 'deudasEXPTES', 'instituciones', 'intendentes026', 'diputados', 'eventuales',
] as const;

/** 8 person-specific Type2 tables (FK → Person — INSERT a new row each time). */
export const TYPE2_TABLES = [
  'piniHerrera', 'gabiPedrali', 'teresitaMadera', 'florenciaLopez', 'guryCaceres', 'dirigentes', 'romina', 'misael',
] as const;

/** ReportesHistorico is a tab but uses its own paginated endpoint. */
export const REPORTES_HISTORICO = ['reportes-historico'] as const;

/** Full import view list: 15 API tables + the reportes-historico tab. */
export const ALL_IMPORT_TABLES = [...TYPE1_TABLES, ...TYPE2_TABLES, ...REPORTES_HISTORICO] as const;

export type Type1TableName = (typeof TYPE1_TABLES)[number];
export type Type2TableName = (typeof TYPE2_TABLES)[number];

// ─── Table List Views (GET /api/import/tables/:tableName) ─────────────────────

/** Mirrors server tableListQuerySchema — dates are ISO-day strings. */
export const TableListQueryContract = z.object({
  expediente: z.string().optional(),
  nombre: z.string().optional(),
  fecha_carga: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_carga must be a valid day (YYYY-MM-DD)').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

/** Mirrors server tableListResponseSchema. */
export const TableListResponseContract = z.object({
  table_name: z.string(),
  data: z.array(z.record(z.unknown())),
  pagination: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }),
}).strict();

/** Row as persisted in one of the 15 tables (Prisma over JSON); person_id only on Type2. */
export const TableRowContract = z.object({
  id: z.number(),
  expediente: z.string(),
  nombre: z.string().nullable().optional(),
  referente: z.string().nullable().optional(),
  detalle: z.string().nullable().optional(),
  monto_total: z.number(),
  monto_parcial: z.number(),
  saldo: z.number(),
  version: z.number(),
  imported_from: z.string(),
  fecha_carga: z.string().nullable().optional(),
  person_id: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).strict();

/** POST /tables/:tableName/rows returns the created row. */
export const CreateRowResponseContract = TableRowContract;

// ─── Manual Row Creation (POST /api/import/tables/:tableName/rows) ────────────

/** Mirrors server createTableRowSchema — server-managed fields excluded; person_id enforced server-side (no discriminated union). */
export const CreateTableRowContract = z.object({
  expediente: z.string().min(1),
  nombre: z.string().nullable().optional(),
  referente: z.string().nullable().optional(),
  detalle: z.string().nullable().optional(),
  monto_total: z.number().default(0),
  monto_parcial: z.number().default(0),
  saldo: z.number().default(0),
  fecha_carga: z.string().optional(),
  person_id: z.number().optional(),
}).strict();

// ─── Import Request (POST /api/import) ────────────────────────────────────────

/** Mirrors server importRequestSchema (the file travels as multipart/form-data). */
export const ImportRequestContract = z.object({
  import_date: z.string().optional(),
  nro_expediente: z.string().optional(),
  fecha_carga: z.string().optional(),
}).strict();

// ─── Inferred TypeScript Types ────────────────────────────────────────────────

export type ImportResponse = z.infer<typeof ImportResponseContract>;
export type ReportesHistorico = z.infer<typeof ReportesHistoricoContract>;
export type VersionHistory = z.infer<typeof VersionHistoryContract>;
export type ImportRequest = z.infer<typeof ImportRequestContract>;
export type TableListQuery = z.infer<typeof TableListQueryContract>;
export type TableListResponse = z.infer<typeof TableListResponseContract>;
export type TableRow = z.infer<typeof TableRowContract>;
export type CreateTableRow = z.infer<typeof CreateTableRowContract>;
