'use client';
import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { Timer } from './Timer';
import { OrdenCocina, getNombreDetalle, getNotaMenuDia } from '@/modules/cocina/types/cocina.types';

interface CardOrdenProps {
  orden: OrdenCocina;
  onClick: () => void;
}

export function CardOrden({ orden, onClick }: CardOrdenProps) {
  // Solo mostramos items que cocina aún debe preparar
  const itemsPendientes = orden.comensales.flatMap(c =>
    c.detalles
      .filter(d => d.estado === 'pendiente')
      .map(d => ({
        ...d,
        // Helper centralizado: distingue carta vs menú del día
        // Para menú del día muestra "Entrada + Fondo" en lugar de "Menú del Día"
        nombreLegible: getNombreDetalle(d),
        comensal: c.numero,
      }))
  );

  // Usamos updatedAt como referencia del último envío a cocina
  const tiempoRef = orden.updatedAt || orden.creadoEn || new Date().toISOString();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-[#1a1f2e] border border-red-500/30 hover:border-red-500/60 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10"
    >
      {/* ── Header: mesa + timer ──────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center">
            <span className="text-red-400 font-bold text-sm">{orden.mesa.numero}</span>
          </div>
          <div>
            <div className="text-white font-bold">Mesa {orden.mesa.numero}</div>
            <div className="text-white/40 text-xs">
              {orden.comensales.length} comensal{orden.comensales.length !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
        <Timer desde={tiempoRef} />
      </div>

      {/* ── Items pendientes ──────────────────────────────────── */}
      <div className="space-y-2">
        {itemsPendientes.map(item => (
          <div key={item.id} className="flex items-start gap-2 bg-[#2a3040] rounded-xl px-3 py-2">
            <span className="text-orange-400 font-bold text-sm w-5 flex-shrink-0">
              {item.cantidad}x
            </span>
            <div className="flex-1 min-w-0">
              {/* Nombre del plato — para menú del día muestra "Caldo + Lomo Saltado" */}
              <div className="text-white text-sm font-medium">
                {item.nombreLegible}
              </div>
              {/* Badge menú del día para diferenciar visualmente de carta */}
              {item.tipo === 'menu_dia' && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                  Menú del día
                </span>
              )}
              {/* Notas extra del comensal (sin cebolla, término medio, etc.) */}
              {item.nota && item.tipo === 'carta' && (
                <div className="text-orange-400/70 text-xs mt-0.5">📝 {item.nota}</div>
              )}
              {/* Nota adicional del comensal para menú del día (ej: "Sin ensalada") */}
              {item.tipo === 'menu_dia' && getNotaMenuDia(item) && (
                <div className="text-orange-400/70 text-xs mt-0.5">📝 {getNotaMenuDia(item)}</div>
              )}
              <div className="text-white/30 text-xs mt-0.5">C{item.comensal}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-white/30 text-xs">
          {itemsPendientes.length} item{itemsPendientes.length !== 1 ? 's' : ''}
        </span>
        <span className="text-red-400/70 text-xs font-medium flex items-center gap-1">
          <ChefHat size={12} />
          Toca para marcar listo
        </span>
      </div>
    </motion.div>
  );
}