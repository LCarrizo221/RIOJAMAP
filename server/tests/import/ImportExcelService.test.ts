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

    const rows = await service.parseFile(buffer as any);
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
    const rows = await service.parseFile(buffer as any);
    expect(rows).toHaveLength(0);
  });

  it('skips completely empty data rows', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.addRow(['Fecha', 'Expediente', 'Nombre', 'Referente', 'Detalle', 'Monto_Total', 'Monto_Parcial', 'Saldo']);
    ws.addRow([]); // empty row
    const buffer = await wb.xlsx.writeBuffer();
    const rows = await service.parseFile(buffer as any);
    expect(rows).toHaveLength(0);
  });
});
