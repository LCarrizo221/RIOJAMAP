import React from 'react';
import { X } from 'lucide-react';
import ConveniosDashboard from './ConveniosDashboard.js';
import type { DepartmentFeature } from '../types.js';
import type { ToastType } from './Toast.js';

interface DashboardProps {
  department: DepartmentFeature['properties'];
  onClose: () => void;
  addToast: (type: ToastType, message: string) => void;
}

export default function Dashboard({ department, onClose }: DashboardProps) {
  return (
    <aside className="w-full lg:w-1/2 xl:w-[600px] border-t lg:border-t-0 lg:border-l border-white/5 bg-[#0c0c0e] flex flex-col overflow-y-auto shrink-0 relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="sticky top-0 bg-[#0c0c0e]/95 backdrop-blur-sm border-b border-white/10 p-4 lg:p-6 flex justify-between items-start z-20">
        <div>
          <h2 className="text-xs font-mono text-gov-gold uppercase tracking-widest mb-1">Análisis Detallado</h2>
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

      <div className="p-4 lg:p-6">
        <ConveniosDashboard municipio={department.departamento} />
      </div>
    </aside>
  );
}
