import { Request, Response } from 'express';
import { Orden, Comensal, DetalleOrden, Mesa, Producto, MenuDiario, User } from '../models';
import { AuditAccion } from '../models/AuditLog';
import { audit } from '../services/audit.service';
import { EstadoOrden, EstadoMesa, EstadoDetalle } from '../types/enums';
import { parseId } from '../utils/parseId';
import { emitNuevaOrden, emitItemListo, emitEstadoMesa } from '../sockets/orden.socket';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ordenes
// Crea una nueva orden para una mesa libre o reservada.
// Genera los comensales asociados y cambia el estado de la mesa a OCUPADA.
// Roles: mesero, admin
// ─────────────────────────────────────────────────────────────────────────────
export const crearOrden = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mesaId, nombreCliente, comensales } = req.body;

    if (!mesaId || !comensales?.length) {
      res.status(400).json({ ok: false, message: 'Mesa y comensales son requeridos' });
      return;
    }

    const mesa = await Mesa.findByPk(mesaId);
    if (!mesa) { res.status(404).json({ ok: false, message: 'Mesa no encontrada' }); return; }
    if (mesa.estado !== EstadoMesa.LIBRE && mesa.estado !== EstadoMesa.RESERVADA) {
      res.status(409).json({ ok: false, message: 'La mesa no está disponible' });
      return;
    }

    const orden = await Orden.create({
      mesaId,
      userId:        req.user!.id,
      nombreCliente: nombreCliente || null,
      estado:        EstadoOrden.ABIERTA,
    });

    const comensalesCreados = await Promise.all(
      comensales.map((c: { nombre?: string; numero: number }) =>
        Comensal.create({
          ordenId: orden.id,
          nombre:  c.nombre || null,
          numero:  c.numero,
        })
      )
    );

    await mesa.update({ estado: EstadoMesa.OCUPADA });

    // ── Auditoría: quién abrió la orden y en qué mesa ──
    await audit({
      accion:    AuditAccion.ORDEN_CREADA,
      entidad:   'ordenes',
      entidadId: orden.id,
      userId:    req.user!.id,
      antes:     null,
      despues:   { ordenId: orden.id, mesaId, comensales: comensalesCreados.length },
      meta: {
        mesero:    req.user!.nombre ?? req.user!.username,
        mesa:      mesa.numero,
        comensales: comensalesCreados.length,
      },
    });

    res.status(201).json({
      ok: true,
      data: { orden, comensales: comensalesCreados },
    });
  } catch (err) {
    console.error('[Orden] crearOrden:', err);
    res.status(500).json({ ok: false, message: 'Error al crear orden' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ordenes/:id/items
// Agrega items a una orden abierta o en cocina.
// Calcula el precio en el momento del pedido para preservar el historial
// aunque el precio del producto cambie en el futuro.
// Roles: mesero, admin
// ─────────────────────────────────────────────────────────────────────────────
export const agregarItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const orden = await Orden.findByPk(id);
    if (!orden) { res.status(404).json({ ok: false, message: 'Orden no encontrada' }); return; }
    if (orden.estado !== EstadoOrden.ABIERTA && orden.estado !== EstadoOrden.EN_COCINA) {
      res.status(400).json({ ok: false, message: 'No se pueden agregar items a esta orden' });
      return;
    }

    const { items } = req.body;
    if (!items?.length) {
      res.status(400).json({ ok: false, message: 'Items son requeridos' });
      return;
    }

    const detalles = await Promise.all(
      items.map(async (item: {
        comensalId: number;
        tipo: 'carta' | 'menu_dia';
        productoId?: number;
        menuDiarioId?: number;
        cantidad?: number;
        nota?: string;
      }) => {
        let precioUnitario = 0;

        if (item.tipo === 'carta') {
          const producto = await Producto.findByPk(item.productoId);
          if (!producto) throw new Error(`Producto ${item.productoId} no encontrado`);
          precioUnitario = Number(producto.precio);
        } else if (item.tipo === 'menu_dia') {
          const menu = await MenuDiario.findByPk(item.menuDiarioId);
          if (!menu) throw new Error(`Menú del día ${item.menuDiarioId} no encontrado`);
          precioUnitario = Number(menu.precio);
        }

        return DetalleOrden.create({
          ordenId:      id,
          comensalId:   item.comensalId,
          tipo:         item.tipo,
          productoId:   item.tipo === 'carta'    ? item.productoId    : null,
          menuDiarioId: item.tipo === 'menu_dia' ? item.menuDiarioId  : null,
          cantidad:     item.cantidad || 1,
          precioUnitario,
          nota:         item.nota || null,
          estado:       EstadoDetalle.PENDIENTE,
        });
      })
    );

    res.status(201).json({ ok: true, data: detalles });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al agregar items';
    console.error('[Orden] agregarItems:', err);
    res.status(500).json({ ok: false, message: msg });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/ordenes/:id/enviar
// Envía la orden a cocina:
//   1. Marca como LISTO automáticamente los items que NO requieren cocina
//      (ej: gaseosas, agua — el mesero los sirve directamente)
//   2. Cambia el estado de la orden a EN_COCINA
//   3. Emite socket 'orden:nueva' con solo los items pendientes (los que sí van a cocina)
// Roles: mesero, admin
// ─────────────────────────────────────────────────────────────────────────────
export const enviarACocina = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const orden = await Orden.findByPk(id, {
      include: [{
        model: Comensal, as: 'comensales',
        include: [{
          model: DetalleOrden, as: 'detalles',
          include: [{ model: Producto, as: 'producto' }],
        }],
      }],
    });

    if (!orden) { res.status(404).json({ ok: false, message: 'Orden no encontrada' }); return; }
    if (orden.estado !== EstadoOrden.ABIERTA && orden.estado !== EstadoOrden.EN_COCINA) {
      res.status(400).json({ ok: false, message: 'No se puede enviar esta orden' });
      return;
    }

    const todosDetalles: DetalleOrden[] = orden.comensales.flatMap(c => c.detalles);

    // Marcar directo (sin cocina) los items de productos con requiereCocina=false
    // El menú del día SIEMPRE va a cocina — no tiene campo requiereCocina
    await Promise.all(
      todosDetalles
        .filter(d => d.estado === EstadoDetalle.PENDIENTE)
        .map(async d => {
          const esDirecto = d.tipo === 'carta' && d.producto && !d.producto.requiereCocina;
          if (esDirecto) await d.update({ estado: EstadoDetalle.LISTO });
        })
    );

    await orden.update({ estado: EstadoOrden.EN_COCINA });

    // Recargar con solo los items que SÍ van a cocina para el emit
    const ordenParaCocina = await Orden.findByPk(id, {
      include: [
        { model: Mesa, as: 'mesa' },
        {
          model: Comensal, as: 'comensales',
          include: [{
            model: DetalleOrden, as: 'detalles',
            where: { estado: EstadoDetalle.PENDIENTE },
            required: false,
            include: [
              { model: Producto,    as: 'producto'   },
              { model: MenuDiario,  as: 'menuDiario' },
            ],
          }],
        },
      ],
    });

    emitNuevaOrden(ordenParaCocina);

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.ORDEN_ENVIADA,
      entidad:   'ordenes',
      entidadId: orden.id,
      userId:    req.user!.id,
      antes:     null,
      despues:   { ordenId: orden.id, estado: EstadoOrden.EN_COCINA },
      meta: {
        mesero:      req.user!.nombre ?? req.user!.username,
        itemsTotales: todosDetalles.length,
        itemsACocina: todosDetalles.filter(d => d.estado === EstadoDetalle.PENDIENTE).length,
        itemsDirectos: todosDetalles.filter(d => d.tipo === 'carta' && d.producto && !d.producto.requiereCocina).length,
      },
    });

    res.json({ ok: true, data: orden, message: 'Orden enviada a cocina' });
  } catch (err) {
    console.error('[Orden] enviarACocina:', err);
    res.status(500).json({ ok: false, message: 'Error al enviar a cocina' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ordenes/cocina
// Vista de cocina: todas las órdenes en estado EN_COCINA ordenadas por antigüedad.
// Solo muestra los detalles pendientes — los ya listos no aparecen en pantalla.
// Roles: cocina, admin
// ─────────────────────────────────────────────────────────────────────────────
export const getOrdenescocina = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ordenes = await Orden.findAll({
      where: { estado: EstadoOrden.EN_COCINA },
      include: [
        { model: Mesa, as: 'mesa' },
        {
          model: Comensal, as: 'comensales',
          include: [{
            model: DetalleOrden, as: 'detalles',
            required: false,
            include: [
              { model: Producto,   as: 'producto'   },
              { model: MenuDiario, as: 'menuDiario' },
            ],
          }],
        },
      ],
      order: [['createdAt', 'ASC']], // los más antiguos primero — mayor urgencia
    });

    res.json({ ok: true, data: ordenes });
  } catch (err) {
    console.error('[Orden] getOrdenescocina:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener órdenes de cocina' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/ordenes/items/:itemId/listo
// Cocina marca un item como listo.
// Emite 'orden:item_listo' al mesero para actualizar su carrito en tiempo real.
// Roles: cocina, admin
// ─────────────────────────────────────────────────────────────────────────────
export const marcarItemListo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.itemId);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const detalle = await DetalleOrden.findByPk(id, {
      include: [{ model: Producto, as: 'producto' }],
    });
    if (!detalle) { res.status(404).json({ ok: false, message: 'Item no encontrado' }); return; }
    if (detalle.estado === EstadoDetalle.LISTO) {
      res.status(409).json({ ok: false, message: 'El item ya estaba marcado como listo' });
      return;
    }

    await detalle.update({ estado: EstadoDetalle.LISTO });

    // Notifica al mesero en tiempo real que este item ya está listo
    emitItemListo(detalle);

    res.json({ ok: true, data: detalle, message: 'Item marcado como listo' });
  } catch (err) {
    console.error('[Orden] marcarItemListo:', err);
    res.status(500).json({ ok: false, message: 'Error al marcar item' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ordenes/mesa/:mesaId
// Retorna la orden activa (ABIERTA o EN_COCINA) de una mesa.
// Incluye todos los detalles con producto y menú para que el mesero
// pueda ver el historial completo del pedido.
// Roles: mesero, admin
// ─────────────────────────────────────────────────────────────────────────────
export const getOrdenMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const mesaId = parseId(req.params.mesaId);
    if (!mesaId) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const orden = await Orden.findOne({
      where: {
        mesaId,
        estado: [EstadoOrden.ABIERTA, EstadoOrden.EN_COCINA],
      },
      include: [{
        model: Comensal, as: 'comensales',
        include: [{
          model: DetalleOrden, as: 'detalles',
          include: [
            { model: Producto,   as: 'producto'   },
            { model: MenuDiario, as: 'menuDiario' },
          ],
        }],
      }],
    });

    if (!orden) {
      res.status(404).json({ ok: false, message: 'No hay orden activa para esta mesa' });
      return;
    }

    res.json({ ok: true, data: orden });
  } catch (err) {
    console.error('[Orden] getOrdenMesa:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener orden' });
  }
};