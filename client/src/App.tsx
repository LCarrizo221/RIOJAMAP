/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';
import InteractiveMap from './components/Map.js';
import Sidebar from './components/Sidebar.js';
import Dashboard from './components/Dashboard.js';
import ToastContainer from './components/Toast.js';
import geoData from './data/la_rioja.json';
import type { ToastType } from './components/Toast.js';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export default function App() {
  const [hoveredDept, setHoveredDept] = useState<any | null>(null);
  const [selectedDept, setSelectedDept] = useState<any | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const totalPoblacion = useMemo(() => 
    geoData.features.reduce((acc: number, f: any) => acc + (f.properties.poblacion || 0), 0), 
    []
  );
  const totalHogares = useMemo(() => 
    geoData.features.reduce((acc: number, f: any) => acc + (f.properties.hogares || 0), 0), 
    []
  );

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-slate-100 font-sans overflow-hidden select-none border-4 border-[#18181b]">
      <header className="p-4 lg:p-8 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-end bg-[#0c0c0e] shrink-0">
        <div>
          <p className="text-amber-500 font-mono text-xs tracking-widest uppercase mb-1">Sistema de Información Geográfica</p>
          <h1 className="text-2xl lg:text-4xl font-serif tracking-tight font-light">Observatorio La Rioja</h1>
        </div>
        <div className="text-left sm:text-right mt-4 sm:mt-0">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">Total Provincial</p>
          <div className="flex gap-4 lg:gap-8">
            <div className="flex flex-col">
              <span className="text-xl lg:text-2xl font-mono text-slate-100">{totalPoblacion.toLocaleString('es-AR')}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Habitantes</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl lg:text-2xl font-mono text-slate-100">{totalHogares.toLocaleString('es-AR')}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Hogares</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <section className="flex-1 p-4 lg:p-8 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,_#1a1a1e_0%,_#09090b_100%)] min-h-[50vh] lg:min-h-0">
          <InteractiveMap 
            onHover={setHoveredDept} 
            onClick={setSelectedDept} 
            selectedDept={selectedDept} 
          />
        </section>
        
        {selectedDept ? (
          <Dashboard 
            department={selectedDept} 
            onClose={() => setSelectedDept(null)}
            addToast={addToast}
          />
        ) : (
          <Sidebar 
            department={hoveredDept}
            // Could pass obrasCount and montoTotal here if we want to show them on hover
          />
        )}
      </main>

      <footer className="p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between bg-[#0c0c0e] px-4 lg:px-8 gap-4 sm:gap-0 shrink-0">
        <div className="flex gap-4 lg:gap-6">
          <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Censo 2022</span>
          <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Metadatos</span>
          <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">API Access</span>
        </div>
        <div className="text-[9px] text-slate-600 uppercase tracking-widest text-center sm:text-right">
          La Rioja, Argentina • Dirección de Estadística y Censos
        </div>
      </footer>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
