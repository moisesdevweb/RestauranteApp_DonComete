'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Producto } from '@/types';

const NOTAS_RAPIDAS = [
  'Sin cebolla', 'Sin ají', 'Sin ensalada', 'Extra arroz',
  'Término medio', 'Bien cocido', 'Sin sal', 'Picante aparte',
];

interface ModalProductoProps {
  producto: Producto;
  onAgregar: (nota: string) => void;
  onCerrar: () => void;
}

export function ModalProducto({ producto, onAgregar, onCerrar }: ModalProductoProps) {
  const [nota, setNota] = useState('');
  const [notasSeleccionadas, setNotasSeleccionadas] = useState<string[]>([]);

  const toggleNota = (n: string) => {
    setNotasSeleccionadas(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  };

  const handleAgregar = () => {
    const notaFinal = [
      ...notasSeleccionadas,
      ...(nota.trim() ? [nota.trim()] : [])
    ].join(', ');
    onAgregar(notaFinal);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onCerrar}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#1e2433] rounded-2xl p-6 w-full max-w-md border border-white/10"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">{producto.nombre}</h3>
            <p className="text-orange-400 font-semibold">S/. {Number(producto.precio).toFixed(2)}</p>
          </div>
          <button onClick={onCerrar} className="text-white/40 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-white/50 text-sm mb-3">Notas Rápidas</p>
          <div className="flex flex-wrap gap-2">
            {NOTAS_RAPIDAS.map(n => (
              <button
                key={n}
                onClick={() => toggleNota(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  notasSeleccionadas.includes(n)
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#2a3040] text-white/60 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-white/50 text-sm mb-2">Nota Personalizada</p>
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Ej: Término medio, sin sal..."
            rows={2}
            className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-orange-500/50 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            className="flex-1 py-3 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleAgregar}
            className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Agregar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
