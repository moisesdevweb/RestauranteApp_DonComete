'use client';
import { Edit2, EyeOff, Eye, Trash2 } from 'lucide-react';
import { MenuDiario, TipoItem } from '@/modules/admin/types/admin.types';

const seccionConfig: { tipo: TipoItem; label: string; emoji: string; color: string }[] = [
  { tipo: 'entrada', label: 'ENTRADAS',       emoji: '🤌', color: 'text-emerald-400' },
  { tipo: 'fondo',   label: 'PLATOS DE FONDO', emoji: '🍽️', color: 'text-orange-400'  },
  { tipo: 'postre',  label: 'POSTRES',         emoji: '🍮', color: 'text-pink-400'    },
  { tipo: 'bebida',  label: 'BEBIDAS',         emoji: '🥤', color: 'text-blue-400'    },
];

const puntoColor: Record<TipoItem, string> = {
  entrada: 'bg-emerald-400',
  fondo:   'bg-orange-400',
  postre:  'bg-pink-400',
  bebida:  'bg-blue-400',
};

interface CardMenuHoyProps {
  menu:          MenuDiario;
  onEditar:      () => void;
  onDesactivar:  () => void;
  onReactivar:   () => void;
  onEliminar:    () => void;
}

export function CardMenuHoy({ menu, onEditar, onDesactivar, onReactivar, onEliminar }: CardMenuHoyProps) {
  const disponibles = menu.stock - menu.vendidos;

  return (
    <div className={`bg-[#1a1f2e] border rounded-2xl p-6 transition-all ${
      menu.activo ? 'border-white/10' : 'border-red-500/20 opacity-60'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold text-lg">
              Menú del {new Date(menu.fecha + 'T12:00:00').toLocaleDateString('es-PE', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              menu.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {menu.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-orange-400 font-bold text-2xl">S/. {Number(menu.precio).toFixed(2)}</span>
            <span className="text-white/50 text-sm">
              📋 {disponibles} / {menu.stock} disponibles
            </span>
            <span className="text-white/40 text-sm">🍽 {menu.vendidos} vendidos</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button onClick={onEditar}
            className="p-2 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer" title="Editar">
            <Edit2 size={15} />
          </button>
          {menu.activo ? (
            <button onClick={onDesactivar}
              className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors cursor-pointer" title="Desactivar">
              <EyeOff size={15} />
            </button>
          ) : (
            <button onClick={onReactivar}
              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer" title="Reactivar">
              <Eye size={15} />
            </button>
          )}
          <button onClick={onEliminar}
            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer" title="Eliminar">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Items por sección */}
      <div className="grid grid-cols-4 gap-3">
        {seccionConfig.map(sec => {
          const itemsSec = menu.items.filter(i => i.tipo === sec.tipo);
          if (!itemsSec.length) return null;
          return (
            <div key={sec.tipo} className="bg-[#2a3040] rounded-xl p-3">
              <div className={`text-xs font-bold mb-2 flex items-center gap-1 ${sec.color}`}>
                <span>{sec.emoji}</span> {sec.label}
              </div>
              <ul className="space-y-1">
                {itemsSec.map(item => (
                  <li key={item.id} className="flex items-center gap-1.5 text-white/70 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${puntoColor[sec.tipo]}`} />
                    {item.nombre}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
