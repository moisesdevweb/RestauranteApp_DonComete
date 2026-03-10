'use client';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import { getMesas } from '@/modules/mesero/services/mesa.service';
import { crearOrden, getOrdenMesa, agregarItems, enviarACocina } from '@/modules/mesero/services/orden.service';
import { getProductos, getCategorias, getMenuHoy } from '@/modules/mesero/services/producto.service';
import { usePedidoStore } from '@/modules/mesero/store/pedido.store';
import { Mesa, Producto, Categoria, MenuDiario, Comensal, DetalleOrden } from '@/types';

export interface SeleccionMenu {
  entrada: string;
  fondo: string;
  nota: string;
}

export function useMesaPedido(mesaId: number) {
  const { ordenId, items, setOrdenId, agregarItem, quitarItem, limpiar, totalItems, totalPrecio, itemsPorComensal } = usePedidoStore();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [comensales, setComensales] = useState<Comensal[]>([]);
  const [comensalActivo, setComensalActivo] = useState(0);
  const [numComensales, setNumComensales] = useState(1);
  const [nombreCliente, setNombreCliente] = useState('');
  const [itemsYaEnviados, setItemsYaEnviados] = useState<(DetalleOrden & { nombreProducto: string; numeroComensal: number })[]>([]);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [menuHoy, setMenuHoy] = useState<MenuDiario | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [tabActivo, setTabActivo] = useState<'carta' | 'menu'>('carta');

  const [productoModal, setProductoModal] = useState<Producto | null>(null);
  const [ordenCreada, setOrdenCreada] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // ── Carga inicial ──────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      const [todasMesas, prods, cats, menu] = await Promise.all([
        getMesas(), getProductos(), getCategorias(), getMenuHoy(),
      ]);
      const mesaEncontrada = todasMesas.find(m => m.id === mesaId);
      setMesa(mesaEncontrada || null);
      setProductos(prods);
      setCategorias(cats);
      setMenuHoy(menu);

      if (mesaEncontrada?.estado !== 'libre') {
        const ordenExistente = await getOrdenMesa(mesaId);
        if (ordenExistente) {
          setOrdenId(ordenExistente.id);
          setComensales(ordenExistente.comensales || []);
          setOrdenCreada(true);
          const yaEnviados = (ordenExistente.comensales || []).flatMap((c: Comensal) =>
            (c.detalles || []).map((d: DetalleOrden) => ({
              ...d,
              nombreProducto: d.producto?.nombre || 'Menú del Día',
              numeroComensal: c.numero,
            }))
          );
          setItemsYaEnviados(yaEnviados);
        }
      }
    };
    cargar();
    limpiar();
  }, [mesaId, limpiar, setOrdenId]);

  // ── Sync comensales locales ────────────────────────────
  useEffect(() => {
    if (!ordenCreada) {
      const nuevos = Array.from({ length: numComensales }, (_, i) => ({
        id: -(i + 1), ordenId: 0, nombre: null, numero: i + 1,
      }));
      setComensales(nuevos as unknown as Comensal[]);
    }
  }, [numComensales, ordenCreada]);

  // ── Productos filtrados ────────────────────────────────
  const productosFiltrados = categoriaActiva
    ? productos.filter(p => p.categoriaId === categoriaActiva)
    : productos;

  // ── Handlers ──────────────────────────────────────────
  const handleAgregarProducto = (producto: Producto, nota: string) => {
    const comensal = comensales[comensalActivo];
    if (!comensal) return;
    agregarItem({
      comensalId: comensal.id,
      tipo: 'carta',
      productoId: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad: 1,
      nota: nota || undefined,
    });
    setProductoModal(null);
    sileo.success({ title: `${producto.nombre} agregado ✓` });
  };

  const handleAgregarMenu = (seleccion: SeleccionMenu) => {
    const comensal = comensales[comensalActivo];
    if (!comensal || !menuHoy) return;
    agregarItem({
      comensalId: comensal.id,
      tipo: 'menu_dia',
      menuDiarioId: menuHoy.id,
      nombre: `Menú: ${seleccion.entrada} + ${seleccion.fondo}`,
      precio: Number(menuHoy.precio),
      cantidad: 1,
      nota: seleccion.nota || undefined,
    });
    sileo.success({ title: 'Menú del día agregado ✓' });
  };

  const handleEnviarCocina = async () => {
  if (items.length === 0) {
    sileo.error({ title: 'Agrega al menos un item' });
    return;
  }
  setEnviando(true);
  try {
    let idOrden = ordenId;

    if (!idOrden) {
      const nuevaOrden = await crearOrden(
        mesaId,
        comensales.map(c => ({ nombre: c.nombre || undefined, numero: c.numero }))
      );
      idOrden = nuevaOrden.orden.id;
      const comensalesReales = nuevaOrden.comensales;
      setOrdenId(idOrden!);
      setOrdenCreada(true);
      setComensales(comensalesReales); // ← actualiza comensales con IDs reales

      const itemsMapeados = items.map(item => {
        const indexComensal = comensales.findIndex(c => c.id === item.comensalId);
        return {
          comensalId: comensalesReales[indexComensal]?.id || comensalesReales[0].id,
          tipo: item.tipo,
          productoId: item.productoId,
          menuDiarioId: item.menuDiarioId,
          cantidad: item.cantidad,
          nota: item.nota,
        };
      });
      await agregarItems(idOrden!, itemsMapeados);
    } else {
      const itemsMapeados = items.map(item => ({
        comensalId: item.comensalId,
        tipo: item.tipo,
        productoId: item.productoId,
        menuDiarioId: item.menuDiarioId,
        cantidad: item.cantidad,
        nota: item.nota,
      }));
      await agregarItems(idOrden, itemsMapeados);
    }

    await enviarACocina(idOrden!);

    // ← Actualiza itemsYaEnviados con los nuevos para mostrarlos en el carrito
    const ordenActualizada = await getOrdenMesa(mesaId);
    if (ordenActualizada) {
      const yaEnviados = (ordenActualizada.comensales || []).flatMap((c: Comensal) =>
        (c.detalles || []).map((d: DetalleOrden) => ({
          ...d,
          nombreProducto: d.producto?.nombre || 'Menú del Día',
          numeroComensal: c.numero,
        }))
      );
      setItemsYaEnviados(yaEnviados);
    }

    sileo.success({
      title: '¡Orden enviada a cocina! 🍽️',
      description: `Mesa ${mesa?.numero} · ${items.length} items nuevos`,
    });

    limpiar(); // limpia solo el carrito local, NO redirige

  } catch {
    sileo.error({ title: 'Error al enviar la orden' });
  } finally {
    setEnviando(false);
  }
};


  return {
    // Estado mesa
    mesa, ordenCreada, enviando, nombreCliente, setNombreCliente,
    ordenId, 
    // Comensales
    comensales, comensalActivo, setComensalActivo, numComensales, setNumComensales,
    itemsYaEnviados,
    // Productos
    productos, categorias, menuHoy, categoriaActiva, setCategoriaActiva,
    tabActivo, setTabActivo, productosFiltrados,
    // Modal
    productoModal, setProductoModal,
    // Store
    items, totalItems, totalPrecio, itemsPorComensal, quitarItem,
    // Handlers
    handleAgregarProducto, handleAgregarMenu, handleEnviarCocina,
  };

}
