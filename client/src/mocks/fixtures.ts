/**
 * Schema-driven MSW fixtures.
 * All fixtures are validated through schema.parse() to ensure contract compliance.
 * If a schema changes, fixtures must be updated or parse() will fail.
 */

import { 
  ObraSchema, 
  ObrasListResponseSchema,
  KpisResponseSchema 
} from '../contracts/obra.js';
import { UserSchema } from '../contracts/auth.js';

// Valid obra fixture - passes schema validation
export const mockObra = ObraSchema.parse({
  id: 1,
  fecha: '2026-08-05T10:00:00.000Z',
  municipio: 'Capital',
  referente: 'Juan Pérez',
  concepto: 'Construcción de escuela primaria',
  tipo: 'Educación',
  estado: 'En Ejecución',
  montoTotal: 5000000,
  montoPendiente: 1500000,
  montoParcial: 3500000,
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: '2026-08-05T10:00:00.000Z'
});

// Second obra for list testing
export const mockObra2 = ObraSchema.parse({
  id: 2,
  fecha: '2026-07-20T14:30:00.000Z',
  municipio: 'Chilecito',
  referente: 'María González',
  concepto: 'Mejoramiento de ruta provincial',
  tipo: 'Infraestructura',
  estado: 'Finalizado',
  montoTotal: 12000000,
  montoPendiente: 0,
  montoParcial: 12000000,
  createdAt: '2026-03-10T09:00:00.000Z',
  updatedAt: '2026-07-20T14:30:00.000Z'
});

// Mock user fixture
export const mockUser = UserSchema.parse({
  id: 1,
  email: 'admin@riojamap.com',
  name: 'Admin User',
  role: 'ADMIN'
});

// Mock KPIs fixture
export const mockKpis = KpisResponseSchema.parse({
  total: 17000000,
  parcial: 15500000,
  pendiente: 1500000,
  count: 2
});

// Mock list response
export const mockObrasList = ObrasListResponseSchema.parse({
  data: [mockObra, mockObra2],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1
  }
});

// Outdated/invalid fixture for contract drift testing
// Missing required fields: concepto, tipo, estado, montoPendiente, createdAt, updatedAt
export const outdatedObraFixture = {
  id: 999,
  municipio: 'Capital',
  montoTotal: 1000000
};
