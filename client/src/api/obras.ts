import type { Obra, ObraInput, KpisResponse } from '../types.js';

const API_BASE = '/api';

export interface ObrasListResponse {
  data: Obra[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  municipio?: string;
  referente?: string;
}

/**
 * Get all obras with optional filters
 */
export async function getObras(filters?: FilterOptions): Promise<ObrasListResponse> {
  const params = new URLSearchParams();
  if (filters?.municipio) params.append('municipio', filters.municipio);
  if (filters?.referente) params.append('referente', filters.referente);
  
  const response = await fetch(`${API_BASE}/obras?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch obras');
  }
  return response.json();
}

/**
 * Get KPIs with optional filters
 */
export async function getObraKpis(filters?: FilterOptions): Promise<KpisResponse> {
  const params = new URLSearchParams();
  if (filters?.municipio) params.append('municipio', filters.municipio);
  if (filters?.referente) params.append('referente', filters.referente);
  
  const response = await fetch(`${API_BASE}/obras/kpis?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch KPIs');
  }
  return response.json();
}

/**
 * Get single obra by ID
 */
export async function getObraById(id: number): Promise<Obra> {
  const response = await fetch(`${API_BASE}/obras/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Obra not found');
    }
    throw new Error('Failed to fetch obra');
  }
  return response.json();
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
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create obra');
  }
  return response.json();
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
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update obra');
  }
  return response.json();
}

/**
 * Delete obra
 */
export async function deleteObra(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/obras/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Obra not found');
    }
    throw new Error('Failed to delete obra');
  }
}
