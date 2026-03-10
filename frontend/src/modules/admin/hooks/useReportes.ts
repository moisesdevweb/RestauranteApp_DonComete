'use client';
import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import {
  ReporteDiario, ReporteSemanal, ReporteMensual,
  ReporteAnual, Comparativa, ProductoTop,
} from '@/modules/admin/types/admin.types';
import {
  getReporteDiario, getReporteSemanal, getReporteMensual,
  getReporteAnual, getComparativa, getProductosTop,
} from '@/modules/admin/services/reporte.service';

type VistaReporte = 'diario' | 'semanal' | 'mensual' | 'anual';

const getLunesDe = (fechaStr: string): string => {
  const d = new Date(fechaStr);
  const dia = d.getDay();
  d.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1));
  return d.toISOString().split('T')[0];
};

export function useReportes() {
  const hoy     = new Date();
  const añoHoy  = hoy.getFullYear();
  const mesHoy  = hoy.getMonth() + 1;
  const fechaHoy = hoy.toISOString().split('T')[0]; 

  const [vista,         setVista]         = useState<VistaReporte>('semanal');
  const [loading,       setLoading]       = useState(true);

  const [diario,        setDiario]        = useState<ReporteDiario | null>(null);
  const [semanal,       setSemanal]       = useState<ReporteSemanal | null>(null);
  const [mensual,       setMensual]       = useState<ReporteMensual | null>(null);
  const [anual,         setAnual]         = useState<ReporteAnual | null>(null);
  const [comparativa,   setComparativa]   = useState<Comparativa | null>(null);
  const [productosTop,  setProductosTop]  = useState<ProductoTop[]>([]);

  // Params por vista
  const [fecha,  setFecha]  = useState(fechaHoy);    // diario
  const [año,    setAño]    = useState(añoHoy);       // mensual + anual
  const [mes,    setMes]    = useState(mesHoy);       // mensual

  const cargar = useCallback(async (v: VistaReporte) => {
    try {
      setLoading(true);
      // Resetear datos para evitar mostrar valores viejos mientras carga
      setDiario(null);
      setSemanal(null);
      setMensual(null);
      setAnual(null);
      setProductosTop([]);
      setComparativa(null);

      if (v === 'diario') {
        const [d, top] = await Promise.all([
          getReporteDiario(fecha),
          getProductosTop(fecha, fecha),
        ]);
        setDiario(d);
        setProductosTop(top);
      }

      if (v === 'semanal') {
        const lunes = getLunesDe(fecha); // calcula el lunes de esa semana
        const [s, top] = await Promise.all([
          getReporteSemanal(fecha),
          getProductosTop(lunes, fecha), //rango lunes → fecha seleccionada
        ]);
        setSemanal(s);
        setProductosTop(top);
      }

      if (v === 'mensual') {
        const primerDia = `${año}-${String(mes).padStart(2, '0')}-01`;
        const ultimoDia = new Date(año, mes, 0).getDate();
        const ultimaFecha = `${año}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
        const [m, top] = await Promise.all([
          getReporteMensual(año, mes),
          getProductosTop(primerDia, ultimaFecha),
        ]);
        setMensual(m);
        setProductosTop(top);
      }

      if (v === 'anual') {
        const [a, top, comp] = await Promise.all([
          getReporteAnual(año),
          getProductosTop(`${año}-01-01`, `${año}-12-31`),
          getComparativa(),
        ]);
        setAnual(a);
        setProductosTop(top);
        setComparativa(comp);
      }

      // Comparativa siempre
      if (v !== 'anual') {
        const comp = await getComparativa();
        setComparativa(comp);
      }

    } catch {
      sileo.error({ title: 'Error al cargar reportes' });
    } finally {
      setLoading(false);
    }
  }, [fecha, año, mes]);

  useEffect(() => {
    cargar(vista);
  }, [vista, fecha, año, mes]);

  return {
    vista, setVista,
    loading,
    diario, semanal, mensual, anual,
    comparativa, productosTop,
    fecha, setFecha,
    año, setAño,
    mes, setMes,
  };
}
