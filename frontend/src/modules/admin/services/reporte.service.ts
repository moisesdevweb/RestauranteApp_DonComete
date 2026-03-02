import api from '@/lib/axios';
import {ProductoTop } from '@/modules/admin/types/admin.types';

// GET /api/reportes/diario?fecha=2026-02-26
export const getReporteDiario = async (fecha: string) => {
  const { data } = await api.get(`/reportes/diario?fecha=${fecha}`);
  return data.data;
};

// GET /api/reportes/semanal?fecha=2026-02-26
export const getReporteSemanal = async (fecha: string) => {
  const { data } = await api.get(`/reportes/semanal?fecha=${fecha}`);
  return data.data;
};

// GET /api/reportes/mensual?año=2026&mes=2
export const getReporteMensual = async (año: number, mes: number) => {
  const { data } = await api.get(`/reportes/mensual?año=${año}&mes=${mes}`);
  return data.data;
};

// GET /api/reportes/anual?año=2026
export const getReporteAnual = async (año: number) => {
  const { data } = await api.get(`/reportes/anual?año=${año}`);
  return data.data;
};

// GET /api/reportes/comparativa
export const getComparativa = async () => {
  const { data } = await api.get('/reportes/comparativa');
  return data.data;
};

// GET /api/reportes/productos-top?limite=5&desde=2026-02-01&hasta=2026-02-28
export const getProductosTop = async (desde: string, hasta: string, limite = 5) => {
  const { data } = await api.get(`/reportes/productos-top?desde=${desde}&hasta=${hasta}&limite=${limite}`);
  return data.data as ProductoTop[];
};
