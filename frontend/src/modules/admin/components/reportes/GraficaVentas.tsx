'use client';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { VistaReporte } from '@/modules/admin/hooks/useReportes';

interface PuntoVenta { label: string; ventas: number; mesas: number; }

interface GraficaVentasProps {
  vista:            VistaReporte;
  ventasPorDia:     Record<string | number, number>;
  mesasPorDia?:     Record<string | number, number>;
  ventasPorSemana?: Record<string, number>;
  desde?:           string;
  loading:          boolean;
}

interface TooltipPayload {
  value?:   number;
  payload?: { mesas?: number };
}

interface TooltipCustomProps {
  active?:  boolean;
  payload?: TooltipPayload[];
  label?:   string | number;
}

function TooltipDefault({ active, payload, label }: TooltipCustomProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1520] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="text-orange-400 font-bold text-base">
        S/. {Number(payload[0]?.value ?? 0).toFixed(2)}
      </div>
    </div>
  );
}

function TooltipSemanal({ active, payload, label }: TooltipCustomProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1520] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="text-emerald-400 font-bold text-base">
        S/. {Number(payload[0]?.value ?? 0).toFixed(2)}
      </div>
      <div className="text-white/40 text-xs mt-0.5">
        {Number(payload[0]?.payload?.mesas ?? 0)} mesas
      </div>
    </div>
  );
}

const DIAS_ORDEN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTO: Record<string, string> = {
  'Lunes': 'Lun', 'Martes': 'Mar', 'Miércoles': 'Mié',
  'Jueves': 'Jue', 'Viernes': 'Vie', 'Sábado': 'Sáb', 'Domingo': 'Dom',
};

const buildDataSemanal = (
  ventasPorDia: Record<string, number>,
  mesasPorDia:  Record<string, number>,
  desde: string,
): PuntoVenta[] => {
  const [y, m, d] = desde.split('-').map(Number);
  return DIAS_ORDEN.map((nombre, i) => {
    const fecha = new Date(y, m - 1, d + i);
    return {
      label:  `${DIAS_CORTO[nombre]} ${fecha.getDate()}`,
      ventas: ventasPorDia[nombre] ?? 0,
      mesas:  mesasPorDia[nombre]  ?? 0,
    };
  });
};

const TITULOS: Record<VistaReporte, string> = {
  diario:  'Ventas por Hora',
  semanal: 'Ventas por Día de la Semana',
  mensual: 'Ventas por Semana del Mes',
  anual:   'Ventas por Mes',
};

export function GraficaVentas({
  vista, ventasPorDia, mesasPorDia = {},
  ventasPorSemana, desde, loading,
}: GraficaVentasProps) {
  if (loading) return <div className="h-72 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  const data: PuntoVenta[] =
    vista === 'mensual' && ventasPorSemana
      ? Object.entries(ventasPorSemana).map(([label, ventas]) => ({ label, ventas, mesas: 0 }))
      : vista === 'semanal' && desde
        ? buildDataSemanal(
            ventasPorDia as Record<string, number>,
            mesasPorDia  as Record<string, number>,
            desde,
          )
        : Object.entries(ventasPorDia).map(([label, ventas]) => ({
            label:  vista === 'diario' ? `${label}:00` : String(label),
            ventas: Number(ventas),
            mesas:  Number(mesasPorDia[label] ?? 0),
          }));

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">{TITULOS[vista]}</h3>
      <ResponsiveContainer width="100%" height={260}>
        {vista === 'semanal' ? (
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `S/.${v}`} />
            <Tooltip content={<TooltipSemanal />} />
            <Line
              type="monotone" dataKey="ventas"
              stroke="#10b981" strokeWidth={2.5}
              dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#10b981' }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `S/.${v}`} />
            <Tooltip content={<TooltipDefault />} />
            <Bar dataKey="ventas" radius={[6, 6, 0, 0]} maxBarSize={52}>
              {data.map((_, i) => (
                <Cell key={i} fill={i % 2 === 0 ? '#f97316' : '#fb923c'} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
