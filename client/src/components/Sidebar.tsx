import React from 'react';
import { MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DepartmentProperties {
  id: number;
  nombre?: string;
  departamento: string;
  poblacion?: number;
  hogares?: number;
}

interface SidebarProps {
  department: DepartmentProperties | null;
  obrasCount?: number;
  montoTotal?: number;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS', 
    maximumFractionDigits: 0 
  }).format(val);
}

export default function Sidebar({ department, obrasCount, montoTotal }: SidebarProps) {
  return (
    <aside className="w-full lg:w-2/5 xl:w-[400px] border-t lg:border-t-0 lg:border-l border-white/5 bg-[#0c0c0e] p-4 lg:p-8 flex flex-col gap-6 overflow-y-auto shrink-0">
      <AnimatePresence mode="wait">
        {department ? (
          <motion.div
            key={department.departamento}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6 h-full"
          >
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">Departamento</h2>
              <p className="text-3xl font-serif italic text-white">
                {(department.departamento ?? '').split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ')}
              </p>
            </div>

            {/* Obra-related info */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-[#141417] p-4 border border-white/5 rounded-sm">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Obras</p>
                <p className="text-xl lg:text-2xl font-mono text-slate-100">{obrasCount ?? 0}</p>
              </div>
              <div className="bg-[#141417] p-4 border border-white/5 rounded-sm">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Monto Total</p>
                <p className="text-xl lg:text-2xl font-mono text-amber-400">
                  {montoTotal ? formatCurrency(montoTotal) : '$ 0'}
                </p>
              </div>
            </div>

            <div className="mt-auto p-4 bg-amber-900/10 border border-amber-900/20 rounded-sm italic text-xs text-slate-400">
"El departamento {(department.departamento ?? '').split(' ').map(word => 

                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')} cuenta con {obrasCount ?? 0} obras registradas en el sistema."
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center h-full p-6"
          >
            <div className="w-16 h-16 rounded-full border border-white/10 bg-[#141417] flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-amber-500/50" />
            </div>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest max-w-[200px] leading-relaxed">
              Seleccione un departamento en el mapa para ver sus indicadores
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
