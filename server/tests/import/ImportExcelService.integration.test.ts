import { describe, it, expect } from '@jest/globals';
import { ImportExcelService } from '../../src/services/import/ImportExcelService';
import { NameNormalizationService } from '../../src/services/import/NameNormalizationService';
import type { ImportRow, ImportResult } from '../../src/services/import/types.js';

// Helper to create a minimal ImportRow
function makeRow(overrides: Partial<ImportRow> = {}): ImportRow {
  return {
    expediente: 'EXP001',
    nombre: 'Test Name',
    referente: undefined,
    detalle: undefined,
    monto_total: 0,
    monto_parcial: 0,
    saldo: 0,
    fecha: undefined,
    raw: {},
    ...overrides,
  } as ImportRow;
}

describe('ImportExcelService _processRow branches', () => {
  const importDate = new Date('2023-01-01');
  const sourceFile = 'test.xlsx';
  // Per-row write context normally computed by importFile (eventual mode).
  const writeCtx = { fecha_carga: importDate, es_eventual: false };

  const baseResult: ImportResult = {
    success: true,
    summary: {
      total_rows: 0,
      matched_by_expediente: 0,
      matched_by_name: 0,
      unmatched: 0,
      ambiguous: 0,
      warnings: [],
    },
    updated_rows: [],
    errors: [],
  };

  it('handles expediente_exact with Type1 upsert', async () => {
    const matchingMock = { match: jest.fn().mockResolvedValue({ match_type: 'expediente_exact', table_type: 'Type1', table_name: 'expedientes' }) } as any;
    const versioningMock = {
      upsertGenericRow: jest.fn().mockResolvedValue({ id: 1, version: 2 }),
      buildResult: jest.fn().mockReturnValue({ /* dummy result */ } as any),
    } as any;
    const historicoMock = { log: jest.fn().mockResolvedValue(undefined) } as any;
    const nameServiceMock = {} as any;

    const service = new ImportExcelService({} as any, matchingMock, versioningMock, historicoMock, nameServiceMock);
    const result = JSON.parse(JSON.stringify(baseResult));
    const row = makeRow();

    // @ts-ignore private method
    await (service as any)._processRow(row, importDate, sourceFile, result, writeCtx);

    expect(result.summary.matched_by_expediente).toBe(1);
    expect(matchingMock.match).toHaveBeenCalled();
    expect(versioningMock.upsertGenericRow).toHaveBeenCalled();
    expect(historicoMock.log).toHaveBeenCalled();
  });

  it('handles expediente_exact with Type2 duplicate (adds warning)', async () => {
    const matchingMock = { match: jest.fn().mockResolvedValue({ match_type: 'expediente_exact', table_type: 'Type2', table_name: 'personas', matched_row: { person_id: 10 } }) } as any;
    const versioningMock = {
      isDuplicate: jest.fn().mockResolvedValue(true),
      buildResult: jest.fn(),
    } as any;
    const historicoMock = { log: jest.fn().mockResolvedValue(undefined) } as any;
    const nameServiceMock = {} as any;

    const service = new ImportExcelService({} as any, matchingMock, versioningMock, historicoMock, nameServiceMock);
    const result = JSON.parse(JSON.stringify(baseResult));
    const row = makeRow();

    await (service as any)._processRow(row, importDate, sourceFile, result, writeCtx);

    expect(result.summary.warnings.some((w: string) => w.includes('Duplicate (same day): expediente'))).toBe(true);
    expect(result.summary.matched_by_expediente).toBe(0);
    expect(historicoMock.log).toHaveBeenCalled();
  });

  it('handles name_exact non-duplicate', async () => {
    const matchingMock = { match: jest.fn().mockResolvedValue({ match_type: 'name_exact', table_name: 'personas', matched_row: { person_id: 5 } }) } as any;
    const versioningMock = {
      isDuplicate: jest.fn().mockResolvedValue(false),
      getLatestVersion: jest.fn().mockResolvedValue(1),
      createVersionedRow: jest.fn().mockResolvedValue({ id: 2, version: 2 }),
      buildResult: jest.fn().mockReturnValue({} as any),
    } as any;
    const historicoMock = { log: jest.fn().mockResolvedValue(undefined) } as any;
    const nameServiceMock = new NameNormalizationService() as any;

    const service = new ImportExcelService({} as any, matchingMock, versioningMock, historicoMock, nameServiceMock);
    const result = JSON.parse(JSON.stringify(baseResult));
    const row = makeRow({ expediente: undefined });

    await (service as any)._processRow(row, importDate, sourceFile, result, writeCtx);

    expect(result.summary.matched_by_name).toBe(1);
    expect(versioningMock.createVersionedRow).toHaveBeenCalled();
    expect(historicoMock.log).toHaveBeenCalled();
  });

  it('handles ambiguous match adds warning', async () => {
    const matchingMock = { match: jest.fn().mockResolvedValue({ match_type: 'ambiguous', candidates: [] }) } as any;
    const versioningMock = {} as any;
    const historicoMock = { log: jest.fn().mockResolvedValue(undefined) } as any;
    const nameServiceMock = {} as any;
    const service = new ImportExcelService({} as any, matchingMock, versioningMock, historicoMock, nameServiceMock);
    const result = JSON.parse(JSON.stringify(baseResult));
    const row = makeRow();
    await (service as any)._processRow(row, importDate, sourceFile, result, writeCtx);
    expect(result.summary.ambiguous).toBe(1);
    expect(result.summary.warnings.some((w: string) => w.includes('Ambiguous match for expediente'))).toBe(true);
  });

  it('handles no_match adds to unmatched', async () => {
    const matchingMock = { match: jest.fn().mockResolvedValue({ match_type: 'no_match' }) } as any;
    const versioningMock = {} as any;
    const historicoMock = { log: jest.fn().mockResolvedValue(undefined) } as any;
    const nameServiceMock = {} as any;
    const service = new ImportExcelService({} as any, matchingMock, versioningMock, historicoMock, nameServiceMock);
    const result = JSON.parse(JSON.stringify(baseResult));
    const row = makeRow();
    await (service as any)._processRow(row, importDate, sourceFile, result, writeCtx);
    expect(result.summary.unmatched).toBe(1);
  });

  it('catches row processing error and logs', async () => {
    const matchingMock = { match: jest.fn().mockRejectedValue(new Error('boom')) } as any;
    const versioningMock = {} as any;
    const historicoMock = { log: jest.fn().mockResolvedValue(undefined) } as any;
    const nameServiceMock = {} as any;
    const service = new ImportExcelService({} as any, matchingMock, versioningMock, historicoMock, nameServiceMock);
    const result = JSON.parse(JSON.stringify(baseResult));
    const row = makeRow();
    await (service as any)._processRow(row, importDate, sourceFile, result, writeCtx);
    expect(result.errors.length).toBe(1);
    expect(historicoMock.log).toHaveBeenCalled();
  });
});
