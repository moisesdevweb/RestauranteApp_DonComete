// src/modules/admin/components/dashboard/ProductosTopDia.tsx
interface Props {
  productos: { id: number; nombre: string; cantidad: number; total: number }[];
  loading:   boolean;
}

export function ProductosTopDia({ productos, loading }: Props) {
  if (loading) return <div className="h-64 bg-[#1a1f2e] rounded-2xl animate-pulse" />;

  const max = Math.max(...productos.map(p => p.cantidad), 1);

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Productos Top Hoy</h3>
      {productos.length === 0
        ? <p className="text-white/20 text-sm text-center py-6">Sin ventas hoy</p>
        : <div className="space-y-3">
            {productos.map((p, i) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 text-xs font-bold w-5">#{i + 1}</span>
                    <span className="text-white text-sm truncate max-w-[140px]">{p.nombre}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white text-sm font-semibold">{p.cantidad} uds</span>
                    <span className="text-white/30 text-xs ml-2">S/. {p.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${(p.cantidad / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
