/**
 * Zod schemas for the Excel Import pipeline.
 * Server-side source of truth — mirrored in client/src/contracts/import.ts.
 * Last synced with server/prisma/schema.prisma: 2026-08-06
 */

import { z } from 'zod';

// ─── Base Table Row Schema (DRY) ──────────────────────────────────────────────

/**
 * Shared field set for all 14 import tables.
 * Type1 tables re-export this as named aliases.
 * Type2 tables extend it with `person_id`.
 */
const baseTableRowSchema = z.object({
  id: z.number().optional(),
  expediente: z.string().min(1),
  nombre: z.string().nullable().optional(),
  referente: z.string().nullable().optional(),
  detalle: z.string().nullable().optional(),
  monto_total: z.number().default(0),
  monto_parcial: z.number().default(0),
  saldo: z.number().default(0),
  version: z.number().default(1),
  imported_from: z.string().default('INFORME_DIARIO'),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

// ─── Type 1 Schemas (generic; expediente @unique → upsert on re-import) ───────

export const expedientesSchema = baseTableRowSchema;
export const conveniosMunicSchema = baseTableRowSchema;
export const deudasEXPTESSchema = baseTableRowSchema;
export const institucionesSchema = baseTableRowSchema;
export const intendentes026Schema = baseTableRowSchema;
export const diputadosSchema = baseTableRowSchema;

// ─── Type 2 Schemas (person-specific; FK → Person; INSERT new row each time) ──

/** All person-specific tables share this shape; differentiated by person_id. */
export const personTableRowSchema = baseTableRowSchema.extend({
  person_id: z.number(),
});

/** Person registry model. */
export const personSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  table_name_alias: z.string().min(1),
  createdAt: z.coerce.date().optional(),
});

// ─── ReportesHistorico (immutable audit log) ──────────────────────────────────

/**
 * Mirrors the ReportesHistorico Prisma model exactly.
 * - `expediente` is nullable (String? in schema.prisma)
 * - audit timestamp field is `createdAt` (camelCase, per schema.prisma)
 */
export const reportesHistoricoSchema = z.object({
  id: z.number().optional(),
  fecha_importacion: z.coerce.date().optional(),
  expediente: z.string().nullable().optional(),
  nombre: z.string().nullable().optional(),
  referente: z.string().nullable().optional(),
  monto_total: z.number().default(0),
  monto_parcial: z.number().default(0),
  saldo: z.number().default(0),
  import_source_file: z.string().nullable().optional(),
  matched_table_type: z.string().nullable().optional(),
  matched_table_name: z.string().nullable().optional(),
  matched_by_expediente: z.boolean().default(false),
  matched_by_name: z.boolean().default(false),
  version_created: z.number().nullable().optional(),
  warnings: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
});

// ─── Import Pipeline Schemas ──────────────────────────────────────────────────

/**
 * Single Excel row after parsing.
 * `saldo` is included to match the INFORME DIARIO Excel format and
 * the ImportRow service interface in types.ts.
 */
export const importRowSchema = z.object({
  expediente: z.string().optional(),
  nombre: z.string().optional(),
  referente: z.string().optional(),
  detalle: z.string().optional(),
  monto_total: z.number().default(0),
  monto_parcial: z.number().default(0),
  saldo: z.number().default(0),
  fecha: z.coerce.date().optional(),
});

/**
 * POST /api/import request body (text fields only).
 * Multer handles binary file validation — z.instanceof(File) is intentionally absent.
 */
export const importRequestSchema = z.object({
  import_date: z.coerce.date().optional(),
});

/**
 * Result of matching one import row against the 14-table ecosystem.
 * `table_type` uses 'Type1'/'Type2' to match the design's TableType union.
 */
export const matchResultSchema = z.object({
  match_type: z.enum(['expediente_exact', 'name_exact', 'ambiguous', 'no_match']),
  table_type: z.enum(['Type1', 'Type2']).optional(),
  table_name: z.string().optional(),
  matched_row_id: z.number().optional(),
  candidates: z.array(z.unknown()).optional(),
});

/** Aggregated statistics for a completed import run. */
export const importSummarySchema = z.object({
  total_rows: z.number(),
  matched_by_expediente: z.number(),
  matched_by_name: z.number(),
  unmatched: z.number(),
  ambiguous: z.number(),
  warnings: z.array(z.string()),
});

/** POST /api/import response. */
export const importResponseSchema = z.object({
  success: z.boolean(),
  summary: importSummarySchema,
  updated_rows: z.array(
    z.object({
      table_type: z.string(),
      table_name: z.string(),
      row_id: z.number(),
      expediente: z.string().optional(),
      version_created: z.number(),
      matched_by: z.string(),
    }),
  ),
  errors: z.array(z.string()).optional(),
});

/** Single version entry returned by the /versions history endpoints. */
export const versionHistoryRowSchema = z.object({
  version: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  data: z.record(z.unknown()),
  imported_from: z.string(),
});

/**
 * Response for:
 *   GET /api/expedientes/:numero/versions
 *   GET /api/person/:personId/table/:tableName/versions
 */
export const versionHistoryResponseSchema = z.object({
  expediente: z.string().optional(),
  person_id: z.number().optional(),
  table_name: z.string(),
  versions: z.array(versionHistoryRowSchema),
});

// ─── Table List Views (GET /api/import/tables/:tableName) ─────────────────────

/**
 * Query parameters for the paginated table listing.
 * `fecha_carga` is an ISO day (YYYY-MM-DD) — TableQueryService expands it to
 * the [startOfDay, endOfDay] range over that calendar day.
 */
export const tableListQuerySchema = z.object({
  expediente: z.string().optional(),
  nombre: z.string().optional(),
  fecha_carga: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_carga must be a valid day (YYYY-MM-DD)')
    .optional(),
  es_eventual: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/** GET /api/import/tables/:tableName response (spec: { table_name, data, pagination, eventual_total }). */
export const tableListResponseSchema = z.object({
  table_name: z.string(),
  data: z.array(z.record(z.unknown())),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  eventual_total: z.number(),
});

// ─── Inferred TypeScript Types ────────────────────────────────────────────────

export type ImportRow = z.infer<typeof importRowSchema>;
export type ImportRequest = z.infer<typeof importRequestSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;
export type ImportSummary = z.infer<typeof importSummarySchema>;
export type ImportResponse = z.infer<typeof importResponseSchema>;
export type ReportesHistoricoRow = z.infer<typeof reportesHistoricoSchema>;
export type VersionHistoryRow = z.infer<typeof versionHistoryRowSchema>;
export type VersionHistoryResponse = z.infer<typeof versionHistoryResponseSchema>;
export type TableListQuery = z.infer<typeof tableListQuerySchema>;
export type TableListResponse = z.infer<typeof tableListResponseSchema>;
export type Person = z.infer<typeof personSchema>;
