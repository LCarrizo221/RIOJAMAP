/**
 * backfill-municipio.ts
 *
 * Idempotent script: populates the `municipio` column on all 6 Type1 tables
 * by parsing the `referente` field (e.g. "INT. ARMANDO MOLINA - Capital" → "capital").
 * Only touches rows WHERE municipio IS NULL.
 *
 * Usage:
 *   npx tsx scripts/backfill-municipio.ts          # dry-run (default)
 *   npx tsx scripts/backfill-municipio.ts --apply   # write changes
 */

import { PrismaClient } from '@prisma/client';
import { extractMunicipio } from '../src/utils/ReferenteParser.js';
import { normalizeMunicipio } from '../src/utils/MunicipioNormalizer.js';

const prisma = new PrismaClient();

const TYPE1_TABLES = [
  'Expedientes',
  'ConveniosMunic',
  'DeudasEXPTES',
  'Instituciones',
  'Diputados',
  'Intendentes026',
] as const;

type TableRecord = { id: number; referente: string | null };

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`\n=== backfill-municipio (${apply ? 'APPLY' : 'DRY RUN'}) ===\n`);

  let totalUpdated = 0;

  for (const table of TYPE1_TABLES) {
    const rows = await prisma.$queryRawUnsafe<TableRecord[]>(
      `SELECT id, referente FROM "${table}" WHERE municipio IS NULL`,
    );

    if (rows.length === 0) {
      console.log(`  ${table}: 0 rows to update (all have municipio or no referente)`);
      continue;
    }

    let updated = 0;
    for (const row of rows) {
      const municipio = normalizeMunicipio(extractMunicipio(row.referente));
      if (!municipio) continue; // referente has no parseable municipio

      if (apply) {
        await prisma.$executeRawUnsafe(
          `UPDATE "${table}" SET municipio = $1 WHERE id = $2`,
          municipio,
          row.id,
        );
      }
      updated++;
    }

    console.log(`  ${table}: ${updated}/${rows.length} rows ${apply ? 'updated' : 'would be updated'}`);
    totalUpdated += updated;
  }

  console.log(`\nTotal: ${totalUpdated} rows ${apply ? 'updated' : 'would be updated'}\n`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
