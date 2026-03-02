'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Mesa } from '@/modules/admin/types/admin.types';

interface ModalMesaProps {
  mesa: Mesa | null;
  guardando: boolean;
  onGuardar: (data: { numero: number; piso: number; capacidad: number }) => void;
  onCerrar: () => void;
}

export function ModalMesa({ mesa, guardando, onGuardar, onCerrar }: ModalMesaProps) {
    const [numero,    setNumero]    = useState(() => mesa ? String(mesa.numero) : '');
    const [piso,      setPiso]      = useState(() => mesa?.piso      ?? 1);
    const [capacidad, setCapacidad] = useState(() => mesa?.capacidad ?? 4);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGuardar({ numero: Number(numero), piso, capacidad });
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
        className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">
            {mesa ? 'Editar Mesa' : 'Nueva Mesa'}
          </h3>
          <button onClick={onCerrar} className="text-white/30 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-1 block">Número de Mesa</label>
            <input
              type="number" min={1} required
              value={numero}
              onChange={e => setNumero(e.target.value)}
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50"
              placeholder="Ej: 5"
            />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">Piso</label>
            <select value={piso} onChange={e => setPiso(Number(e.target.value))}
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 cursor-pointer">
              {[1, 2, 3, 4].map(p => <option key={p} value={p}>Piso {p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">Capacidad (personas)</label>
            <input
              type="number" min={1} max={20} required
              value={capacidad}
              onChange={e => setCapacidad(Number(e.target.value))}
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50">
              {guardando ? 'Guardando...' : mesa ? 'Guardar' : 'Crear Mesa'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
