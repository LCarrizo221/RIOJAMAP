import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CreateObraSchema, UpdateObraSchema } from '../validation/obra.schema.js';
import type { Obra, ObraInput } from '../types.js';

interface ObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  obra?: Obra;
  onSave: (data: ObraInput) => Promise<void>;
  municipio?: string;
  isSubmitting?: boolean;
}

const TIPOS_OBRA = [
  'Infraestructura',
  'Salud',
  'Educación',
  'Social',
  'Deporte',
  'Energía',
  'Turismo',
  'Tecnología',
  'Productivo',
  'Subsidio',
  'Cultura',
  'Maquinaria'
] as const;

const ESTADOS_OBRA = [
  'En Ejecución',
  'Finalizado',
  'Pendiente',
  'Proyectada',
  'Detenida'
] as const;

export default function ObraModal({ isOpen, onClose, obra, onSave, municipio, isSubmitting = false }: ObraModalProps) {
  const [formData, setFormData] = useState<Partial<ObraInput>>({
    fecha: new Date().toISOString().split('T')[0],
    municipio: municipio || '',
    referente: '',
    concepto: '',
    tipo: 'Infraestructura',
    estado: 'En Ejecución',
    montoTotal: 0,
    montoParcial: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (obra) {
      // Edit mode - pre-fill form
      setFormData({
        fecha: obra.fecha.split('T')[0],
        municipio: obra.municipio,
        referente: obra.referente,
        concepto: obra.concepto,
        tipo: obra.tipo as typeof TIPOS_OBRA[number],
        estado: obra.estado as typeof ESTADOS_OBRA[number],
        montoTotal: obra.montoTotal,
        montoParcial: obra.montoParcial
      });
    } else {
      // Create mode - reset form
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        municipio: municipio || '',
        referente: '',
        concepto: '',
        tipo: 'Infraestructura',
        estado: 'En Ejecución',
        montoTotal: 0,
        montoParcial: 0
      });
    }
    setErrors({});
  }, [obra, isOpen, municipio]);

  const validate = () => {
    const schema = obra ? UpdateObraSchema : CreateObraSchema;
    const result = schema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      await onSave(formData as ObraInput);
      // Modal close and data refresh is handled by parent
    } catch (error) {
      // Error is already shown as toast by parent
      // Keep modal open so user can fix issues if needed
    }
  };

  const handleChange = (field: keyof ObraInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000]"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
          >
            <div className="bg-[#0c0c0e] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm border-b border-white/10 p-4 lg:p-6 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
                    {obra ? 'Editar Obra' : 'Nueva Obra'}
                  </h2>
                  <p className="text-xl font-serif italic text-white">
                    {obra ? 'Modificar datos' : 'Registrar nueva obra'}
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 lg:p-6 flex flex-col gap-4">
                {errors.submit && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                    {errors.submit}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => handleChange('fecha', e.target.value)}
                      className="w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50"
                      required
                    />
                    {errors.fecha && <p className="text-red-400 text-xs mt-1">{errors.fecha}</p>}
                  </div>

                  {/* Municipio */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Municipio *
                    </label>
                    <input
                      type="text"
                      value={formData.municipio}
                      onChange={(e) => handleChange('municipio', e.target.value)}
                      disabled={!!municipio}
                      className="w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                      required
                    />
                    {errors.municipio && <p className="text-red-400 text-xs mt-1">{errors.municipio}</p>}
                  </div>

                  {/* Referente */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Referente *
                    </label>
                    <input
                      type="text"
                      value={formData.referente}
                      onChange={(e) => handleChange('referente', e.target.value)}
                      className="w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50"
                      required
                    />
                    {errors.referente && <p className="text-red-400 text-xs mt-1">{errors.referente}</p>}
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => handleChange('tipo', e.target.value)}
                      className="w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50"
                      required
                    >
                      {TIPOS_OBRA.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                    {errors.tipo && <p className="text-red-400 text-xs mt-1">{errors.tipo}</p>}
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Estado *
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => handleChange('estado', e.target.value)}
                      className="w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50"
                      required
                    >
                      {ESTADOS_OBRA.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                    {errors.estado && <p className="text-red-400 text-xs mt-1">{errors.estado}</p>}
                  </div>

                  {/* Concepto */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Concepto *
                    </label>
                    <input
                      type="text"
                      value={formData.concepto}
                      onChange={(e) => handleChange('concepto', e.target.value)}
                      className="w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50"
                      required
                    />
                    {errors.concepto && <p className="text-red-400 text-xs mt-1">{errors.concepto}</p>}
                  </div>

                  {/* Monto Total */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Monto Total *
                    </label>
                    <input
                      type="number"
                      value={formData.montoTotal}
                      onChange={(e) => handleChange('montoTotal', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50"
                      required
                      min="0"
                    />
                    {errors.montoTotal && <p className="text-red-400 text-xs mt-1">{errors.montoTotal}</p>}
                  </div>

                  {/* Monto Parcial */}
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Monto Parcial *
                    </label>
                    <input
                      type="number"
                      value={formData.montoParcial}
                      onChange={(e) => handleChange('montoParcial', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#141417] border border-white/10 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-amber-500/50"
                      required
                      min="0"
                    />
                    {errors.montoParcial && <p className="text-red-400 text-xs mt-1">{errors.montoParcial}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Guardando...' : (obra ? 'Actualizar' : 'Crear')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
