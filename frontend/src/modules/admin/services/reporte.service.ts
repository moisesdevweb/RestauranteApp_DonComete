import api from '@/lib/axios';
import { ProductoTop } from '@/modules/admin/types/admin.types';

const param = (userId?: number) => (userId ? `&userId=${userId}` : '');

export const getReporteDiario = async (fecha: string, userId?: number) => {
  const { data } = await api.get(`/reportes/diario?fecha=${fecha}${param(userId)}`);
  return data.data;
};

export const getReporteSemanal = async (fecha: string, userId?: number) => {
  const { data } = await api.get(`/reportes/semanal?fecha=${fecha}${param(userId)}`);
  return data.data;
};

export const getReporteMensual = async (año: number, mes: number, userId?: number) => {
  const { data } = await api.get(`/reportes/mensual?año=${año}&mes=${mes}${param(userId)}`);
  return data.data;
};

export const getReporteAnual = async (año: number, userId?: number) => {
  const { data } = await api.get(`/reportes/anual?año=${año}${param(userId)}`);
  return data.data;
};

export const getComparativa = async (userId?: number) => {
  const { data } = await api.get(`/reportes/comparativa${userId ? `?userId=${userId}` : ''}`);
  return data.data;
};

export const getProductosTop = async (desde: string, hasta: string, limite = 5, userId?: number) => {
  const { data } = await api.get(
    `/reportes/productos-top?desde=${desde}&hasta=${hasta}&limite=${limite}${param(userId)}`
  );
  return data.data as ProductoTop[];
};

export const getMeseros = async () => {
  const { data } = await api.get('/usuarios?rol=mesero&activo=true');
  return data.data as { id: number; nombre: string }[];
};
