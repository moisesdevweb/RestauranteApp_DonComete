'use client';
import { useReportes } from '@/modules/admin/hooks/useReportes';
import { FiltrosFecha } from '@/modules/admin/components/reportes/FiltrosFecha';
import { ResumenKpis } from '@/modules/admin/components/reportes/ResumenKpis';
import { GraficaVentas } from '@/modules/admin/components/reportes/GraficaVentas';
import { GraficaProductos } from '@/modules/admin/components/reportes/GraficaProductos';
import { TablaOrdenesRecientes } from '@/modules/admin/components/reportes/TablaOrdenesRecientes';

export default function ReportesPage() {
  const {
    vista, setVista,
    loading,
    diario, semanal, mensual, anual,
    productosTop,
    fecha, setFecha,
    año,  setAño,
    mes,  setMes,
  } = useReportes();

  // KPIs según vista activa
  const kpis = diario?.kpis ?? semanal?.kpis ?? mensual?.kpis ?? anual?.kpis ?? null;

  // Ventas y mesas según vista
  const ventasPorDia =
    vista === 'diario'  ? { [diario?.fecha ?? '']: diario?.kpis.totalVentas ?? 0 } :
    vista === 'semanal' ? (semanal?.ventasPorDia  ?? {}) :
    vista === 'mensual' ? (mensual?.ventasPorDia  ?? {}) :
                          (anual?.ventasPorMes    ?? {});

  const mesasPorDia =
    vista === 'semanal' ? (semanal?.mesasPorDia ?? {}) :
    vista === 'mensual' ? (mensual?.mesasPorDia ?? {}) : 
    vista === 'anual'   ? (anual?.mesasPorMes   ?? {}) :
                          {};

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Reportes de Ventas</h1>
        <p className="text-white/40 text-sm">Analiza el rendimiento del restaurante</p>
      </div>

      {/* Selector de vista */}
      <div className="flex gap-2 flex-wrap">
        {(['diario', 'semanal', 'mensual', 'anual'] as const).map(v => (
          <button key={v} onClick={() => setVista(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all cursor-pointer ${
              vista === v
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a1f2e] text-white/50 border border-white/10 hover:text-white'
            }`}>
            {v}
          </button>
        ))}
      </div>

      {/* Filtros según vista */}
      <FiltrosFecha
        vista={vista}
        fecha={fecha} onFechaChange={setFecha}
        año={año}     onAñoChange={setAño}
        mes={mes}     onMesChange={setMes}
      />

      {/* KPIs */}
      <ResumenKpis kpis={kpis} loading={loading} />

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficaVentas
          ventasPorDia={ventasPorDia}
          mesasPorDia={mesasPorDia}
          loading={loading}
        />
        <GraficaProductos
          data={productosTop}
          loading={loading}
        />
      </div>

      {/* Tabla solo en vista diaria */}
      {vista === 'diario' && (
        <TablaOrdenesRecientes
          pedidos={diario?.pedidos ?? []}
          loading={loading}
        />
      )}

    </div>
  );
} 