// src/modules/admin/components/dashboard/TablaUltimosPedidos.tsx
interface Pedido { id: number; mesa: number; mesero: string; total: number; cerradoEn: string }
interface Props { pedidos: Pedido[]; loading: boolean }

export function TablaUltimosPedidos({ pedidos, loading }: Props) {
  if (loading) return <div className="h-64 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Últimos Pedidos Cerrados</h3>
      {pedidos.length === 0
        ? <p className="text-white/20 text-sm text-center py-6">Sin pedidos hoy</p>
        : <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs border-b border-white/5">
                  <th className="text-left pb-3">ID</th>
                  <th className="text-left pb-3">Mesa</th>
                  <th className="text-left pb-3">Mesero</th>
                  <th className="text-right pb-3">Total</th>
                  <th className="text-right pb-3">Hora</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 text-orange-400 font-mono">#{p.id}</td>
                    <td className="py-3 text-white/70">Mesa {p.mesa}</td>
                    <td className="py-3 text-white/70">{p.mesero ?? '—'}</td>
                    <td className="py-3 text-right text-white font-semibold">S/. {Number(p.total).toFixed(2)}</td>
                    <td className="py-3 text-right text-white/40">{p.cerradoEn ? hora(p.cerradoEn) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  );
}
