import api from '@/lib/axios';

export const crearOrden = async (mesaId: number, comensales: { nombre?: string; numero: number }[]) => {
  const res = await api.post('/ordenes', { mesaId, comensales });
  return res.data.data;
};

export const getOrdenMesa = async (mesaId: number) => {
  try {
    const res = await api.get(`/ordenes/mesa/${mesaId}`);
    return res.data.data;
  } catch {
    return null; // mesa sin orden activa
  }
};

export const agregarItems = async (ordenId: number, items: {
  comensalId: number;
  tipo: 'carta' | 'menu_dia';
  productoId?: number;
  menuDiarioId?: number;
  cantidad: number;
  nota?: string;
}[]) => {
  const res = await api.post(`/ordenes/${ordenId}/items`, { items });
  return res.data.data;
};

export const enviarACocina = async (ordenId: number) => {
  const res = await api.patch(`/ordenes/${ordenId}/enviar`);
  return res.data.data;
};