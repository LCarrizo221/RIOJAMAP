import { z } from 'zod';

export const createEventualSchema = z.object({
  fecha:            z.string().optional(),
  nombre:           z.string().min(1, 'El nombre es obligatorio'),
  dni:              z.string().optional().default(''),
  nro_celular:      z.string().optional().default(''),
  fecha_nacimiento: z.string().optional(),
  referente:        z.string().optional().default(''),
  monto:            z.coerce.number().default(0),
  zona:             z.string().optional().default(''),
  pedido:           z.enum(['POLITICO', 'SOCIAL', 'ESPECIAL_SECRETARIO_GENERAL']),
  tipo_pago:        z.enum(['CUBIX', 'INTERBANKING']),
  notas:            z.string().optional().default(''),
  estado_del_pedido: z.enum(['REGISTRADO', 'APROBADO', 'PAGADO', 'NOTIFICADO']),
  expediente:       z.string().optional().default(''),
});

export type CreateEventualInput = z.infer<typeof createEventualSchema>;
