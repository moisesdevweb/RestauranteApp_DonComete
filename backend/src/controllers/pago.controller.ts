import { Request, Response } from 'express';
import { Pago, DetallePago, Orden, Mesa, Comensal, DetalleOrden, Producto, MenuDiario } from '../models';
import { EstadoOrden, EstadoMesa, MetodoPago } from '../types/enums';
import { parseId } from '../utils/parseId';
import { emitEstadoMesa } from '../sockets/orden.socket';

// POST /api/pagos — cobrar una orden
export const cobrarOrden = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ordenId, descuento = 0, pagos } = req.body;
    // pagos = [{ metodo: 'efectivo', monto: 30 }, { metodo: 'yape', monto: 20 }]

    if (!ordenId || !pagos || !pagos.length) {
      res.status(400).json({ ok: false, message: 'ordenId y pagos son requeridos' }); return;
    }

    const orden = await Orden.findByPk(ordenId, {
      include: [{
        model: Comensal, as: 'comensales',
        include: [{ model: DetalleOrden, as: 'detalles',
          include: [
            { model: Producto, as: 'producto' },
            { model: MenuDiario, as: 'menuDiario' },
          ],
        }],
      }],
    });

    if (!orden) { res.status(404).json({ ok: false, message: 'Orden no encontrada' }); return; }
    if (orden.estado === EstadoOrden.PAGADA) {
      res.status(400).json({ ok: false, message: 'Esta orden ya fue cobrada' }); return;
    }

    // Calcular subtotal desde los detalles
    const todosDetalles: DetalleOrden[] = orden.comensales.flatMap(c => c.detalles);
    const subtotal = todosDetalles.reduce((acc, d) => acc + Number(d.precioUnitario) * d.cantidad, 0);
    const total = subtotal - Number(descuento);

    // Validar que la suma de pagos cubra el total
    const sumaPagos = pagos.reduce((acc: number, p: { monto: number }) => acc + Number(p.monto), 0);
    if (sumaPagos < total) {
      res.status(400).json({ ok: false, message: `El monto pagado (S/. ${sumaPagos.toFixed(2)}) no cubre el total (S/. ${total.toFixed(2)})` }); return;
    }

    // Crear cabecera de pago
    const pago = await Pago.create({ ordenId, subtotal, descuento, total });

    // Crear detalles por método
    await Promise.all(
      pagos.map((p: { metodo: string; monto: number }) =>
        DetallePago.create({ pagoId: pago.id, metodo: p.metodo, monto: p.monto })
      )
    );

        // Cerrar orden y liberar mesa
    await orden.update({ estado: EstadoOrden.PAGADA });
    await Mesa.update({ estado: EstadoMesa.LIBRE }, { where: { id: orden.mesaId } });

    // Emitir estado actualizado de la mesa a todos
    const mesaActualizada = await Mesa.findByPk(orden.mesaId);
    if (mesaActualizada) emitEstadoMesa(mesaActualizada);

    // Retornar pago completo con detalles
    const pagoCompleto = await Pago.findByPk(pago.id, {
      include: [{ model: DetallePago, as: 'detalles' }],
    });

    res.status(201).json({ ok: true, data: pagoCompleto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al cobrar orden' });
  }
};

// GET /api/pagos/:id — obtener pago con boleta
export const getPago = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const pago = await Pago.findByPk(id, {
      include: [
        {
          model: Orden, as: 'orden',
          include: [
            { model: Mesa, as: 'mesa' },
            {
              model: Comensal, as: 'comensales',
              include: [{
                model: DetalleOrden, as: 'detalles',
                include: [
                  { model: Producto, as: 'producto' },
                  { model: MenuDiario, as: 'menuDiario' },
                ],
              }],
            },
          ],
        },
        { model: DetallePago, as: 'detalles' },
      ],
    });

    if (!pago) { res.status(404).json({ ok: false, message: 'Pago no encontrado' }); return; }
    res.json({ ok: true, data: pago });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener pago' });
  }
};
