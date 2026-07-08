import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateObraSchema, UpdateObraSchema } from '../schemas/obra.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/obras - List all obras with optional filters and pagination
router.get('/', async (req, res) => {
  try {
    const { municipio, referente, page = '1', limit = '20' } = req.query;

    // Build where clause for filtering
    const where: any = {};

    if (municipio) {
      where.municipio = {
        equals: String(municipio),
        mode: 'insensitive'
      };
    }

    if (referente) {
      where.referente = {
        contains: String(referente),
        mode: 'insensitive'
      };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await prisma.obra.count({ where });
    const totalPages = Math.ceil(total / limitNum);

    // Get obras
    const obras = await prisma.obra.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    // Compute montoPendiente for each obra
    const obrasWithPendiente = obras.map(obra => ({
      ...obra,
      montoPendiente: obra.montoTotal - obra.montoParcial
    }));

    res.json({
      data: obrasWithPendiente,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching obras:', error);
    res.status(500).json({ error: 'Failed to fetch obras', code: 'FETCH_ERROR' });
  }
});

// GET /api/obras/kpis - Get aggregated KPIs
router.get('/kpis', async (req, res) => {
  try {
    const { municipio, referente } = req.query;

    // Build where clause for filtering
    const where: any = {};

    if (municipio) {
      where.municipio = {
        equals: String(municipio),
        mode: 'insensitive'
      };
    }

    if (referente) {
      where.referente = {
        contains: String(referente),
        mode: 'insensitive'
      };
    }

    // Get all filtered obras
    const obras = await prisma.obra.findMany({ where });

    // Calculate aggregates
    const total = obras.reduce((sum, obra) => sum + obra.montoTotal, 0);
    const parcial = obras.reduce((sum, obra) => sum + obra.montoParcial, 0);
    const pendiente = total - parcial;
    const count = obras.length;

    res.json({ total, parcial, pendiente, count });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs', code: 'KPI_FETCH_ERROR' });
  }
});

// GET /api/obras/:id - Get single obra by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format', code: 'INVALID_ID' });
    }

    const obra = await prisma.obra.findUnique({ where: { id } });

    if (!obra) {
      return res.status(404).json({ error: 'Obra not found', code: 'NOT_FOUND' });
    }

    res.json({
      ...obra,
      montoPendiente: obra.montoTotal - obra.montoParcial
    });
  } catch (error) {
    console.error('Error fetching obra:', error);
    res.status(500).json({ error: 'Failed to fetch obra', code: 'FETCH_ERROR' });
  }
});

// POST /api/obras - Create new obra
router.post('/', async (req, res) => {
  try {
    const validationResult = CreateObraSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      });
    }

    const { fecha, municipio, referente, concepto, tipo, estado, montoTotal, montoParcial } = validationResult.data;

    const obra = await prisma.obra.create({
      data: {
        fecha: new Date(fecha),
        municipio,
        referente,
        concepto,
        tipo,
        estado,
        montoTotal,
        montoParcial
      }
    });

    res.status(201).json({
      ...obra,
      montoPendiente: obra.montoTotal - obra.montoParcial
    });
  } catch (error) {
    console.error('Error creating obra:', error);
    res.status(500).json({ error: 'Failed to create obra', code: 'CREATE_ERROR' });
  }
});

// PUT /api/obras/:id - Update existing obra
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format', code: 'INVALID_ID' });
    }

    // Check if obra exists
    const existingObra = await prisma.obra.findUnique({ where: { id } });
    if (!existingObra) {
      return res.status(404).json({ error: 'Obra not found', code: 'NOT_FOUND' });
    }

    const validationResult = UpdateObraSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      });
    }

    const updateData: any = {};
    if (validationResult.data.fecha) updateData.fecha = new Date(validationResult.data.fecha);
    if (validationResult.data.municipio) updateData.municipio = validationResult.data.municipio;
    if (validationResult.data.referente) updateData.referente = validationResult.data.referente;
    if (validationResult.data.concepto) updateData.concepto = validationResult.data.concepto;
    if (validationResult.data.tipo) updateData.tipo = validationResult.data.tipo;
    if (validationResult.data.estado) updateData.estado = validationResult.data.estado;
    if (validationResult.data.montoTotal !== undefined) updateData.montoTotal = validationResult.data.montoTotal;
    if (validationResult.data.montoParcial !== undefined) updateData.montoParcial = validationResult.data.montoParcial;

    const obra = await prisma.obra.update({
      where: { id },
      data: updateData
    });

    res.json({
      ...obra,
      montoPendiente: obra.montoTotal - obra.montoParcial
    });
  } catch (error) {
    console.error('Error updating obra:', error);
    res.status(500).json({ error: 'Failed to update obra', code: 'UPDATE_ERROR' });
  }
});

// DELETE /api/obras/:id - Delete obra
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format', code: 'INVALID_ID' });
    }

    // Check if obra exists
    const existingObra = await prisma.obra.findUnique({ where: { id } });
    if (!existingObra) {
      return res.status(404).json({ error: 'Obra not found', code: 'NOT_FOUND' });
    }

    await prisma.obra.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting obra:', error);
    res.status(500).json({ error: 'Failed to delete obra', code: 'DELETE_ERROR' });
  }
});

export default router;
