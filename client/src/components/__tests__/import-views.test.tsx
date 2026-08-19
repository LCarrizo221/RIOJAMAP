import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import DataTable from '../DataTable.js';
import { ImportPage } from '../ImportPage.js';
import { AuthProvider } from '../../context/AuthContext.js';

const mocks = vi.hoisted(() => ({
  getTableRows: vi.fn(),
  getReportesHistorico: vi.fn(),
  getMe: vi.fn(),
  postImport: vi.fn(),
}));

vi.mock('../../api/tables.js', () => ({
  getTableRows: mocks.getTableRows,
  createTableRow: vi.fn(),
}));

vi.mock('../../api/import.js', () => ({
  getReportesHistorico: mocks.getReportesHistorico,
  postImport: mocks.postImport,
}));

vi.mock('../../api/auth.js', () => ({
  getMe: mocks.getMe,
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
}));

const listResponse = {
  table_name: 'expedientes',
  data: [
    {
      id: 1,
      expediente: 'EXP-42',
      monto_total: 1000,
      monto_parcial: 0,
      saldo: 1000,
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

const emptyHistorico = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getTableRows.mockResolvedValue(listResponse);
  mocks.getReportesHistorico.mockResolvedValue(emptyHistorico);
});

describe('DataTable — ADMIN/USER role gate', () => {
  it('shows the "+ Agregar fila" button for ADMIN', async () => {
    render(<DataTable tableName="expedientes" isAdmin />);

    expect(await screen.findByRole('button', { name: /agregar fila/i })).toBeInTheDocument();
  });

  it('hides the "+ Agregar fila" button for USER', async () => {
    render(<DataTable tableName="expedientes" isAdmin={false} />);

    await screen.findByText('EXP-42');
    expect(screen.queryByRole('button', { name: /agregar fila/i })).not.toBeInTheDocument();
  });
});

describe('ImportPage — tabs', () => {
  it('renders Cargar / Ver tablas tabs and mounts the table browser', async () => {
    mocks.getMe.mockResolvedValue({
      id: 1,
      email: 'admin@riojamap.com',
      name: 'Admin User',
      role: 'ADMIN',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ImportPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Cargar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver tablas' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ver tablas' }));

    expect(await screen.findByRole('button', { name: 'expedientes' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /agregar fila/i })).toBeInTheDocument();
  });

  it('sends nro_expediente and fecha_carga with the uploaded file', async () => {
    mocks.getMe.mockResolvedValue({
      id: 1,
      email: 'admin@riojamap.com',
      name: 'Admin User',
      role: 'ADMIN',
    });
    mocks.postImport.mockResolvedValue({
      success: true,
      summary: {
        total_rows: 1,
        matched_by_expediente: 0,
        matched_by_name: 0,
        unmatched: 1,
        ambiguous: 0,
        eventual_matched: 1,
        warnings: [],
      },
      updated_rows: [],
      errors: [],
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ImportPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    // Wait for auth to resolve so the ADMIN upload panel renders
    expect(await screen.findByText(/admin@riojamap\.com/i)).toBeInTheDocument();

    const file = new File(['xlsx-content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await userEvent.upload(screen.getByLabelText(/archivo excel/i), file);

    await userEvent.type(screen.getByLabelText(/nro\. expediente/i), 'H11-00388-7-26');
    await userEvent.type(screen.getByLabelText(/fecha de carga/i), '2026-08-14');

    await userEvent.click(screen.getByRole('button', { name: /subir e importar/i }));

    expect(mocks.postImport).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        nro_expediente: 'H11-00388-7-26',
        fecha_carga: '2026-08-14',
      }),
    );
    expect(await screen.findByText(/exitosa/i)).toBeInTheDocument();
  });
});
