import request from 'supertest';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import importRoutes from '../../src/routes/import';
import { importResponseSchema, tableListResponseSchema } from '../../src/schemas/import';

// Mock Prisma so the real listTableRows (whitelist + pagination) runs against fake data.
jest.mock('@prisma/client', () => {
  // Track the most recent Type2 row created so findUnique returns it (201 body).
  let lastCreatedRow: any = null;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      expedientes: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([
          { id: 2, expediente: 'EXP-42', es_eventual: true },
          { id: 1, expediente: 'EXP-1', es_eventual: false },
        ]),
        findUnique: jest.fn().mockImplementation(({ where }: any) =>
          where?.expediente === 'EXP-42' ? { id: 1, expediente: 'EXP-42' } : null,
        ),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      piniHerrera: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockImplementation(({ where }: any) =>
          lastCreatedRow && lastCreatedRow.id === where?.id ? lastCreatedRow : null,
        ),
        create: jest.fn().mockImplementation(({ data }: any) => {
          lastCreatedRow = { id: 10, ...data };
          return lastCreatedRow;
        }),
      },
      person: {
        findUnique: jest.fn().mockResolvedValue({ id: 3, name: 'Pini Herrera', table_name_alias: 'piniHerrera' }),
      },
      reportesHistorico: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
      $disconnect: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Partial mock: keep the real listTableRows, stub only the DB-touching handlers.
jest.mock('../../src/controllers/importController.ts', () => {
  const actual = jest.requireActual('../../src/controllers/importController.ts');
  return {
    ...actual,
    uploadFile: (req: any, res: any) => {
      res.status(200).json({
        success: true,
        summary: { total_rows: 0, matched_by_expediente: 0, matched_by_name: 0, unmatched: 0, ambiguous: 0, warnings: [] },
        updated_rows: []
      });
    },
    getExpedienteVersions: (req: any, res: any) => res.json({ expediente: req.params.numero, tables: [] }),
    getPersonVersions: (req: any, res: any) => res.json({ person_id: parseInt(req.params.personId, 10), table_name: req.params.tableName, versions: [] }),
    getReportesHistorico: (req: any, res: any) => {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      res.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }
  };
});

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

function createApp() {
  const app = express();
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/import', importRoutes);
  return app;
}

function authCookie() {
  const token = jwt.sign({ id: 1, email: 'test@example.com', name: 'Test', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
  return `riojamap_token=${token}`;
}

describe('Import API integration tests', () => {
  const app = createApp();

  it('authenticated POST /api/import succeeds with valid .xlsx', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    sheet.getCell('A1').value = 'test';
    const buffer = await workbook.xlsx.writeBuffer();

    const response = await request(app)
      .post('/api/import/')
      .set('Cookie', authCookie())
      .attach('file', buffer as any, 'test.xlsx')
      .field('import_date', new Date().toISOString());

    expect(response.status).toBe(200);
    // Validate response against Zod schema
    expect(() => importResponseSchema.parse(response.body)).not.toThrow();
  });

  it('unauthenticated POST /api/import returns 401', async () => {
    const response = await request(app).post('/api/import/');
    expect(response.status).toBe(401);
  });

  it('invalid file type returns 400', async () => {
    const response = await request(app)
      .post('/api/import/')
      .set('Cookie', authCookie())
        .attach('file', Buffer.from('plain text') as any, 'test.txt');
    expect(response.status).toBe(500);
  });

  it('GET /api/import/expedientes/:numero/versions returns expected shape', async () => {
    const response = await request(app)
      .get('/api/import/expedientes/123/versions')
      .set('Cookie', authCookie());
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ expediente: '123', tables: [] });
  });

  it('GET /api/import/reportes-historico with pagination returns correct structure', async () => {
    const response = await request(app)
      .get('/api/import/reportes-historico?page=2&limit=20')
      .set('Cookie', authCookie());
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.limit).toBe(20);
  });

  it('rate limiter blocks after exceeding limit', async () => {
    // 21 rapid requests should trigger 429 on the last one
    const promises = [];
    for (let i = 0; i < 21; i++) {
      const p = request(app)
        .post('/api/import/')
        .set('Cookie', authCookie())
        .attach('file', Buffer.from('test') as any, 'test.xlsx');
      promises.push(p);
    }
    const results = await Promise.all(promises);
    const last = results[results.length - 1];
    expect(last.status).toBe(429);
  });
});

describe('GET /api/import/tables/:tableName', () => {
  const app = createApp();

  it('rejects an unknown table with 400 INVALID_TABLE', async () => {
    const res = await request(app)
      .get('/api/import/tables/hackers')
      .set('Cookie', authCookie());
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TABLE');
  });

  it('lets USER read rows and matches the spec response shape', async () => {
    const token = jwt.sign({ id: 2, email: 'user@example.com', name: 'User', role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/import/tables/expedientes?page=1&limit=50')
      .set('Cookie', `riojamap_token=${token}`);
    expect(res.status).toBe(200);
    expect(() => tableListResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body).toMatchObject({ table_name: 'expedientes', eventual_total: 2 });
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 50, total: 2, totalPages: 1 });
  });
});

describe('Write paths — ADMIN gates & manual row creation (slice 2)', () => {
  const app = createApp();
  const userCookie = `riojamap_token=${jwt.sign(
    { id: 2, email: 'user@example.com', name: 'User', role: 'USER' },
    JWT_SECRET,
    { expiresIn: '1h' },
  )}`;

  it('USER blocked from POST /api/import with 403 FORBIDDEN and no DB access', async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('Sheet1').getCell('A1').value = 'x';
    const buffer = await wb.xlsx.writeBuffer();
    const prismaMock = jest.requireMock('@prisma/client').PrismaClient as jest.Mock;
    const instancesBefore = prismaMock.mock.results.length;
    const res = await request(app)
      .post('/api/import/')
      .set('Cookie', userCookie)
      .attach('file', buffer as any, 'test.xlsx');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    // authorize() short-circuits before the controller → no PrismaClient, nothing persisted/audited.
    expect(prismaMock.mock.results.length).toBe(instancesBefore);
  });
  it('USER blocked from POST /api/import/tables/:tableName/rows with 403 FORBIDDEN and no DB access', async () => {
    const prismaMock = jest.requireMock('@prisma/client').PrismaClient as jest.Mock;
    const instancesBefore = prismaMock.mock.results.length;
    const res = await request(app)
      .post('/api/import/tables/piniHerrera/rows')
      .set('Cookie', userCookie)
      .send({ expediente: 'P-1', monto_total: 100, person_id: 3 });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    expect(prismaMock.mock.results.length).toBe(instancesBefore);
  });
  it('Type1 manual create with existing expediente returns 409 EXPEDIENTE_EXISTS', async () => {
    const res = await request(app)
      .post('/api/import/tables/expedientes/rows')
      .set('Cookie', authCookie())
      .send({ expediente: 'EXP-42', monto_total: 100 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EXPEDIENTE_EXISTS');
  });
  it('Type2 manual create returns 201 with created row and writes an audit entry', async () => {
    const res = await request(app)
      .post('/api/import/tables/piniHerrera/rows')
      .set('Cookie', authCookie())
      .send({ expediente: 'P-1', monto_total: 100, person_id: 3 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 10,
      expediente: 'P-1',
      version: 1,
      es_eventual: false,
      imported_from: 'MANUAL',
      person_id: 3,
    });
    expect(res.body.fecha_carga).toEqual(expect.any(String));
    const prismaMock = jest.requireMock('@prisma/client').PrismaClient as jest.Mock;
    const instance = prismaMock.mock.results[prismaMock.mock.results.length - 1].value;
    expect(instance.reportesHistorico.create).toHaveBeenCalledTimes(1);
  });
});
