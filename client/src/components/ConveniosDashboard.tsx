import React, { useState, useEffect, useMemo } from 'react';
import { getConveniosMunic } from '../api/conveniosMunic.js';
import type { Convenio } from '../api/conveniosMunic.js';

interface ConveniosDashboardProps {
  municipio: string;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(val);
}

export default function ConveniosDashboard({ municipio }: ConveniosDashboardProps) {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [kpis, setKpis] = useState({ count: 0, montoTotal: 0, montoParcial: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReferente, setSelectedReferente] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getConveniosMunic(municipio, selectedReferente || undefined);
        setConvenios(response.convenios);
        setKpis({
          count: response.count,
          montoTotal: response.montoTotal,
          montoParcial: response.montoParcial,
          saldo: response.saldo,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar convenios');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [municipio, selectedReferente]);

  const referentes = useMemo(() => {
    const unique = new Set(convenios.map((c) => c.referente).filter(Boolean));
    return Array.from(unique).sort() as string[];
  }, [convenios]);

  if (loading) {
    return (
      <div className="bg-[#141417] border border-white/5 rounded-lg p-8 text-center">
        <p className="text-slate-400 text-sm">Cargando convenios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (convenios.length === 0) {
    return (
      <div className="space-y-4">
        {/* KPIs with zeros */}
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Total" value={0} />
          <KpiCard label="Ejecutado" value={0} />
          <KpiCard label="Pendiente" value={0} />
        </div>
        <div className="bg-[#141417] border border-white/5 rounded-lg p-8 text-center">
          <p className="text-slate-400 text-sm">Sin convenios en {municipio}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Total" value={kpis.montoTotal} />
        <KpiCard label="Ejecutado" value={kpis.montoParcial} />
        <KpiCard label="Pendiente" value={kpis.saldo} />
      </div>

      {/* Referente Filter */}
      {referentes.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            Filtrar por Referente:
          </label>
          <select
            value={selectedReferente}
            onChange={(e) => setSelectedReferente(e.target.value)}
            className="bg-[#141417] border border-white/10 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-gov-gold/50"
          >
            <option value="">Todos</option>
            {referentes.map((ref) => (
              <option key={ref} value={ref}>
                {ref}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Convenios Table */}
      <div className="bg-[#141417] border border-white/5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0c0c0e] border-b border-white/10">
              <tr>
                <th className="text-left text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                  Expediente
                </th>
                <th className="text-left text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                  Referente
                </th>
                <th className="text-left text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                  Detalle
                </th>
                <th className="text-right text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                  Monto Total
                </th>
                <th className="text-right text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                  Pago Parcial
                </th>
                <th className="text-right text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody>
              {convenios.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-200 font-mono">{c.expediente}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-200 truncate max-w-[200px]">{c.referente ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{c.detalle ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-xs font-mono text-slate-200">{formatCurrency(c.monto_total)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-xs font-mono text-green-400">{formatCurrency(c.monto_parcial)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-xs font-mono text-gov-gold-light">{formatCurrency(c.saldo)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#141417] border border-white/5 rounded-lg p-3">
      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">{label}</p>
      <p className="text-lg font-mono text-white">{formatCurrency(value)}</p>
    </div>
  );
}
