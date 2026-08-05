import type { Obra, ObraInput, KpisResponse } from '../types.js';
import { validateResponse } from './validate.js';
import { 
  ObrasListResponseSchema, 
  KpisResponseSchema, 
  ObraSchema,
  type ObrasListResponse as ObrasListResponseContract
} from '../contracts/obra.js';

const API_BASE = '/api';

export interface FilterOptions {
  municipio?: string;
  referente?: string;
}

/**
 * Get all obras with optional filters
 */
export async function getObras(filters?: FilterOptions): Promise<ObrasListResponseContract> {
  const params = new URLSearchParams();
  if (filters?.municipio) params.append('municipio', filters.municipio);
  if (filters?.referente) params.append('referente', filters.referente);
  
  const response = await fetch(`${API_BASE}/obras?${params.toString()}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch obras');
  }
  const data = await response.json();
  return validateResponse(data, ObrasListResponseSchema);
}

/**
 * Get KPIs with optional filters
 */
export async function getObraKpis(filters?: FilterOptions): Promise<KpisResponse> {
  const params = new URLSearchParams();
  if (filters?.municipio) params.append('municipio', filters.municipio);
  if (filters?.referente) params.append('referente', filters.referente);
  
  const response = await fetch(`${API_BASE}/obras/kpis?${params.toString()}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch KPIs');
  }
  const data = await response.json();
  return validateResponse(data, KpisResponseSchema) as KpisResponse;
}

/**
 * Get single obra by ID
 */
export async function getObraById(id: number): Promise<Obra> {
  const response = await fetch(`${API_BASE}/obras/${id}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Obra not found');
    }
    throw new Error('Failed to fetch obra');
  }
  const data = await response.json();
  return validateResponse(data, ObraSchema);
}

/**
 * Create new obra
 */
export async function createObra(data: ObraInput): Promise<Obra> {
  const response = await fetch(`${API_BASE}/obras`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create obra');
  }
  const responseData = await response.json();
  return validateResponse(responseData, ObraSchema);
}

/**
 * Update existing obra
 */
export async function updateObra(id: number, data: Partial<ObraInput>): Promise<Obra> {
  const response = await fetch(`${API_BASE}/obras/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update obra');
  }
  const responseData = await response.json();
  return validateResponse(responseData, ObraSchema);
}

/**
 * Delete obra
 */
export async function deleteObra(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/obras/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Obra not found');
    }
    throw new Error('Failed to delete obra');
  }
}
