'use client';
import { Plus, Minus } from 'lucide-react';
import { Comensal } from '@/types';
import { ItemCarrito } from '@/modules/mesero/store/pedido.store';

interface ComensalesBarProps {
  comensales: Comensal[];
  comensalActivo: number;
  numComensales: number;
  ordenCreada: boolean;
  capacidadMesa: number;
  itemsPorComensal: (comensalId: number) => ItemCarrito[];
  onCambiarComensal: (index: number) => void;
  onAumentarComensales: () => void;
  onDisminuirComensales: () => void;
}

export function ComensalesBar({
  comensales,
  comensalActivo,
  numComensales,
  ordenCreada,
  capacidadMesa,
  itemsPorComensal,
  onCambiarComensal,
  onAumentarComensales,
  onDisminuirComensales,
}: ComensalesBarProps) {
  return (
    <div className="bg-[#161b27] border-b border-white/10 px-4 py-3 flex items-center gap-4 flex-wrap">

      {/* Contador comensales */}
      <div className="flex items-center gap-2 text-sm text-white/60">
        <span>Comensales:</span>
        {!ordenCreada && (
          <div className="flex items-center gap-2">
            <button
              onClick={onDisminuirComensales}
              className="w-7 h-7 bg-[#2a3040] rounded-lg flex items-center justify-center hover:bg-[#3a4050] cursor-pointer transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="text-white font-bold w-4 text-center">{numComensales}</span>
            <button
              onClick={onAumentarComensales}
              className="w-7 h-7 bg-[#2a3040] rounded-lg flex items-center justify-center hover:bg-[#3a4050] cursor-pointer transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      <span className="text-white/30 text-sm">Pedido para:</span>

      {/* Botones por comensal */}
      <div className="flex items-center gap-2">
        {comensales.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onCambiarComensal(i)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer relative ${
              comensalActivo === i
                ? 'bg-orange-500 text-white scale-110 shadow-lg shadow-orange-500/40'
                : 'bg-[#2a3040] text-white/60 hover:bg-[#3a4050]'
            }`}
          >
            {i + 1}
            {itemsPorComensal(c.id).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-xs flex items-center justify-center">
                {itemsPorComensal(c.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Comensal activo label */}
      {comensales[comensalActivo] && (
        <span className="text-orange-400 text-sm font-medium">
          Comensal {comensalActivo + 1}
        </span>
      )}
    </div>
  );
}
