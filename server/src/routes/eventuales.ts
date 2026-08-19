import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { createEventualSchema } from '../schemas/eventuales.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/eventuales — ADMIN only: create a new eventual
router.post('/', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const parsed = createEventualSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: parsed.error.errors,
      });
    }

    const input = parsed.data;

    // Auto-generate expediente if not provided
    let expediente = input.expediente.trim();
    if (!expediente) {
      const count = await prisma.eventuales.count();
      expediente = `EVT-${String(count + 1).padStart(5, '0')}`;
    }

    // Build date fields
    const fechaCarga = input.fecha ? new Date(input.fecha) : new Date();
    const fechaNacimiento = input.fecha_nacimiento ? new Date(input.fecha_nacimiento) : null;

    const eventuale = await prisma.eventuales.create({
      data: {
        expediente,
        nombre:          input.nombre.trim(),
        dni:             input.dni || null,
        nro_celular:     input.nro_celular || null,
        fecha_nacimiento: fechaNacimiento,
        referente:       input.referente || null,
        monto_total:     input.monto,
        monto_parcial:   input.monto,
        saldo:           0,
        zona:            input.zona || null,
        pedido:          input.pedido,
        tipo_pago:       input.tipo_pago,
        estado_pedido:   input.estado_del_pedido,
        notas:           input.notas || null,
        fecha_carga:     fechaCarga,
        imported_from:   'MANUAL',
      },
    });

    res.status(201).json(eventuale);
  } catch (err) {
    console.error('Error creating eventuale:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

export default router;
