'use client';
import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import { Categoria } from '@/modules/admin/types/admin.types';
import { CategoriaPayload, getCategorias, crearCategoria, editarCategoria, eliminarCategoria } from '@/modules/admin/services/categoria.service';

type AxiosError = { response?: { data?: { message?: string } } };
const getErrMsg = (err: unknown, fallback: string) =>
  (err as AxiosError)?.response?.data?.message ?? fallback;

export function useCategorias() {
  const [categorias, setCategorias]         = useState<Categoria[]>([]);
  const [loading, setLoading]               = useState(true);
  const [guardando, setGuardando]           = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState<Categoria | null>(null);
  const [modalAbierto, setModalAbierto]     = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch {
      sileo.error({ title: 'Error al cargar categorías' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardar = async (data: CategoriaPayload) => {
    setGuardando(true);
    try {
      if (categoriaEditar) {
        const actualizada = await editarCategoria(categoriaEditar.id, data);
        setCategorias(prev => prev.map(c => c.id === categoriaEditar.id ? actualizada : c));
        sileo.success({ title: 'Categoría actualizada' });
      } else {
        const nueva = await crearCategoria(data);
        setCategorias(prev => [...prev, nueva]);
        sileo.success({ title: 'Categoría creada' });
      }
      setModalAbierto(false);
      setCategoriaEditar(null);
    } catch (err) {
      sileo.error({ title: getErrMsg(err, categoriaEditar ? 'Error al actualizar categoría' : 'Error al crear categoría') });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarCategoria(id);
      setCategorias(prev => prev.filter(c => c.id !== id));
      sileo.success({ title: 'Categoría eliminada' });
    } catch (err) {
      sileo.error({ title: getErrMsg(err, 'Error al eliminar categoría') });
    }
  };

  const abrirCrear  = () => { setCategoriaEditar(null); setModalAbierto(true); };
  const abrirEditar = (cat: Categoria) => { setCategoriaEditar(cat); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setCategoriaEditar(null); };

  return {
    categorias, loading, guardando,
    categoriaEditar, modalAbierto,
    handleGuardar, handleEliminar,
    abrirCrear, abrirEditar, cerrarModal,
  };
}