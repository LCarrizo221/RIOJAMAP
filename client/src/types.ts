export interface Obra {
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

export interface ObraInput {
  fecha: string;
  municipio: string;
  referente: string;
  concepto: string;
  tipo: string;
  estado: string;
  montoTotal: number;
  montoParcial: number;
}

export interface KpisResponse {
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
    poblacion?: number;
    hogares?: number;
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
