'use client';
import { Edit2, Trash2, Users } from 'lucide-react';
import { Mesa } from '@/modules/admin/types/admin.types';

const estadoStyle: Record<string, string> = {
  libre:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ocupada: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  cuenta:  'bg-red-500/20 text-red-400 border-red-500/30',
};

interface TablaMesasProps {
  mesas: Mesa[];
  loading: boolean;
  onEditar: (mesa: Mesa) => void;
  onEliminar: (mesa: Mesa) => void;
}

export function TablaMesas({ mesas, loading, onEditar, onEliminar }: TablaMesasProps) {
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10">
        <h2 className="text-white font-semibold">Todas las Mesas</h2>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {['Mesa', 'Piso', 'Capacidad', 'Estado', 'Acciones'].map(h => (
              <th key={h} className="text-left px-5 py-3 text-white/40 text-xs font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(4)].map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-5 py-3">
                <div className="h-4 bg-white/5 rounded animate-pulse" />
              </td></tr>
            ))
          ) : mesas.map(mesa => (
            <tr key={mesa.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-orange-400 text-xs font-bold">{mesa.numero}</span>
                  </div>
                  <span className="text-white text-sm">Mesa {mesa.numero}</span>
                </div>
              </td>
              <td className="px-5 py-3">
                <span className="text-xs bg-[#2a3040] text-white/60 px-2 py-1 rounded-lg">
                  Piso {mesa.piso}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className="text-white/60 text-sm flex items-center gap-1">
                  <Users size={12} /> {mesa.capacidad} personas
                </span>
              </td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-1 rounded-full border ${estadoStyle[mesa.estado] ?? estadoStyle.libre}`}>
                  {mesa.estado === 'libre' ? 'Activa' : mesa.estado}
                </span>
              </td>
              <td className="px-5 py-3">
                <div className="flex gap-2">
                  <button onClick={() => onEditar(mesa)}
                    className="p-1.5 rounded-lg bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onEliminar(mesa)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
