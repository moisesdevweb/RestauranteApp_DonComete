import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  valor: string | number;
  icono: LucideIcon;
  color: 'blue' | 'emerald' | 'orange' | 'purple' | 'red' | 'yellow';
}

const colores = {
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/10'  },
  purple:  { text: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  red:     { text: 'text-red-400',     bg: 'bg-red-500/10'     },
  yellow:  { text: 'text-yellow-400',  bg: 'bg-yellow-500/10'  },
};

export function KpiCard({ label, valor, icono: Icono, color }: KpiCardProps) {
  const c = colores[color];
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
      <div>
        <div className="text-white/40 text-xs mb-1">{label}</div>
        <div className={`text-2xl font-bold ${c.text}`}>{valor}</div>
      </div>
      <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
        <Icono size={18} className={c.text} />
      </div>
    </div>
  );
}