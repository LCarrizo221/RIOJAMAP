/**
 * Client API wrapper for the /api/import endpoints.
 * Follows the same pattern as client/src/api/obras.ts:
 *   - fetch with credentials: 'include' (cookie-based auth)
 *   - validateResponse() for runtime contract validation
 *   - Descriptive error messages on non-2xx responses
 */

import {
  ImportResponseContract,
  ReportesHistoricoContract,
  VersionHistoryContract,
  type ImportResponse,
  type ReportesHistorico,
  type VersionHistory,
} from '../contracts/import.js';
import { validateResponse } from './validate.js';
import { z } from 'zod';

const API_BASE = '/api/import';

// ─── POST /api/import ─────────────────────────────────────────────────────────

/**
 * Upload and process an Excel (.xlsx) file.
 *
 * IMPORTANT: Do NOT set Content-Type manually — the browser sets
 * `multipart/form-data; boundary=...` automatically when body is FormData.
 *
 * @param file       The .xlsx File object from an <input type="file">
 * @param importDate Optional import date (defaults to server's current date)
 */
export async function postImport(file: File, importDate?: Date): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (importDate) {
    formData.append('import_date', importDate.toISOString());
  }

  const response = await fetch(`${API_BASE}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    // Content-Type is intentionally omitted — browser sets multipart/form-data with boundary
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.error || `Import failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return validateResponse(data, ImportResponseContract);
}

// ─── GET /api/import/expedientes/:numero/versions ─────────────────────────────

export interface ExpedienteVersionsResponse {
  expediente: string;
  tables: Array<{
    table_name: string;
    versions: unknown[];
  }>;
}

/**
 * Fetch version history for an expediente across all 14 tables.
 * Returns every table that contains at least one matching row.
 */
export async function getVersionsByExpediente(
  numero: string,
): Promise<ExpedienteVersionsResponse> {
  const response = await fetch(
    `${API_BASE}/expedientes/${encodeURIComponent(numero)}/versions`,
    { credentials: 'include' },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch expediente versions: ${response.status}`);
  }

  return response.json();
}

// ─── GET /api/import/person/:personId/table/:tableName/versions ───────────────

/**
 * Fetch version history for a specific person in a specific Type2 table.
 */
export async function getPersonVersions(
  personId: number,
  tableName: string,
): Promise<VersionHistory> {
  const response = await fetch(
    `${API_BASE}/person/${personId}/table/${encodeURIComponent(tableName)}/versions`,
    { credentials: 'include' },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch person versions: ${response.status}`);
  }

  const data = await response.json();
  return validateResponse(data, VersionHistoryContract);
}

// ─── GET /api/import/reportes-historico ──────────────────────────────────────

export interface ReportesHistoricoParams {
  fecha_from?: string;
  fecha_to?: string;
  matched_by?: string;
  page?: number;
  limit?: number;
}

export interface ReportesHistoricoPaginatedResponse {
  data: ReportesHistorico[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch paginated import audit log with optional date-range and filter params.
 */
export async function getReportesHistorico(
  params?: ReportesHistoricoParams,
): Promise<ReportesHistoricoPaginatedResponse> {
  const queryParams: Record<string, string> = {};
  if (params?.fecha_from) queryParams.fecha_from = params.fecha_from;
  if (params?.fecha_to) queryParams.fecha_to = params.fecha_to;
  if (params?.matched_by) queryParams.matched_by = params.matched_by;
  if (params?.page !== undefined) queryParams.page = String(params.page);
  if (params?.limit !== undefined) queryParams.limit = String(params.limit);

  const query =
    Object.keys(queryParams).length > 0
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';

  const response = await fetch(`${API_BASE}/reportes-historico${query}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reportes historico: ${response.status}`);
  }

  const responseData = await response.json();

  // Validate the data array against the contract
  const validatedData = validateResponse(
    responseData.data,
    z.array(ReportesHistoricoContract),
  );

  return {
    data: validatedData,
    pagination: responseData.pagination,
  };
}
