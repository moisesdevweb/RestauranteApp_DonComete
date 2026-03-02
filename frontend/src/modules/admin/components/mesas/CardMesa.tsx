'use client';
import { Edit2, Trash2, Users } from 'lucide-react';
import { Mesa } from '@/modules/admin/types/admin.types';

const estadoStyle: Record<string, string> = {
  libre:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ocupada: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  cuenta:  'bg-red-500/20 text-red-400 border-red-500/30',
};

interface CardMesaProps {
  mesa: Mesa;
  onEditar: () => void;
  onEliminar: () => void;
}

export function CardMesa({ mesa, onEditar, onEliminar }: CardMesaProps) {
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center">
          <span className="text-orange-400 font-bold">{mesa.numero}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${estadoStyle[mesa.estado] ?? estadoStyle.libre}`}>
          {mesa.estado === 'libre' ? 'Activa' : mesa.estado}
        </span>
      </div>
      <div className="text-white/40 text-xs flex items-center gap-1 mb-3">
        <Users size={12} />
        {mesa.capacidad} personas
      </div>
      <div className="flex gap-2">
        <button onClick={onEditar}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#2a3040] text-white/60 hover:text-white text-xs transition-colors cursor-pointer">
          <Edit2 size={12} /> Editar
        </button>
        <button onClick={onEliminar}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors cursor-pointer">
          <Trash2 size={12} /> Eliminar
        </button>
      </div>
    </div>
  );
}
