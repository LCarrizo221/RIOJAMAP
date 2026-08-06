/**
 * VersioningService
 *
 * Handles versioned row creation for both table types:
 *
 * - Type1 (generic, expediente @unique): UPSERT — updates in-place, increments version.
 *   Uses prisma[tableName].upsert({ where: { expediente }, update: { version: { increment: 1 } } })
 *
 * - Type2 (person-specific, no unique on expediente alone): INSERT new row each time.
 *   Uses prisma[tableName].create({ data: { ...rowData, version, imported_from } })
 *
 * Dynamic table access uses (prisma as any)[tableName] since Prisma client is
 * statically typed and table names are resolved at runtime.
 */

import { PrismaClient } from '@prisma/client';
import type { VersionedRowResult, TableType } from './types.js';

export class VersioningService {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Queries ────────────────────────────────────────────────────────────────

  /**
   * Gets the latest version number for a given expediente in any table.
   * Optionally scoped to a specific person (for Type2 tables).
   *
   * @returns The highest version number found, or 0 if no matching row exists.
   */
  async getLatestVersion(
    tableName: string,
    expediente: string,
    personId?: number,
  ): Promise<number> {
    const where: Record<string, unknown> = { expediente };
    if (personId !== undefined) {
      where.person_id = personId;
    }

    const row = await (this.prisma as any)[tableName].findFirst({
      where,
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return row?.version ?? 0;
  }

  /**
   * Detects a same-day duplicate: same expediente + same personId + same calendar day.
   * Used before inserting a new Type2 row to avoid double-imports within a day.
   *
   * @param personId - Pass null for Type1 tables (no person scoping).
   * @returns true if a duplicate row already exists for that calendar day.
   */
  async isDuplicate(
    tableName: string,
    expediente: string,
    personId: number | null,
    importDate: Date,
  ): Promise<boolean> {
    const startOfDay = new Date(importDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(importDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      expediente,
      createdAt: { gte: startOfDay, lte: endOfDay },
    };
    if (personId !== null) {
      where.person_id = personId;
    }

    const existing = await (this.prisma as any)[tableName].findFirst({ where });
    return existing !== null;
  }

  // ─── Writers ─────────────────────────────────────────────────────────────────

  /**
   * Creates a new versioned row in the target table (Type2 pattern).
   * Does NOT check for duplicates — caller is responsible for that guard.
   *
   * @param rowData    - Full row fields (must NOT include version or imported_from; added here).
   * @param version    - Version number to assign (usually latestVersion + 1).
   * @param importedFrom - Source file tag (e.g. "INFORME_DIARIO").
   * @returns { id, version } of the newly created row.
   */
  async createVersionedRow(
    tableName: string,
    rowData: Record<string, unknown>,
    version: number,
    importedFrom: string,
  ): Promise<{ id: number; version: number }> {
    const result = await (this.prisma as any)[tableName].create({
      data: {
        ...rowData,
        version,
        imported_from: importedFrom,
      },
      select: { id: true, version: true },
    });
    return { id: result.id, version: result.version };
  }

  /**
   * Upserts a row in a Type1 generic table (expediente @unique).
   *
   * - First import  → CREATE with version=1.
   * - Re-import     → UPDATE in-place with version++ (atomic Prisma increment).
   *
   * `expediente` is stripped from updateData to avoid re-sending the unique key.
   *
   * @returns { id, version } of the upserted row (version reflects the new value).
   */
  async upsertGenericRow(
    tableName: string,
    expediente: string,
    rowData: Record<string, unknown>,
  ): Promise<{ id: number; version: number }> {
    // Exclude expediente from the update payload — it's the unique key
    const { expediente: _exp, version: _v, imported_from: _if, ...updateFields } = rowData;

    const result = await (this.prisma as any)[tableName].upsert({
      where: { expediente },
      update: {
        ...updateFields,
        version: { increment: 1 },
      },
      create: {
        ...rowData,
        expediente,
        version: 1,
        imported_from: rowData.imported_from ?? 'INFORME_DIARIO',
      },
      select: { id: true, version: true },
    });
    return { id: result.id, version: result.version };
  }

  // ─── Convenience builder ──────────────────────────────────────────────────────

  /**
   * Builds a VersionedRowResult envelope suitable for the ImportResult.updated_rows array.
   */
  buildResult(
    tableName: string,
    tableType: TableType,
    rowId: number,
    expediente: string | undefined,
    version: number,
    matchedBy: 'expediente_exact' | 'name_exact',
    createdAt: Date,
  ): VersionedRowResult {
    return {
      table_type: tableType,
      table_name: tableName,
      row_id: rowId,
      expediente,
      version_created: version,
      matched_by: matchedBy,
      created_at: createdAt.toISOString(),
    };
  }
}
