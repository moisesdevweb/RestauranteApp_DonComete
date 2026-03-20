'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Package, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface ProductoStock {
  id:         number;
  nombre:     string;
  stock:      number;
  stockMinimo:number;
  agotado:    boolean;
  categoria?: { nombre: string };
  imagenUrl?: string;
}

export function ModalStockBajo() {
  const router = useRouter();
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [visible,   setVisible]   = useState(false);
  const [checkeado, setCheckeado] = useState(false);

  const verificar = useCallback(async () => {
    try {
      const res = await api.get('/productos?stockBajo=true&todos=true');
      const bajos: ProductoStock[] = res.data.data;
      if (bajos.length > 0) { setProductos(bajos); setVisible(true); }
    } catch { /* silencioso */ }
    finally { setCheckeado(true); }
  }, []);

  useEffect(() => { if (!checkeado) verificar(); }, [checkeado, verificar]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{    scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#1a1f2e] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-yellow-500/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={22} className="text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl leading-tight">Alerta de Inventario</h2>
                  <p className="text-white/30 text-xs font-medium tracking-wider uppercase">Don Camote</p>
                </div>
              </div>
              <button onClick={() => setVisible(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Subtítulo */}
            <div className="px-6 py-3">
              <p className="text-white/50 text-sm">
                Se han detectado{' '}
                <span className="text-yellow-400 font-bold">
                  {productos.length} producto{productos.length !== 1 ? 's' : ''}
                </span>
                {' '}con poco o sin stock.
              </p>
            </div>

            {/* Lista */}
            <div className="px-4 pb-2 max-h-72 overflow-y-auto space-y-2">
              {productos.map(p => (
                <div key={p.id}
                  className={`bg-[#2a3040] rounded-2xl px-4 py-3 flex items-center gap-3 border ${
                    p.agotado ? 'border-red-500/20' : 'border-yellow-500/15'
                  }`}>
                  <div className="w-10 h-10 bg-[#1a1f2e] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.imagenUrl
                      ? <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover" />
                      : <Package size={18} className="text-white/30" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{p.nombre}</div>
                    {p.categoria && (
                      <div className="text-white/30 text-xs uppercase tracking-wider">{p.categoria.nombre}</div>
                    )}
                  </div>
                  <div className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-right border ${
                    p.agotado
                      ? 'bg-red-500/15 border-red-500/30'
                      : 'bg-yellow-500/15 border-yellow-500/30'
                  }`}>
                    <div className={`text-xs font-semibold ${p.agotado ? 'text-red-400' : 'text-yellow-400'}`}>
                      {p.agotado ? 'AGOTADO' : 'STOCK'}
                    </div>
                    {!p.agotado && (
                      <div className="text-yellow-300 font-bold text-sm leading-none">{p.stock} und.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botones */}
            <div className="px-4 py-4 flex gap-3">
              <button onClick={() => setVisible(false)}
                className="flex-1 py-3 rounded-2xl bg-[#2a3040] text-white/60 hover:text-white font-semibold text-sm transition-all cursor-pointer border border-white/10">
                Cerrar Aviso
              </button>
              <button onClick={() => { setVisible(false); router.push('/admin/menu'); }}
                className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                GESTIONAR INVENTARIO
                <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}