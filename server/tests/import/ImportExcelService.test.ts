// ImportExcelService unit tests
import ExcelJS from 'exceljs';
import { ImportExcelService } from '../../src/services/import/ImportExcelService';
import { NameNormalizationService } from '../../src/services/import/NameNormalizationService';

// Mock dependencies
const mockMatchingService = { match: jest.fn() } as any;
const mockVersioningService = {
  upsertGenericRow: jest.fn(),
  createVersionedRow: jest.fn(),
  getLatestVersion: jest.fn().mockResolvedValue(0),
  isDuplicate: jest.fn().mockResolvedValue(false),
  buildResult: jest.fn(),
} as any;
const mockHistoricoService = { log: jest.fn().mockResolvedValue(undefined) } as any;
const mockNameService = new NameNormalizationService();

function createWorkbookBuffer(): Buffer {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  // Header row (matching known columns, mixed case)
  ws.addRow(['Fecha', 'Expediente', 'Nombre', 'Referente', 'Detalle', 'Monto_Total', 'Monto_Parcial', 'Saldo']);
  // Data row
  ws.addRow(['2026-08-06', 'EXP001', 'Juan Pérez', 'Ref1', 'Detail', 1000, 600, 400]);
  // Return buffer synchronously (write to buffer)
  // ExcelJS writeBuffer returns a Promise<Buffer>
  // We'll use async function to get it
  // Placeholder – actual usage will await this function
  return Buffer.from('');
}

describe('ImportExcelService.parseFile', () => {
  let service: ImportExcelService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new ImportExcelService(
      {} as any,
      mockMatchingService,
      mockVersioningService,
      mockHistoricoService,
      mockNameService,
    );
  });

  it('parses a valid Excel buffer into ImportRow objects', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.addRow(['Fecha', 'Expediente', 'Nombre', 'Referente', 'Detalle', 'Monto_Total', 'Monto_Parcial', 'Saldo']);
    ws.addRow(['2026-08-06', 'EXP001', 'Juan Pérez', 'Ref1', 'Detail', 1000, 600, 400]);
    const buffer = await wb.xlsx.writeBuffer();

    const { rows } = await service.parseFile(buffer as any);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.expediente).toBe('EXP001');
    expect(row.nombre).toBe('Juan Pérez');
    expect(row.referente).toBe('Ref1');
    expect(row.detalle).toBe('Detail');
    expect(row.monto_total).toBe(1000);
    expect(row.monto_parcial).toBe(600);
    expect(row.saldo).toBe(400);
    expect(row.fecha).toBeInstanceOf(Date);
  });

  it('returns empty array when header row is missing', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.addRow(['Some', 'Random', 'Data']);
    const buffer = await wb.xlsx.writeBuffer();
    const { rows } = await service.parseFile(buffer as any);
    expect(rows).toHaveLength(0);
  });

  it('skips completely empty data rows', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.addRow(['Fecha', 'Expediente', 'Nombre', 'Referente', 'Detalle', 'Monto_Total', 'Monto_Parcial', 'Saldo']);
    ws.addRow([]); // empty row
    const buffer = await wb.xlsx.writeBuffer();
    const { rows } = await service.parseFile(buffer as any);
    expect(rows).toHaveLength(0);
  });
});

describe('ImportExcelService.importFile — eventual mode (slice 2)', () => {
  let service: ImportExcelService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVersioningService.upsertGenericRow.mockResolvedValue({ id: 1, version: 3 });
    mockVersioningService.buildResult.mockImplementation(
      (tableName: string, tableType: string, rowId: number, expediente: string | undefined, version: number, matchedBy: string, createdAt: Date) => ({
        table_type: tableType,
        table_name: tableName,
        row_id: rowId,
        expediente,
        version_created: version,
        matched_by: matchedBy,
        created_at: createdAt.toISOString(),
      }),
    );
    service = new ImportExcelService(
      {} as any,
      mockMatchingService,
      mockVersioningService,
      mockHistoricoService,
      mockNameService,
    );
  });

  async function buildBuffer(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.addRow(['Fecha', 'Expediente', 'Nombre', 'Monto_Total']);
    // Padded expediente on purpose: proves trim (and lowercase opts) matching.
    ws.addRow(['2026-08-06', '  EXP-42  ', 'Juan Pérez', 1000]);
    ws.addRow(['2026-08-06', 'OTHER-1', 'Ana Gómez', 500]);
    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  it('tags rows matching nro_expediente es_eventual=true and counts eventual_matched', async () => {
    mockMatchingService.match.mockResolvedValue({
      match_type: 'expediente_exact',
      table_type: 'Type1',
      table_name: 'expedientes',
    });
    const importDate = new Date('2026-08-06T12:00:00Z');

    const result = await service.importFile(await buildBuffer(), importDate, 'test.xlsx', {
      nro_expediente: ' exp-42 ', // lowercase + padded → trim + case-insensitive match
    });

    expect(result.summary.eventual_matched).toBe(1);
    expect(mockVersioningService.upsertGenericRow).toHaveBeenCalledTimes(2);

    const [, , eventualRowData] = mockVersioningService.upsertGenericRow.mock.calls[0];
    expect(eventualRowData.es_eventual).toBe(true);
    expect(eventualRowData.fecha_carga).toEqual(importDate);

    const [, , normalRowData] = mockVersioningService.upsertGenericRow.mock.calls[1];
    expect(normalRowData.es_eventual).toBe(false);
  });

  it('normal import (no nro_expediente) persists es_eventual=false and omits eventual_matched', async () => {
    mockMatchingService.match.mockResolvedValue({
      match_type: 'expediente_exact',
      table_type: 'Type1',
      table_name: 'expedientes',
    });

    const result = await service.importFile(await buildBuffer(), new Date('2026-08-06T12:00:00Z'), 'test.xlsx');

    expect(result.summary.eventual_matched).toBeUndefined();
    const [, , rowData] = mockVersioningService.upsertGenericRow.mock.calls[0];
    expect(rowData.es_eventual).toBe(false);
  });

  it('prefers opts.fecha_carga over importDate as effective fecha_carga', async () => {
    mockMatchingService.match.mockResolvedValue({
      match_type: 'expediente_exact',
      table_type: 'Type1',
      table_name: 'expedientes',
    });
    const importDate = new Date('2026-08-06T12:00:00Z');
    const optsFechaCarga = new Date('2026-08-01T00:00:00Z');

    await service.importFile(await buildBuffer(), importDate, 'test.xlsx', {
      nro_expediente: 'EXP-42',
      fecha_carga: optsFechaCarga,
    });

    const [, , rowData] = mockVersioningService.upsertGenericRow.mock.calls[0];
    expect(rowData.fecha_carga).toEqual(optsFechaCarga);
  });

  it('tags a Type2 row matched by name es_eventual=true and spreads it into the versioned insert', async () => {
    mockMatchingService.match.mockResolvedValue({
      match_type: 'name_exact',
      table_type: 'Type2',
      table_name: 'piniHerrera',
      matched_row: { person_id: 3 },
    });
    mockVersioningService.createVersionedRow.mockResolvedValue({ id: 2, version: 1 });
    const importDate = new Date('2026-08-06T12:00:00Z');

    const result = await service.importFile(await buildBuffer(), importDate, 'test.xlsx', {
      nro_expediente: ' exp-42 ',
    });

    expect(result.summary.eventual_matched).toBe(1);
    expect(mockVersioningService.createVersionedRow).toHaveBeenCalledTimes(2);

    const [, eventualRowData] = mockVersioningService.createVersionedRow.mock.calls[0];
    expect(eventualRowData).toMatchObject({ es_eventual: true, person_id: 3, expediente: 'EXP-42' });
    expect(eventualRowData.fecha_carga).toEqual(importDate);

    const [, normalRowData] = mockVersioningService.createVersionedRow.mock.calls[1];
    expect(normalRowData).toMatchObject({ es_eventual: false, person_id: 3 });
  });

  it('tags a Type2 row matched by expediente es_eventual=true and spreads it into the versioned insert', async () => {
    mockMatchingService.match.mockResolvedValue({
      match_type: 'expediente_exact',
      table_type: 'Type2',
      table_name: 'piniHerrera',
      matched_row: { person_id: 3 },
    });
    mockVersioningService.createVersionedRow.mockResolvedValue({ id: 3, version: 1 });
    const importDate = new Date('2026-08-06T12:00:00Z');

    const result = await service.importFile(await buildBuffer(), importDate, 'test.xlsx', {
      nro_expediente: ' exp-42 ',
    });

    expect(result.summary.eventual_matched).toBe(1);
    expect(mockVersioningService.createVersionedRow).toHaveBeenCalledTimes(2);

    const [, eventualRowData] = mockVersioningService.createVersionedRow.mock.calls[0];
    expect(eventualRowData).toMatchObject({ es_eventual: true, person_id: 3, expediente: 'EXP-42' });
    expect(eventualRowData.fecha_carga).toEqual(importDate);

    const [, normalRowData] = mockVersioningService.createVersionedRow.mock.calls[1];
    expect(normalRowData).toMatchObject({ es_eventual: false, person_id: 3 });
  });
});
