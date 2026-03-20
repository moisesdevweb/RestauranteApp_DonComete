'use client';
import { useEffect, useState, useCallback } from 'react';
import { Package, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';

interface ProductoStock {
  id:          number;
  nombre:      string;
  stock:       number;
  stockMinimo: number;
  agotado:     boolean;
  categoria?:  { nombre: string };
}

export function StockBajoWidget() {
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [loading,   setLoading]   = useState(true);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/productos?stockBajo=true&todos=true');
      setProductos(res.data.data);
    } catch {
      console.error('Error al cargar stock bajo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <div className="h-40 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  if (productos.length === 0) return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Package size={16} className="text-emerald-400" />
        <h3 className="text-white font-semibold">Stock</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-6 text-white/20">
        <Package size={32} className="mb-2 text-emerald-400/50" />
        <p className="text-sm">Todo el stock está bien</p>
      </div>
    </div>
  );

  return (
    <div className="bg-[#1a1f2e] border border-yellow-500/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-yellow-400" />
          <h3 className="text-white font-semibold">Stock Bajo</h3>
          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-bold">
            {productos.length}
          </span>
        </div>
        <button onClick={cargar} className="text-white/20 hover:text-white/50 cursor-pointer transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {productos.map(p => (
          <div key={p.id}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${
              p.agotado
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-yellow-500/10 border border-yellow-500/20'
            }`}>
            <div className="flex items-center gap-2 min-w-0">
              <Package size={14} className={p.agotado ? 'text-red-400 flex-shrink-0' : 'text-yellow-400 flex-shrink-0'} />
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">{p.nombre}</div>
                {p.categoria && (
                  <div className="text-white/30 text-xs">{p.categoria.nombre}</div>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              {p.agotado ? (
                <span className="text-red-400 text-xs font-bold">AGOTADO</span>
              ) : (
                <div>
                  <div className={`text-sm font-bold ${p.stock <= p.stockMinimo ? 'text-yellow-400' : 'text-white'}`}>
                    {p.stock} uds
                  </div>
                  <div className="text-white/20 text-xs">mín: {p.stockMinimo}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}