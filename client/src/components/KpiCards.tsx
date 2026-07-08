import React from 'react';
import { TrendingUp, Wallet, Clock } from 'lucide-react';

interface KpiCardsProps {
  total: number;
  parcial: number;
  pendiente: number;
  count: number;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS', 
    maximumFractionDigits: 0 
  }).format(val);
}

export default function KpiCards({ total, parcial, pendiente, count }: KpiCardsProps) {
  const hasData = count > 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total */}
      <div className="group relative bg-gradient-to-br from-blue-600 to-blue-500 p-4 rounded-lg border border-white/10 shadow-lg hover:shadow-2xl hover:z-10 transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-white/90 shrink-0" />
          <p className="text-[10px] text-white/90 uppercase font-bold tracking-wider truncate">Total Provincial</p>
        </div>
        <p className="font-mono font-bold text-white truncate"
           style={{ fontSize: 'clamp(0.875rem, 1.8vw + 0.5rem, 1.5rem)' }}>
          {hasData ? formatCurrency(total) : '---'}
        </p>
        <p className="text-[9px] text-white/70 uppercase tracking-wider mt-1 truncate">
          {count} {count === 1 ? 'obra' : 'obras'}
        </p>

        {/* Hover expansion: bounce-in right with full number */}
        <div className="absolute top-0 z-20 flex items-center h-full px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-r-lg border border-white/10 border-l-0 shadow-2xl whitespace-nowrap left-full
          opacity-0 pointer-events-none -translate-x-[12px]
          group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0
          transition-all duration-300 ease-out [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]">
          <p className="font-mono font-bold text-white"
             style={{ fontSize: 'clamp(0.875rem, 1.8vw + 0.5rem, 1.5rem)' }}>
            {hasData ? formatCurrency(total) : '---'}
          </p>
        </div>
      </div>

      {/* Parcial Entregado */}
      <div className="group relative bg-gradient-to-br from-green-600 to-green-500 p-4 rounded-lg border border-white/10 shadow-lg hover:shadow-2xl hover:z-10 transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-white/90 shrink-0" />
          <p className="text-[10px] text-white/90 uppercase font-bold tracking-wider truncate">Parcial Entregado</p>
        </div>
        <p className="font-mono font-bold text-white truncate"
           style={{ fontSize: 'clamp(0.875rem, 1.8vw + 0.5rem, 1.5rem)' }}>
          {hasData ? formatCurrency(parcial) : '---'}
        </p>
        <p className="text-[9px] text-white/70 uppercase tracking-wider mt-1 truncate">
          {hasData ? `${((parcial / total) * 100).toFixed(1)}%` : '---'}
        </p>

        {/* Hover expansion: bounce-in right with full number */}
        <div className="absolute top-0 z-20 flex items-center h-full px-4 py-3 bg-gradient-to-br from-green-600 to-green-500 rounded-r-lg border border-white/10 border-l-0 shadow-2xl whitespace-nowrap left-full
          opacity-0 pointer-events-none -translate-x-[12px]
          group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0
          transition-all duration-300 ease-out [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]">
          <p className="font-mono font-bold text-white"
             style={{ fontSize: 'clamp(0.875rem, 1.8vw + 0.5rem, 1.5rem)' }}>
            {hasData ? formatCurrency(parcial) : '---'}
          </p>
        </div>
      </div>

      {/* Monto Pendiente */}
      <div className="group relative bg-gradient-to-br from-red-600 to-red-500 p-4 rounded-lg border border-white/10 shadow-lg hover:shadow-2xl hover:z-10 transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-white/90 shrink-0" />
          <p className="text-[10px] text-white/90 uppercase font-bold tracking-wider truncate">Monto Pendiente</p>
        </div>
        <p className="font-mono font-bold text-white truncate"
           style={{ fontSize: 'clamp(0.875rem, 1.8vw + 0.5rem, 1.5rem)' }}>
          {hasData ? formatCurrency(pendiente) : '---'}
        </p>
        <p className="text-[9px] text-white/70 uppercase tracking-wider mt-1 truncate">
          {hasData ? `${((pendiente / total) * 100).toFixed(1)}%` : '---'}
        </p>

        {/* Hover expansion: bounce-in LEFT with full number (last card) */}
        <div className="absolute top-0 z-20 flex items-center h-full px-4 py-3 bg-gradient-to-br from-red-600 to-red-500 rounded-l-lg border border-white/10 border-r-0 shadow-2xl whitespace-nowrap right-full
          opacity-0 pointer-events-none translate-x-[12px]
          group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0
          transition-all duration-300 ease-out [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]">
          <p className="font-mono font-bold text-white"
             style={{ fontSize: 'clamp(0.875rem, 1.8vw + 0.5rem, 1.5rem)' }}>
            {hasData ? formatCurrency(pendiente) : '---'}
          </p>
        </div>
      </div>
    </div>
  );
}
