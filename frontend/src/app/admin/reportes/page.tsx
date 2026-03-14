'use client';
import { useReportes }             from '@/modules/admin/hooks/useReportes';
import { useExport }               from '@/modules/admin/hooks/useExport';
import { FiltrosFecha }            from '@/modules/admin/components/reportes/FiltrosFecha';
import { ResumenKpis }             from '@/modules/admin/components/reportes/ResumenKpis';
import { GraficaVentas }           from '@/modules/admin/components/reportes/GraficaVentas';
import { GraficaProductos }        from '@/modules/admin/components/reportes/GraficaProductos';
import { GraficaMetodosPago }      from '@/modules/admin/components/reportes/GraficaMetodosPago';
import { GraficaComparativaVista } from '@/modules/admin/components/reportes/GraficaComparativaVista';
import { GraficaMeseros }          from '@/modules/admin/components/reportes/GraficaMeseros';
import { TablaOrdenesRecientes }   from '@/modules/admin/components/reportes/TablaOrdenesRecientes';
import { FileSpreadsheet, FileText } from 'lucide-react';

const VISTAS = ['diario', 'semanal', 'mensual', 'anual'] as const;

export default function ReportesPage() {
  const {
    vista, setVista, loading,
    diario, semanal, mensual, anual,
    comparativa, productosTop,
    fecha, setFecha,
    año,   setAño,
    mes,   setMes,
    meseros, meseroId, setMeseroId,
  } = useReportes();

  const datos =
    vista === 'diario'  ? diario  :
    vista === 'semanal' ? semanal :
    vista === 'mensual' ? mensual :
                          anual   ?? null;

  const { exportarExcel, exportarPDF } = useExport(vista, datos);

  const kpis =
    vista === 'diario'  ? diario?.kpis  :
    vista === 'semanal' ? semanal?.kpis :
    vista === 'mensual' ? mensual?.kpis :
                          anual?.kpis   ?? null;

  const ventasPorDia =
    vista === 'diario'  ? (diario?.ventasPorHora ?? {}) :
    vista === 'semanal' ? (semanal?.ventasPorDia  ?? {}) :
    vista === 'mensual' ? (mensual?.ventasPorDia  ?? {}) :
                          (anual?.ventasPorMes    ?? {});

  const mesasPorDia =
    vista === 'semanal' ? (semanal?.mesasPorDia ?? {}) :
    vista === 'mensual' ? (mensual?.mesasPorDia ?? {}) :
    vista === 'anual'   ? (anual?.mesasPorMes   ?? {}) : {};

  const metodosPago =
    vista === 'diario'  ? (diario?.metodosPago  ?? {}) :
    vista === 'semanal' ? (semanal?.metodosPago ?? {}) :
    vista === 'mensual' ? (mensual?.metodosPago ?? {}) :
                          (anual?.metodosPago   ?? {});

  return (
    <div id="reporte-contenedor" className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Reportes de Ventas</h1>
          <p className="text-white/40 text-sm">Analiza el rendimiento del restaurante</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarPDF}
            disabled={loading || !datos}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileText size={15} />
            Exportar PDF
          </button>
          <button
            onClick={exportarExcel}
            disabled={loading || !datos}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Selector de vista */}
      <div className="flex gap-2 flex-wrap">
        {VISTAS.map(v => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all cursor-pointer ${
              vista === v
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a1f2e] text-white/50 border border-white/10 hover:text-white'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <FiltrosFecha
        vista={vista}
        fecha={fecha}   onFechaChange={setFecha}
        año={año}       onAñoChange={setAño}
        mes={mes}       onMesChange={setMes}
        meseros={meseros}
        meseroId={meseroId}
        onMeseroChange={setMeseroId}
      />

      {/* KPIs */}
      <ResumenKpis vista={vista} kpis={kpis ?? null} loading={loading} />

      {/* Fila 1: gráfica principal + productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficaVentas
          vista={vista}
          ventasPorDia={ventasPorDia}
          mesasPorDia={mesasPorDia}
          ventasPorSemana={vista === 'mensual' ? mensual?.ventasPorSemana : undefined}
          desde={vista === 'semanal' ? semanal?.desde : undefined}
          loading={loading}
        />
        <GraficaProductos
          data={productosTop}
          loading={loading}
        />
      </div>

      {/* Fila 2: comparativa por vista + métodos de pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficaComparativaVista
          vista={vista}
          comparativa={comparativa}
          comparativaSemanas={semanal?.comparativaSemanas}
          tendenciaMeses={mensual?.tendenciaMeses}
          ventasPorAño={anual?.ventasPorAño}
          loading={loading}
        />
        <GraficaMetodosPago
          metodosPago={metodosPago}
          loading={loading}
        />
      </div>

      {/* Solo diario: tabla + meseros */}
      {vista === 'diario' && (
        <>
          <TablaOrdenesRecientes
            pedidos={diario?.pedidos ?? []}
            loading={loading}
          />
          <GraficaMeseros
            ventasPorMesero={diario?.ventasPorMesero ?? {}}
            loading={loading}
          />
        </>
      )}

    </div>
  );
}
