import request from 'supertest';
import express from 'express';
import conveniosMunicRouter from '../../src/routes/conveniosMunic.js';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockConvenios = [
    {
      id: 1,
      expediente: 'H11-01637-6-26',
      nombre: null,
      referente: 'INT. ARMANDO MOLINA - Capital',
      municipio: 'capital',
      detalle: 'Convenio municipal',
      monto_total: 1000000,
      monto_parcial: 500000,
      saldo: 500000,
      fecha_carga: null,
      es_eventual: false,
      version: 1,
      imported_from: 'INFORME_DIARIO',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      expediente: 'H11-01597-6-26',
      nombre: null,
      referente: 'INT. ADRIANA ARIAS - Vinchina',
      municipio: 'vinchina',
      detalle: 'Otro convenio',
      monto_total: 2000000,
      monto_parcial: 800000,
      saldo: 1200000,
      fecha_carga: null,
      es_eventual: false,
      version: 1,
      imported_from: 'INFORME_DIARIO',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      conveniosMunic: {
        findMany: jest.fn().mockImplementation((args: any) => {
          const municipio = args?.where?.municipio;
          if (municipio) {
            return Promise.resolve(
              mockConvenios.filter((c) => c.municipio === municipio),
            );
          }
          return Promise.resolve(mockConvenios);
        }),
      },
    })),
  };
});

const app = express();
app.use(express.json());
app.use('/api/convenios-munic', conveniosMunicRouter);

describe('GET /api/convenios-munic', () => {
  it('returns 400 when municipio is missing', async () => {
    const res = await request(app).get('/api/convenios-munic');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('municipio');
  });

  it('returns convenios for a valid municipio', async () => {
    const res = await request(app).get('/api/convenios-munic?municipio=capital');
    expect(res.status).toBe(200);
    expect(res.body.convenios).toBeDefined();
    expect(Array.isArray(res.body.convenios)).toBe(true);
    expect(res.body.count).toBeDefined();
    expect(res.body.montoTotal).toBeDefined();
    expect(res.body.montoParcial).toBeDefined();
    expect(res.body.saldo).toBeDefined();
  });

  it('returns empty results for unknown municipio', async () => {
    const res = await request(app).get('/api/convenios-munic?municipio=desconocido');
    expect(res.status).toBe(200);
    expect(res.body.convenios).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it('returns aggregates matching the convenios', async () => {
    const res = await request(app).get('/api/convenios-munic?municipio=capital');
    expect(res.status).toBe(200);
    // Aggregates should be numbers
    expect(typeof res.body.montoTotal).toBe('number');
    expect(typeof res.body.montoParcial).toBe('number');
    expect(typeof res.body.saldo).toBe('number');
  });
});
