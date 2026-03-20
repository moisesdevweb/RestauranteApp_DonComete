'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { sileo } from 'sileo';
import { getMesas } from '@/modules/mesero/services/mesa.service';
import { crearOrden, getOrdenMesa, agregarItems, enviarACocina } from '@/modules/mesero/services/orden.service';
import { getProductos, getCategorias, getMenuHoy } from '@/modules/mesero/services/producto.service';
import { usePedidoStore } from '@/modules/mesero/store/pedido.store';
import { Mesa, Producto, Categoria, MenuDiario, Comensal, DetalleOrden } from '@/types';

// extend DetalleOrden with extra fields used locally
interface DetalleConNombre extends DetalleOrden {
  nombreProducto: string;
  numeroComensal: number;
}

export interface SeleccionMenu {
  entrada: string;
  fondo: string;
  nota: string;
}

export function useMesaPedido(mesaId: number) {
  const { ordenId, items, setOrdenId, agregarItem, quitarItem, limpiar, limpiarItems, totalItems, totalPrecio, itemsPorComensal } = usePedidoStore();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [comensales, setComensales] = useState<Comensal[]>([]);
  const [comensalActivo, setComensalActivo] = useState(0);
  const [numComensales, setNumComensales] = useState(1);
  const [nombreCliente, setNombreCliente] = useState('');
  const [itemsYaEnviados, setItemsYaEnviados] = useState<DetalleConNombre[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [menuHoy, setMenuHoy] = useState<MenuDiario | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [tabActivo, setTabActivo] = useState<'carta' | 'menu'>('carta');

  const [productoModal, setProductoModal] = useState<Producto | null>(null);
  const [ordenCreada, setOrdenCreada] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Socket: alertas de stock bajo y estado de items
  useSocket({
    // Admin canceló un item desde el panel — actualizar carrito y carta del mesero
    'orden:item_cancelado': (data: unknown) => {
      const payload = data as { 
        itemId: number; 
        ordenId: number; 
        productoId: number | null;
        agotado: boolean;
        stock?: number | null; 
      };

      // Quitar el item de los ya enviados si está en esta mesa
      setItemsYaEnviados(prev => prev.filter(i => i.id !== payload.itemId));

      // Actualizar el stock del producto visualmente en la carta
      if (payload.productoId) {
        setProductos(prev => prev.map(p => {
          if (p.id === payload.productoId) {
            return {
              ...p,
              agotado: payload.agotado,
              stock: payload.stock !== undefined && payload.stock !== null ? payload.stock : p.stock
            };
          }
          return p;
        }));
      }

      sileo.action({
        title: '❌ Item cancelado',
        description: 'Un admin canceló un item de esta orden',
      });
    },

    // Alerta cuando un producto llega al stock mínimo o se agota
    'producto:stock_bajo': (data: unknown) => {
      const alerta = data as { id: number; nombre: string; stock: number; stockMinimo: number; agotado: boolean };

      // Actualizar el producto en el estado local para que el badge cambie en tiempo real
      setProductos(prev => prev.map(p =>
        p.id === alerta.id
          ? { ...p, stock: alerta.stock, agotado: alerta.agotado }
          : p
      ));

      if (alerta.agotado) {
        sileo.error({
          title: `${alerta.nombre} se agotó`,
          description: 'El producto ya no está disponible para pedir',
        });
      } else {
        sileo.action({
          title: `⚠️ Stock bajo: ${alerta.nombre}`,
          description: `Solo quedan ${alerta.stock} units`,
        });
      }
    },
    'orden:item_listo': (data: unknown) => {
      // el API sólo envía el detalle actualizado, puede incluir campos adicionales
      const detalle = data as DetalleConNombre;
      // sólo actuamos si la orden actual contiene ese item
      setItemsYaEnviados(prev =>
        prev.map(i => (i.id === detalle.id ? { ...i, estado: detalle.estado } : i))
      );

      // notificación rápida para el mesero
      if (detalle.estado === 'listo') {
        sileo.action({
          title: '🍽️ Item listo',
          description: `Mesa ${mesa?.numero} · ${detalle.nombreProducto || ''}`,
        });
      }
    },
  });
  // ── Carga inicial ──────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      limpiar(); // limpiar carrito antes del await para evitar race condition con ordenId
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
      // La nota combina entrada+fondo (obligatorio para cocina) con la nota
      // personal del comensal (opcional). Formato: "Entrada + Fondo | nota extra"
      nota: seleccion.nota?.trim()
        ? `${seleccion.entrada} + ${seleccion.fondo} | ${seleccion.nota.trim()}`
        : `${seleccion.entrada} + ${seleccion.fondo}`,
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

      limpiarItems(); // limpia solo items del carrito, preserva ordenId para seguir agregando

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