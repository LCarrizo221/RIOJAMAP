// Unit tests for VersioningService
import { VersioningService } from '../../src/services/import/VersioningService';

describe('VersioningService.getLatestVersion', () => {
  test('returns version when row exists', async () => {
    const mockFindFirst = jest.fn().mockResolvedValue({ version: 3 });
    const mockPrisma: any = { expedientes: { findFirst: mockFindFirst } };
    const service = new VersioningService(mockPrisma as any);
    const v = await service.getLatestVersion('expedientes', 'EXP001');
    expect(v).toBe(3);
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { expediente: 'EXP001' },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
  });

  test('includes personId when given', async () => {
    const mockFindFirst = jest.fn().mockResolvedValue(null);
    const mockPrisma: any = { expedientes: { findFirst: mockFindFirst } };
    const service = new VersioningService(mockPrisma as any);
    const v = await service.getLatestVersion('expedientes', 'EXP002', 7);
    expect(v).toBe(0);
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { expediente: 'EXP002', person_id: 7 },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
  });

  test('returns 0 when no row found', async () => {
    const mockFindFirst = jest.fn().mockResolvedValue(null);
    const mockPrisma: any = { expedientes: { findFirst: mockFindFirst } };
    const service = new VersioningService(mockPrisma as any);
    const v = await service.getLatestVersion('expedientes', 'UNKNOWN');
    expect(v).toBe(0);
  });
});