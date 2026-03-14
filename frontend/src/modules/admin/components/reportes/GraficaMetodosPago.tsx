'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface GraficaMetodosPagoProps {
  metodosPago: Record<string, number>;
  loading:     boolean;
}

interface TooltipProps {
  active?:  boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { porcentaje: number } }>;
}

const COLORES: Record<string, string> = {
  efectivo: '#10b981',
  tarjeta:  '#f97316',
  yape:     '#a855f7',
  plin:     '#3b82f6',
};

const COLOR_DEFAULT = '#6b7280';

const BADGE: Record<string, string> = {
  efectivo: 'bg-emerald-500/20 text-emerald-400',
  tarjeta:  'bg-orange-500/20  text-orange-400',
  yape:     'bg-purple-500/20  text-purple-400',
  plin:     'bg-blue-500/20    text-blue-400',
};

function TooltipCustom({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#0f1520] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-white/50 text-xs capitalize mb-1">{item.name}</div>
      <div className="text-white font-bold">S/. {Number(item.value ?? 0).toFixed(2)}</div>
      <div className="text-white/40 text-xs">{item.payload?.porcentaje}%</div>
    </div>
  );
}

export function GraficaMetodosPago({ metodosPago, loading }: GraficaMetodosPagoProps) {
  if (loading) {
    return <div className="h-72 bg-[#1a1f2e] rounded-2xl animate-pulse" />;
  }

  const total = Object.values(metodosPago).reduce((sum, v) => sum + v, 0);

  const data = Object.entries(metodosPago).map(([metodo, monto]) => ({
    name:       metodo,
    value:      monto,
    porcentaje: total > 0 ? Math.round((monto / total) * 100) : 0,
    color:      COLORES[metodo] ?? COLOR_DEFAULT,
  }));

  if (data.length === 0) {
    return (
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5 flex items-center justify-center h-72">
        <p className="text-white/20 text-sm">Sin datos de pagos</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Distribución de Métodos de Pago</h3>

      <div className="flex items-center gap-6">
        {/* Pie chart */}
        <div style={{ width: 160, height: 160 }} className="flex-shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data} 
                cx="50%" cy="50%"
                innerRadius={40} outerRadius={68}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<TooltipCustom />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Progress bars */}
        <div className="flex-1 space-y-3">
          {data.map(entry => (
            <div key={entry.name}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${BADGE[entry.name] ?? 'bg-white/10 text-white/50'}`}>
                  {entry.name}
                </span>
                <div className="text-right">
                  <span className="text-white text-sm font-semibold">
                    S/. {Number(entry.value).toFixed(2)}
                  </span>
                  <span className="text-white/30 text-xs ml-2">{entry.porcentaje}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${entry.porcentaje}%`, backgroundColor: entry.color }}
                />
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-white/5 flex justify-between">
            <span className="text-white/40 text-xs">Total</span>
            <span className="text-orange-400 font-bold text-sm">S/. {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
