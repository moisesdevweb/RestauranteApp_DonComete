'use client';
import { Edit2, Trash2, Users, Bookmark } from 'lucide-react';
import { Mesa } from '@/modules/admin/types/admin.types';

const estadoStyle: Record<string, string> = {
  libre:            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ocupada:          'bg-orange-500/20 text-orange-400 border-orange-500/30',
  cuenta_pendiente: 'bg-red-500/20 text-red-400 border-red-500/30',
  reservada:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

interface CardMesaProps {
  mesa: Mesa;
  onEditar: () => void;
  onEliminar: () => void;
  onToggleReserva?: (mesa: Mesa, nuevoEstado: string) => void;
  onReactivar?: (id: number) => void;
}

export function CardMesa({ mesa, onEditar, onEliminar, onToggleReserva, onReactivar }: CardMesaProps) {
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center">
          <span className="text-orange-400 font-bold">{mesa.numero}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${mesa.activo ? (estadoStyle[mesa.estado] ?? estadoStyle.libre) : 'bg-gray-600 text-gray-400 border-gray-500'}`}>
          {mesa.activo
            ? mesa.estado === 'libre'
              ? 'Activa'
              : mesa.estado === 'cuenta_pendiente'
                ? 'Cuenta'
                : mesa.estado
            : 'Inactiva'}
        </span>
      </div>
      <div className="text-white/40 text-xs flex items-center gap-1 mb-3">
        <Users size={12} />
        {mesa.capacidad} personas
      </div>  
      <div className="flex gap-2">
        {mesa.activo ? (
          <>
            <button onClick={onEditar}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#2a3040] text-white/60 hover:text-white text-xs transition-colors cursor-pointer">
              <Edit2 size={12} /> Editar
            </button>
            {onToggleReserva && (
              <button
                onClick={() => onToggleReserva(mesa, mesa.estado === 'reservada' ? 'libre' : 'reservada')}
                disabled={mesa.estado === 'ocupada'}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs transition-colors 
                  ${mesa.estado === 'ocupada' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Bookmark size={12} /> {mesa.estado === 'reservada' ? 'Liberar' : 'Reservar'}
              </button>
            )}
            <button onClick={onEliminar}
              disabled={mesa.estado !== 'libre'}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg 
                ${mesa.estado === 'libre' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-gray-700 text-gray-500 cursor-not-allowed'} 
                text-xs transition-colors`}
            >
              <Trash2 size={12} /> Eliminar
            </button>
          </>
        ) : (
          <button
            onClick={() => onReactivar && onReactivar(mesa.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs transition-colors cursor-pointer"
          >
            <Bookmark size={12} /> Activar
          </button>
        )}
      </div>
    </div>
  );
}
