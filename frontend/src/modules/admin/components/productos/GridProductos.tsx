'use client';
import { Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Producto } from '@/modules/admin/types/admin.types';

interface GridProductosProps {
  productos: Producto[];
  loading: boolean;
  onEditar: (p: Producto) => void;
  onEliminar: (p: Producto) => void;
  onToggleAgotado: (id: number) => void;
}

export function GridProductos({ productos, loading, onEditar, onEliminar, onToggleAgotado }: GridProductosProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-64 bg-[#1a1f2e] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {productos.map(p => (
        <div key={p.id} className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors group">

          {/* Imagen */}
          <div className="relative h-36 bg-[#2a3040]">
            {p.imagenUrl ? (
              <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {!p.disponible && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">Inactivo</span>
              )}
              {p.agotado && (
                <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-medium">Agotado</span>
              )}
              {p.disponible && !p.agotado && (
                <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium">Activo</span>
              )}
            </div>

            <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              S/. {Number(p.precio).toFixed(2)}
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <div className="text-white font-medium text-sm truncate">{p.nombre}</div>
            {p.categoria && (
              <div className="text-white/30 text-xs mt-0.5 truncate">{p.categoria.nombre}</div>
            )}
          </div>

          {/* Acciones */}
          <div className="px-3 pb-3 grid grid-cols-3 gap-1.5">
            <button onClick={() => onEditar(p)}
              className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#2a3040] text-white/60 hover:text-white text-xs transition-colors cursor-pointer">
              <Edit2 size={11} /> Editar
            </button>
            <button onClick={() => onToggleAgotado(p.id)}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                p.agotado
                  ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25'
              }`}>
              {p.agotado ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
              {p.agotado ? 'Stock' : 'Agotado'}
            </button>
            <button onClick={() => onEliminar(p)}
              className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors cursor-pointer">
              <Trash2 size={11} /> Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
