'use client';
import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import { Mesa } from '@/modules/admin/types/admin.types';
import { getMesas, crearMesa, editarMesa, desactivarMesa, cambiarEstadoMesa, reactivarMesa } from '@/modules/admin/services/mesa.service';

export function useMesas() {
  const [mesas, setMesas]               = useState<Mesa[]>([]);
  const [loading, setLoading]           = useState(true);
  const [guardando, setGuardando]       = useState(false);
  const [mesaEditar, setMesaEditar]     = useState<Mesa | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  const cargar = useCallback(async (mostrarInactivas = false) => {
    try {
      const data = await getMesas(mostrarInactivas);
      setMesas(data);
    } catch {
      sileo.error({ title: 'Error al cargar mesas' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    cargar(filtroEstado !== 'activos'); 
  }, [cargar, filtroEstado]);

  const handleGuardar = async (data: { numero: number; piso: number; capacidad: number }) => {
    setGuardando(true);
    try {
      if (mesaEditar) {
        const actualizada = await editarMesa(mesaEditar.id, data);
        setMesas(prev => prev.map(m => m.id === mesaEditar.id ? actualizada : m));
        sileo.success({ title: 'Mesa actualizada ' });
      } else {
        const nueva = await crearMesa(data);
        setMesas(prev => [...prev, nueva]);
        sileo.success({ title: 'Mesa creada ' });
      }
      setModalAbierto(false);
      setMesaEditar(null);
    } catch {
      sileo.error({ title: 'Error al guardar mesa' });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await desactivarMesa(id);
      setMesas(prev => prev.filter(m => m.id !== id));
      sileo.success({ title: 'Mesa eliminada' });
    } catch (err: unknown) {
      // axios-like error structure without using `any`
      type AxiosError = { response?: { data?: { message?: string } } };
      const msg = (err as AxiosError)?.response?.data?.message || 'Error al eliminar mesa';
      sileo.error({ title: msg });
    }
  };

  const handleCambiarEstado = async (mesa: Mesa, nuevoEstado: string) => {
    try {
      const actualizada = await cambiarEstadoMesa(mesa.id, nuevoEstado);
      setMesas(prev => prev.map(m => m.id === mesa.id ? actualizada : m));
      sileo.success({ title: 'Estado de mesa actualizado' });
    } catch (err: unknown) {
      type AxiosError = { response?: { data?: { message?: string } } };
      const msg = (err as AxiosError)?.response?.data?.message || 'No se pudo cambiar estado';
      sileo.error({ title: msg });
    }
  };

  const abrirCrear = () => { setMesaEditar(null); setModalAbierto(true); };
  const abrirEditar = (mesa: Mesa) => { setMesaEditar(mesa); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setMesaEditar(null); };

  const handleReactivar = async (id: number) => {
    try {
      const act = await reactivarMesa(id);
      setMesas(prev => prev.map(m => m.id === id ? act : m));
      sileo.success({ title: 'Mesa reactivada' });
    } catch (err: unknown) {
      type AxiosError = { response?: { data?: { message?: string } } };
      const msg = (err as AxiosError)?.response?.data?.message || 'No se pudo reactivar mesa';
      sileo.error({ title: msg });
    }
  };

  const pisos = [...new Set(mesas.map(m => m.piso))].sort();

  // Filtrar mesas según el estado seleccionado
  const mesasFiltradas = filtroEstado === 'todos' 
    ? mesas 
    : filtroEstado === 'activos' 
      ? mesas.filter(m => m.activo) 
      : mesas.filter(m => !m.activo);

  return {
    mesas: mesasFiltradas, loading, guardando,
    mesaEditar, modalAbierto,
    pisos,
    filtroEstado, setFiltroEstado,
    handleGuardar, handleEliminar, handleCambiarEstado, handleReactivar,
    abrirCrear, abrirEditar, cerrarModal,
  };
}
