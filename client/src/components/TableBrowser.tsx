import { useState } from 'react';
import { ALL_IMPORT_TABLES, REPORTES_HISTORICO } from '../contracts/import.js';
import DataTable from './DataTable.js';

interface TableBrowserProps {
  isAdmin: boolean;
}

/**
 * Table selector over the 14 import tables + ReportesHistorico.
 * ReportesHistorico is read-only (no add button, no filters).
 */
export default function TableBrowser({ isAdmin }: TableBrowserProps) {
  const [selected, setSelected] = useState<string>(ALL_IMPORT_TABLES[0]);
  const readonly = selected === REPORTES_HISTORICO[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {ALL_IMPORT_TABLES.map((table) => {
          const active = selected === table;
          return (
            <button
              key={table}
              onClick={() => setSelected(table)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg border transition-colors ${
                active
                  ? 'bg-amber-500 text-[#09090b] border-amber-500 font-semibold'
                  : 'bg-[#141417] text-slate-400 border-white/10 hover:border-amber-500/40 hover:text-slate-200'
              }`}
            >
              {table}
            </button>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {readonly ? 'Registro histórico de importaciones' : `Tabla: ${selected}`}
          </p>
          {readonly && (
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border border-white/10 rounded-full px-2 py-0.5">
              Solo lectura
            </span>
          )}
        </div>
        <DataTable tableName={selected} isAdmin={isAdmin} readonly={readonly} />
      </div>
    </div>
  );
}
