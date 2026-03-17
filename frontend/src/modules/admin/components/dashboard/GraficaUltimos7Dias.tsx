// src/modules/admin/components/dashboard/GraficaUltimos7Dias.tsx
'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Dot } from 'recharts';

interface Props { data: { dia: string; total: number }[]; loading: boolean }

export function GraficaUltimos7Dias({ data, loading }: Props) {
  if (loading) return <div className="h-64 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Ventas Últimos 7 Días</h3>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="dia" tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0f1520', border: '1px solid #ffffff20', borderRadius: 12 }}
              labelStyle={{ color: '#ffffff80' }}
              formatter={(v: number | undefined) => [`S/. ${(v ?? 0).toFixed(2)}`, 'Ventas']}
            />
            <Line
              type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5}
              dot={<Dot r={4} fill="#10b981" stroke="#0f1520" strokeWidth={2} />}
              activeDot={{ r: 6, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
