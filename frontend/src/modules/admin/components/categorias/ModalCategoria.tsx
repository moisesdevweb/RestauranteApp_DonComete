'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChefHat, Zap } from 'lucide-react';
import { Categoria } from '@/modules/admin/types/admin.types';

const ICONOS = ['🍽️', '🍕', '🍔', '🥗', '🍜', '🍣', '🥩', '🍗', '🥘', '🍲', '🥤', '🍺', '☕', '🧃', '🍰', '🍨'];

interface ModalCategoriaProps {
  categoria: Categoria | null;
  guardando: boolean;
  onGuardar: (data: { nombre: string; descripcion?: string; icono?: string; requiereCocina: boolean }) => void;
  onCerrar: () => void;
}

export function ModalCategoria({ categoria, guardando, onGuardar, onCerrar }: ModalCategoriaProps) {
  const [nombre,      setNombre]      = useState(() => categoria?.nombre      ?? '');
  const [descripcion, setDescripcion] = useState(() => categoria?.descripcion ?? '');
  const [icono,         setIcono]         = useState(() => categoria?.icono           ?? '🍽️');
  const [requiereCocina, setRequiereCocina] = useState(() => categoria?.requiereCocina ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar({ nombre, descripcion, icono, requiereCocina });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onCerrar}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <button onClick={onCerrar} className="text-white/30 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-1 block">Nombre de la Categoría</label>
            <input
              type="text" required
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Bebidas Frías"
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1 block">Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Breve descripción de la categoría"
              rows={3}
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20 resize-none"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Selecciona un Ícono</label>
            <div className="grid grid-cols-8 gap-2">
              {ICONOS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcono(emoji)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                    icono === emoji
                      ? 'bg-orange-500 scale-110 shadow-lg shadow-orange-500/30'
                      : 'bg-[#2a3040] hover:bg-[#3a4050]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* ── ¿Requiere cocina? ───────────────────────────────────────── */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">¿Dónde se prepara?</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button"
                onClick={() => setRequiereCocina(true)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                  requiereCocina
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                    : 'bg-[#2a3040] text-white/40 border-transparent hover:text-white/70'
                }`}>
                <ChefHat size={15} /> Va a cocina
              </button>
              <button type="button"
                onClick={() => setRequiereCocina(false)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                  !requiereCocina
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-[#2a3040] text-white/40 border-transparent hover:text-white/70'
                }`}>
                <Zap size={15} /> Servicio directo
              </button>
            </div>
            <p className="text-white/25 text-xs mt-1.5">
              {requiereCocina
                ? 'Los productos de esta categoría se envían a cocina (ej: platos, café)'
                : 'El mesero los sirve directamente sin pasar por cocina (ej: gaseosas, agua)'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50">
              {guardando ? 'Guardando...' : categoria ? 'Guardar' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}