/**
 * Client-side Zod schemas mirroring server/src/schemas/import.ts
 * Last synced with backend: 2026-08-06
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

// ─── Inferred TypeScript Types ────────────────────────────────────────────────

export type ImportResponse = z.infer<typeof ImportResponseContract>;
export type ReportesHistorico = z.infer<typeof ReportesHistoricoContract>;
export type VersionHistory = z.infer<typeof VersionHistoryContract>;
