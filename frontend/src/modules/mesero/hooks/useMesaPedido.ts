'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { sileo } from 'sileo';
import { getMesas } from '@/modules/mesero/services/mesa.service';
import { crearOrden, getOrdenMesa, agregarItems, enviarACocina } from '@/modules/mesero/services/orden.service';
import { getProductos, getCategorias, getMenuHoy } from '@/modules/mesero/services/producto.service';
import { usePedidoStore } from '@/modules/mesero/store/pedido.store';
import { Mesa, Producto, Categoria, MenuDiario, Comensal, DetalleOrden } from '@/types';

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
  const {
    ordenId, items, setOrdenId, agregarItem, quitarItem,
    limpiar, limpiarItems, totalItems, totalPrecio, itemsPorComensal,
  } = usePedidoStore();

  const [mesa, setMesa]                       = useState<Mesa | null>(null);
  const [comensales, setComensales]           = useState<Comensal[]>([]);
  const [comensalActivo, setComensalActivo]   = useState(0);
  const [numComensales, setNumComensales]     = useState(1);
  const [nombreCliente, setNombreCliente]     = useState('');
  const [itemsYaEnviados, setItemsYaEnviados] = useState<DetalleConNombre[]>([]);
  const [productos, setProductos]             = useState<Producto[]>([]);
  const [categorias, setCategorias]           = useState<Categoria[]>([]);
  const [menuHoy, setMenuHoy]                 = useState<MenuDiario | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [tabActivo, setTabActivo]             = useState<'carta' | 'menu'>('carta');
  const [productoModal, setProductoModal]     = useState<Producto | null>(null);
  const [ordenCreada, setOrdenCreada]         = useState(false);
  const [enviando, setEnviando]               = useState(false);

  useSocket({
    'orden:item_listo': (data: unknown) => {
      const detalle = data as DetalleConNombre;
      setItemsYaEnviados(prev =>
        prev.map(i => (i.id === detalle.id ? { ...i, estado: detalle.estado } : i))
      );
      if (detalle.estado === 'listo') {
        sileo.action({
          title: 'Item listo',
          description: `Mesa ${mesa?.numero} · ${detalle.nombreProducto || ''}`,
        });
      }
    },
  });

  // ── Carga inicial ──────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      limpiar();
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
              nombreProducto: d.producto?.nombre || 'Menu del Dia',
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
    sileo.success({ title: `${producto.nombre} agregado` });
  };

  const handleAgregarMenu = (seleccion: SeleccionMenu) => {
    const comensal = comensales[comensalActivo];
    if (!comensal || !menuHoy) return;
    agregarItem({
      comensalId: comensal.id,
      tipo: 'menu_dia',
      menuDiarioId: menuHoy.id,
      nombre: `Menu: ${seleccion.entrada} + ${seleccion.fondo}`,
      precio: Number(menuHoy.precio),
      cantidad: 1,
      nota: seleccion.nota || undefined,
    });
    sileo.success({ title: 'Menu del dia agregado' });
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
        setComensales(comensalesReales);

        const itemsMapeados = items.map(item => {
          const indexComensal = comensales.findIndex(c => c.id === item.comensalId);
          return {
            comensalId:   comensalesReales[indexComensal]?.id || comensalesReales[0].id,
            tipo:         item.tipo,
            productoId:   item.productoId,
            menuDiarioId: item.menuDiarioId,
            cantidad:     item.cantidad,
            nota:         item.nota,
          };
        });
        await agregarItems(idOrden!, itemsMapeados);
      } else {
        const itemsMapeados = items.map(item => {
          const comensalReal = comensales.find(c => c.id === item.comensalId) || comensales[0];
          return {
            comensalId:   comensalReal.id,
            tipo:         item.tipo,
            productoId:   item.productoId,
            menuDiarioId: item.menuDiarioId,
            cantidad:     item.cantidad,
            nota:         item.nota,
          };
        });
        await agregarItems(idOrden, itemsMapeados);
      }

      await enviarACocina(idOrden!);

      const ordenActualizada = await getOrdenMesa(mesaId);
      if (ordenActualizada) {
        const yaEnviados = (ordenActualizada.comensales || []).flatMap((c: Comensal) =>
          (c.detalles || []).map((d: DetalleOrden) => ({
            ...d,
            nombreProducto: d.producto?.nombre || 'Menu del Dia',
            numeroComensal: c.numero,
          }))
        );
        setItemsYaEnviados(yaEnviados);
      }

      sileo.success({
        title: 'Orden enviada a cocina',
        description: `Mesa ${mesa?.numero} · ${items.length} items nuevos`,
      });

      limpiarItems(); // conserva ordenId, solo vacia el carrito

    } catch {
      sileo.error({ title: 'Error al enviar la orden' });
    } finally {
      setEnviando(false);
    }
  };

  return {
    mesa, ordenCreada, enviando, nombreCliente, setNombreCliente,
    ordenId,
    comensales, comensalActivo, setComensalActivo, numComensales, setNumComensales,
    itemsYaEnviados,
    productos, categorias, menuHoy, categoriaActiva, setCategoriaActiva,
    tabActivo, setTabActivo, productosFiltrados,
    productoModal, setProductoModal,
    items, totalItems, totalPrecio, itemsPorComensal, quitarItem,
    handleAgregarProducto, handleAgregarMenu, handleEnviarCocina,
  };
}
