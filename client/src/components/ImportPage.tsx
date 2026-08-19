import { useState, useRef, type FormEvent, type ChangeEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postImport } from '../api/import.js';
import type { ImportResponse } from '../contracts/import.js';
import TableBrowser from './TableBrowser.js';
import EventualesForm from './EventualesForm.js';

type Tab = 'cargar' | 'eventuales' | 'tablas';
type Status = 'idle' | 'loading' | 'success' | 'error';

const TAB_CLASSES = (active: boolean) =>
  `px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-t-lg border-b-2 transition-colors ${
    active
      ? 'text-gov-gold-light border-gov-gold bg-gov-gold/gov-gold/5'
      : 'text-slate-400 border-transparent hover:text-slate-200'
  }`;

export function ImportPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [tab, setTab] = useState<Tab>('cargar');
  const [file, setFile] = useState<File | null>(null);
  const [nroExpediente, setNroExpediente] = useState('');
  const [fechaCarga, setFechaCarga] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    // Reset previous results when a new file is picked
    setStatus('idle');
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Seleccioná un archivo .xlsx primero');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setResult(null);

    try {
      const response = await postImport(file, {
        nro_expediente: nroExpediente.trim() || undefined,
        fecha_carga: fechaCarga || undefined,
      });
      setResult(response);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al importar');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setFile(null);
    setNroExpediente('');
    setFechaCarga('');
    setStatus('idle');
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0c0c0e] px-4 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-gov-gold font-mono text-xs tracking-widest uppercase mb-1">
              Importación de datos
            </p>
            <h1 className="text-2xl lg:text-3xl font-serif tracking-tight font-light">
              Importar Excel
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              {user?.email ?? '—'} · {user?.role ?? '—'}
            </span>
            <Link
              to="/"
              className="text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-gov-gold transition-colors"
            >
              ← Volver al mapa
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Tabs */}
        <nav className="flex gap-1 border-b border-white/10" aria-label="Secciones de importación">
          <button onClick={() => setTab('cargar')} className={TAB_CLASSES(tab === 'cargar')}>
            Cargar
          </button>
          <button onClick={() => setTab('eventuales')} className={TAB_CLASSES(tab === 'eventuales')}>
            Eventuales
          </button>
          <button onClick={() => setTab('tablas')} className={TAB_CLASSES(tab === 'tablas')}>
            Ver tablas
          </button>
        </nav>

        {tab === 'cargar' && (
          isAdmin ? (
            <UploadPanel
              file={file}
              nroExpediente={nroExpediente}
              fechaCarga={fechaCarga}
              status={status}
              error={error}
              result={result}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onNroExpedienteChange={setNroExpediente}
              onFechaCargaChange={setFechaCarga}
              onSubmit={handleSubmit}
              onReset={handleReset}
            />
          ) : (
            <section className="bg-[#0c0c0e] rounded-lg border border-white/10 p-6 lg:p-8">
              <p className="text-sm font-mono text-slate-400">
                Solo los administradores pueden cargar archivos.
              </p>
            </section>
          )
        )}

        {tab === 'eventuales' && (
          isAdmin ? (
            <EventualesForm />
          ) : (
            <section className="bg-[#0c0c0e] rounded-lg border border-white/10 p-6 lg:p-8">
              <p className="text-sm font-mono text-slate-400">
                Solo los administradores pueden cargar eventuales.
              </p>
            </section>
          )
        )}

        {tab === 'tablas' && <TableBrowser isAdmin={isAdmin} />}
      </main>
    </div>
  );
}

interface UploadPanelProps {
  file: File | null;
  nroExpediente: string;
  fechaCarga: string;
  status: Status;
  error: string | null;
  result: ImportResponse | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onNroExpedienteChange: (value: string) => void;
  onFechaCargaChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
}

function UploadPanel({
  file,
  nroExpediente,
  fechaCarga,
  status,
  error,
  result,
  fileInputRef,
  onFileChange,
  onNroExpedienteChange,
  onFechaCargaChange,
  onSubmit,
  onReset,
}: UploadPanelProps) {
  return (
    <div className="space-y-6">
      <section className="bg-[#0c0c0e] rounded-lg border border-white/10 p-6 lg:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* File picker */}
          <div>
            <label
              htmlFor="file"
              className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2"
            >
              Archivo Excel (.xlsx)
            </label>
            <input
              id="file"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={onFileChange}
              disabled={status === 'loading'}
              className="block w-full text-sm font-mono text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gov-gold file:text-[#09090b] file:font-semibold file:font-mono file:uppercase file:tracking-wider file:cursor-pointer hover:file:bg-gov-gold-light file:transition-colors disabled:opacity-50"
            />
            {file && (
              <p className="mt-2 text-xs font-mono text-slate-500">
                Seleccionado: <span className="text-slate-300">{file.name}</span>{' '}
                ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Optional import metadata: eventual expedition number + load date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="nro-expediente"
                className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2"
              >
                Nro. expediente (opcional)
              </label>
              <input
                id="nro-expediente"
                type="text"
                value={nroExpediente}
                onChange={(e) => onNroExpedienteChange(e.target.value)}
                disabled={status === 'loading'}
                placeholder="Ej: H11-00388-7-26"
                className="block w-full bg-[#141417] border border-white/10 rounded px-3 py-2 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:border-gov-gold/50 focus:outline-none disabled:opacity-50"
              />
              <p className="mt-1 text-[11px] font-mono text-slate-600">
                Si se completa, las filas con ese expediente se marcan como eventuales.
              </p>
            </div>
            <div>
              <label
                htmlFor="fecha-carga"
                className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2"
              >
                Fecha de carga (opcional)
              </label>
              <input
                id="fecha-carga"
                type="date"
                value={fechaCarga}
                onChange={(e) => onFechaCargaChange(e.target.value)}
                disabled={status === 'loading'}
                className="block w-full bg-[#141417] border border-white/10 rounded px-3 py-2 text-sm font-mono text-slate-200 focus:border-gov-gold/50 focus:outline-none disabled:opacity-50"
              />
              <p className="mt-1 text-[11px] font-mono text-slate-600">
                Por defecto usa la fecha actual.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={status === 'loading' || !file}
              className="bg-gov-gold hover:bg-gov-gold-light disabled:bg-gov-gold/30 disabled:cursor-not-allowed text-[#09090b] font-mono text-sm font-semibold uppercase tracking-wider px-6 py-3 rounded transition-colors"
            >
              {status === 'loading' ? 'Subiendo…' : 'Subir e importar'}
            </button>
            {status !== 'loading' && (file || result || error) && (
              <button
                type="button"
                onClick={onReset}
                className="border border-white/10 hover:border-white/20 text-slate-300 font-mono text-sm uppercase tracking-wider px-6 py-3 rounded transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Error */}
          {status === 'error' && error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3">
              <p className="text-red-400 text-sm font-mono whitespace-pre-wrap break-words">{error}</p>
            </div>
          )}
        </form>
      </section>

      {/* Result */}
      {status === 'loading' && (
        <section className="bg-[#0c0c0e] rounded-lg border border-white/10 p-6 text-center">
          <p className="text-slate-400 font-mono text-sm uppercase tracking-widest animate-pulse">
            Procesando…
          </p>
        </section>
      )}

      {status === 'success' && result && <ImportResult result={result} />}
    </div>
  );
}

function ImportResult({ result }: { result: ImportResponse }) {
  const s = result.summary;
  const totals = [
    { label: 'Total filas', value: s.total_rows, color: 'text-slate-100' },
    { label: 'Match expediente', value: s.matched_by_expediente, color: 'text-emerald-400' },
    { label: 'Match nombre', value: s.matched_by_name, color: 'text-sky-400' },
    { label: 'Sin match', value: s.unmatched, color: 'text-gov-gold-light' },
    { label: 'Ambiguos', value: s.ambiguous, color: 'text-red-400' },
    { label: 'Eventuales', value: s.eventual_matched ?? 0, color: 'text-orange-400' },
  ];

  return (
    <section className="bg-[#0c0c0e] rounded-lg border border-white/10 overflow-hidden">
      {/* Summary header */}
      <div className="px-6 lg:px-8 py-5 border-b border-white/10 bg-emerald-500/5">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 text-2xl">✓</span>
          <p className="text-emerald-300 font-mono text-sm uppercase tracking-widest">
            Importación exitosa
          </p>
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-white/5">
        {totals.map((t) => (
          <div key={t.label} className="bg-[#0c0c0e] p-5">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
              {t.label}
            </p>
            <p className={`text-3xl font-serif font-light ${t.color}`}>{t.value}</p>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {s.warnings.length > 0 && (
        <div className="px-6 lg:px-8 py-5 border-t border-white/10">
          <p className="text-xs font-mono text-gov-gold uppercase tracking-widest mb-3">
            Advertencias ({s.warnings.length})
          </p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {s.warnings.slice(0, 50).map((w, i) => (
              <li key={i} className="text-sm font-mono text-slate-400">
                · {w}
              </li>
            ))}
            {s.warnings.length > 50 && (
              <li className="text-xs font-mono text-slate-500">
                … y {s.warnings.length - 50} más
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Updated rows */}
      {result.updated_rows.length > 0 && (
        <div className="px-6 lg:px-8 py-5 border-t border-white/10">
          <p className="text-xs font-mono text-sky-500 uppercase tracking-widest mb-3">
            Filas actualizadas/creadas ({result.updated_rows.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-500 uppercase tracking-widest text-left border-b border-white/10">
                  <th className="py-2 pr-4 font-medium">Tabla</th>
                  <th className="py-2 pr-4 font-medium">Tipo</th>
                  <th className="py-2 pr-4 font-medium">Row ID</th>
                  <th className="py-2 pr-4 font-medium">Expediente</th>
                  <th className="py-2 pr-4 font-medium">Match</th>
                  <th className="py-2 pr-4 font-medium">Versión</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {result.updated_rows.slice(0, 100).map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4">{row.table_name}</td>
                    <td className="py-2 pr-4 text-slate-500">{row.table_type}</td>
                    <td className="py-2 pr-4">{row.row_id}</td>
                    <td className="py-2 pr-4 text-slate-400">{row.expediente ?? '—'}</td>
                    <td className="py-2 pr-4 text-sky-400">{row.matched_by}</td>
                    <td className="py-2 pr-4 text-emerald-400">v{row.version_created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.updated_rows.length > 100 && (
            <p className="text-xs font-mono text-slate-500 mt-2">
              Mostrando 100 de {result.updated_rows.length} filas
            </p>
          )}
        </div>
      )}

      {/* Errors (if any) */}
      {result.errors && result.errors.length > 0 && (
        <div className="px-6 lg:px-8 py-5 border-t border-white/10 bg-red-500/5">
          <p className="text-xs font-mono text-red-400 uppercase tracking-widest mb-3">
            Errores ({result.errors.length})
          </p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {result.errors.slice(0, 50).map((err, i) => (
              <li key={i} className="text-sm font-mono text-red-300">
                · {err}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
