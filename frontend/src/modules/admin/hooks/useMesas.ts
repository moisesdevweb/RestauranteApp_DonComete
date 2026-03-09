'use client';
import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import { Mesa } from '@/modules/admin/types/admin.types';
import { getMesas, crearMesa, editarMesa, desactivarMesa } from '@/modules/admin/services/mesa.service';

export function useMesas() {
  const [mesas, setMesas]               = useState<Mesa[]>([]);
  const [loading, setLoading]           = useState(true);
  const [guardando, setGuardando]       = useState(false);
  const [mesaEditar, setMesaEditar]     = useState<Mesa | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await getMesas();
      setMesas(data);
    } catch {
      sileo.error({ title: 'Error al cargar mesas' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

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
    } catch {
      sileo.error({ title: 'Error al eliminar mesa' });
    }
  };

  const abrirCrear = () => { setMesaEditar(null); setModalAbierto(true); };
  const abrirEditar = (mesa: Mesa) => { setMesaEditar(mesa); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setMesaEditar(null); };

  const pisos = [...new Set(mesas.map(m => m.piso))].sort();

  return {
    mesas, loading, guardando,
    mesaEditar, modalAbierto,
    pisos,
    handleGuardar, handleEliminar,
    abrirCrear, abrirEditar, cerrarModal,
  };
}
