import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { postImport, getPersonVersions, getReportesHistorico } from '../import';
import { ImportResponseContract, VersionHistoryContract, ReportesHistoricoContract } from '../../contracts/import.js';
import { z } from 'zod';

// Helper to create a File-like object in the test environment
function createExcelFile(): File {
  const blob = new Blob(['fake excel content'], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  return new File([blob], 'test.xlsx', { type: blob.type });
}

describe('Client Import API tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('postImport sends FormData and validates successful response', async () => {
    const mockResponse = {
      success: true,
      summary: {
        total_rows: 1,
        matched_by_expediente: 1,
        matched_by_name: 0,
        unmatched: 0,
        ambiguous: 0,
        warnings: []
      },
      updated_rows: []
    };
    const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as any);

    const file = createExcelFile();
    const result = await postImport(file);

    expect(fetchMock).toHaveBeenCalled();
    // Ensure fetch was called with FormData body (cannot inspect directly, just that it was called)
    expect(result).toEqual(mockResponse);
    // Validate against contract
    expect(() => ImportResponseContract.parse(result)).not.toThrow();
  });

  it('postImport throws on non‑2xx response', async () => {
    const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad request', code: 'VALIDATION_ERROR' })
    } as any);

    const file = createExcelFile();
    await expect(postImport(file)).rejects.toThrow('Bad request');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('postImport sends nro_expediente/fecha_carga and validates eventual_matched', async () => {
    const mockResponse = {
      success: true,
      summary: {
        total_rows: 1,
        matched_by_expediente: 1,
        matched_by_name: 0,
        unmatched: 0,
        ambiguous: 0,
        eventual_matched: 3,
        warnings: []
      },
      updated_rows: []
    };
    const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as any);

    const file = createExcelFile();
    const result = await postImport(file, {
      nro_expediente: ' EXP-42 ',
      fecha_carga: '2026-08-14'
    });

    const [, init] = fetchMock.mock.calls[0];
    const form = init.body as FormData;
    expect(form.get('nro_expediente')).toBe(' EXP-42 ');
    expect(form.get('fecha_carga')).toBe('2026-08-14');
    expect(result.summary.eventual_matched).toBe(3);
    expect(() => ImportResponseContract.parse(result)).not.toThrow();
  });

  it('getPersonVersions builds correct URL and validates response', async () => {
    const mockData = {
      person_id: 5,
      table_name: 'personas',
      versions: []
    };
    const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockData
    } as any);

    const result = await getPersonVersions(5, 'personas');
    expect(fetchMock).toHaveBeenCalledWith('/api/import/person/5/table/personas/versions', { credentials: 'include' });
    expect(result).toEqual(mockData);
    expect(() => VersionHistoryContract.parse(result)).not.toThrow();
  });

  it('getReportesHistorico includes query params and validates contract', async () => {
    const mockResponse = {
      data: [],
      pagination: { page: 2, limit: 20, total: 0, totalPages: 0 }
    };
    const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as any);

    const result = await getReportesHistorico({ page: 2, limit: 20 });
    expect(fetchMock).toHaveBeenCalledWith('/api/import/reportes-historico?page=2&limit=20', { credentials: 'include' });
    expect(result).toEqual({ data: [], pagination: { page: 2, limit: 20, total: 0, totalPages: 0 } });
    // Validate each item in data array against contract
    expect(() => z.array(ReportesHistoricoContract).parse(result.data)).not.toThrow();
  });
});
