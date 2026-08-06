/**
 * importController
 *
 * Thin HTTP layer — no business logic here. All logic lives in ImportExcelService
 * and its dependencies. Services are instantiated fresh per request; Prisma
 * handles connection pooling transparently.
 *
 * Exports:
 *   uploadFile            — POST /api/import
 *   getExpedienteVersions — GET  /api/import/expedientes/:numero/versions
 *   getPersonVersions     — GET  /api/import/person/:personId/table/:tableName/versions
 *   getReportesHistorico  — GET  /api/import/reportes-historico
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { PrismaClient } from '@prisma/client';
import { importRequestSchema, importResponseSchema } from '../schemas/import.js';
import { ImportExcelService } from '../services/import/ImportExcelService.js';
import { MatchingService } from '../services/import/MatchingService.js';
import { VersioningService } from '../services/import/VersioningService.js';
import { ReportesHistoricoService } from '../services/import/ReportesHistoricoService.js';
import { NameNormalizationService } from '../services/import/NameNormalizationService.js';
import { GENERIC_TABLES, PERSON_TABLES } from '../services/import/types.js';

// ─── POST /api/import ─────────────────────────────────────────────────────────

/**
 * Accepts multipart/form-data with an .xlsx file (field name: `file`).
 * Optional body field: `import_date` (ISO 8601 string).
 * Returns an ImportResponse on success.
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  // 1. Validate file presence (multer populates req.file)
  if (!req.file) {
    res.status(400).json({ error: 'No file provided', code: 'NO_FILE' });
    return;
  }

  // 2. Parse and validate optional body fields
  let importDate: Date;
  try {
    const body = importRequestSchema.parse(req.body);
    importDate = body.import_date ?? new Date();
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: err.errors,
      });
      return;
    }
    res.status(400).json({ error: 'Invalid request body', code: 'VALIDATION_ERROR' });
    return;
  }

  // 3. Instantiate services in dependency order
  try {
    const prisma = new PrismaClient();
    const nameService = new NameNormalizationService();
    const matchingService = new MatchingService(prisma, nameService);
    const versioningService = new VersioningService(prisma);
    const historicoService = new ReportesHistoricoService(prisma);
    const importExcelService = new ImportExcelService(
      prisma,
      matchingService,
      versioningService,
      historicoService,
      nameService,
    );

    // 4. Run the import pipeline
    const result = await importExcelService.importFile(
      req.file.buffer,
      importDate,
      req.file.originalname,
    );

    await prisma.$disconnect();

    // 5. Validate and return the response
    res.status(200).json(importResponseSchema.parse(result));
  } catch (err) {
    console.error('Import error:', err);
    if (err instanceof ZodError) {
      res.status(400).json({
        error: 'Response validation failed',
        code: 'RESPONSE_VALIDATION_ERROR',
        details: err.errors,
      });
      return;
    }
    res.status(500).json({ error: 'Import failed', code: 'IMPORT_ERROR' });
  }
};

// ─── GET /api/import/expedientes/:numero/versions ─────────────────────────────

/**
 * Returns version history for an expediente across all 14 tables.
 * Only tables that contain matching rows are included in the response.
 */
export const getExpedienteVersions = async (req: Request, res: Response): Promise<void> => {
  const { numero } = req.params;

  if (!numero) {
    res.status(400).json({ error: 'Missing expediente number', code: 'MISSING_PARAM' });
    return;
  }

  try {
    const prisma = new PrismaClient();
    const allTables = [...GENERIC_TABLES, ...PERSON_TABLES];

    const tableResults = await Promise.all(
      allTables.map(async (tableName) => {
        const rows = await (prisma as any)[tableName].findMany({
          where: { expediente: { equals: numero, mode: 'insensitive' } },
          orderBy: { version: 'desc' },
        });
        return { table_name: tableName, versions: rows };
      }),
    );

    await prisma.$disconnect();

    const matched = tableResults.filter((t) => t.versions.length > 0);

    res.status(200).json({ expediente: numero, tables: matched });
  } catch (err) {
    console.error('Error fetching expediente versions:', err);
    res.status(500).json({ error: 'Failed to fetch versions', code: 'FETCH_ERROR' });
  }
};

// ─── GET /api/import/person/:personId/table/:tableName/versions ───────────────

/**
 * Returns version history for a specific person in a specific Type2 table.
 */
export const getPersonVersions = async (req: Request, res: Response): Promise<void> => {
  const personId = parseInt(String(req.params.personId), 10);
  const tableName = String(req.params.tableName);

  if (isNaN(personId) || !tableName) {
    res.status(400).json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' });
    return;
  }

  if (!PERSON_TABLES.includes(tableName as any)) {
    res.status(400).json({ error: `Unknown table name: ${tableName}`, code: 'INVALID_TABLE' });
    return;
  }

  try {
    const prisma = new PrismaClient();

    const versions = await (prisma as any)[tableName].findMany({
      where: { person_id: personId },
      orderBy: { version: 'desc' },
    });

    await prisma.$disconnect();

    res.status(200).json({ person_id: personId, table_name: tableName, versions });
  } catch (err) {
    console.error('Error fetching person versions:', err);
    res.status(500).json({ error: 'Failed to fetch versions', code: 'FETCH_ERROR' });
  }
};

// ─── GET /api/import/reportes-historico ──────────────────────────────────────

/**
 * Returns paginated import audit log.
 * Optional query params: fecha_from, fecha_to (ISO dates), matched_by ('expediente' | 'name'),
 * page (default 1), limit (default 50, max 100).
 */
export const getReportesHistorico = async (req: Request, res: Response): Promise<void> => {
  const { fecha_from, fecha_to, matched_by, page = '1', limit = '50' } = req.query;

  const pageNum = Math.max(1, parseInt(String(page), 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
  const skip = (pageNum - 1) * limitNum;

  try {
    const prisma = new PrismaClient();

    const where: Record<string, unknown> = {};

    if (fecha_from || fecha_to) {
      const dateRange: Record<string, Date> = {};
      if (fecha_from) dateRange.gte = new Date(String(fecha_from));
      if (fecha_to) dateRange.lte = new Date(String(fecha_to));
      where.createdAt = dateRange;
    }

    if (matched_by === 'expediente') {
      where.matched_by_expediente = true;
    } else if (matched_by === 'name') {
      where.matched_by_name = true;
    }

    const [total, records] = await Promise.all([
      prisma.reportesHistorico.count({ where }),
      prisma.reportesHistorico.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    await prisma.$disconnect();

    res.status(200).json({
      data: records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Error fetching reportes historico:', err);
    res.status(500).json({ error: 'Failed to fetch reportes historico', code: 'FETCH_ERROR' });
  }
};
