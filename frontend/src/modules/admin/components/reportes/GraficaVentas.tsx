'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// El backend devuelve Record<string, number> → lo convertimos a array
interface PuntoVenta {
  label: string;
  ventas: number;
  mesas: number;
}

interface GraficaVentasProps {
  ventasPorDia:  Record<string, number>;
  mesasPorDia?:  Record<string, number>;
  loading: boolean;
}

interface TooltipVentasProps {
  active?:  boolean;
  payload?: Array<{ value?: number | string }>;
  label?:   string | number;
}

function TooltipCustom({ active, payload, label }: TooltipVentasProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="text-orange-400 font-bold text-base">
        S/. {Number(payload[0]?.value ?? 0).toFixed(2)}
      </div>
      <div className="text-white/40 text-xs">
        {Number(payload[1]?.value ?? 0)} mesas
      </div>
    </div>
  );
}

export function GraficaVentas({ ventasPorDia, mesasPorDia = {}, loading }: GraficaVentasProps) {
  if (loading) {
    return <div className="h-64 bg-[#1a1f2e] rounded-2xl animate-pulse" />;
  }

  // Convertir Record → array para Recharts
  const data: PuntoVenta[] = Object.entries(ventasPorDia).map(([label, ventas]) => ({
    label,
    ventas,
    mesas: mesasPorDia[label] ?? 0,
  }));

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Ventas por Día</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="gradMesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
            axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
            axisLine={false} tickLine={false} tickFormatter={v => `S/.${v}`} />
          <Tooltip content={<TooltipCustom />} />
          <Area type="monotone" dataKey="ventas" stroke="#f97316"
            strokeWidth={2} fill="url(#gradVentas)" />
          <Area type="monotone" dataKey="mesas"  stroke="#6366f1"
            strokeWidth={2} fill="url(#gradMesas)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
