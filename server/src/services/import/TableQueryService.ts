/**
 * TableQueryService
 *
 * Read-only listing for the 14 import tables (GET /api/import/tables/:tableName).
 *
 * - Table names are resolved ONLY through the GENERIC_TABLES ∪ PERSON_TABLES
 *   whitelist; anything else throws InvalidTableError (→ 400 INVALID_TABLE).
 *   Dynamic access goes through `(prisma as any)[tableName]` — safe because the
 *   whitelist is enforced before any Prisma call, never interpolated into raw SQL.
 * - Rows are ordered by `id desc` (PK index serves ordering free, design #1).
 * - Filters: expediente / nombre (case-insensitive contains), es_eventual,
 *   fecha_carga (ISO day → [startOfDay, endOfDay] range over the calendar day).
 * - Pagination: page/limit with skip/take; totalPages = ceil(total / limit).
 */

import { PrismaClient } from '@prisma/client';
import { GENERIC_TABLES, PERSON_TABLES } from './types.js';

/** All valid table names; built once from the service-layer whitelists. */
const WHITELIST: ReadonlySet<string> = new Set([...GENERIC_TABLES, ...PERSON_TABLES]);

/** Thrown when a table name is not in the whitelist (controller maps to 400). */
export class InvalidTableError extends Error {
  constructor(tableName: string) {
    super(`Unknown table name: ${tableName}`);
    this.name = 'InvalidTableError';
  }
}

/** Filter + pagination query for a table listing (shape of tableListQuerySchema). */
export interface TableListQuery {
  expediente?: string;
  nombre?: string;
  /** ISO day (YYYY-MM-DD) → expanded to [startOfDay, endOfDay]. */
  fecha_carga?: string;
  es_eventual?: 'true' | 'false';
  page: number;
  limit: number;
}

/** Paginated rows without the table-name/eventual envelope (controller composes it). */
export interface TableListResult {
  data: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export class TableQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  isValidTable(tableName: string): boolean {
    return WHITELIST.has(tableName);
  }

  /**
   * Paginated listing for one whitelisted table.
   * @throws InvalidTableError when tableName is not whitelisted.
   */
  async list(tableName: string, q: TableListQuery): Promise<TableListResult> {
    this.assertValidTable(tableName);

    const where = this.buildWhere(q);
    const skip = (q.page - 1) * q.limit;
    const table = (this.prisma as any)[tableName];

    const [total, rows] = await Promise.all([
      table.count({ where }),
      table.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: q.limit,
      }),
    ]);

    return {
      data: rows as unknown[],
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    };
  }

  /**
   * Total rows with es_eventual=true in a whitelisted table (eventual badge count).
   * @throws InvalidTableError when tableName is not whitelisted.
   */
  async countEventual(tableName: string): Promise<number> {
    this.assertValidTable(tableName);

    const table = (this.prisma as any)[tableName];
    return table.count({ where: { es_eventual: true } });
  }

  private assertValidTable(tableName: string): void {
    if (!this.isValidTable(tableName)) {
      throw new InvalidTableError(tableName);
    }
  }

  private buildWhere(q: TableListQuery): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (q.expediente !== undefined && q.expediente !== '') {
      where.expediente = { contains: q.expediente, mode: 'insensitive' };
    }
    if (q.nombre !== undefined && q.nombre !== '') {
      where.nombre = { contains: q.nombre, mode: 'insensitive' };
    }
    if (q.es_eventual !== undefined) {
      where.es_eventual = q.es_eventual === 'true';
    }
    if (q.fecha_carga !== undefined && q.fecha_carga !== '') {
      // Parse the day parts locally so the range is timezone-stable.
      if (DAY_RE.test(q.fecha_carga)) {
        const [year, month, day] = q.fecha_carga.split('-').map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.fecha_carga = { gte: startOfDay, lte: endOfDay };
      }
    }

    return where;
  }
}
