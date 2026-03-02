import { Request, Response } from 'express';
import { Pago, DetallePago, Orden, Comensal, DetalleOrden, Mesa, Producto, MenuDiario } from '../models';
import { EstadoOrden, EstadoMesa, MetodoPago } from '../types/enums';
import { parseId } from '../utils/parseId';

// GET /api/pagos/orden/:ordenId — ver resumen de cuenta antes de pagar
export const getCuenta = async (req: Request, res: Response): Promise<void> => {
  try {
    const ordenId = parseId(req.params.ordenId);
    if (!ordenId) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const orden = await Orden.findByPk(ordenId, {
      include: [
        { model: Mesa, as: 'mesa' },
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

    if (!orden) { res.status(404).json({ ok: false, message: 'Orden no encontrada' }); return; }

    // Calcular total
    let subtotal = 0;
    orden.comensales.forEach(comensal => {
      comensal.detalles.forEach(detalle => {
        subtotal += Number(detalle.precioUnitario) * detalle.cantidad;
      });
    });

    res.json({ ok: true, data: { orden, subtotal, total: subtotal } });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener cuenta' });
  }
};

// POST /api/pagos — registrar pago y cerrar mesa
export const registrarPago = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ordenId, descuento, metodospago } = req.body;
    // metodospago = [
    //   { metodo: 'efectivo', monto: 50, montoPagado: 100 },
    //   { metodo: 'yape', monto: 30 }
    // ]

    if (!ordenId || !metodospago || !metodospago.length) {
      res.status(400).json({ ok: false, message: 'OrdenId y métodos de pago son requeridos' });
      return;
    }

    const orden = await Orden.findByPk(ordenId, {
      include: [
        {
          model: Comensal,
          as: 'comensales',
          include: [{ model: DetalleOrden, as: 'detalles' }],
        },
      ],
    });

    if (!orden) { res.status(404).json({ ok: false, message: 'Orden no encontrada' }); return; }
    if (orden.estado === EstadoOrden.PAGADA) {
      res.status(400).json({ ok: false, message: 'Esta orden ya fue pagada' });
      return;
    }

    // Calcular subtotal
    let subtotal = 0;
    orden.comensales.forEach(comensal => {
      comensal.detalles.forEach(detalle => {
        subtotal += Number(detalle.precioUnitario) * detalle.cantidad;
      });
    });

    const descuentoMonto = descuento || 0;
    const total = subtotal - descuentoMonto;

    // Verificar que los montos cuadren
    const totalPagado = metodospago.reduce((sum: number, m: any) => sum + Number(m.monto), 0);
    if (Math.abs(totalPagado - total) > 0.01) {
      res.status(400).json({
        ok: false,
        message: `Los montos no cuadran. Total: S/.${total}, Pagado: S/.${totalPagado}`,
      });
      return;
    }

    // Validar métodos de pago
    for (const m of metodospago) {
      if (!Object.values(MetodoPago).includes(m.metodo)) {
        res.status(400).json({ ok: false, message: `Método de pago inválido: ${m.metodo}` });
        return;
      }
    }

    // Crear el pago
    const pago = await Pago.create({ ordenId, subtotal, descuento: descuentoMonto, total });

    // Crear detalle por cada método de pago
    await Promise.all(
      metodospago.map((m: any) => {
        const vuelto = m.metodo === MetodoPago.EFECTIVO && m.montoPagado
          ? Number(m.montoPagado) - Number(m.monto)
          : null;

        return DetallePago.create({
          pagoId: pago.id,
          metodo: m.metodo,
          monto: m.monto,
          montoPagado: m.metodo === MetodoPago.EFECTIVO ? m.montoPagado || null : null,
          vuelto,
        });
      })
    );

    // Cerrar orden y liberar mesa
    await orden.update({ estado: EstadoOrden.PAGADA, cerradoEn: new Date() });
    await Mesa.update({ estado: EstadoMesa.LIBRE }, { where: { id: orden.mesaId } });

    // Obtener pago completo con detalles
    const pagoCompleto = await Pago.findByPk(pago.id, {
      include: [{ model: DetallePago, as: 'detalles' }],
    });

    res.status(201).json({ ok: true, data: pagoCompleto, message: 'Pago registrado, mesa liberada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al registrar pago' });
  }
};