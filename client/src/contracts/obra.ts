/**
 * Client-side Zod schemas mirroring server/src/schemas/obra.ts
 * Last synced with backend: 2026-08-05
 * 
 * These schemas are used for runtime validation of API responses.
 * Keep in sync with server schemas - contract tests will catch drift.
 */

import { z } from 'zod';

/**
 * Obra response schema - uses strict() to reject unknown/extra fields (drift detection).
 */
export const ObraSchema = z.object({
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
}).strict();

/**
 * Pagination wrapper - uses strict() for drift detection.
 */
export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number()
}).strict();

/**
 * Obras list response - uses strict() for drift detection.
 */
export const ObrasListResponseSchema = z.object({
  data: ObraSchema.array(),
  pagination: PaginationSchema
}).strict();

/**
 * KPIs response - uses strict() for drift detection.
 */
export const KpisResponseSchema = z.object({
  total: z.number(),
  parcial: z.number(),
  pendiente: z.number(),
  count: z.number()
}).strict();

// Explicit type definition for KpisResponse to avoid inference issues
export interface KpisResponse {
  total: number;
  parcial: number;
  pendiente: number;
  count: number;
}

// Input schemas for mutations
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

// Type exports
export type Obra = z.infer<typeof ObraSchema>;
export type ObrasListResponse = z.infer<typeof ObrasListResponseSchema>;
export type CreateObraInput = z.infer<typeof CreateObraSchema>;
export type UpdateObraInput = z.infer<typeof UpdateObraSchema>;
export type ObraInput = CreateObraInput;
