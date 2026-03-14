'use client';
import { TrendingUp, ShoppingBag, DollarSign, Store, Clock, Star, TrendingDown, Calendar } from 'lucide-react';
import { KpisDiario, KpisSemanal, KpisMensual, KpisAnual } from '@/modules/admin/types/admin.types';
import { VistaReporte } from '@/modules/admin/hooks/useReportes';

type KpisUnion = KpisDiario | KpisSemanal | KpisMensual | KpisAnual;

interface ResumenKpisProps {
  vista:   VistaReporte;
  kpis:    KpisUnion | null;
  loading: boolean;
}

interface KpiItem {
  label: string;
  valor: string | number;
  icono: React.ElementType;
  color: string;
  bg:    string;
}

function buildKpis(vista: VistaReporte, kpis: KpisUnion | null): KpiItem[] {
  const base: KpiItem[] = [
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

  // KPI extra según vista
  if (vista === 'diario' && kpis) {
    const k = kpis as KpisDiario;
    base[2] = {
      label: 'Hora Pico',
      valor: k.horaPico ?? '—',
      icono: Clock,
      color: 'text-orange-400',
      bg:    'bg-orange-500/10',
    };
  }

  if (vista === 'semanal' && kpis) {
    const k = kpis as KpisSemanal;
    base.push(
      {
        label: 'Mejor Día',
        valor: k.mejorDia ?? '—',
        icono: Star,
        color: 'text-yellow-400',
        bg:    'bg-yellow-500/10',
      },
      {
        label: 'Día Más Flojo',
        valor: k.peorDia ?? '—',
        icono: TrendingDown,
        color: 'text-red-400',
        bg:    'bg-red-500/10',
      },
    );
  }

  if (vista === 'mensual' && kpis) {
    const k = kpis as KpisMensual;
    base.push({
      label: 'Mejor Semana',
      valor: k.mejorSemana ?? '—',
      icono: Calendar,
      color: 'text-yellow-400',
      bg:    'bg-yellow-500/10',
    });
  }

  if (vista === 'anual' && kpis) {
    const k = kpis as KpisAnual;
    base.push(
      {
        label: 'Mejor Mes',
        valor: k.mejorMes ?? '—',
        icono: Star,
        color: 'text-yellow-400',
        bg:    'bg-yellow-500/10',
      },
      {
        label: 'Crecimiento vs Año Anterior',
        valor: k.crecimiento != null ? `${k.crecimiento > 0 ? '+' : ''}${k.crecimiento}%` : '—',
        icono: k.crecimiento >= 0 ? TrendingUp : TrendingDown,
        color: k.crecimiento >= 0 ? 'text-emerald-400' : 'text-red-400',
        bg:    k.crecimiento >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      },
    );
  }

  return base;
}

export function ResumenKpis({ vista, kpis, loading }: ResumenKpisProps) {
  const items = buildKpis(vista, kpis);

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
