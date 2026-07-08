import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import KpiCards from './KpiCards.js';
import ObraModal from './ObraModal.js';
import { getObras, getObraKpis, deleteObra, createObra, updateObra } from '../api/obras.js';
import type { Obra, ObraInput, DepartmentFeature } from '../types.js';
import type { ToastType } from './Toast.js';

interface DashboardProps {
  department: DepartmentFeature['properties'];
  onClose: () => void;
  addToast: (type: ToastType, message: string) => void;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS', 
    maximumFractionDigits: 0 
  }).format(val);
}

function getEstadoColor(estado: string) {
  switch (estado) {
    case 'Finalizado':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'En Ejecución':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Pendiente':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'Proyectada':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'Detenida':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export default function Dashboard({ department, onClose, addToast }: DashboardProps) {
  const [obras, setObras] = useState<Obra[]>([]);
  const [kpis, setKpis] = useState({ total: 0, parcial: 0, pendiente: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReferente, setSelectedReferente] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data when department or referente changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const filters: { municipio: string; referente?: string } = {
          municipio: department.departamento
        };
        
        if (selectedReferente) {
          filters.referente = selectedReferente;
        }

        const [obrasResponse, kpisResponse] = await Promise.all([
          getObras(filters),
          getObraKpis(filters)
        ]);

        setObras(obrasResponse.data);
        setKpis(kpisResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [department.departamento, selectedReferente]);

  // Extract unique referentes from current obras
  const referentes = useMemo(() => {
    const unique = new Set(obras.map(o => o.referente));
    return Array.from(unique).sort();
  }, [obras]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar esta obra?')) {
      return;
    }

    try {
      await deleteObra(id);
      addToast('success', 'Obra eliminada correctamente');
      
      // Refresh data
      const filters: { municipio: string; referente?: string } = {
        municipio: department.departamento
      };
      if (selectedReferente) {
        filters.referente = selectedReferente;
      }
      const [obrasResponse, kpisResponse] = await Promise.all([
        getObras(filters),
        getObraKpis(filters)
      ]);
      setObras(obrasResponse.data);
      setKpis(kpisResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la obra';
      addToast('error', message);
    }
  };

  const handleSave = async (data: ObraInput) => {
    if (isSubmitting) return; // Prevent double-submit
    
    setIsSubmitting(true);
    try {
      if (editingObra) {
        // Edit mode
        await updateObra(editingObra.id, data);
        addToast('success', 'Obra actualizada correctamente');
      } else {
        // Create mode
        await createObra(data);
        addToast('success', 'Obra creada correctamente');
      }
      
      // Refresh data
      const filters: { municipio: string; referente?: string } = {
        municipio: department.departamento
      };
      if (selectedReferente) {
        filters.referente = selectedReferente;
      }
      const [obrasResponse, kpisResponse] = await Promise.all([
        getObras(filters),
        getObraKpis(filters)
      ]);
      setObras(obrasResponse.data);
      setKpis(kpisResponse);
      
      setModalOpen(false);
      setEditingObra(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la obra';
      addToast('error', message);
      throw err; // Re-throw so modal knows it failed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-full lg:w-1/2 xl:w-[600px] border-t lg:border-t-0 lg:border-l border-white/5 bg-[#0c0c0e] flex flex-col overflow-y-auto shrink-0 relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm border-b border-white/10 p-4 lg:p-6 flex justify-between items-start z-20">
        <div>
          <h2 className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">Análisis Detallado</h2>
          <p className="text-2xl lg:text-3xl font-serif italic text-white leading-tight">
            {department.departamento.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ')}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 lg:p-6 flex flex-col gap-6">
        {/* KPI Cards */}
        <section>
          <KpiCards 
            total={kpis.total} 
            parcial={kpis.parcial} 
            pendiente={kpis.pendiente} 
            count={kpis.count} 
          />
        </section>

        {/* Referente Filter */}
        {referentes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Filtrar por Referente:
              </label>
              <select
                value={selectedReferente}
                onChange={(e) => setSelectedReferente(e.target.value)}
                className="bg-[#141417] border border-white/10 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Todos</option>
                {referentes.map(ref => (
                  <option key={ref} value={ref}>{ref}</option>
                ))}
              </select>
            </div>
          </section>
        )}

        {/* Obras Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest">
              Obras ({obras.length})
            </h3>
            <button
              onClick={() => {
                setEditingObra(undefined);
                setModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              Nueva Obra
            </button>
          </div>

          {loading ? (
            <div className="bg-[#141417] border border-white/5 rounded-lg p-8 text-center">
              <p className="text-slate-400 text-sm">Cargando obras...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : obras.length === 0 ? (
            <div className="bg-[#141417] border border-white/5 rounded-lg p-8 text-center">
              <p className="text-slate-400 text-sm">
                No hay obras registradas en {department.departamento}
              </p>
            </div>
          ) : (
            <div className="bg-[#141417] border border-white/5 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0c0c0e] border-b border-white/10">
                    <tr>
                      <th className="text-left text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                        Concepto
                      </th>
                      <th className="text-left text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                        Estado
                      </th>
                      <th className="text-right text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                        Monto Total
                      </th>
                      <th className="text-right text-[9px] text-slate-400 uppercase tracking-wider font-bold px-4 py-3">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {obras.map((obra, idx) => (
                      <tr 
                        key={obra.id}
                        className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-200 font-medium truncate max-w-[200px]">
                            {obra.concepto}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-0.5">
                            {obra.referente} • {new Date(obra.fecha).toLocaleDateString('es-AR')}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider border ${getEstadoColor(obra.estado)}`}>
                            {obra.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-xs font-mono text-slate-200">
                            {formatCurrency(obra.montoTotal)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingObra(obra);
                                setModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(obra.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modal for Create/Edit */}
      <ObraModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingObra(undefined);
        }}
        obra={editingObra}
        onSave={handleSave}
        municipio={department.departamento}
        isSubmitting={isSubmitting}
      />
    </aside>
  );
}
