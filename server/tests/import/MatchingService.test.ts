// Unit tests for MatchingService
import { MatchingService } from '../../src/services/import/MatchingService';
import { GENERIC_TABLES, PERSON_TABLES } from '../../src/services/import/types';

// Simple mock NameNormalizationService
const mockNameService = { compare: jest.fn() } as any;

function createPrismaMock(tableRows: Record<string, any[]>) {
  const mock: any = {};
  for (const table of Object.keys(tableRows)) {
    mock[table] = {
      findMany: jest.fn().mockResolvedValue(tableRows[table]),
    };
  }
  return mock;
}

describe('MatchingService private methods', () => {
  test('_matchByExpediente single Type1 hit', async () => {
    const rows = { expedientes: [{ id: 1, version: 1 }], conveniosMunic: [], deudasEXPTES: [], instituciones: [], intendentes026: [], diputados: [] };
    const prisma = createPrismaMock(rows);
    const service = new MatchingService(prisma as any, mockNameService);
    const result = await (service as any)._matchByExpediente('EXP1');
    expect(result).toMatchObject({ match_type: 'expediente_exact', table_type: 'Type1', table_name: 'expedientes' });
  });

  test('_matchByExpediente ambiguous Type1', async () => {
    const rows = { expedientes: [{ id: 1, version: 1 }], conveniosMunic: [{ id: 2, version: 1 }], deudasEXPTES: [], instituciones: [], intendentes026: [], diputados: [] };
    const prisma = createPrismaMock(rows);
    const service = new MatchingService(prisma as any, mockNameService);
    const result = await (service as any)._matchByExpediente('EXP2');
    expect(result).toMatchObject({ match_type: 'ambiguous', table_type: 'Type1' });
    expect((result as any).candidates).toHaveLength(2);
  });

  test('_matchByExpediente falls back to Type2', async () => {
    const rows = { expedientes: [], conveniosMunic: [], deudasEXPTES: [], instituciones: [], intendentes026: [], diputados: [], piniHerrera: [{ id: 5, version: 1 }], gabiPedrali: [], teresitaMadera: [], florenciaLopez: [], guryCaceres: [], dirigentes: [], romina: [], misael: [] };
    const prisma = createPrismaMock(rows);
    const service = new MatchingService(prisma as any, mockNameService);
    const result = await (service as any)._matchByExpediente('EXP3');
    expect(result).toMatchObject({ match_type: 'expediente_exact', table_type: 'Type2', table_name: 'piniHerrera' });
  });

  test('_matchByName exact match', async () => {
    (mockNameService.compare as jest.Mock).mockImplementation((a: string, b: string) => a === b);
    const rows = { piniHerrera: [{ id: 1, version: 1, nombre: 'Juan' }], gabiPedrali: [], teresitaMadera: [], florenciaLopez: [], guryCaceres: [], dirigentes: [], romina: [], misael: [] };
    const prisma = createPrismaMock(rows);
    const service = new MatchingService(prisma as any, mockNameService);
    const result = await (service as any)._matchByName('Juan');
    expect(result).toMatchObject({ match_type: 'name_exact', table_type: 'Type2', table_name: 'piniHerrera' });
  });

  test('_matchByName ambiguous', async () => {
    (mockNameService.compare as jest.Mock).mockReturnValue(true);
    const rows = { piniHerrera: [{ id: 1, version: 1, nombre: 'Ana' }], gabiPedrali: [{ id: 2, version: 1, nombre: 'Ana' }], teresitaMadera: [], florenciaLopez: [], guryCaceres: [], dirigentes: [], romina: [], misael: [] };
    const prisma = createPrismaMock(rows);
    const service = new MatchingService(prisma as any, mockNameService);
    const result = await (service as any)._matchByName('Ana');
    expect(result).toMatchObject({ match_type: 'ambiguous', table_type: 'Type2' });
    expect((result as any).candidates).toHaveLength(2);
  });

  test('_matchByName no match', async () => {
    (mockNameService.compare as jest.Mock).mockReturnValue(false);
    const rows = { piniHerrera: [{ id: 1, version: 1, nombre: 'Bob' }], gabiPedrali: [], teresitaMadera: [], florenciaLopez: [], guryCaceres: [], dirigentes: [], romina: [], misael: [] };
    const prisma = createPrismaMock(rows);
    const service = new MatchingService(prisma as any, mockNameService);
    const result = await (service as any)._matchByName('Alice');
    expect(result).toMatchObject({ match_type: 'no_match' });
  });
});