import api from '@/lib/axios';

export const getOrdenescocina = async () => {
  const res = await api.get('/ordenes/cocina');
  return res.data.data;
};

export const marcarItemListo = async (itemId: number) => {
  const res = await api.patch(`/ordenes/items/${itemId}/listo`);
  return res.data.data;
};