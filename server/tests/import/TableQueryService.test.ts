// Unit tests for TableQueryService (whitelist, filters, pagination)
import { TableQueryService, InvalidTableError } from '../../src/services/import/TableQueryService';

describe('TableQueryService.list', () => {
  test('paginates 120 rows into 3 pages ordered by id desc', async () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ id: 100 - i }));
    const mockCount = jest.fn().mockResolvedValue(120);
    const mockFindMany = jest.fn().mockResolvedValue(rows);
    const mockPrisma: any = { expedientes: { count: mockCount, findMany: mockFindMany } };
    const service = new TableQueryService(mockPrisma as any);

    const result = await service.list('expedientes', { page: 2, limit: 50 });

    expect(result.data).toHaveLength(50);
    expect(result.pagination).toEqual({ page: 2, limit: 50, total: 120, totalPages: 3 });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { id: 'desc' },
      skip: 50,
      take: 50,
    });
  });

  test('filters es_eventual=true rows', async () => {
    const mockCount = jest.fn().mockResolvedValue(0);
    const mockFindMany = jest.fn().mockResolvedValue([]);
    const mockPrisma: any = { piniHerrera: { count: mockCount, findMany: mockFindMany } };
    const service = new TableQueryService(mockPrisma as any);

    await service.list('piniHerrera', { page: 1, limit: 50, es_eventual: 'true' });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ es_eventual: true }) }),
    );
  });

  test('expands fecha_carga day into a [startOfDay, endOfDay] range', async () => {
    const mockCount = jest.fn().mockResolvedValue(0);
    const mockFindMany = jest.fn().mockResolvedValue([]);
    const mockPrisma: any = { expedientes: { count: mockCount, findMany: mockFindMany } };
    const service = new TableQueryService(mockPrisma as any);

    await service.list('expedientes', { page: 1, limit: 50, fecha_carga: '2026-08-14' });

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.fecha_carga).toEqual({
      gte: new Date(2026, 7, 14, 0, 0, 0, 0),
      lte: new Date(2026, 7, 14, 23, 59, 59, 999),
    });
  });

  test('filters expediente and nombre case-insensitively', async () => {
    const mockCount = jest.fn().mockResolvedValue(0);
    const mockFindMany = jest.fn().mockResolvedValue([]);
    const mockPrisma: any = { expedientes: { count: mockCount, findMany: mockFindMany } };
    const service = new TableQueryService(mockPrisma as any);

    await service.list('expedientes', {
      page: 1,
      limit: 50,
      expediente: 'exp-42',
      nombre: 'pini',
    });

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.expediente).toEqual({ contains: 'exp-42', mode: 'insensitive' });
    expect(where.nombre).toEqual({ contains: 'pini', mode: 'insensitive' });
  });

  test('rejects an unknown table with InvalidTableError', async () => {
    const service = new TableQueryService({} as any);

    await expect(service.list('hackers', { page: 1, limit: 50 })).rejects.toBeInstanceOf(
      InvalidTableError,
    );
  });
});

describe('TableQueryService.countEventual', () => {
  test('counts rows with es_eventual=true', async () => {
    const mockCount = jest.fn().mockResolvedValue(7);
    const mockPrisma: any = { expedientes: { count: mockCount } };
    const service = new TableQueryService(mockPrisma as any);

    const total = await service.countEventual('expedientes');

    expect(total).toBe(7);
    expect(mockCount).toHaveBeenCalledWith({ where: { es_eventual: true } });
  });
});
