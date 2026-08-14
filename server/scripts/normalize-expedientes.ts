/**
 * normalize-expedientes.ts
 *
 * Backfill script: normalizes all stored expediente values across the 14 import
 * tables + ReportesHistorico to canonical form `H11-02353-2-26`.
 *
 * Usage:
 *   tsx server/scripts/normalize-expedientes.ts          # dry-run (no writes)
 *   tsx server/scripts/normalize-expedientes.ts --apply  # actually write changes
 *
 * SAFE BY DEFAULT: without --apply, only counts and prints what WOULD change
 * plus any collisions. Never deletes rows. Never modifies rows whose normalize()
 * returns the original value.
 *
 * Type1 tables (expediente @unique): collisions are detected and skipped in --apply.
 * Type2 tables & reportesHistorico (no unique on expediente): updated directly.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ExpedienteNormalizationService } from '../src/services/import/ExpedienteNormalizationService.js';

const prisma = new PrismaClient();
const normalizer = new ExpedienteNormalizationService();

// ─── Table configuration ──────────────────────────────────────────────────────

interface TableConfig {
  /** Prisma client property name (lowercased first letter of model name). */
  model: string;
  /** Whether expediente has a @unique constraint (collision check needed). */
  isType1: boolean;
}

/** All 14 import tables + ReportesHistorico. Type1 tables have @unique expediente. */
const TABLES: TableConfig[] = [
  // Type1 — expediente is @unique
  { model: 'expedientes',      isType1: true },
  { model: 'conveniosMunic',   isType1: true },
  { model: 'deudasEXPTES',     isType1: true },
  { model: 'instituciones',    isType1: true },
  { model: 'intendentes026',   isType1: true },
  { model: 'diputados',        isType1: true },
  // Type2 — person-specific, expediente not unique
  { model: 'piniHerrera',      isType1: false },
  { model: 'gabiPedrali',      isType1: false },
  { model: 'teresitaMadera',   isType1: false },
  { model: 'florenciaLopez',   isType1: false },
  { model: 'guryCaceres',      isType1: false },
  { model: 'dirigentes',       isType1: false },
  { model: 'romina',           isType1: false },
  { model: 'misael',           isType1: false },
  // Audit log (immutable in normal flow, but expedientes may be non-canonical)
  { model: 'reportesHistorico', isType1: false },
];

const MAX_EXAMPLES = 30;

// ─── CLI parsing ────────────────────────────────────────────────────────────────

const APPLY = process.argv.includes('--apply');

// ─── Signal handling ───────────────────────────────────────────────────────────

let shuttingDown = false;
process.on('SIGTERM', async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.warn('\n[SIGNAL] SIGTERM received — shutting down gracefully…');
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
});

// ─── Row-level result ─────────────────────────────────────────────────────────

interface RowChange {
  id: number;
  old: string;
  newVal: string;
  collision: boolean;
}

// ─── Main logic ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`Mode: ${APPLY ? 'APPLY (writes enabled)' : 'DRY-RUN (no writes)'}`);
  console.log('');

  let grandTotalChanged = 0;
  let grandTotalCollisions = 0;

  for (const table of TABLES) {
    const { model, isType1 } = table;

    // Fetch all rows with a non-null/non-empty expediente. Prisma 5 rejects
    // `not: null`, so we fetch the key set and filter in-process.
    const rows: { id: number; expediente: string | null }[] = await (prisma as any)[model]
      .findMany({ select: { id: true, expediente: true } }) as {
      id: number;
      expediente: string | null;
    }[];
    const filtered = rows.filter(
      (r) => r.expediente !== null && r.expediente !== undefined && r.expediente !== '',
    );

    const total = filtered.length;

    // Build the set of current expediente values (for collision detection).
    const currentValues = new Set<string>(rows.map((r) => r.expediente));

    // Track canonical values assigned during this run — handles intra-run
    // collisions where two different non-canonical values normalize to the
    // same canonical (Type1 would violate @unique on the second update).
    const assignedInRun = new Set<string>();

    let changed = 0;
    let collisions = 0;
    const examples: RowChange[] = [];

    for (const row of filtered) {
      const oldVal = row.expediente;
      const newVal = normalizer.normalize(oldVal);

      // Skip rows that are already canonical (no change).
      if (newVal === oldVal) continue;

      // Type guard: normalize returns original input for matching rows,
      // so newVal is always a string here.
      if (typeof newVal !== 'string') continue;

      // Collision: the target canonical value already exists in this table
      // (from an existing row or from a prior update in this same run).
      const isCollision = currentValues.has(newVal) || assignedInRun.has(newVal);

      if (isCollision) {
        collisions++;
        // For Type1, collisions are skipped in BOTH dry-run and apply mode
        // (would violate the @unique constraint).
        // For Type2/Historico there are no collisions in practice (no unique
        // constraint), but the check does no harm.
        if (isType1 && examples.length < MAX_EXAMPLES) {
          examples.push({ id: row.id, old: oldVal, newVal, collision: true });
        }
        continue;
      }

      // Non-collision candidate.
      changed++;
      if (examples.length < MAX_EXAMPLES) {
        examples.push({ id: row.id, old: oldVal, newVal, collision: false });
      }

      if (APPLY) {
        if (isType1) {
          assignedInRun.add(newVal);
        }
        await (prisma as any)[model].update({
          where: { id: row.id },
          data: { expediente: newVal },
        });
      }
    }

    // ─── Per-table summary ────────────────────────────────────────────────────
    console.log(`Table: ${model} (${isType1 ? 'Type1' : 'Type2/Historico'})`);
    console.log(`  Total rows with expediente: ${total}`);
    console.log(`  Changed: ${changed}`);
    console.log(`  Collisions: ${collisions}`);

    if (examples.length > 0) {
      const shown = examples.length;
      const remaining =
        changed + collisions - shown > 0 ? changed + collisions - shown : 0;
      console.log(`  Examples (${shown}${remaining > 0 ? ` + ${remaining} more` : ''}):`);
      for (const ex of examples) {
        const marker = ex.collision ? '  [COLLISION — skipped]' : '  → will update';
        console.log(`    id=${ex.id}: "${ex.old}" → "${ex.newVal}"${marker}`);
      }
    }

    if (changed === 0 && collisions === 0) {
      console.log('  (all expedientes already canonical)');
    }

    console.log('');
    grandTotalChanged += changed;
    grandTotalCollisions += collisions;
  }

  console.log('─'.repeat(40));
  console.log(`Grand total — would change: ${grandTotalChanged}, collisions: ${grandTotalCollisions}`);
  if (!APPLY) {
    console.log('(dry-run — no changes written. Re-run with --apply to persist.)');
  }
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
