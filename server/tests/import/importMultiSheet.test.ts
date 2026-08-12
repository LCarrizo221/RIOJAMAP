// Multi-sheet (Informes_Convenios_Deudas.xlsx) parsing tests.
// Covers: sheet→table mapping, per-sheet header aliases, formula SALDO cells,
// Type2 person_id resolution, and skip behavior (warned vs silent sheets).
import ExcelJS from 'exceljs';
import { ImportExcelService } from '../../src/services/import/ImportExcelService';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Builds an in-memory workbook shaped like the real Informes_Convenios_Deudas.xlsx:
 *  - 'Expedientes' (Type1) with real-world header names and a formula SALDO cell.
 *  - 'PiniHerrera' (Type2) with person-specific header names.
 *  - 'Comp_Especiales' (unmapped data sheet) — should be skipped WITH a warning.
 *  - 'ÍNDICE' (aux sheet) — should be skipped silently.
 */
async function buildMultiSheetBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  const expedientes = wb.addWorksheet('Expedientes');
  expedientes.addRow(['Número de EXPTE', 'Apellido y Nombre', 'Referente y Solicitante', 'Motivo o Detalle', 'Monto Total', 'Pago Parcial', 'Saldo']);
  expedientes.addRow(['EXP-001', 'Juan Pérez', 'Ref1', 'Detalle1', 1000, 600, { formula: 'E2-F2', result: 400 }]);

  const pini = wb.addWorksheet('PiniHerrera');
  pini.addRow(['Apellido y Nombre', 'Referente y Solicitante', 'Motivo o Detalle', 'Monto Total']);
  pini.addRow(['Ana García', 'Ref2', 'Detalle2', 500]);

  const comp = wb.addWorksheet('Comp_Especiales');
  comp.addRow(['Col A', 'Col B']);
  comp.addRow([1, 2]);

  const indice = wb.addWorksheet('ÍNDICE');
  indice.addRow(['Hoja', 'Página']);
  indice.addRow(['Expedientes', 1]);

  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  person: {
    findMany: jest.fn().mockResolvedValue([{ id: 7, table_name_alias: 'piniHerrera' }]),
  },
} as any;

const versioningMock = {
  upsertGenericRow: jest.fn().mockResolvedValue({ id: 1, version: 2 }),
  isDuplicate: jest.fn().mockResolvedValue(false),
  getLatestVersion: jest.fn().mockResolvedValue(1),
  createVersionedRow: jest.fn().mockResolvedValue({ id: 2, version: 2 }),
  buildResult: jest.fn().mockReturnValue({} as any),
} as any;

const historicoMock = { log: jest.fn().mockResolvedValue(undefined) } as any;
const matchingMock = { match: jest.fn() } as any;
const nameServiceMock = { normalize: jest.fn((s: string) => s) } as any;

function makeService() {
  return new ImportExcelService(prismaMock, matchingMock, versioningMock, historicoMock, nameServiceMock);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ImportExcelService multi-sheet parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps mapped sheets to their Prisma tables and tags rows', async () => {
    const service = makeService();
    const buffer = await buildMultiSheetBuffer();

    const { rows } = await service.parseFile(buffer as any);

    // Expedientes Type1 row
    const expedienteRow = rows.find(r => r.table_name === 'expedientes');
    expect(expedienteRow).toBeDefined();
    expect(expedienteRow!.expediente).toBe('EXP-001');
    expect(expedienteRow!.nombre).toBe('Juan Pérez');
    expect(expedienteRow!.referente).toBe('Ref1');
    expect(expedienteRow!.detalle).toBe('Detalle1');
    expect(expedienteRow!.monto_total).toBe(1000);
    expect(expedienteRow!.monto_parcial).toBe(600);

    // PiniHerrera Type2 row: tagged with table + person_id resolved from registry
    const piniRow = rows.find(r => r.table_name === 'piniHerrera');
    expect(piniRow).toBeDefined();
    expect(piniRow!.nombre).toBe('Ana García');
    expect(piniRow!.table_name).toBe('piniHerrera');
    expect(piniRow!.person_id).toBe(7);
    expect(prismaMock.person.findMany).toHaveBeenCalled();
  });

  it('takes SALDO from the formula cell numeric result', async () => {
    const service = makeService();
    const buffer = await buildMultiSheetBuffer();

    const { rows } = await service.parseFile(buffer as any);
    const expedienteRow = rows.find(r => r.table_name === 'expedientes');
    expect(expedienteRow!.saldo).toBe(400);
  });

  it('warns about unmapped data sheets and silently skips aux sheets', async () => {
    const service = makeService();
    const buffer = await buildMultiSheetBuffer();

    const { rows, warnings } = await service.parseFile(buffer as any);

    expect(warnings.some(w => w.includes("'Comp_Especiales'"))).toBe(true);
    expect(warnings.some(w => w.includes("'ÍNDICE'"))).toBe(false);
    expect(rows.some(r => r.table_name === 'comp_especiales')).toBe(false);
    expect(rows.length).toBe(2); // only Expedientes + PiniHerrera rows
  });

  it('imports tagged rows through the pipeline without cross-table matching', async () => {
    const service = makeService();
    const buffer = await buildMultiSheetBuffer();

    const result = await service.importFile(buffer as any, new Date('2026-08-06'), 'Informes_Convenios_Deudas.xlsx');

    expect(matchingMock.match).not.toHaveBeenCalled();
    expect(versioningMock.upsertGenericRow).toHaveBeenCalledWith('expedientes', 'EXP-001', expect.any(Object));
    expect(versioningMock.createVersionedRow).toHaveBeenCalled();
    expect(result.summary.matched_by_expediente).toBe(1);
    expect(result.summary.matched_by_name).toBe(1);
    expect(result.summary.unmatched).toBe(0);
    expect(historicoMock.log).toHaveBeenCalled();
  });
});
