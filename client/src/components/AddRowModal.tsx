import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { createTableRow } from '../api/tables.js';
import type { CreateTableRow } from '../contracts/import.js';

interface AddRowModalProps {
  tableName: string;
  /** Type2 tables require a valid person_id (server enforces too). */
  isType2: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/** Today as YYYY-MM-DD — default for fecha_carga. */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const TEXT_FIELDS = ['expediente', 'nombre', 'referente', 'detalle'] as const;
const NUMBER_FIELDS = ['monto_total', 'monto_parcial', 'saldo'] as const;

const FIELD_LABELS: Record<string, string> = {
  expediente: 'Expediente',
  nombre: 'Nombre',
  referente: 'Referente',
  detalle: 'Detalle',
  monto_total: 'Monto total',
  monto_parcial: 'Monto parcial',
  saldo: 'Saldo',
};

export default function AddRowModal({ tableName, isType2, onClose, onCreated }: AddRowModalProps) {
  const [form, setForm] = useState<Record<string, string | boolean>>({
    expediente: '',
    nombre: '',
    referente: '',
    detalle: '',
    monto_total: '0',
    monto_parcial: '0',
    saldo: '0',
    person_id: '',
    fecha_carga: todayISO(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.expediente) {
      setError('El expediente es obligatorio');
      return;
    }
    if (isType2 && !form.person_id) {
      setError('La persona (ID) es obligatoria para esta tabla');
      return;
    }

    setSubmitting(true);
    setError(null);
    const payload: CreateTableRow = {
      expediente: form.expediente as string,
      monto_total: Number(form.monto_total) || 0,
      monto_parcial: Number(form.monto_parcial) || 0,
      saldo: Number(form.saldo) || 0,
      fecha_carga: form.fecha_carga as string,
      ...(isType2 ? { person_id: Number(form.person_id) } : {}),
    };
    for (const f of TEXT_FIELDS) {
      if (f !== 'expediente' && form[f]) payload[f] = form[f] as string;
    }

    try {
      await createTableRow(tableName, payload);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la fila');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c0c0e] border border-white/10 rounded-xl shadow-2xl">
        <div className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm border-b border-white/10 p-4 lg:p-6 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-1">
              Alta manual · {tableName}
            </p>
            <h2 className="text-xl font-serif font-light text-white">Agregar fila</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEXT_FIELDS.map((f) => (
              <label key={f} className="block">
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                  {FIELD_LABELS[f]} {f === 'expediente' ? '*' : ''}
                </span>
                <input
                  value={form[f] as string}
                  onChange={(e) => setField(f, e.target.value)}
                  className={inputClass}
                />
              </label>
            ))}

            {NUMBER_FIELDS.map((f) => (
              <label key={f} className="block">
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                  {FIELD_LABELS[f]}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={form[f] as string}
                  onChange={(e) => setField(f, e.target.value)}
                  className={inputClass}
                />
              </label>
            ))}

            {isType2 && (
              <label className="block">
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                  Persona (ID) *
                </span>
                <input
                  type="number"
                  value={form.person_id as string}
                  onChange={(e) => setField('person_id', e.target.value)}
                  className={inputClass}
                />
              </label>
            )}

            <label className="block">
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                Fecha de carga
              </span>
              <input
                type="date"
                value={form.fecha_carga as string}
                onChange={(e) => setField('fecha_carga', e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3">
              <p className="text-red-400 text-sm font-mono">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-white/10 hover:border-white/20 text-slate-300 font-mono text-sm uppercase tracking-wider px-4 py-2 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed text-[#09090b] font-mono text-sm font-semibold uppercase tracking-wider px-5 py-2 rounded transition-colors"
            >
              {submitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
