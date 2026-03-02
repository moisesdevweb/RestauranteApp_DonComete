import api from '@/lib/axios';

export const getMesas        = async () => (await api.get('/mesas')).data.data;
export const crearMesa       = async (data: { numero: number; piso: number; capacidad: number }) =>
  (await api.post('/mesas', data)).data.data;
export const editarMesa      = async (id: number, data: { numero: number; piso: number; capacidad: number }) =>
  (await api.put(`/mesas/${id}`, data)).data.data;
export const desactivarMesa  = async (id: number) => (await api.delete(`/mesas/${id}`)).data;
