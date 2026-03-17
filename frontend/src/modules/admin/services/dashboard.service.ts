// src/modules/admin/services/dashboard.service.ts
import api from '@/lib/axios';

export interface DashboardData {
  fecha:       string; 
  kpis: {
    totalVentas:    number;
    totalMesas:     number;
    ordenesPagadas: number;
    ticketPromedio: number;
    horaPico:       string;
  };
  ventasPorHora:      Record<number, number>;
  ventasUltimos7:     { dia: string; fecha: string; total: number }[];
  metodosPago:        Record<string, number>;
  ultimosPedidos: {
    id:        number;
    mesa:      number;
    mesero:    string;
    total:     number;
    cerradoEn: string;
  }[];
  productosTop: { id: number; nombre: string; cantidad: number; total: number }[];
  estadoMesas: {
    libres: number; ocupadas: number; reservadas: number; total: number;
    detalle: { id: number; numero: number; piso: number; estado: string; capacidad: number }[];
  };
  rendimientoMeseros: { nombre: string; ordenes: number; total: number; ticketPromedio: number }[];
  comparativa: {
    hoyVsAyer:      { actual: number; anterior: number; variacion: number };
    semanaVsSemana: { actual: number; anterior: number; variacion: number };
    mesVsMes:       { actual: number; anterior: number; variacion: number };
  };
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const { data } = await api.get('/reportes/dashboard');
  return data.data;
};
