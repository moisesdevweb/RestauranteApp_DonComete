'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  abierto: boolean;
  titulo: string;
  descripcion?: string;
  labelConfirmar?: string;
  cargando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}

export function ConfirmModal({
  abierto, titulo, descripcion,
  labelConfirmar = 'Eliminar',
  cargando = false,
  onConfirmar, onCerrar,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {abierto && (
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
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">{titulo}</h3>
                  {descripcion && (
                    <p className="text-white/40 text-sm mt-0.5">{descripcion}</p>
                  )}
                </div>
              </div>
              <button onClick={onCerrar} className="text-white/30 hover:text-white cursor-pointer ml-2">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={onCerrar}
                className="flex-1 py-2.5 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
                Cancelar
              </button>
              <button onClick={onConfirmar} disabled={cargando}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50">
                {cargando ? 'Eliminando...' : labelConfirmar}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
