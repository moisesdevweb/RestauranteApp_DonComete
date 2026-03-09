'use client';
import { useState } from 'react';
import { Copy } from 'lucide-react';
import { MenuDiario } from '@/modules/admin/types/admin.types';

interface HistorialMenusProps {
  historial:    MenuDiario[];
  guardando:    boolean;
  onDuplicar:   (id: number, fecha: string) => void;
  onReactivar:  (id: number) => void;
}

export function HistorialMenus({ historial, guardando, onDuplicar, onReactivar }: HistorialMenusProps) {
  const [fechaDup, setFechaDup] = useState<Record<number, string>>({});

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">🕐 Historial de Menús Anteriores</h3>

      {historial.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-6">Sin historial aún</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {historial.map(m => (
            <div key={m.id}
              className={`bg-[#2a3040] rounded-2xl p-4 border transition-all ${
                m.activo ? 'border-white/10' : 'border-red-500/10 opacity-50'
              }`}>

              {/* Info */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white/80 text-sm font-medium">
                    📅 {new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-PE', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                  </div>
                  <div className="text-orange-400 font-bold">S/. {Number(m.precio).toFixed(2)}</div>
                  <div className="text-white/30 text-xs mt-0.5">
                    Stock: {m.stock} · Vendidos: {m.vendidos}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  m.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {m.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Duplicar */}
              <div className="flex gap-2 mt-3">
                <input
                  type="date"
                  value={fechaDup[m.id] ?? ''}
                  onChange={e => setFechaDup(prev => ({ ...prev, [m.id]: e.target.value }))}
                  className="flex-1 bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-orange-500/50 cursor-pointer"
                />
                <button
                  disabled={!fechaDup[m.id] || guardando}
                  onClick={() => onDuplicar(m.id, fechaDup[m.id])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40">
                  <Copy size={12} /> Duplicar
                </button>
              </div>

              {/* Reactivar si está inactivo */}
              {!m.activo && (
                <button onClick={() => onReactivar(m.id)}
                  className="w-full mt-2 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors cursor-pointer">
                  Reactivar Menú
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
