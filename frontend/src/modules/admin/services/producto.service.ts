import api from '@/lib/axios';

export const getProductos    = async () => (await api.get('/productos')).data.data;
export const crearProducto   = async (data: FormData) =>
  (await api.post('/productos', data, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const editarProducto  = async (id: number, data: FormData) =>
  (await api.put(`/productos/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
export const eliminarProducto = async (id: number) => (await api.delete(`/productos/${id}`)).data;
export const toggleAgotado   = async (id: number) => (await api.patch(`/productos/${id}/agotado`)).data.data;
