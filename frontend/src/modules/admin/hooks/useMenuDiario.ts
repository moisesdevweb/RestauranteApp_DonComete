'use client';
import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import type { AxiosError } from 'axios';
import { MenuDiario, MenuDiarioPayload } from '@/modules/admin/types/admin.types';
import {
  getMenus, crearMenu, editarMenu,
  desactivarMenu, reactivarMenu, duplicarMenu,
} from '@/modules/admin/services/menuDiario.service';

export function useMenuDiario() {
  const [menus,        setMenus]        = useState<MenuDiario[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [guardando,    setGuardando]    = useState(false);
  const [menuEditar,   setMenuEditar]   = useState<MenuDiario | null>(null);
  const [mostrarForm,  setMostrarForm]  = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

    // Función helper para extraer mensaje de error de axios
    const getMensajeError = (err: unknown, fallback: string): string => {
    const axiosErr = err as AxiosError<{ message: string }>;
    return axiosErr?.response?.data?.message ?? fallback;
    };


  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMenus();
      setMenus(data);
    } catch {
      sileo.error({ title: 'Error al cargar menús' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Menú activo de hoy
  const hoy = new Date().toISOString().split('T')[0];
  const menuHoy = menus.find(m => m.fecha === hoy && m.activo) ?? null;

  // Historial — todos excepto el de hoy activo
  const historial = menus.filter(m => !(m.fecha === hoy && m.activo));

  const handleCrear = async (data: MenuDiarioPayload) => {
    try {
      setGuardando(true);
      const nuevo = await crearMenu(data);
      setMenus(prev => [nuevo, ...prev]);
      setMostrarForm(false);
      sileo.success({ title: 'Menú creado ' });
    } catch (err: unknown) {
      sileo.error({ title: getMensajeError(err, 'Error al crear menú') });
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = async (id: number, data: Partial<MenuDiarioPayload> & { activo?: boolean }) => {
    try {
      setGuardando(true);
      const actualizado = await editarMenu(id, data);
      setMenus(prev => prev.map(m => m.id === id ? actualizado : m));
      setMenuEditar(null);
      sileo.success({ title: 'Menú actualizado ' });
    } catch {
      sileo.error({ title: 'Error al editar menú' });
    } finally {
      setGuardando(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    try {
      await desactivarMenu(id);
      setMenus(prev => prev.map(m => m.id === id ? { ...m, activo: false } : m));
      sileo.success({ title: 'Menú desactivado' });
    } catch {
      sileo.error({ title: 'Error al desactivar menú' });
    }
  };

  const handleReactivar = async (id: number) => {
    try {
      const actualizado = await reactivarMenu(id);
      setMenus(prev => prev.map(m => m.id === id ? actualizado : m));
      sileo.success({ title: 'Menú reactivado ' });
    } catch {
      sileo.error({ title: 'Error al reactivar menú' });
    }
  };

  const handleDuplicar = async (id: number, fecha: string) => {
    try {
      setGuardando(true);
      const nuevo = await duplicarMenu(id, fecha);
      setMenus(prev => [nuevo, ...prev]);
      sileo.success({ title: 'Menú duplicado ' });
    } catch (err: unknown) {
      sileo.error({ title: getMensajeError(err, 'Error al duplicar menú') });
    } finally {
      setGuardando(false);
    }
  };

  return {
    menus, menuHoy, historial,
    loading, guardando,
    menuEditar, setMenuEditar,
    mostrarForm, setMostrarForm,
    mostrarHistorial, setMostrarHistorial,
    handleCrear, handleEditar,
    handleDesactivar, handleReactivar, handleDuplicar,
  };
}
