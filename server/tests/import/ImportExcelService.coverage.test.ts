import { ImportExcelService } from '../../src/services/import/ImportExcelService';
import type { ImportRow, ImportResult } from '../../src/services/import/types';

// Minimal mocks – methods won't be called because there are no rows
const matchingMock = { match: jest.fn() } as any;
const versioningMock = {} as any;
const historicoMock = { log: jest.fn().mockResolvedValue(undefined) } as any;
const nameServiceMock = {} as any;

const service = new ImportExcelService({} as any, matchingMock, versioningMock, historicoMock, nameServiceMock);

test('importFile with empty buffer covers parseFile and importFile paths', async () => {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Sheet1');
  const buffer = await wb.xlsx.writeBuffer();
  const result = await (service as any).importFile(buffer, new Date('2023-01-01'), 'empty.xlsx');
  // Expect result to have zero rows and zero counts
  expect(result.summary.total_rows).toBe(0);
  expect(result.summary.matched_by_expediente).toBe(0);
  expect(result.summary.matched_by_name).toBe(0);
  expect(result.summary.unmatched).toBe(0);
  expect(result.summary.ambiguous).toBe(0);
  expect(result.updated_rows).toHaveLength(0);
});
