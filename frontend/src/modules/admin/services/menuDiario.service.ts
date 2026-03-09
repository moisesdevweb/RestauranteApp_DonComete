import api from '@/lib/axios';
import { MenuDiario, MenuDiarioPayload } from '@/modules/admin/types/admin.types';

export const getMenus = async (): Promise<MenuDiario[]> =>
  (await api.get('/menu-diario')).data.data;

export const getMenusTodos = async (): Promise<MenuDiario[]> =>
  (await api.get('/menu-diario?todos=true')).data.data;

export const crearMenu = async (data: MenuDiarioPayload): Promise<MenuDiario> =>
  (await api.post('/menu-diario', data)).data.data;

export const editarMenu = async (id: number, data: Partial<MenuDiarioPayload> & { activo?: boolean }): Promise<MenuDiario> =>
  (await api.put(`/menu-diario/${id}`, data)).data.data;

export const desactivarMenu = async (id: number): Promise<void> =>
  (await api.delete(`/menu-diario/${id}`)).data;

export const reactivarMenu = async (id: number): Promise<MenuDiario> =>
  (await api.put(`/menu-diario/${id}`, { activo: true })).data.data;

export const duplicarMenu = async (id: number, fecha: string): Promise<MenuDiario> =>
  (await api.post(`/menu-diario/${id}/duplicar`, { fecha })).data.data;
