'use client';
import { PedidoResumen } from '@/modules/admin/types/admin.types';

const metodoBadge: Record<string, string> = {
  efectivo: 'bg-emerald-500/20 text-emerald-400',
  yape:     'bg-purple-500/20 text-purple-400',
  plin:     'bg-blue-500/20 text-blue-400',
  tarjeta:  'bg-orange-500/20 text-orange-400',
};

interface TablaOrdenesRecientesProps {
  pedidos: PedidoResumen[];
  loading: boolean;
}

export function TablaOrdenesRecientes({ pedidos, loading }: TablaOrdenesRecientesProps) {
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-white font-semibold">Órdenes del Día</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {['#Orden', 'Mesa', 'Mesero', 'Total', 'Métodos de Pago', 'Hora'].map(h => (
              <th key={h} className="text-left px-5 py-3 text-white/40 text-xs font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i}>
                <td colSpan={6} className="px-5 py-3">
                  <div className="h-4 bg-white/5 rounded animate-pulse" />
                </td>
              </tr>
            ))
          ) : pedidos.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-white/30 text-sm">
                Sin órdenes en este período
              </td>
            </tr>
          ) : pedidos.map(p => (
            <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">

              {/* # Orden */}
              <td className="px-5 py-3 text-orange-400 font-mono text-sm">#{p.id}</td>

              {/* Mesa */}
              <td className="px-5 py-3 text-white text-sm">Mesa {p.mesa}</td>

              {/* Mesero */}
              <td className="px-5 py-3 text-white/60 text-sm">{p.mesero ?? '—'}</td>

              {/* Total */}
              <td className="px-5 py-3 text-emerald-400 font-semibold text-sm">
                S/. {Number(p.total).toFixed(2)}
              </td>

              {/* Métodos de pago */}
              <td className="px-5 py-3">
                <div className="flex gap-1 flex-wrap">
                  {p.metodos.map((m, i) => (
                    <span key={i}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${metodoBadge[m.metodo] ?? 'bg-white/10 text-white/50'}`}>
                      {m.metodo} S/.{Number(m.monto).toFixed(2)}
                    </span>
                  ))}
                </div>
              </td>

              {/* Hora */}
              <td className="px-5 py-3 text-white/40 text-sm">
                {new Date(p.cerradoEn).toLocaleTimeString('es-PE', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
