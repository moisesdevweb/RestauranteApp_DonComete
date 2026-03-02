'use client';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import { Categoria } from '@/modules/admin/types/admin.types';

interface ListaCategoriasProps {
  categorias: Categoria[];
  loading: boolean;
  onEditar: (cat: Categoria) => void;
  onEliminar: (cat: Categoria) => void;
}

export function ListaCategorias({ categorias, loading, onEditar, onEliminar }: ListaCategoriasProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-[#1a1f2e] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categorias.map(cat => (
        <div key={cat.id}
          className="bg-[#1a1f2e] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-4 hover:border-white/20 transition-colors group"
        >
          {/* Drag handle */}
          <GripVertical size={16} className="text-white/20 group-hover:text-white/40 flex-shrink-0 cursor-grab" />

          {/* Ícono */}
          <div className="w-10 h-10 bg-orange-500/15 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            {cat.icono || '🍽️'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{cat.nombre}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                cat.activo
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}>
                {cat.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {cat.descripcion && (
              <div className="text-white/30 text-xs mt-0.5 truncate">{cat.descripcion}</div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onEditar(cat)}
              className="p-2 rounded-xl bg-[#2a3040] text-white/50 hover:text-white transition-colors cursor-pointer">
              <Edit2 size={15} />
            </button>
            <button onClick={() => onEliminar(cat)}
              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
