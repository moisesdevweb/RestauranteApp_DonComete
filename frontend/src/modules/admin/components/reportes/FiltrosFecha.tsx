'use client';
import { Calendar } from 'lucide-react';

type VistaReporte = 'diario' | 'semanal' | 'mensual' | 'anual';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

interface FiltrosFechaProps {
  vista:         VistaReporte;
  fecha:         string;  onFechaChange: (v: string) => void;
  año:           number;  onAñoChange:   (v: number) => void;
  mes:           number;  onMesChange:   (v: number) => void;
}

export function FiltrosFecha({ vista, fecha, onFechaChange, año, onAñoChange, mes, onMesChange }: FiltrosFechaProps) {
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-3">
      <Calendar size={15} className="text-white/30" />

      {vista === 'diario' && (
        <input type="date" value={fecha} onChange={e => onFechaChange(e.target.value)}
          className="bg-[#2a3040] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-orange-500/50 cursor-pointer" />
      )}

      {vista === 'semanal' && (
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-sm">Semana que contiene:</span>
          <input type="date" value={fecha} onChange={e => onFechaChange(e.target.value)}
            className="bg-[#2a3040] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-orange-500/50 cursor-pointer" />
        </div>
      )}

      {vista === 'mensual' && (
        <div className="flex items-center gap-2">
          <select value={mes} onChange={e => onMesChange(Number(e.target.value))}
            className="bg-[#2a3040] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-orange-500/50 cursor-pointer">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={año} onChange={e => onAñoChange(Number(e.target.value))}
            min={2024} max={2099}
            className="w-24 bg-[#2a3040] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-orange-500/50" />
        </div>
      )}

      {vista === 'anual' && (
        <input type="number" value={año} onChange={e => onAñoChange(Number(e.target.value))}
          min={2024} max={2099}
          className="w-24 bg-[#2a3040] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-orange-500/50" />
      )}
    </div>
  );
}
