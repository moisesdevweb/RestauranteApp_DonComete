// src/modules/admin/components/dashboard/EstadoMesas.tsx
interface Mesa { id: number; numero: number; piso: number; estado: string; capacidad: number }
interface Props {
  estadoMesas: { libres: number; ocupadas: number; reservadas: number; total: number; detalle: Mesa[] };
  loading: boolean;
}

const COLORES: Record<string, string> = {
  libre:     'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  ocupada:   'bg-orange-500/20  border-orange-500/40  text-orange-400',
  reservada: 'bg-blue-500/20    border-blue-500/40    text-blue-400',
};

export function EstadoMesas({ estadoMesas, loading }: Props) {
  if (loading) return <div className="h-64 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  const pisos = [...new Set(estadoMesas.detalle.map(m => m.piso))].sort();

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Estado de Mesas</h3>
        <div className="flex gap-3 text-xs">
          <span className="text-emerald-400">● {estadoMesas.libres} libres</span>
          <span className="text-orange-400">● {estadoMesas.ocupadas} ocupadas</span>
          {estadoMesas.reservadas > 0 && <span className="text-blue-400">● {estadoMesas.reservadas} reservadas</span>}
        </div>
      </div>
      {pisos.map(piso => (
        <div key={piso} className="mb-4">
          <p className="text-white/30 text-xs mb-2">Piso {piso}</p>
          <div className="flex flex-wrap gap-2">
            {estadoMesas.detalle.filter(m => m.piso === piso).map(m => (
              <div key={m.id}
                className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center cursor-default ${COLORES[m.estado] ?? 'bg-white/5 border-white/10 text-white/40'}`}>
                <span className="text-sm font-bold">{m.numero}</span>
                <span className="text-[10px] opacity-70 capitalize">{m.estado}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
