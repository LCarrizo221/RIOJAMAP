/**
 * MatchingService
 *
 * Dual-criteria matching across all 14 tables (6 Type1 + 8 Type2).
 *
 * Algorithm (strict priority order):
 *
 *   Step 1 — Expediente match (Type1 first, then Type2):
 *     • Search all 6 Type1 tables sequentially; collect every matching row.
 *     • If exactly 1 total → expediente_exact / Type1.
 *     • If > 1 total      → ambiguous (cross-table or within-table duplicates).
 *     • If 0              → search all 8 Type2 tables sequentially.
 *       - If exactly 1 → expediente_exact / Type2.
 *       - If > 1       → ambiguous.
 *       - If 0         → fall through to Step 2.
 *
 *   Step 2 — Name match (Type2 only, parallel):
 *     • Promise.all across 8 Type2 tables.
 *     • Each table: findMany where nombre IS NOT NULL, filter client-side via
 *       nameService.compare() (normalized exact match).
 *     • If exactly 1 total → name_exact / Type2.
 *     • If > 1 total       → ambiguous.
 *     • If 0               → no_match.
 *
 *   If row.expediente is absent/empty, skip directly to Step 2.
 *
 * Design decision (from design.md):
 *   - Type1 expediente: sequential (to detect multi-table ambiguity correctly).
 *   - Type2 name: Promise.all (tables are independent; no cross-table ordering needed).
 */

import { PrismaClient } from '@prisma/client';
import { GENERIC_TABLES, PERSON_TABLES } from './types.js';
import type { ImportRow, MatchResult } from './types.js';
import type { NameNormalizationService } from './NameNormalizationService.js';
import { ExpedienteNormalizationService } from './ExpedienteNormalizationService.js';

interface CandidateRow {
  tableName: string;
  row: { id: number; version: number; [key: string]: unknown };
}

export class MatchingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly nameService: NameNormalizationService,
  ) {}

  /**
   * Match one import row against the full 14-table ecosystem.
   * Returns a MatchResult with the appropriate match_type discriminant.
   */
  async match(row: ImportRow): Promise<MatchResult> {
    // ── Step 1: Expediente matching ──────────────────────────────────────────
    const normalizedExpediente = row.expediente
      ? new ExpedienteNormalizationService().normalize(row.expediente) ?? row.expediente
      : undefined;
    if (normalizedExpediente && normalizedExpediente.trim() !== '') {
      const expResult = await this._matchByExpediente(normalizedExpediente.trim());
      if (expResult !== null) return expResult;
    }

    // ── Step 2: Name matching (Type2 only) ───────────────────────────────────
    if (row.nombre && row.nombre.trim() !== '') {
      return this._matchByName(row.nombre.trim());
    }

    return { match_type: 'no_match' };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Searches Type1 then Type2 tables for an exact expediente (case-insensitive).
   * Returns a MatchResult or null if 0 candidates found in both tier searches.
   */
  private async _matchByExpediente(expediente: string): Promise<MatchResult | null> {
    // Tier A: Type1 tables (generic)
    const type1Candidates = await this._searchTablesForExpediente(
      GENERIC_TABLES as unknown as string[],
      expediente,
    );

    if (type1Candidates.length === 1) {
      const hit = type1Candidates[0];
      return {
        match_type: 'expediente_exact',
        table_type: 'Type1',
        table_name: hit.tableName,
        matched_row: hit.row,
      };
    }
    if (type1Candidates.length > 1) {
      return {
        match_type: 'ambiguous',
        table_type: 'Type1',
        candidates: type1Candidates.map(c => ({ table: c.tableName, row: c.row })),
      };
    }

    // Tier B: Type2 tables (person-specific) — only if Type1 had no hits
    const type2Candidates = await this._searchTablesForExpediente(
      PERSON_TABLES as unknown as string[],
      expediente,
    );

    if (type2Candidates.length === 1) {
      const hit = type2Candidates[0];
      return {
        match_type: 'expediente_exact',
        table_type: 'Type2',
        table_name: hit.tableName,
        matched_row: hit.row,
      };
    }
    if (type2Candidates.length > 1) {
      return {
        match_type: 'ambiguous',
        table_type: 'Type2',
        candidates: type2Candidates.map(c => ({ table: c.tableName, row: c.row })),
      };
    }

    // No expediente match in any table
    return null;
  }

  /**
   * Queries each table in the provided list for rows matching the expediente
   * (case-insensitive equality). Accumulates all hits across all tables.
   */
  private async _searchTablesForExpediente(
    tables: string[],
    expediente: string,
  ): Promise<CandidateRow[]> {
    const candidates: CandidateRow[] = [];

    for (const tableName of tables) {
      const rows: { id: number; version: number; [key: string]: unknown }[] =
        await (this.prisma as any)[tableName].findMany({
          where: {
            expediente: {
              equals: expediente,
              mode: 'insensitive',
            },
          },
        });

      for (const row of rows) {
        candidates.push({ tableName, row });
      }
    }

    return candidates;
  }

  /**
   * Searches all 8 Type2 person tables in parallel for a name match.
   * Name comparison is done client-side via NameNormalizationService.compare().
   */
  private async _matchByName(nombre: string): Promise<MatchResult> {
    // Fetch all non-null nombre rows from all person tables in parallel
    const perTableResults = await Promise.all(
      (PERSON_TABLES as unknown as string[]).map(async tableName => {
        const rows: { id: number; version: number; nombre?: string | null; [key: string]: unknown }[] =
          await (this.prisma as any)[tableName].findMany({
            where: { nombre: { not: null } },
          });

        return rows
          .filter(row => this.nameService.compare(nombre, row.nombre ?? null))
          .map(row => ({ tableName, row }));
      }),
    );

    const candidates: CandidateRow[] = perTableResults.flat();

    if (candidates.length === 1) {
      const hit = candidates[0];
      return {
        match_type: 'name_exact',
        table_type: 'Type2',
        table_name: hit.tableName,
        matched_row: hit.row,
      };
    }

    if (candidates.length > 1) {
      return {
        match_type: 'ambiguous',
        table_type: 'Type2',
        candidates: candidates.map(c => ({ table: c.tableName, row: c.row })),
      };
    }

    return { match_type: 'no_match' };
  }
}
