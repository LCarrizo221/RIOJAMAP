// Static test for the 20260814142505_load_date_eventual migration.
// Property under test: existing rows keep a NULL fecha_carga — the column is
// added nullable (TIMESTAMP(3), no NOT NULL, no DEFAULT) and there is no
// backfill/UPDATE. es_eventual is added NOT NULL DEFAULT false.
// Pure static test — reads the SQL file, no DB connection required.

import { readFileSync } from 'fs';
import { join } from 'path';

const MIGRATION_DIR = join(
  process.cwd(),
  'prisma',
  'migrations',
  '20260814142505_load_date_eventual',
);
const migrationSql = readFileSync(join(MIGRATION_DIR, 'migration.sql'), 'utf8');

const EXPECTED_TABLES = [
  'ConveniosMunic',
  'DeudasEXPTES',
  'Diputados',
  'Dirigentes',
  'Expedientes',
  'FlorenciaLopez',
  'GabiPedrali',
  'GuryCaceres',
  'Instituciones',
  'Intendentes026',
  'Misael',
  'PiniHerrera',
  'Romina',
  'TeresitaMadera',
];

function alterBlockFor(tableName: string): string {
  const block = migrationSql.match(new RegExp(`ALTER TABLE "${tableName}"([\\s\\S]*?);`));
  if (!block) throw new Error(`No ALTER TABLE block found for "${tableName}"`);
  return block[1];
}

describe('20260814142505_load_date_eventual migration', () => {
  it('adds the two columns to exactly the 14 expected tables', () => {
    expect((migrationSql.match(/ALTER TABLE/g) ?? []).length).toBe(EXPECTED_TABLES.length);
  });

  it.each(EXPECTED_TABLES)(
    'adds a nullable fecha_carga (no NOT NULL, no DEFAULT) and es_eventual NOT NULL DEFAULT false to %s',
    (tableName) => {
      const block = alterBlockFor(tableName);

      // fecha_carga: nullable TIMESTAMP(3) — no NOT NULL, no DEFAULT/backfill
      expect(block).toMatch(/"fecha_carga"\s*TIMESTAMP\(3\)/);
      expect(block).not.toMatch(/"fecha_carga"\s*TIMESTAMP\(3\)[^,;]*NOT NULL/i);
      expect(block).not.toMatch(/"fecha_carga"\s*TIMESTAMP\(3\)[^,;]*DEFAULT/i);

      // es_eventual: NOT NULL with a DEFAULT of false
      expect(block).toContain('"es_eventual" BOOLEAN NOT NULL DEFAULT false');
    },
  );

  it('does not backfill fecha_carga or es_eventual (existing rows keep NULL)', () => {
    expect(migrationSql).not.toMatch(/\bUPDATE\b/i);
    expect(migrationSql).not.toMatch(/SET\s+"fecha_carga"/i);
    expect(migrationSql).not.toMatch(/SET\s+"es_eventual"/i);
  });
});
