'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, LogOut, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getMesas } from '@/modules/mesero/services/mesa.service';
import { useSocket } from '@/hooks/useSocket';
import { Mesa } from '@/types';

const estadoConfig = {
  libre:            { color: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500',  texto: 'LIBRE',             subtext: 'Toca para tomar pedido' },
  ocupada:          { color: 'bg-orange-600 hover:bg-orange-500 border-orange-500',     texto: 'OCUPADA',           subtext: 'Pedido activo' },
  cuenta_pendiente: { color: 'bg-red-700 hover:bg-red-600 border-red-600',              texto: 'CUENTA PENDIENTE',  subtext: 'Pendiente de pago' },
};

function Reloj() {
  const [hora, setHora] = useState('');
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();
      setHora(ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }));
      setFecha(ahora.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }));
    };
    actualizar();
    const interval = setInterval(actualizar, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-right">
      <div className="text-orange-400 font-bold text-xl leading-none">{hora}</div>
      <div className="text-white/40 text-xs capitalize">{fecha}</div>
    </div>
  );
}

export default function MeseroPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pisoActivo, setPisoActivo] = useState(1);
  const [loading, setLoading] = useState(true);

  const cargarMesas = useCallback(async () => {
    try {
      const data = await getMesas();
      setMesas(data);
    } catch {
      console.error('Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarMesas(); }, [cargarMesas]);

  // Socket.io — actualizar mesa en tiempo real
  useSocket({
    'mesa:estado': (mesaActualizada: unknown) => {
      const mesa = mesaActualizada as Mesa;
      setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, estado: mesa.estado } : m));
    },
  });

  const mesasFiltradas = mesas.filter(m => m.piso === pisoActivo);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleMesa = (mesa: Mesa) => {
    router.push(`/mesero/mesa/${mesa.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">

      {/* Header */}
      <header className="bg-[#1a1f2e] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white leading-none">Mapa de Mesas</div>
            <div className="text-white/40 text-xs">Mesero: {user?.nombre}</div>
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

      {/* Tabs piso */}
      <div className="px-4 pt-4 flex gap-2">
        {[1, 2].map(piso => (
          <button
            key={piso}
            onClick={() => setPisoActivo(piso)}
            className={`
              px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
              ${pisoActivo === piso
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-[#1a1f2e] text-white/50 hover:text-white/80 border border-white/10'
              }
            `}
          >
            Piso {piso}
          </button>
        ))}
      </div>

      {/* Grid de mesas */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-[#1a1f2e] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : mesasFiltradas.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-white/30">
            No hay mesas en este piso
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={pisoActivo}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {mesasFiltradas.map((mesa, i) => {
                const config = estadoConfig[mesa.estado];
                return (
                  <motion.button
                    key={mesa.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleMesa(mesa)}
                    className={`
                      ${config.color} border rounded-2xl p-5 text-left
                      transition-all duration-200 cursor-pointer
                      active:scale-95
                    `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <UtensilsCrossed size={16} className="text-white" />
                      </div>
                      <span className="text-white/60 text-xs font-medium">{config.texto}</span>
                    </div>
                    <div className="text-white font-bold text-xl">Mesa {mesa.numero}</div>
                    <div className="text-white/70 text-sm mt-1">{config.subtext}</div>
                    <div className="text-white/40 text-xs mt-2">{mesa.capacidad} personas</div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Leyenda */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e] border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-center gap-6 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            Libre · Mesa disponible
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
            Ocupada · Pedido activo
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full" />
            Cuenta · Pendiente de pago
          </div>
        </div>
      </div>
    </div>
  );
}