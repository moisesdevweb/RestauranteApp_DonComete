'use client';
import { TrendingUp, ShoppingBag, DollarSign, Store } from 'lucide-react';
import { KpisReporte } from '@/modules/admin/types/admin.types';

interface ResumenKpisProps {
  kpis: KpisReporte | null;
  loading: boolean;
}

export function ResumenKpis({ kpis, loading }: ResumenKpisProps) {
  const items = [
    {
      label: 'Ventas Totales',
      valor: kpis ? `S/. ${Number(kpis.totalVentas).toFixed(2)}` : '—',
      icono: DollarSign,
      color: 'text-emerald-400',
      bg:    'bg-emerald-500/10',
    },
    {
      label: 'Mesas Atendidas',
      valor: kpis?.totalMesas ?? '—',
      icono: Store,
      color: 'text-blue-400',
      bg:    'bg-blue-500/10',
    },
    {
      label: 'Ticket Promedio',
      valor: kpis ? `S/. ${Number(kpis.ticketPromedio).toFixed(2)}` : '—',
      icono: TrendingUp,
      color: 'text-orange-400',
      bg:    'bg-orange-500/10',
    },
    {
      label: 'Órdenes Pagadas',
      valor: kpis?.ordenesPagadas ?? '—',
      icono: ShoppingBag,
      color: 'text-purple-400',
      bg:    'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(k => {
        const Icon = k.icono;
        return (
          <div key={k.label} className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
            {loading ? (
              <div className="space-y-3">
                <div className="h-8 w-8 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-6 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} className={k.color} />
                </div>
                <div className={`text-2xl font-bold ${k.color}`}>{k.valor}</div>
                <div className="text-white/40 text-sm mt-1">{k.label}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
