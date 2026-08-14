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
}));

vi.mock('../../api/tables.js', () => ({
  getTableRows: mocks.getTableRows,
  createTableRow: vi.fn(),
}));

vi.mock('../../api/import.js', () => ({
  getReportesHistorico: mocks.getReportesHistorico,
  postImport: vi.fn(),
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
      es_eventual: true,
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  eventual_total: 1,
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

  it('renders the EVENTUAL badge for eventual rows', async () => {
    render(<DataTable tableName="expedientes" isAdmin={false} />);

    expect(await screen.findByText('EVENTUAL')).toBeInTheDocument();
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
});
