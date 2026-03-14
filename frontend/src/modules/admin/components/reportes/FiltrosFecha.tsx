'use client';
import { Calendar } from 'lucide-react';
import { VistaReporte } from '@/modules/admin/hooks/useReportes';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

interface Mesero {
  id:     number;
  nombre: string;
}

interface FiltrosFechaProps {
  vista:          VistaReporte;
  fecha:          string;   onFechaChange:  (v: string) => void;
  año:            number;   onAñoChange:    (v: number) => void;
  mes:            number;   onMesChange:    (v: number) => void;
  meseros:        Mesero[];
  meseroId:       number | undefined;
  onMeseroChange: (v: number | undefined) => void;
}

export function FiltrosFecha({
  vista, fecha, onFechaChange,
  año, onAñoChange, mes, onMesChange,
  meseros, meseroId, onMeseroChange,
}: FiltrosFechaProps) {
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-3">
      <Calendar size={15} className="text-white/30" />

      {/* Filtros de fecha según vista */}
      {(vista === 'diario' || vista === 'semanal') && (
        <div className="flex items-center gap-2">
          {vista === 'semanal' && (
            <span className="text-white/40 text-sm">Semana que contiene:</span>
          )}
          <input
            type="date"
            value={fecha}
            onChange={e => onFechaChange(e.target.value)}
            className="bg-[#2a3040] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-orange-500/50 cursor-pointer"
          />
        </div>
      )}

      {(vista === 'mensual' || vista === 'anual') && (
        <div className="flex items-center gap-2">
          {vista === 'mensual' && (
            <select
              value={mes}
              onChange={e => onMesChange(Number(e.target.value))}
              className="bg-[#2a3040] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-orange-500/50 cursor-pointer"
            >
              {MESES.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          )}
          <input
            type="number"
            value={año}
            onChange={e => onAñoChange(Number(e.target.value))}
            min={2024}
            max={2099}
            className="w-24 bg-[#2a3040] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-orange-500/50"
          />
        </div>
      )}

      {/* Divisor */}
      {meseros.length > 0 && (
        <div className="w-px h-5 bg-white/10 mx-1" />
      )}

      {/* Filtro por mesero */}
      {meseros.length > 0 && (
        <select
          value={meseroId ?? ''}
          onChange={e => onMeseroChange(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-[#2a3040] border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-orange-500/50 cursor-pointer"
        >
          <option value="">Todos los Meseros</option>
          {meseros.map(m => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      )}
    </div>
  );
}
