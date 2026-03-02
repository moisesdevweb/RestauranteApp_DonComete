'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import { ProductoTop } from '@/modules/admin/types/admin.types';

const COLORES = ['#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5'];

interface TooltipProductosProps {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string | number;
}

function TooltipCustom({ active, payload, label }: TooltipProductosProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="text-orange-400 font-bold">
        {Number(payload[0]?.value ?? 0)} vendidos
      </div>
      <div className="text-white/40 text-xs">
        S/. {Number(payload[1]?.value ?? 0).toFixed(2)}
      </div>
    </div>
  );
}

interface GraficaProductosProps {
  data: ProductoTop[];
  loading: boolean;
}

export function GraficaProductos({ data, loading }: GraficaProductosProps) {
  if (loading) {
    return <div className="h-64 bg-[#1a1f2e] rounded-2xl animate-pulse" />;
  }

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Top 5 Productos Más Vendidos</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="nombre" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
            axisLine={false} tickLine={false} />
          <Tooltip content={<TooltipCustom />} />
          <Bar dataKey="cantidad" radius={[6,6,0,0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
          </Bar>
          <Bar dataKey="ingresos" hide />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
