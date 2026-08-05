import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server.js';
import { ObraSchema, ObrasListResponseSchema, KpisResponseSchema } from '../contracts/obra.js';
import { getObras, getObraById } from '../api/obras.js';
import { outdatedObraFixture } from '../mocks/fixtures.js';

describe('Contract Validation', () => {
  describe('Outdated fixture detection', () => {
    it('outdated fixture fails schema validation', () => {
      // This test proves our contract system catches drift
      // The outdatedObraFixture is missing required fields
      expect(() => {
        ObraSchema.parse(outdatedObraFixture);
      }).toThrow();
    });

    it('outdated fixture throws ZodError with field path', () => {
      try {
        ObraSchema.parse(outdatedObraFixture);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.name).toBe('ZodError');
        expect(error.issues).toBeDefined();
        expect(error.issues.length).toBeGreaterThan(0);
        // Should mention missing fields like 'fecha', 'referente', etc.
        const fieldPaths = error.issues.map((i: any) => i.path.join('.'));
        expect(fieldPaths).toContain('fecha');
      }
    });
  });

  describe('Strict mode - unknown field detection', () => {
    it('extra unknown field fails strict schema validation', () => {
      // This test proves strict() catches unexpected fields (drift detection)
      const obraWithExtraField = {
        id: 1,
        fecha: '2026-08-05T10:00:00.000Z',
        municipio: 'Capital',
        referente: 'Juan Pérez',
        concepto: 'Test obra',
        tipo: 'Educación',
        estado: 'En Ejecución',
        montoTotal: 1000000,
        montoParcial: 500000,
        montoPendiente: 500000,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-08-05T10:00:00.000Z',
        unknownField: 'should fail' // Extra field not in schema
      };

      expect(() => {
        ObraSchema.parse(obraWithExtraField);
      }).toThrow();
    });

    it('extra unknown field throws ZodError with unrecognized key message', () => {
      const obraWithExtraField = {
        id: 1,
        fecha: '2026-08-05T10:00:00.000Z',
        municipio: 'Capital',
        referente: 'Juan Pérez',
        concepto: 'Test obra',
        tipo: 'Educación',
        estado: 'En Ejecución',
        montoTotal: 1000000,
        montoParcial: 500000,
        montoPendiente: 500000,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-08-05T10:00:00.000Z',
        unexpectedField: 'drift detected'
      };

      try {
        ObraSchema.parse(obraWithExtraField);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.name).toBe('ZodError');
        expect(error.issues.some((i: any) => i.code === 'unrecognized_keys')).toBe(true);
      }
    });

    it('KpisResponseSchema rejects unknown fields', () => {
      const kpisWithExtraField = {
        total: 1000000,
        parcial: 800000,
        pendiente: 200000,
        count: 5,
        extraMetric: 'should fail'
      };

      expect(() => {
        KpisResponseSchema.parse(kpisWithExtraField);
      }).toThrow();
    });
  });
});

describe('API Layer - getObras', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('calls correct URL with no filters', async () => {
    // Spy on fetch to verify request shape
    const fetchSpy = vi.spyOn(window, 'fetch');
    
    await getObras();
    
    // URLSearchParams creates empty string when no params, resulting in '/api/obras?'
    expect(fetchSpy).toHaveBeenCalled();
    const callArgs = fetchSpy.mock.calls[0];
    const url = callArgs[0] as string;
    expect(url).toMatch(/^\/api\/obras\??$/);
    expect(callArgs[1]).toEqual({ credentials: 'include' });
    
    fetchSpy.mockRestore();
  });

  it('calls correct URL with municipio filter', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');
    
    await getObras({ municipio: 'Capital' });
    
    expect(fetchSpy).toHaveBeenCalledWith('/api/obras?municipio=Capital', {
      credentials: 'include'
    });
    
    fetchSpy.mockRestore();
  });

  it('calls correct URL with multiple filters', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');
    
    await getObras({ municipio: 'Capital', referente: 'Juan Pérez' });
    
    // URLSearchParams order may vary, so check the URL contains both params
    const callArgs = fetchSpy.mock.calls[0];
    const url = callArgs[0] as string;
    expect(url).toContain('/api/obras');
    expect(url).toContain('municipio=Capital');
    expect(url).toContain('referente=');
    expect(url).toContain('P%C3%A9rez'); // UTF-8 encoding for 'é'
    
    fetchSpy.mockRestore();
  });

  it('validates response and returns typed data', async () => {
    const result = await getObras();
    
    // Verify response structure
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    
    // Verify first obra has required fields
    const firstObra = result.data[0];
    expect(firstObra).toHaveProperty('id');
    expect(firstObra).toHaveProperty('municipio');
    expect(firstObra).toHaveProperty('montoTotal');
  });

  it('validates pagination structure', async () => {
    const result = await getObras();
    
    expect(result.pagination).toHaveProperty('page');
    expect(result.pagination).toHaveProperty('limit');
    expect(result.pagination).toHaveProperty('total');
    expect(result.pagination).toHaveProperty('totalPages');
    
    expect(typeof result.pagination.page).toBe('number');
    expect(typeof result.pagination.total).toBe('number');
  });
});

describe('API Layer - getObraById', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('calls correct URL with ID', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');
    
    await getObraById(1);
    
    expect(fetchSpy).toHaveBeenCalledWith('/api/obras/1', {
      credentials: 'include'
    });
    
    fetchSpy.mockRestore();
  });

  it('returns validated obra data', async () => {
    const result = await getObraById(1);
    
    expect(result).toHaveProperty('id', 1);
    expect(result).toHaveProperty('municipio');
    expect(result).toHaveProperty('montoTotal');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
  });

  it('throws error on 404', async () => {
    await expect(getObraById(999)).rejects.toThrow('Obra not found');
  });
});
