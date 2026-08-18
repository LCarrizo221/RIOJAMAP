import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { normalizeMunicipio } from '../utils/MunicipioNormalizer.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/convenios-munic?municipio={name}&referente={filter}
 *
 * Returns convenios filtered by municipio (case-insensitive, accent-normalized).
 * Response: { convenios, count, montoTotal, montoParcial, saldo }
 */
router.get('/', async (req, res) => {
  try {
    const { municipio, referente } = req.query;

    if (!municipio || typeof municipio !== 'string' || municipio.trim() === '') {
      return res.status(400).json({ error: 'municipio query parameter is required' });
    }

    const normalizedMunicipio = normalizeMunicipio(municipio);

    // Build where clause
    const where: Record<string, unknown> = {};

    // For case-insensitive + accent-normalized matching, use raw query
    // Prisma's mode: 'insensitive' handles case but not accent normalization
    // Since we stored municipio already normalized, we can match directly
    where.municipio = normalizedMunicipio;

    if (referente && typeof referente === 'string' && referente.trim() !== '') {
      where.referente = { contains: referente, mode: 'insensitive' };
    }

    const convenios = await prisma.conveniosMunic.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate totals
    const count = convenios.length;
    const montoTotal = convenios.reduce((sum, c) => sum + c.monto_total, 0);
    const montoParcial = convenios.reduce((sum, c) => sum + c.monto_parcial, 0);
    const saldo = convenios.reduce((sum, c) => sum + c.saldo, 0);

    return res.json({ convenios, count, montoTotal, montoParcial, saldo });
  } catch (err) {
    console.error('Error fetching convenios by municipio:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
