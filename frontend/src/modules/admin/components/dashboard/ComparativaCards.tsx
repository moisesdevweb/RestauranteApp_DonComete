// src/modules/admin/components/dashboard/ComparativaCards.tsx
interface Comp { actual: number; anterior: number; variacion: number }
interface Props {
  comparativa: { hoyVsAyer: Comp; semanaVsSemana: Comp; mesVsMes: Comp };
  loading: boolean;
}

function CompCard({ label, actual, anterior, variacion }: { label: string } & Comp) {
  const positivo = variacion >= 0;
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white text-xl font-bold">S/. {actual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
      <div className="flex items-center justify-between">
        <p className="text-white/30 text-xs">vs S/. {anterior.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          positivo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {positivo ? '▲' : '▼'} {Math.abs(variacion)}%
        </span>
      </div>
    </div>
  );
}

export function ComparativaCards({ comparativa, loading }: Props) {
  if (loading) return (
    <div className="grid grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-[#1a1f2e] rounded-2xl animate-pulse" />)}
    </div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <CompCard label="Hoy vs Ayer"                 {...comparativa.hoyVsAyer} />
      <CompCard label="Esta Semana vs Semana Pasada" {...comparativa.semanaVsSemana} />
      <CompCard label="Este Mes vs Mes Pasado"       {...comparativa.mesVsMes} />
    </div>
  );
}
