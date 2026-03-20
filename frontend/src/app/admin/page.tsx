// src/app/admin/dashboard/page.tsx
'use client';
import { useDashboard }        from '@/modules/admin/hooks/useDashboard';
import { KpiCard }             from '@/modules/admin/components/dashboard/KpiCard';
import { GraficaVentasHora }   from '@/modules/admin/components/dashboard/GraficaVentasHora';
import { GraficaUltimos7Dias } from '@/modules/admin/components/dashboard/GraficaUltimos7Dias';
import { ComparativaCards }    from '@/modules/admin/components/dashboard/ComparativaCards';
import { EstadoMesas }         from '@/modules/admin/components/dashboard/EstadoMesas';
import { ProductosTopDia }     from '@/modules/admin/components/dashboard/ProductosTopDia';
import { TablaUltimosPedidos } from '@/modules/admin/components/dashboard/TablaUltimosPedidos';
import { RendimientoMeseros }  from '@/modules/admin/components/dashboard/RendimientoMeseros';
import { StockBajoWidget }   from '@/modules/admin/components/dashboard/StockBajoWidget';
import { ModalStockBajo }   from '@/modules/admin/components/dashboard/ModalStockBajo';

export default function DashboardPage() {
  const { datos, loading, lastUpdate, refetch } = useDashboard();

  const kpis = datos?.kpis;
  const comp = datos?.comparativa;

  return (
    <>
    {/* Modal de alerta de stock bajo — aparece automáticamente al cargar */}
    <ModalStockBajo />
    <div className="p-6 space-y-6 min-h-screen bg-[#0f1520]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-white/30 text-sm">Resumen de ventas y operaciones del restaurante</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-white/20 text-xs">
              Actualizado {lastUpdate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={refetch}
            className="text-xs text-orange-400 border border-orange-400/30 px-3 py-1.5 rounded-lg hover:bg-orange-400/10 transition-colors">
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ventas del Día"   valor={`S/. ${kpis?.totalVentas.toFixed(2) ?? '0.00'}`}
          icono="💰" color="bg-orange-500/20"
          variacion={comp?.hoyVsAyer.variacion} sub={`vs S/. ${comp?.hoyVsAyer.anterior.toFixed(2) ?? '0'} ayer`} />
        <KpiCard label="Mesas Atendidas" valor={String(kpis?.totalMesas ?? 0)}
          icono="🍽️" color="bg-blue-500/20"
          variacion={comp?.semanaVsSemana.variacion} />
        <KpiCard label="Ticket Promedio" valor={`S/. ${kpis?.ticketPromedio.toFixed(2) ?? '0.00'}`}
          icono="🧾" color="bg-purple-500/20" />
        <KpiCard label="Órdenes Pagadas" valor={String(kpis?.ordenesPagadas ?? 0)}
          icono="✅" color="bg-emerald-500/20" sub={`Hora pico: ${kpis?.horaPico ?? '—'}`} />
      </div>

      {/* Estado de mesas */}
      <EstadoMesas estadoMesas={datos?.estadoMesas ?? { libres:0, ocupadas:0, reservadas:0, total:0, detalle:[] }} loading={loading} />

      {/* Alertas de stock bajo */}
      <StockBajoWidget />

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficaVentasHora   ventasPorHora={datos?.ventasPorHora ?? {}} loading={loading} />
        <GraficaUltimos7Dias data={datos?.ventasUltimos7 ?? []}         loading={loading} />
      </div>

      {/* Comparativas */}
      <div>
        <h2 className="text-white font-semibold mb-3">Comparativas de Ventas</h2>
        <ComparativaCards comparativa={datos?.comparativa ?? {
          hoyVsAyer:      { actual:0, anterior:0, variacion:0 },
          semanaVsSemana: { actual:0, anterior:0, variacion:0 },
          mesVsMes:       { actual:0, anterior:0, variacion:0 },
        }} loading={loading} />
      </div>

      {/* Productos top + Rendimiento meseros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductosTopDia  productos={datos?.productosTop ?? []}           loading={loading} />
        <RendimientoMeseros meseros={datos?.rendimientoMeseros ?? []}     loading={loading} />
      </div>

      {/* Últimos pedidos */}
      <TablaUltimosPedidos pedidos={datos?.ultimosPedidos ?? []} loading={loading} />

    </div>
    </>
  );
}