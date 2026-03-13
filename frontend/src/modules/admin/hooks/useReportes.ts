'use client';
import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import {
  ReporteDiario, ReporteSemanal, ReporteMensual,
  ReporteAnual, Comparativa, ProductoTop,
} from '@/modules/admin/types/admin.types';
import {
  getReporteDiario, getReporteSemanal, getReporteMensual,
  getReporteAnual, getComparativa, getProductosTop, getMeseros,
} from '@/modules/admin/services/reporte.service';

export type VistaReporte = 'diario' | 'semanal' | 'mensual' | 'anual';

interface Mesero {
  id:     number;
  nombre: string;
}

const getLunesDe = (fechaStr: string): string => {
  const d = new Date(fechaStr);
  const dia = d.getDay();
  d.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1));
  return d.toISOString().split('T')[0];
};

const fmtLocal = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
};

export function useReportes() {
  const hoy    = new Date();
  const añoHoy = hoy.getFullYear();
  const mesHoy = hoy.getMonth() + 1;

  const [vista,        setVista]        = useState<VistaReporte>('diario');
  const [loading,      setLoading]      = useState(true);

  const [diario,       setDiario]       = useState<ReporteDiario  | null>(null);
  const [semanal,      setSemanal]      = useState<ReporteSemanal | null>(null);
  const [mensual,      setMensual]      = useState<ReporteMensual | null>(null);
  const [anual,        setAnual]        = useState<ReporteAnual   | null>(null);
  const [comparativa,  setComparativa]  = useState<Comparativa    | null>(null);
  const [productosTop, setProductosTop] = useState<ProductoTop[]>([]);

  const [fecha,      setFecha]      = useState(fmtLocal());
  const [año,        setAño]        = useState(añoHoy);
  const [mes,        setMes]        = useState(mesHoy);

  // Filtro por mesero
  const [meseros,    setMeseros]    = useState<Mesero[]>([]);
  const [meseroId,   setMeseroId]   = useState<number | undefined>(undefined);

  // Carga lista de meseros una sola vez
  useEffect(() => {
    getMeseros()
      .then(setMeseros)
      .catch(() => {});
  }, []);

  const cargar = useCallback(async (v: VistaReporte) => {
    try {
      setLoading(true);
      setDiario(null);
      setSemanal(null);
      setMensual(null);
      setAnual(null);
      setProductosTop([]);
      setComparativa(null);

      if (v === 'diario') {
        const [d, top, comp] = await Promise.all([
          getReporteDiario(fecha, meseroId),
          getProductosTop(fecha, fecha, 5, meseroId),
          getComparativa(meseroId),
        ]);
        setDiario(d);
        setProductosTop(top);
        setComparativa(comp);
      }

      if (v === 'semanal') {
        const lunes = getLunesDe(fecha);
        const [s, top, comp] = await Promise.all([
          getReporteSemanal(fecha, meseroId),
          getProductosTop(lunes, fecha, 5, meseroId),
          getComparativa(meseroId),
        ]);
        setSemanal(s);
        setProductosTop(top);
        setComparativa(comp);
      }

      if (v === 'mensual') {
        const primerDia   = `${año}-${String(mes).padStart(2, '0')}-01`;
        const ultimoDia   = new Date(año, mes, 0).getDate();
        const ultimaFecha = `${año}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
        const [m, top, comp] = await Promise.all([
          getReporteMensual(año, mes, meseroId),
          getProductosTop(primerDia, ultimaFecha, 5, meseroId),
          getComparativa(meseroId),
        ]);
        setMensual(m);
        setProductosTop(top);
        setComparativa(comp);
      }

      if (v === 'anual') {
        const [a, top, comp] = await Promise.all([
          getReporteAnual(año, meseroId),
          getProductosTop(`${año}-01-01`, `${año}-12-31`, 5, meseroId),
          getComparativa(meseroId),
        ]);
        setAnual(a);
        setProductosTop(top);
        setComparativa(comp);
      }

    } catch {
      sileo.error({ title: 'Error al cargar reportes' });
    } finally {
      setLoading(false);
    }
  }, [fecha, año, mes, meseroId]);

  useEffect(() => {
    cargar(vista);
  }, [vista, fecha, año, mes, meseroId]);

  return {
    vista,       setVista,
    loading,
    diario,      semanal,     mensual,     anual,
    comparativa, productosTop,
    fecha,       setFecha,
    año,         setAño,
    mes,         setMes,
    meseros,     meseroId,    setMeseroId,
  };
}
