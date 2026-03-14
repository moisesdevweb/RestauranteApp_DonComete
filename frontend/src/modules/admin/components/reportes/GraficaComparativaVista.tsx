'use client';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { VistaReporte } from '@/modules/admin/hooks/useReportes';
import {
  Comparativa, ComparativaSemana, VentaAño,
} from '@/modules/admin/types/admin.types';

interface GraficaComparativaVistaProps {
  vista:               VistaReporte;
  comparativa?:        Comparativa | null;
  comparativaSemanas?: ComparativaSemana[];
  tendenciaMeses?:     Record<string, number>;
  ventasPorAño?:       VentaAño[];
  loading:             boolean;
}

// ─── Diario ──────────────────────────────────────────────────────────────────
function DiarioComparativa({ comparativa }: { comparativa: Comparativa | null }) {
  if (!comparativa) return (
    <p className="text-white/20 text-sm text-center py-8">Sin datos comparativos</p>
  );

  const filas = [
    { label: 'Hoy vs Ayer',             ...comparativa.hoyVsAyer      },
    { label: 'Esta semana vs Anterior', ...comparativa.semanaVsSemana },
    { label: 'Este mes vs Anterior',    ...comparativa.mesVsMes       },
  ];

  return (
    <div className="space-y-5">
      {filas.map(({ label, actual, anterior, variacion }) => {
        const pos    = variacion > 0;
        const neutro = variacion === 0;
        const Icon   = neutro ? Minus : pos ? TrendingUp : TrendingDown;
        const color  = neutro ? 'text-white/40' : pos ? 'text-emerald-400' : 'text-red-400';
        const bg     = neutro ? 'bg-white/5'    : pos ? 'bg-emerald-500/10' : 'bg-red-500/10';
        const maxVal = Math.max(actual, anterior, 1);
        return (
          <div key={label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">{label}</span>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${bg} ${color}`}>
                <Icon size={12} />
                {neutro ? 'Sin cambio' : `${pos ? '+' : ''}${variacion}%`}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-white/40">
                <span>Este período</span>
                <span className="text-white font-medium">S/. {actual.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(actual / maxVal) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/40">
                <span>Período anterior</span>
                <span>S/. {anterior.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white/20 rounded-full transition-all duration-500"
                  style={{ width: `${(anterior / maxVal) * 100}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────
interface TooltipPayloadItem {
  value?:   number;
}

interface TooltipCustomProps {
  active?:  boolean;
  payload?: TooltipPayloadItem[];
  label?:   string | number;
}

function TooltipSemanal({ active, payload, label }: TooltipCustomProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1520] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-white/50 text-xs mb-2">{label}</div>
      <div className="text-orange-400 text-sm font-bold">
        Este mes: S/. {Number(payload[0]?.value ?? 0).toFixed(2)}
      </div>
      <div className="text-white/40 text-sm">
        Mes ant.: S/. {Number(payload[1]?.value ?? 0).toFixed(2)}
      </div>
    </div>
  );
}

function TooltipArea({ active, payload, label }: TooltipCustomProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1520] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="text-orange-400 font-bold">
        S/. {Number(payload[0]?.value ?? 0).toFixed(2)}
      </div>
    </div>
  );
}

function TooltipAnual({ active, payload, label }: TooltipCustomProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1520] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="text-emerald-400 font-bold">
        S/. {Number(payload[0]?.value ?? 0).toFixed(2)}
      </div>
    </div>
  );
}


const TITULOS: Record<VistaReporte, string> = {
  diario:  'Comparativa de Períodos',
  semanal: 'Comparación entre Semanas',
  mensual: 'Tendencia Mensual del Año',
  anual:   'Comparación entre Años',
};

export function GraficaComparativaVista({
  vista, comparativa, comparativaSemanas,
  tendenciaMeses, ventasPorAño, loading,
}: GraficaComparativaVistaProps) {
  if (loading) return <div className="h-72 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  const renderContenido = () => {
    if (vista === 'diario') {
      return <DiarioComparativa comparativa={comparativa ?? null} />;
    }

    if (vista === 'semanal') {
      const data = comparativaSemanas ?? [];
      if (!data.length) return <p className="text-white/20 text-sm text-center py-8">Sin datos</p>;
      return (
        <>
          <div className="flex gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-orange-500" />
              <span className="text-white/50 text-xs">Este Mes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#6b7280]" />
              <span className="text-white/50 text-xs">Mes Anterior</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="semana"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `S/.${v}`} />
              <Tooltip content={<TooltipSemanal />} />
              <Bar dataKey="actual"   radius={[4, 4, 0, 0]} fill="#f97316" maxBarSize={44} />
              <Bar dataKey="anterior" radius={[4, 4, 0, 0]} fill="#6b7280" maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </>
      );
    }

    if (vista === 'mensual') {
      const data = Object.entries(tendenciaMeses ?? {}).map(([label, ventas]) => ({ label, ventas }));
      if (!data.length) return <p className="text-white/20 text-sm text-center py-8">Sin datos</p>;
      return (
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTendencia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `S/.${v}`} />
            <Tooltip content={<TooltipArea />} />
            <Area
              type="monotone" dataKey="ventas"
              stroke="#f97316" strokeWidth={2.5}
              fill="url(#gradTendencia)"
              dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#f97316' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (vista === 'anual') {
      const data = ventasPorAño ?? [];
      if (!data.length) return <p className="text-white/20 text-sm text-center py-8">Sin datos</p>;
      return (
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="año"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
              axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `S/.${v}`} />
            <Tooltip content={<TooltipAnual />} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={100}>
              {data.map((_, i) => <Cell key={i} fill="#10b981" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">{TITULOS[vista]}</h3>
      {renderContenido()}
    </div>
  );
}
