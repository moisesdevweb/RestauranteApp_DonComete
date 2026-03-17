// src/modules/admin/components/dashboard/RendimientoMeseros.tsx
interface Props {
  meseros: { nombre: string; ordenes: number; total: number; ticketPromedio: number }[];
  loading: boolean;
}

export function RendimientoMeseros({ meseros, loading }: Props) {
  if (loading) return <div className="h-48 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Rendimiento Meseros Hoy</h3>
      {meseros.length === 0
        ? <p className="text-white/20 text-sm text-center py-4">Sin actividad hoy</p>
        : <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs border-b border-white/5">
                  <th className="text-left pb-3">Mesero</th>
                  <th className="text-center pb-3">Mesas</th>
                  <th className="text-right pb-3">Ticket Prom.</th>
                  <th className="text-right pb-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {meseros.map((m, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 text-white">{m.nombre}</td>
                    <td className="py-3 text-center text-white/60">{m.ordenes}</td>
                    <td className="py-3 text-right text-white/60">S/. {m.ticketPromedio.toFixed(2)}</td>
                    <td className="py-3 text-right text-orange-400 font-semibold">S/. {m.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  );
}
