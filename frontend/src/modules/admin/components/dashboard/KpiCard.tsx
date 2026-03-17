// src/modules/admin/components/dashboard/KpiCard.tsx
interface KpiCardProps {
  label:     string;
  valor:     string;
  icono:     string;
  variacion?: number;
  sub?:       string;
  color:      string; // bg class
}

export function KpiCard({ label, valor, icono, variacion, sub, color }: KpiCardProps) {
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color}`}>
          {icono}
        </div>
        {variacion !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            variacion >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {variacion >= 0 ? '▲' : '▼'} {Math.abs(variacion)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-white/40 text-xs mb-1">{label}</p>
        <p className="text-white text-2xl font-bold">{valor}</p>
        {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}
