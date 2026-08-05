// Re-export types from contracts for backward compatibility
// These interfaces now come from Zod schema inference
export type { Obra, KpisResponse, CreateObraInput, UpdateObraInput, ObraInput } from './contracts/obra.js';
export type { User } from './contracts/auth.js';

// Keep original hand-written interfaces for reference (future work)
// These are deprecated in favor of Zod-inferred types
export interface ObraLegacy {
  id: number;
  fecha: string;
  municipio: string;
  referente: string;
  concepto: string;
  tipo: string;
  estado: string;
  montoTotal: number;
  montoParcial: number;
  montoPendiente: number;
  createdAt: string;
  updatedAt: string;
}

export interface ObraInputLegacy {
  fecha: string;
  municipio: string;
  referente: string;
  concepto: string;
  tipo: string;
  estado: string;
  montoTotal: number;
  montoParcial: number;
}

export interface KpisResponseLegacy {
  total: number;
  parcial: number;
  pendiente: number;
  count: number;
}

export interface DepartmentFeature {
  type: string;
  properties: {
    id: number;
    departamento: string;
    cabecera?: string;
    provincia?: string;
    tasa_desempleo?: number;
    nivel_educativo?: string;
  };
  geometry: any;
}

export type EstadoObra = 'En Ejecución' | 'Finalizado' | 'Pendiente' | 'Proyectada' | 'Detenida';

export type TipoObra = 
  | 'Infraestructura'
  | 'Salud'
  | 'Educación'
  | 'Social'
  | 'Deporte'
  | 'Energía'
  | 'Turismo'
  | 'Tecnología'
  | 'Productivo'
  | 'Subsidio'
  | 'Cultura'
  | 'Maquinaria';
