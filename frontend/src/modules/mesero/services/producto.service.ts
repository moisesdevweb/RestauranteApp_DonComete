import api from '@/lib/axios';
import { Producto, Categoria, MenuDiario } from '@/types';

export const getProductos = async (): Promise<Producto[]> => {
  const res = await api.get('/productos');
  return res.data.data;
};

export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await api.get('/categorias');
  return res.data.data;
};

export const getMenuHoy = async (): Promise<MenuDiario | null> => {
  try {
    const res = await api.get('/menu-diario/hoy');
    return res.data.data;
  } catch {
    return null;
  }
};