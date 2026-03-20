import { Request, Response } from 'express';
import { Orden, Comensal, DetalleOrden, Mesa, Producto, MenuDiario, User } from '../models';
import { AuditAccion } from '../models/AuditLog';
import { audit } from '../services/audit.service';
import { EstadoOrden, EstadoMesa, EstadoDetalle } from '../types/enums';
import { parseId } from '../utils/parseId';
import { emitNuevaOrden, emitItemListo, emitEstadoMesa, emitStockBajo, emitItemCancelado } from '../sockets/orden.socket';

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
          if (!esDirecto) return;

          await d.update({ estado: EstadoDetalle.LISTO });

          // ── Descuento de stock para productos DIRECTOS ──
          // Se hace aquí porque nunca pasan por cocina ni por marcarItemListo.
          if (d.productoId) {
            const prod = await Producto.findByPk(d.productoId);
            if (prod && prod.stock !== null) {
              const stockNuevo   = Math.max(0, (prod.stock as number) - d.cantidad);
              const agotadoNuevo = stockNuevo === 0;
              await prod.update({ stock: stockNuevo, agotado: agotadoNuevo });
              console.log(`[Stock-Directo] ${prod.nombre}: ${prod.stock} → ${stockNuevo}`);
              if (stockNuevo <= (prod.stockMinimo ?? 3)) {
                emitStockBajo({ id: prod.id, nombre: prod.nombre, stock: stockNuevo, stockMinimo: prod.stockMinimo, agotado: agotadoNuevo });
              }
            }
          }
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
// Si el producto tiene stock activo, descuenta las unidades vendidas.
// Si el stock llega al mínimo o a 0, emite alerta en tiempo real.
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

    // ── Descuento de stock automático ──────────────────────────────────────
    // Solo aplica a productos de carta con stock activo (stock !== null).
    // IMPORTANTE: recargar el producto directamente desde BD después del update
    // del detalle — Sequelize puede perder la relación cargada en la instancia.
    if (detalle.tipo === 'carta' && detalle.productoId) {
      const producto = await Producto.findByPk(detalle.productoId);

      // Solo descontar stock de productos que SÍ van a cocina (requiereCocina=true)
      // Los productos directos ya descontaron su stock en enviarACocina
      if (producto && producto.stock !== null && producto.requiereCocina) {
        const stockActual  = producto.stock as number;
        const stockNuevo   = Math.max(0, stockActual - detalle.cantidad);
        const agotadoNuevo = stockNuevo === 0;

        await producto.update({ stock: stockNuevo, agotado: agotadoNuevo });
        console.log(`[Stock-Cocina] ${producto.nombre}: ${stockActual} → ${stockNuevo}`);

        // Emitir alerta si llegó al mínimo o se agotó
        if (stockNuevo <= (producto.stockMinimo ?? 3)) {
          emitStockBajo({
            id:          producto.id,
            nombre:      producto.nombre,
            stock:       stockNuevo,
            stockMinimo: producto.stockMinimo,
            agotado:     agotadoNuevo,
          });
        }
      }
    }

    // Notifica al mesero que este item está listo
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ordenes
// Lista órdenes con filtro de fecha, estado y mesero. Para el panel admin.
// Query: ?fecha=YYYY-MM-DD  ?estado=pagada  ?meseroId=N
// Roles: admin, encargado
// ─────────────────────────────────────────────────────────────────────────────
export const getOrdenes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha, estado, meseroId } = req.query;

    const where: Record<string, unknown> = {};

    if (estado) {
      where.estado = estado;
    }
    if (meseroId) {
      where.userId = parseInt(meseroId as string);
    }

    // Si se pasa fecha, filtrar por cerradoEn (pagadas) o createdAt (abiertas)
    if (fecha) {
      const OFFSET_MS = 5 * 60 * 60 * 1000;
      const desde = new Date(new Date((fecha as string) + 'T00:00:00.000Z').getTime() + OFFSET_MS);
      const hasta  = new Date(new Date((fecha as string) + 'T23:59:59.999Z').getTime() + OFFSET_MS);
      where.createdAt = { [require('sequelize').Op.between]: [desde, hasta] };
    }

    const ordenes = await Orden.findAll({
      where,
      include: [
        { model: Mesa, as: 'mesa' },
        { model: User, as: 'mesero', attributes: ['id', 'nombre', 'username'] },
        {
          model: Comensal, as: 'comensales',
          include: [{
            model: DetalleOrden, as: 'detalles',
            include: [
              { model: Producto,   as: 'producto'   },
              { model: MenuDiario, as: 'menuDiario' },
            ],
          }],
        },
        {
          model: (require('../models')).Pago, as: 'pago',
          include: [{ model: (require('../models')).DetallePago, as: 'detalles' }],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    res.json({ ok: true, data: ordenes });
  } catch (err) {
    console.error('[Orden] getOrdenes:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener órdenes' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/ordenes/items/:itemId
// Admin/encargado cancela un item de una orden activa.
// Si el producto tiene stock activo, se repone automáticamente.
// Solo se puede cancelar si la orden no está pagada.
// Roles: admin, encargado
// ─────────────────────────────────────────────────────────────────────────────
export const cancelarItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.itemId);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const detalle = await DetalleOrden.findByPk(id, {
      include: [{ model: Producto, as: 'producto' }],
    });
    if (!detalle) { res.status(404).json({ ok: false, message: 'Item no encontrado' }); return; }

    // Verificar que la orden no esté pagada
    const orden = await Orden.findByPk(detalle.ordenId);
    if (!orden) { res.status(404).json({ ok: false, message: 'Orden no encontrada' }); return; }
    if (orden.estado === EstadoOrden.PAGADA) {
      res.status(409).json({ ok: false, message: 'No se puede cancelar un item de una orden ya cobrada' });
      return;
    }

    const estadoAnterior = detalle.get({ plain: true });

    // Reponer stock si el producto lo tiene activo
    let stockRepuesto: number | null = null; // <-- Variable añadida para el socket
    
    if (detalle.tipo === 'carta' && detalle.productoId) {
      const producto = await Producto.findByPk(detalle.productoId);
      if (producto && producto.stock !== null) {
        const stockNuevo = (producto.stock as number) + detalle.cantidad;
        await producto.update({
          stock:   stockNuevo,
          agotado: false, // si tenía stock 0, ya no está agotado
        });
        stockRepuesto = stockNuevo; // <-- Guardamos el valor
        console.log(`[Stock] Repuesto por cancelación: ${producto.nombre} → ${stockNuevo}`);
      }
    }

    // Eliminar el item de la orden
    await detalle.destroy();

    // Notificar al mesero en tiempo real — actualiza el carrito y la carta
    emitItemCancelado({
      itemId:     id,
      ordenId:    detalle.ordenId,
      productoId: detalle.productoId,
      agotado:    false, // el stock ya fue repuesto arriba si aplica
      stock:      stockRepuesto, // <-- Enviamos el nuevo stock al frontend
    });

    await audit({
      accion:    AuditAccion.ORDEN_CANCELADA,
      entidad:   'detalle_orden',
      entidadId: id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   null,
      meta: {
        canceladoPor: req.user!.nombre ?? req.user!.username,
        ordenId:      detalle.ordenId,
        motivo:       req.body.motivo ?? 'Cancelado desde panel admin',
      },
    });

    res.json({ ok: true, message: 'Item cancelado correctamente' });
  } catch (err) {
    console.error('[Orden] cancelarItem:', err);
    res.status(500).json({ ok: false, message: 'Error al cancelar item' });
  }
};