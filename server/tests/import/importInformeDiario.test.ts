// Positional INFORME DIARIO parsing tests.
// Layout: single sheet, title row 5, empty row 6, data from row 7.
// Column 1 = fecha, 15 = beneficiary name, 16 = detalle, 17 = monto.
// Rows are untagged and resolved by name through MatchingService.
import ExcelJS from 'exceljs';
import { ImportExcelService } from '../../src/services/import/ImportExcelService';

// ─── Fixture ──────────────────────────────────────────────────────────────────

/** Builds a positional informe diario workbook with 2 data rows. */
async function buildPositionalBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('INFORME DIARIO');

  // Title row 5
  ws.getRow(5).getCell(1).value = 'INFORME DIARIO - PiniHerrera';
  // Row 6 left empty on purpose (format signal)

  // Row 7: fecha, (empty), nombre col 15, detalle col 16, monto col 17
  const r7 = ws.getRow(7);
  r7.getCell(1).value = new Date('2026-08-06');
  r7.getCell(15).value = 'Juan Pérez';
  r7.getCell(16).value = 'Ayuda escolar';
  r7.getCell(17).value = 500;

  // Row 8: second record
  const r8 = ws.getRow(8);
  r8.getCell(1).value = new Date('2026-08-07');
  r8.getCell(15).value = 'María Gómez';
  r8.getCell(16).value = 'Bono';
  r8.getCell(17).value = 300;

  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {} as any;

const versioningMock = {
  isDuplicate: jest.fn().mockResolvedValue(false),
  getLatestVersion: jest.fn().mockResolvedValue(0),
  createVersionedRow: jest.fn().mockResolvedValue({ id: 10, version: 1 }),
  buildResult: jest.fn().mockReturnValue({} as any),
} as any;

const historicoMock = { log: jest.fn().mockResolvedValue(undefined) } as any;
const nameServiceMock = { normalize: jest.fn((s: string) => s) } as any;

function makeService(matchingMock: any) {
  return new ImportExcelService(prismaMock, matchingMock, versioningMock, historicoMock, nameServiceMock);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ImportExcelService positional informe diario parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects the positional format and parses rows from row 7', async () => {
    const matchingMock = { match: jest.fn() } as any;
    const service = makeService(matchingMock);
    const buffer = await buildPositionalBuffer();

    const { rows, warnings } = await service.parseFile(buffer as any);

    expect(rows).toHaveLength(2);
    expect(warnings).toHaveLength(0);

    expect(rows[0].nombre).toBe('Juan Pérez');
    expect(rows[0].detalle).toBe('Ayuda escolar');
    expect(rows[0].monto_total).toBe(500);
    expect(rows[0].fecha).toBeInstanceOf(Date);
    expect(rows[0].table_name).toBeUndefined(); // untagged → resolved by matching

    expect(rows[1].nombre).toBe('María Gómez');
    expect(rows[1].monto_total).toBe(300);
  });

  it('matches rows by beneficiary name through MatchingService on import', async () => {
    const matchingMock = {
      match: jest.fn().mockResolvedValue({
        match_type: 'name_exact',
        table_name: 'piniHerrera',
        matched_row: { person_id: 7 },
      }),
    } as any;
    const service = makeService(matchingMock);
    const buffer = await buildPositionalBuffer();

    const result = await service.importFile(buffer as any, new Date('2026-08-10'), 'INFORME DIARIO - PiniHerrera.xlsx');

    expect(matchingMock.match).toHaveBeenCalledTimes(2);
    expect(versioningMock.createVersionedRow).toHaveBeenCalledTimes(2);
    expect(result.summary.matched_by_name).toBe(2);
    expect(historicoMock.log).toHaveBeenCalledTimes(2);
  });

  it('counts rows that fail to match as unmatched', async () => {
    const matchingMock = {
      match: jest.fn().mockResolvedValue({ match_type: 'no_match' }),
    } as any;
    const service = makeService(matchingMock);
    const buffer = await buildPositionalBuffer();

    const result = await service.importFile(buffer as any, new Date('2026-08-10'), 'INFORME DIARIO - PiniHerrera.xlsx');

    expect(result.summary.unmatched).toBe(2);
    expect(result.summary.matched_by_name).toBe(0);
  });
});
