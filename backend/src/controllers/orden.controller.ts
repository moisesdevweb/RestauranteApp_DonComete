import { Request, Response } from 'express';
import { Orden, Comensal, DetalleOrden, Mesa, Producto, MenuDiario } from '../models';
import { EstadoOrden, EstadoMesa, EstadoDetalle } from '../types/enums';
import { parseId } from '../utils/parseId';
import { emitNuevaOrden } from '../sockets/orden.socket';
import { emitItemListo } from '../sockets/orden.socket';
// POST /api/ordenes — crear orden para una mesa
export const crearOrden = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mesaId, nombreCliente, comensales } = req.body;

    // comensales = [{ nombre: 'Ana', numero: 1 }, { nombre: null, numero: 2 }]
    if (!mesaId || !comensales || !comensales.length) {
      res.status(400).json({ ok: false, message: 'Mesa y comensales son requeridos' });
      return;
    }

    // Verificar que la mesa exista y esté libre o reservada
    const mesa = await Mesa.findByPk(mesaId);
    if (!mesa) { res.status(404).json({ ok: false, message: 'Mesa no encontrada' }); return; }
    if (mesa.estado !== EstadoMesa.LIBRE && mesa.estado !== EstadoMesa.RESERVADA) {
      res.status(400).json({ ok: false, message: 'La mesa no está disponible' });
      return;
    }

    // Crear la orden
    const orden = await Orden.create({
      mesaId,
      userId: req.user!.id,
      nombreCliente: nombreCliente || null,
      estado: EstadoOrden.ABIERTA,
    });

    // Crear los comensales
    const comensalesCreados = await Promise.all(
      comensales.map((c: { nombre?: string; numero: number }) =>
        Comensal.create({
          ordenId: orden.id,
          nombre: c.nombre || null,
          numero: c.numero,
        })
      )
    );

    // Cambiar estado de mesa a ocupada (quita reserva si la había)
    await mesa.update({ estado: EstadoMesa.OCUPADA });

    res.status(201).json({
      ok: true,
      data: { orden, comensales: comensalesCreados },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al crear orden' });
  }
};

// POST /api/ordenes/:id/items — agregar items a una orden
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
    // items = [
    //   { comensalId: 1, tipo: 'carta', productoId: 3, cantidad: 1, nota: 'sin cebolla' },
    //   { comensalId: 2, tipo: 'menu_dia', menuDiarioId: 1, cantidad: 1, nota: null }
    // ]

    if (!items || !items.length) {
      res.status(400).json({ ok: false, message: 'Items son requeridos' });
      return;
    }

    const detalles = await Promise.all(
      items.map(async (item: any) => {
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
          ordenId: id,
          comensalId: item.comensalId,
          tipo: item.tipo,
          productoId: item.tipo === 'carta' ? item.productoId : null,
          menuDiarioId: item.tipo === 'menu_dia' ? item.menuDiarioId : null,
          cantidad: item.cantidad || 1,
          precioUnitario,
          nota: item.nota || null,
          estado: EstadoDetalle.PENDIENTE,
        });
      })
    );

    res.status(201).json({ ok: true, data: detalles });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message || 'Error al agregar items' });
  }
};

// PATCH /api/ordenes/:id/enviar — enviar orden a cocina
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
      res.status(400).json({ ok: false, message: 'No se puede enviar esta orden' }); return;
    }

    // Marcar automáticamente como LISTO los que NO requieren cocina
    const todosDetalles: DetalleOrden[] = orden.comensales.flatMap(c => c.detalles);

    await Promise.all(todosDetalles
      .filter(d => d.estado === EstadoDetalle.PENDIENTE)
      .map(async d => {
        // menu_dia siempre va a cocina
        // carta: depende del campo requiereCocina del producto
        const noCocina = d.tipo === 'carta' && d.producto && !d.producto.requiereCocina;
        if (noCocina) {
          await d.update({ estado: EstadoDetalle.LISTO });
        }
      })
    );

    await orden.update({ estado: EstadoOrden.EN_COCINA });

    // Recargar completo para emitir solo los que SÍ van a cocina
    const ordenCompleta = await Orden.findByPk(id, {
      include: [
        { model: Mesa, as: 'mesa' },
        {
          model: Comensal, as: 'comensales',
          include: [{
            model: DetalleOrden, as: 'detalles',
            where: { estado: EstadoDetalle.PENDIENTE }, // solo pendientes a cocina
            required: false,
            include: [
              { model: Producto, as: 'producto' },
              { model: MenuDiario, as: 'menuDiario' },
            ],
          }],
        },
      ],
    });

    emitNuevaOrden(ordenCompleta);
    res.json({ ok: true, data: orden, message: 'Orden enviada a cocina' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al enviar a cocina' });
  }
};


// GET /api/ordenes/cocina — ver pedidos pendientes (vista cocina)
export const getOrdenescocina = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ordenes = await Orden.findAll({
      where: { estado: EstadoOrden.EN_COCINA },
      include: [
        {
          model: Mesa,
          as: 'mesa',
        },
        {
          model: Comensal,
          as: 'comensales',
          include: [
            {
              model: DetalleOrden,
              as: 'detalles',
              required: false,
              include: [
                { model: Producto, as: 'producto' },
                { model: MenuDiario, as: 'menuDiario' },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json({ ok: true, data: ordenes });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener órdenes de cocina' });
  }
};

// PATCH /api/ordenes/items/:itemId/listo — cocina marca item como listo
export const marcarItemListo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.itemId);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const detalle = await DetalleOrden.findByPk(id);
    if (!detalle) { res.status(404).json({ ok: false, message: 'Item no encontrado' }); return; }

    await detalle.update({ estado: EstadoDetalle.LISTO });

    // Aquí después agregaremos el emit de Socket.io
    // io.emit('orden:item_listo', detalle);
    emitItemListo(detalle);  // ← emit a meseros
    res.json({ ok: true, data: detalle, message: 'Item marcado como listo' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al marcar item' });
  }
};

// GET /api/ordenes/mesa/:mesaId — ver orden activa de una mesa (vista mesero)
export const getOrdenMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const mesaId = parseId(req.params.mesaId);
    if (!mesaId) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const orden = await Orden.findOne({
      where: {
        mesaId,
        estado: [EstadoOrden.ABIERTA, EstadoOrden.EN_COCINA],
      },
      include: [
        {
          model: Comensal,
          as: 'comensales',
          include: [
            {
              model: DetalleOrden,
              as: 'detalles',
              include: [
                { model: Producto, as: 'producto' },
                { model: MenuDiario, as: 'menuDiario' },
              ],
            },
          ],
        },
      ],
    });

    if (!orden) {
      res.status(404).json({ ok: false, message: 'No hay orden activa para esta mesa' });
      return;
    }

    res.json({ ok: true, data: orden });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener orden' });
  }
};