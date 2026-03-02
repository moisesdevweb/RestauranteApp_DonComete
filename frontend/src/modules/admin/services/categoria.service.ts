import api from '@/lib/axios';

export interface CategoriaPayload {
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden?: number;
}

export const getCategorias    = async () => (await api.get('/categorias')).data.data;
export const crearCategoria   = async (data: CategoriaPayload) =>
  (await api.post('/categorias', data)).data.data;
export const editarCategoria  = async (id: number, data: Partial<CategoriaPayload>) =>
  (await api.put(`/categorias/${id}`, data)).data.data;
export const eliminarCategoria = async (id: number) => (await api.delete(`/categorias/${id}`)).data;
