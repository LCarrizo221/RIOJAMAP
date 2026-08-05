/**
 * Client-side Zod schemas mirroring server/src/schemas/auth.ts
 * Last synced with backend: 2026-08-05
 * 
 * These schemas are used for runtime validation of API responses.
 * Keep in sync with server schemas - contract tests will catch drift.
 */

import { z } from 'zod';

/**
 * User response schema - mirrors server's UserResponseSchema exactly.
 * Uses strict() to reject unknown/extra fields (drift detection).
 */
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['ADMIN', 'USER'])
}).strict();

export const LoginRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

export const RegisterRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim()
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
