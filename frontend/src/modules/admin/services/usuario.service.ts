import api from '@/lib/axios';

export interface UsuarioPayload {
  nombre: string;
  username: string;
  password?: string;
  rol: string;
  telefono?: string;
}

export const getUsuarios       = async () => (await api.get('/users/todos')).data.data;
export const crearUsuario      = async (data: UsuarioPayload) =>
  (await api.post('/users', data)).data.data;
export const editarUsuario     = async (id: number, data: Partial<UsuarioPayload>) =>
  (await api.put(`/users/${id}`, data)).data.data;
export const desactivarUsuario = async (id: number) =>
  (await api.delete(`/users/${id}`)).data;
export const reactivarUsuario  = async (id: number) =>
  (await api.patch(`/users/${id}/reactivar`)).data.data;
