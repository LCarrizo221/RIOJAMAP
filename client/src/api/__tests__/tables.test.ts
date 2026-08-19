import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTableRows, createTableRow } from '../tables';
import { TableListResponseContract, ImportResponseContract } from '../../contracts/import.js';

// fetch is mocked (project pattern — see import.test.ts); this client uses no axios.
function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.spyOn(window, 'fetch').mockResolvedValue({ ok, status, json: async () => body } as any);
}

const listResponse = {
  table_name: 'expedientes',
  data: [{ id: 1, expediente: 'EXP-42' }],
  pagination: { page: 2, limit: 50, total: 120, totalPages: 3 },
};

const createdRow = {
  id: 7,
  expediente: 'P-1',
  monto_total: 100,
  monto_parcial: 0,
  saldo: 100,
  version: 1,
  imported_from: 'MANUAL',
  person_id: 3,
  fecha_carga: '2026-08-14T00:00:00.000Z',
};

describe('getTableRows', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('builds the query string, fetches and validates the contract', async () => {
    const fetchMock = mockFetch(listResponse);

    const result = await getTableRows('expedientes', { page: 2, limit: 50 });

    expect(fetchMock).toHaveBeenCalledWith('/api/import/tables/expedientes?page=2&limit=50', {
      credentials: 'include',
    });
    expect(() => TableListResponseContract.parse(result)).not.toThrow();
  });

  it('maps a 400 INVALID_TABLE response to a usable message', async () => {
    mockFetch({ error: 'Unknown table name: hackers', code: 'INVALID_TABLE' }, false, 400);

    await expect(getTableRows('hackers')).rejects.toThrow('Unknown table');
  });
});

describe('createTableRow', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('POSTs the payload to /rows and validates the created row', async () => {
    const fetchMock = mockFetch(createdRow, true, 201);
    const payload = { expediente: 'P-1', monto_total: 100, person_id: 3 };

    const result = await createTableRow('piniHerrera', payload);

    expect(fetchMock).toHaveBeenCalledWith('/api/import/tables/piniHerrera/rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    expect(result.imported_from).toBe('MANUAL');
  });

  it('maps a 409 EXPEDIENTE_EXISTS response to a usable message', async () => {
    mockFetch({ error: "Expediente 'EXP-42' already exists", code: 'EXPEDIENTE_EXISTS' }, false, 409);

    await expect(createTableRow('expedientes', { expediente: 'EXP-42' })).rejects.toThrow(
      'Expediente already exists',
    );
  });

  it('maps a 403 FORBIDDEN response to a usable message', async () => {
    mockFetch({ error: 'Forbidden', code: 'FORBIDDEN' }, false, 403);

    await expect(createTableRow('expedientes', { expediente: 'EXP-99' })).rejects.toThrow(
      'Not authorized',
    );
  });
});

describe('contract strictness (drift detection)', () => {
  it('rejects an unknown field in the list response', () => {
    expect(() => TableListResponseContract.parse({ ...listResponse, surprise: true })).toThrow();
  });

  it('accepts eventual_matched in the import summary', () => {
    expect(() =>
      ImportResponseContract.parse({
        success: true,
        summary: {
          total_rows: 1,
          matched_by_expediente: 1,
          matched_by_name: 0,
          unmatched: 0,
          ambiguous: 0,
          eventual_matched: 3,
          warnings: [],
        },
        updated_rows: [],
      }),
    ).not.toThrow();
  });
});
