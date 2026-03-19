'use client';
import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import { Producto, Categoria } from '@/modules/admin/types/admin.types';
import { getProductos, crearProducto, editarProducto, eliminarProducto, toggleAgotado } from '@/modules/admin/services/producto.service';
import { getCategorias } from '@/modules/admin/services/categoria.service';

type AxiosError = { response?: { data?: { message?: string } } };
const getErrMsg = (err: unknown, fallback: string) =>
  (err as AxiosError)?.response?.data?.message ?? fallback;

export function useProductos() {
  const [productos, setProductos]           = useState<Producto[]>([]);
  const [categorias, setCategorias]         = useState<Categoria[]>([]);
  const [loading, setLoading]               = useState(true);
  const [guardando, setGuardando]           = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [modalAbierto, setModalAbierto]     = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([getProductos(), getCategorias()]);
      setProductos(prods);
      setCategorias(cats);
    } catch {
      sileo.error({ title: 'Error al cargar productos' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardar = async (form: FormData) => {
    setGuardando(true);
    try {
      if (productoEditar) {
        const actualizado = await editarProducto(productoEditar.id, form);
        setProductos(prev => prev.map(p => p.id === productoEditar.id ? actualizado : p));
        sileo.success({ title: 'Producto actualizado' });
      } else {
        const nuevo = await crearProducto(form);
        setProductos(prev => [...prev, nuevo]);
        sileo.success({ title: 'Producto creado' });
      }
      setModalAbierto(false);
      setProductoEditar(null);
    } catch (err) {
      sileo.error({ title: getErrMsg(err, productoEditar ? 'Error al actualizar producto' : 'Error al crear producto') });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarProducto(id);
      setProductos(prev => prev.filter(p => p.id !== id));
      sileo.success({ title: 'Producto eliminado' });
    } catch (err) {
      sileo.error({ title: getErrMsg(err, 'Error al eliminar producto') });
    }
  };

  const handleToggleAgotado = async (id: number) => {
    try {
      const actualizado = await toggleAgotado(id);
      setProductos(prev => prev.map(p => p.id === id ? actualizado : p));
    } catch (err) {
      sileo.error({ title: getErrMsg(err, 'Error al actualizar estado') });
    }
  };

  const abrirCrear  = () => { setProductoEditar(null); setModalAbierto(true); };
  const abrirEditar = (p: Producto) => { setProductoEditar(p); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setProductoEditar(null); };

  const productosFiltrados = categoriaFiltro
    ? productos.filter(p => p.categoriaId === categoriaFiltro)
    : productos;

  return {
    productos: productosFiltrados, categorias, loading, guardando,
    productoEditar, modalAbierto, categoriaFiltro, setCategoriaFiltro,
    handleGuardar, handleEliminar, handleToggleAgotado,
    abrirCrear, abrirEditar, cerrarModal,
  };
}