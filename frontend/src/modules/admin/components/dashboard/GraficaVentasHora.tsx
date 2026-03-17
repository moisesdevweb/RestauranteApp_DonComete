// src/modules/admin/components/dashboard/GraficaVentasHora.tsx
'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props { ventasPorHora: Record<number, number>; loading: boolean }

export function GraficaVentasHora({ ventasPorHora, loading }: Props) {
  if (loading) return <div className="h-64 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  const data = Object.entries(ventasPorHora)
    .map(([h, v]) => ({ hora: `${h}:00`, total: v }))
    .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));

  const max = Math.max(...data.map(d => d.total));

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Ventas por Hora (Hoy)</h3>
      {data.length === 0
        ? <div className="h-52 flex items-center justify-center text-white/20 text-sm">Sin ventas hoy</div>
        : <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="hora" tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1520', border: '1px solid #ffffff20', borderRadius: 12 }}
                  labelStyle={{ color: '#ffffff80' }}
                  formatter={(v: number | undefined) => [`S/. ${(v ?? 0).toFixed(2)}`, 'Ventas']}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.total === max ? '#f97316' : '#f9731650'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      }
    </div>
  );
}
