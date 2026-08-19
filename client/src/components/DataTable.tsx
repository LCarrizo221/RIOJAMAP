import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { getTableRows } from '../api/tables.js';
import { getReportesHistorico } from '../api/import.js';
import { TYPE2_TABLES } from '../contracts/import.js';
import AddRowModal from './AddRowModal.js';

interface DataTableProps {
  tableName: string;
  isAdmin: boolean;
  /** ReportesHistorico — read-only audit log: no add button, no eventual filters. */
  readonly?: boolean;
}

/** Technical/internal fields never rendered as columns (nested `person` object included). */
const HIDDEN_COLUMNS = new Set(['person', 'createdAt', 'imported_from', 'id', 'version', 'updatedAt']);
const MONEY_COLUMNS = new Set(['monto_total', 'monto_parcial', 'saldo']);
const DATE_COLUMNS = new Set(['fecha_carga', 'fecha_importacion']);

function formatMoney(value: unknown) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function DataTable({ tableName, isAdmin, readonly = false }: DataTableProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const [expediente, setExpediente] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (readonly) {
          const res = await getReportesHistorico({ page, limit: pageSize });
          if (cancelled) return;
          setRows(res.data as unknown as Record<string, unknown>[]);
          setTotal(res.pagination.total);
        } else {
          const res = await getTableRows(tableName, {
            page,
            limit: pageSize,
            ...(expediente.trim() ? { expediente: expediente.trim() } : {}),
            ...(nombre.trim() ? { nombre: nombre.trim() } : {}),
          });
          if (cancelled) return;
          setRows(res.data);
          setTotal(res.pagination.total);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar los datos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [readonly, tableName, page, pageSize, expediente, nombre, reloadTick]);

  /** Columns derived from the first row's keys, minus internal fields. */
  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    return Object.keys(rows[0]).filter((k) => !HIDDEN_COLUMNS.has(k));
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canAdd = isAdmin && !readonly;

  const renderCell = (key: string, value: unknown) => {
    if (value === null || value === undefined) return '—';
    if (MONEY_COLUMNS.has(key)) return formatMoney(value);
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return String(value);
    const s = String(value);
    return DATE_COLUMNS.has(key) && s.length > 10 ? s.slice(0, 10) : s;
  };

  const filterClass =
    'bg-[#141417] border border-white/10 rounded-lg px-3 py-1.5 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 w-40';

  return (
    <div className="bg-[#141417] border border-white/5 rounded-lg overflow-hidden">
      {/* Toolbar: filters + add button */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/10 bg-[#0c0c0e]">
        <div className="flex flex-wrap items-center gap-2">
          {!readonly && (
            <>
              <input
                value={expediente}
                onChange={(e) => {
                  setExpediente(e.target.value);
                  setPage(1);
                }}
                placeholder="Filtrar expediente…"
                className={filterClass}
              />
              <input
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setPage(1);
                }}
                placeholder="Filtrar nombre…"
                className={filterClass}
              />
            </>
          )}
        </div>
        {canAdd && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-[#09090b] text-xs font-mono font-semibold uppercase tracking-wider rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar fila
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-8 text-center">
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest animate-pulse">Cargando…</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-500/5">
          <p className="text-red-400 text-sm font-mono">{error}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-slate-500 text-sm">No hay filas para mostrar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0c0c0e] border-b border-white/10">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    className="text-left text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3 whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={String(row.id ?? i)}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  {columns.map((c) => (
                    <td key={c} className="px-4 py-3 text-xs text-slate-200 whitespace-nowrap">
                      {renderCell(c, row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 p-4 border-t border-white/10">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          {total} filas · Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-white/10 rounded text-[10px] font-mono uppercase tracking-wider text-slate-300 hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-white/10 rounded text-[10px] font-mono uppercase tracking-wider text-slate-300 hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>

      {modalOpen && (
        <AddRowModal
          tableName={tableName}
          isType2={(TYPE2_TABLES as readonly string[]).includes(tableName)}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            setReloadTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}
