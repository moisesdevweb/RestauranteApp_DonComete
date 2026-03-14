'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User } from 'lucide-react';
import { MeseroStats } from '@/modules/admin/types/admin.types';

interface TooltipPayloadItem { value?: number; }
interface TooltipCustomProps {
  active?:  boolean;
  payload?: TooltipPayloadItem[];
  label?:   string;
}

function TooltipCustom({ active, payload, label }: TooltipCustomProps) {
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

const COLORES = ['#f97316', '#10b981', '#6366f1', '#a855f7', '#3b82f6', '#ec4899'];

interface GraficaMeserosProps {
  ventasPorMesero: Record<string, MeseroStats>;
  loading:         boolean;
}

export function GraficaMeseros({ ventasPorMesero, loading }: GraficaMeserosProps) {
  if (loading) return <div className="h-72 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  const meseros = Object.values(ventasPorMesero).sort((a, b) => b.total - a.total);

  if (!meseros.length) {
    return (
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5 flex items-center justify-center h-72">
        <p className="text-white/20 text-sm">Sin datos de meseros</p>
      </div>
    );
  }

  const totalGeneral = meseros.reduce((sum, m) => sum + m.total, 0);

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Rendimiento por Mesero</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfica de barras */}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={meseros}
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `S/.${v}`}
            />
            <YAxis
              type="category" dataKey="nombre"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              axisLine={false} tickLine={false}
              width={90}
            />
            <Tooltip content={<TooltipCustom />} />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {meseros.map((_, i) => (
                <Cell key={i} fill={COLORES[i % COLORES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Tabla de stats */}
        <div className="space-y-2">
          {meseros.map((m, i) => {
            const porcentaje = totalGeneral > 0 ? Math.round((m.total / totalGeneral) * 100) : 0;
            return (
              <div key={m.nombre} className="bg-white/[0.03] rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORES[i % COLORES.length] }}
                    />
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-white/30" />
                      <span className="text-white text-sm font-medium">{m.nombre}</span>
                    </div>
                  </div>
                  <span className="text-white/40 text-xs">{porcentaje}%</span>
                </div>

                <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${porcentaje}%`, backgroundColor: COLORES[i % COLORES.length] }}
                  />
                </div>

                <div className="flex justify-between text-xs text-white/40">
                  <span>{m.ordenes} órdenes</span>
                  <span>Ticket prom. S/. {m.ticketPromedio.toFixed(2)}</span>
                  <span className="text-white font-medium">S/. {m.total.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
