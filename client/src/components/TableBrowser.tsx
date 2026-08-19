import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ALL_IMPORT_TABLES, REPORTES_HISTORICO } from '../contracts/import.js';
import DataTable from './DataTable.js';

interface TableBrowserProps {
  isAdmin: boolean;
}

const PAGOS_TABLES = ['reportes-historico'] as const;
const EVENTUALES_TABLES = ['eventuales'] as const;
const CONVENIO_TABLES = ['conveniosMunic', 'instituciones', 'intendentes026'] as const;
const RESTO_TABLES = [
  'expedientes',
  'deudasEXPTES',
  'diputados',
  'piniHerrera',
  'gabiPedrali',
  'teresitaMadera',
  'florenciaLopez',
  'guryCaceres',
  'dirigentes',
  'romina',
  'misael',
] as const;

const SECTION_HEADER = 'text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 px-2';
const SEPARATOR = 'border-t border-white/5 my-2';

function TableButton({
  table,
  active,
  onClick,
}: {
  table: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`pl-4 w-full text-left px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg border transition-colors ${
        active
          ? 'bg-amber-500 text-[#09090b] border-amber-500 font-semibold'
          : 'bg-[#141417] text-slate-400 border-white/10 hover:border-amber-500/40 hover:text-slate-200'
      }`}
    >
      {table}
    </button>
  );
}

/**
 * Table selector over the 14 import tables + ReportesHistorico.
 * ReportesHistorico is read-only (no add button, no filters).
 */
export default function TableBrowser({ isAdmin }: TableBrowserProps) {
  const [selected, setSelected] = useState<string>(ALL_IMPORT_TABLES[0]);
  const [restoOpen, setRestoOpen] = useState(false);
  const readonly = selected === REPORTES_HISTORICO[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {/* PAGOS */}
        <p className={SECTION_HEADER}>Pagos</p>
        {PAGOS_TABLES.map((table) => (
          <TableButton
            key={table}
            table={table}
            active={selected === table}
            onClick={() => setSelected(table)}
          />
        ))}

        <div className={SEPARATOR} />

        {/* EVENTUALES */}
        <p className={SECTION_HEADER}>Eventuales</p>
        {EVENTUALES_TABLES.map((table) => (
          <TableButton
            key={table}
            table={table}
            active={selected === table}
            onClick={() => setSelected(table)}
          />
        ))}

        <div className={SEPARATOR} />

        {/* CONVENIO SECTION */}
        {CONVENIO_TABLES.map((table) => (
          <TableButton
            key={table}
            table={table}
            active={selected === table}
            onClick={() => setSelected(table)}
          />
        ))}

        <div className={SEPARATOR} />

        {/* RESTO DE TABLAS (collapsible) */}
        <button
          onClick={() => setRestoOpen(!restoOpen)}
          className="w-full flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-widest hover:text-slate-400 transition-colors"
        >
          {restoOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Resto de Tablas
        </button>
        {restoOpen &&
          RESTO_TABLES.map((table) => (
            <TableButton
              key={table}
              table={table}
              active={selected === table}
              onClick={() => setSelected(table)}
            />
          ))}
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
