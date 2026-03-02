'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { UtensilsCrossed, LogOut, CheckCircle2, ChefHat } from 'lucide-react';
import { useCocina } from '@/modules/cocina/hooks/useCocina';
import { Reloj } from '@/modules/cocina/components/Reloj';
import { CardOrden } from '@/modules/cocina/components/CardOrden';
import { ModalListo } from '@/modules/cocina/components/ModalListo';

export default function CocinaPage() {
  const {
    ordenesNuevas, ordenesListas,
    ordenSeleccionada, setOrdenSeleccionada,
    marcando, loading,
    handleMarcarListo, handleLogout,
  } = useCocina();

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col">

      {/* Header */}
      <header className="bg-[#0f1520] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white leading-none">Pantalla de Cocina</div>
            <div className="text-white/40 text-xs">Gestión de Pedidos en Tiempo Real</div>
          </div>
        </div>

        <Reloj />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          Salir
        </button>
      </header>

      {/* Kanban */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">

        {/* Columna NUEVOS */}
        <div className="flex flex-col">
          <div className="bg-red-900/40 border border-red-700/50 rounded-2xl px-4 py-3 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={16} className="text-red-400" />
              <span className="text-red-300 font-bold tracking-wide">NUEVOS</span>
            </div>
            <span className="bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {ordenesNuevas.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {loading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="h-40 bg-[#1a1f2e] rounded-2xl animate-pulse" />
              ))
            ) : ordenesNuevas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-white/20">
                <ChefHat size={40} className="mb-2" />
                <p className="text-sm">Sin pedidos nuevos</p>
              </div>
            ) : (
              <AnimatePresence>
                {ordenesNuevas.map(orden => (
                  <CardOrden
                    key={orden.id}
                    orden={orden}
                    onClick={() => setOrdenSeleccionada(orden)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Columna LISTOS */}
        <div className="flex flex-col">
          <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-2xl px-4 py-3 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-emerald-300 font-bold tracking-wide">LISTOS</span>
            </div>
            <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {ordenesListas.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {ordenesListas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-white/20">
                <CheckCircle2 size={40} className="mb-2" />
                <p className="text-sm">Sin pedidos listos</p>
              </div>
            ) : (
              <AnimatePresence>
                {ordenesListas.map(orden => (
                  <motion.div
                    key={orden.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1f2e] border border-emerald-500/20 rounded-2xl p-4 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-white font-bold">Mesa {orden.mesa.numero}</span>
                      </div>
                      <span className="text-emerald-400 text-xs font-medium">Completado</span>
                    </div>
                    <div className="text-white/30 text-xs mt-1">
                      {orden.comensales.flatMap(c => c.detalles).length} items entregados
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {ordenSeleccionada && (
          <ModalListo
            orden={ordenSeleccionada}
            onConfirmar={handleMarcarListo}
            onCerrar={() => setOrdenSeleccionada(null)}
            loading={marcando}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
