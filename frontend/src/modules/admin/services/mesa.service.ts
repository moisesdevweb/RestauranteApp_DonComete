import api from '@/lib/axios';

// si includeInactive es true envía ?todos=true para que el backend devuelva también mesas inactivas
export const getMesas        = async (includeInactive = false) => {
  const res = await api.get('/mesas', { params: { todos: includeInactive ? 'true' : undefined } });
  return res.data.data;
};
export const crearMesa       = async (data: { numero: number; piso: number; capacidad: number }) =>
  (await api.post('/mesas', data)).data.data;
export const editarMesa      = async (id: number, data: { numero: number; piso: number; capacidad: number }) =>
  (await api.put(`/mesas/${id}`, data)).data.data;
export const desactivarMesa  = async (id: number) => (await api.delete(`/mesas/${id}`)).data;
export const reactivarMesa   = async (id: number) => (await api.patch(`/mesas/${id}/reactivar`)).data.data;

// permite cambiar el estado (reservada / libre) desde el panel administrativo
export const cambiarEstadoMesa = async (id: number, estado: string) =>
  (await api.patch(`/mesas/${id}/estado`, { estado })).data.data;
