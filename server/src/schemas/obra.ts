import { z } from 'zod';

export const CreateObraSchema = z.object({
  fecha: z.string().datetime(),
  municipio: z.string().min(1, 'Municipio es requerido'),
  referente: z.string().min(1, 'Referente es requerido'),
  concepto: z.string().min(1, 'Concepto es requerido'),
  tipo: z.enum([
    'Infraestructura',
    'Salud',
    'Educación',
    'Social',
    'Deporte',
    'Energía',
    'Turismo',
    'Tecnología',
    'Productivo',
    'Subsidio',
    'Cultura',
    'Maquinaria'
  ]),
  estado: z.enum([
    'En Ejecución',
    'Finalizado',
    'Pendiente',
    'Proyectada',
    'Detenida'
  ]),
  montoTotal: z.number().min(0, 'Monto total debe ser mayor o igual a 0'),
  montoParcial: z.number().min(0, 'Monto parcial debe ser mayor o igual a 0')
}).refine(
  (data) => data.montoParcial <= data.montoTotal,
  {
    message: 'Monto parcial no puede superar el monto total',
    path: ['montoParcial']
  }
);

export const UpdateObraSchema = z.object({
  fecha: z.string().datetime().optional(),
  municipio: z.string().min(1, 'Municipio es requerido').optional(),
  referente: z.string().min(1, 'Referente es requerido').optional(),
  concepto: z.string().min(1, 'Concepto es requerido').optional(),
  tipo: z.enum([
    'Infraestructura',
    'Salud',
    'Educación',
    'Social',
    'Deporte',
    'Energía',
    'Turismo',
    'Tecnología',
    'Productivo',
    'Subsidio',
    'Cultura',
    'Maquinaria'
  ]).optional(),
  estado: z.enum([
    'En Ejecución',
    'Finalizado',
    'Pendiente',
    'Proyectada',
    'Detenida'
  ]).optional(),
  montoTotal: z.number().min(0, 'Monto total debe ser mayor o igual a 0').optional(),
  montoParcial: z.number().min(0, 'Monto parcial debe ser mayor o igual a 0').optional()
}).refine(
  (data) => {
    if (data.montoParcial !== undefined && data.montoTotal !== undefined) {
      return data.montoParcial <= data.montoTotal;
    }
    return true;
  },
  {
    message: 'Monto parcial no puede superar el monto total',
    path: ['montoParcial']
  }
);

export const ObraResponseSchema = z.object({
  id: z.number(),
  fecha: z.string(),
  municipio: z.string(),
  referente: z.string(),
  concepto: z.string(),
  tipo: z.string(),
  estado: z.string(),
  montoTotal: z.number(),
  montoParcial: z.number(),
  montoPendiente: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type CreateObraInput = z.infer<typeof CreateObraSchema>;
export type UpdateObraInput = z.infer<typeof UpdateObraSchema>;
export type ObraResponse = z.infer<typeof ObraResponseSchema>;
