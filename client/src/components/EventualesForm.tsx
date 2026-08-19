import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type Pedido = 'POLITICO' | 'SOCIAL' | 'ESPECIAL_SECRETARIO_GENERAL';
type TipoPago = 'CUBIX' | 'INTERBANKING';
type EstadoPedido = 'REGISTRADO' | 'APROBADO' | 'PAGADO' | 'NOTIFICADO';

interface EventualesData {
  fecha: string;
  nombre: string;
  dni: string;
  nro_celular: string;
  fecha_nacimiento: string;
  referente: string;
  monto: number | '';
  zona: string;
  pedido: Pedido;
  tipo_pago: TipoPago;
  notas: string;
  estado_del_pedido: EstadoPedido;
  expediente: string;
}

const INITIAL: EventualesData = {
  fecha: todayISO(),
  nombre: '',
  dni: '',
  nro_celular: '',
  fecha_nacimiento: '',
  referente: '',
  monto: '',
  zona: '',
  pedido: 'POLITICO',
  tipo_pago: 'CUBIX',
  notas: '',
  estado_del_pedido: 'REGISTRADO',
  expediente: '',
};

export default function EventualesForm({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = useState<EventualesData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setField = (key: keyof EventualesData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        ...form,
        monto: form.monto === '' ? 0 : Number(form.monto),
        expediente: form.expediente.trim() || undefined,
      };

      const res = await fetch('/api/eventuales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Error ${res.status}`);
      }

      setSuccess(true);
      setForm(INITIAL);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50';

  const selectClass =
    'w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50 appearance-none';

  return (
    <div className="bg-[#0c0c0e] border border-white/10 rounded-xl overflow-hidden">
      <div className="border-b border-white/10 p-4 lg:p-6">
        <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-1">
          Carga manual
        </p>
        <h2 className="text-xl font-serif font-light text-white">Alta de eventual</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fecha */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Fecha
            </span>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setField('fecha', e.target.value)}
              className={inputClass}
            />
          </label>

          {/* Nombre y apellido */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Nombre y apellido *
            </span>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              className={inputClass}
            />
          </label>

          {/* DNI */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              DNI
            </span>
            <input
              type="text"
              value={form.dni}
              onChange={(e) => setField('dni', e.target.value)}
              className={inputClass}
            />
          </label>

          {/* Nro celular */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Nro celular
            </span>
            <input
              type="text"
              value={form.nro_celular}
              onChange={(e) => setField('nro_celular', e.target.value)}
              className={inputClass}
            />
          </label>

          {/* Fecha nacimiento */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Fecha nacimiento
            </span>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) => setField('fecha_nacimiento', e.target.value)}
              className={inputClass}
            />
          </label>

          {/* Referente */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Referente
            </span>
            <input
              type="text"
              value={form.referente}
              onChange={(e) => setField('referente', e.target.value)}
              className={inputClass}
            />
          </label>

          {/* Monto */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Monto
            </span>
            <input
              type="number"
              step="0.01"
              value={form.monto}
              onChange={(e) => setField('monto', e.target.value)}
              className={inputClass}
            />
          </label>

          {/* Zona */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Zona
            </span>
            <input
              type="text"
              value={form.zona}
              onChange={(e) => setField('zona', e.target.value)}
              className={inputClass}
            />
          </label>

          {/* Pedido */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Pedido
            </span>
            <select
              value={form.pedido}
              onChange={(e) => setField('pedido', e.target.value)}
              className={selectClass}
            >
              <option value="POLITICO">Político</option>
              <option value="SOCIAL">Social</option>
              <option value="ESPECIAL_SECRETARIO_GENERAL">Especial Secretario General</option>
            </select>
          </label>

          {/* Tipo pago */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Tipo pago
            </span>
            <select
              value={form.tipo_pago}
              onChange={(e) => setField('tipo_pago', e.target.value)}
              className={selectClass}
            >
              <option value="CUBIX">Cubix</option>
              <option value="INTERBANKING">Interbanking</option>
            </select>
          </label>

          {/* Estado del pedido */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Estado del pedido
            </span>
            <select
              value={form.estado_del_pedido}
              onChange={(e) => setField('estado_del_pedido', e.target.value)}
              className={selectClass}
            >
              <option value="REGISTRADO">Registrado</option>
              <option value="APROBADO">Aprobado</option>
              <option value="PAGADO">Pagado</option>
              <option value="NOTIFICADO">Notificado</option>
            </select>
          </label>

          {/* Expediente */}
          <label className="block">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Expediente (opcional)
            </span>
            <input
              type="text"
              value={form.expediente}
              onChange={(e) => setField('expediente', e.target.value)}
              placeholder="Si se completa, activa modo importación"
              className={inputClass}
            />
          </label>
        </div>

        {/* Notas */}
        <label className="block">
          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
            Notas
          </span>
          <textarea
            value={form.notas}
            onChange={(e) => setField('notas', e.target.value)}
            rows={3}
            className={inputClass + ' resize-none'}
          />
        </label>

        {/* Feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3">
            <p className="text-red-400 text-sm font-mono">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded px-4 py-3">
            <p className="text-emerald-400 text-sm font-mono">Guardado correctamente</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed text-[#09090b] font-mono text-sm font-semibold uppercase tracking-wider px-5 py-2 rounded transition-colors inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
