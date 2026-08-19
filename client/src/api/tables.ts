/**
 * Client API for import table views and manual row creation:
 *   GET  /api/import/tables/:tableName
 *   POST /api/import/tables/:tableName/rows
 * Error messages derive from the server's `code` field when known ({ error, code }).
 */

import {
  TableListResponseContract,
  CreateRowResponseContract,
  type TableListResponse,
  type CreateTableRow,
  type TableRow,
} from '../contracts/import.js';
import { validateResponse } from './validate.js';

const API_BASE = '/api/import/tables';

/** Query params for GET /tables/:tableName (mirrors TableListQueryContract). */
export interface TableListParams {
  expediente?: string;
  nombre?: string;
  fecha_carga?: string; // ISO day YYYY-MM-DD
  es_eventual?: 'true' | 'false';
  page?: number;
  limit?: number;
}

/** Server error codes → user-facing messages (fallback: server `error` text). */
const SERVER_CODE_MESSAGES: Record<string, string> = {
  INVALID_TABLE: 'Unknown table',
  EXPEDIENTE_EXISTS: 'Expediente already exists',
  INVALID_PERSON: 'Invalid person',
  FORBIDDEN: 'Not authorized',
  VALIDATION_ERROR: 'Invalid parameters',
  FETCH_ERROR: 'Failed to load table rows',
  CREATE_ERROR: 'Failed to create row',
};

async function toApiError(response: Response, fallback: string): Promise<Error> {
  const body = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
  return new Error((body.code && SERVER_CODE_MESSAGES[body.code]) || body.error || fallback);
}

/** GET /tables/:tableName — paginated, filterable listing with eventual_total. */
export async function getTableRows(
  tableName: string,
  params: TableListParams = {},
): Promise<TableListResponse> {
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) queryParams.set(key, String(value));
  }
  const query = queryParams.size > 0 ? `?${queryParams.toString()}` : '';

  const response = await fetch(`${API_BASE}/${encodeURIComponent(tableName)}${query}`, {
    credentials: 'include',
  });
  if (!response.ok) throw await toApiError(response, `Failed to fetch table rows: ${response.status}`);

  return validateResponse(await response.json(), TableListResponseContract);
}

/** POST /tables/:tableName/rows — ADMIN manual creation (400/403/409 mapped). */
export async function createTableRow(
  tableName: string,
  payload: CreateTableRow,
): Promise<TableRow> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(tableName)}/rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await toApiError(response, `Failed to create row: ${response.status}`);

  return validateResponse(await response.json(), CreateRowResponseContract);
}
