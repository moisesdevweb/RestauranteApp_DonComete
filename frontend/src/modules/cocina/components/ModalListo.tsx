'use client';
import { motion } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { OrdenCocina } from '@/modules/cocina/types/cocina.types';

interface ModalListoProps {
  orden: OrdenCocina;
  onConfirmar: () => void;
  onCerrar: () => void;
  loading: boolean;
}

export function ModalListo({ orden, onConfirmar, onCerrar, loading }: ModalListoProps) {
  const itemsPendientes = orden.comensales.flatMap(c =>
    c.detalles
      .filter(d => d.estado === 'pendiente')
      .map(d => ({
        ...d,
        nombreProducto: d.producto?.nombre || d.nombre || 'Menú del Día',
        comensal: c.numero,
      }))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onCerrar}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#1e2433] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-bold text-lg">Mesa {orden.mesa.numero}</h3>
            <p className="text-white/40 text-sm">¿Marcar todo como listo?</p>
          </div>
          <button onClick={onCerrar} className="text-white/30 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Lista items pendientes */}
        <div className="bg-[#2a3040] rounded-xl p-4 mb-5 space-y-2 max-h-48 overflow-y-auto">
          {itemsPendientes.map(item => (
            <div key={item.id} className="flex items-start gap-2">
              <div className="w-5 h-5 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-400 text-xs">{item.cantidad}</span>
              </div>
              <div>
                <div className="text-white text-sm">{item.nombreProducto}</div>
                {item.nota && (
                  <div className="text-orange-400/70 text-xs">📝 {item.nota}</div>
                )}
                <div className="text-white/30 text-xs">Comensal {item.comensal}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            className="flex-1 py-3 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={18} />
                ¡Listo!
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
