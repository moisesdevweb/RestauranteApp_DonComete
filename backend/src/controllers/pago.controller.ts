import { Request, Response } from 'express';
import {
  Pago, DetallePago, Orden, Mesa,
  Comensal, DetalleOrden, Producto, MenuDiario,
} from '../models';
import { CodigoDescuento } from '../models/CodigoDescuento';
import { AuditAccion } from '../models/AuditLog';
import { audit } from '../services/audit.service';
import { EstadoOrden, EstadoMesa, MetodoPago } from '../types/enums';
import { parseId } from '../utils/parseId';
import { emitEstadoMesa } from '../sockets/orden.socket';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pagos
// Cobra una orden completa:
//   1. Valida que la orden exista y no esté ya pagada
//   2. Aplica código de descuento si se mandó (y consume un uso)
//   3. Verifica que la suma de pagos cubra el total
//   4. Crea la cabecera Pago y sus DetallePago (uno por método)
//   5. Cierra la orden y libera la mesa
//   6. Emite socket para actualizar el mapa de mesas en tiempo real
//   7. Registra en audit log quién cobró, cuánto y con qué método
// Roles: mesero, admin
// ─────────────────────────────────────────────────────────────────────────────
export const cobrarOrden = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ordenId, descuento: descuentoManual = 0, codigoDescuento, pagos } = req.body;

    if (!ordenId || !pagos?.length) {
      res.status(400).json({ ok: false, message: 'ordenId y pagos son requeridos' });
      return;
    }

    // ── Cargar la orden con todos sus items ──
    const orden = await Orden.findByPk(ordenId, {
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

    if (!orden) { res.status(404).json({ ok: false, message: 'Orden no encontrada' }); return; }
    if (orden.estado === EstadoOrden.PAGADA) {
      res.status(409).json({ ok: false, message: 'Esta orden ya fue cobrada' });
      return;
    }

    // ── Calcular subtotal desde los detalles (precio snapshot) ──
    const todosDetalles: DetalleOrden[] = orden.comensales.flatMap(c => c.detalles);
    const subtotal = todosDetalles.reduce(
      (acc, d) => acc + Number(d.precioUnitario) * d.cantidad, 0
    );

    // ── Resolver descuento: código > manual ──
    let montoDescuento = Number(descuentoManual) || 0;
    let codigoUsado: CodigoDescuento | null = null;

    if (codigoDescuento?.trim()) {
      const codigo = await CodigoDescuento.findOne({
        where: { codigo: codigoDescuento.trim().toUpperCase(), activo: true },
      });

      if (!codigo) {
        res.status(400).json({ ok: false, message: 'Código de descuento inválido o inactivo' });
        return;
      }
      if (codigo.fechaExpira && new Date() > codigo.fechaExpira) {
        res.status(400).json({ ok: false, message: 'El código de descuento ha expirado' });
        return;
      }
      if (codigo.usosMaximos !== null && codigo.usosActuales >= codigo.usosMaximos) {
        res.status(400).json({ ok: false, message: 'El código ya alcanzó su límite de usos' });
        return;
      }

      montoDescuento = codigo.tipo === 'porcentaje'
        ? (subtotal * Number(codigo.valor)) / 100
        : Number(codigo.valor);

      montoDescuento = Math.min(montoDescuento, subtotal); // no puede ser mayor al total
      codigoUsado = codigo;
    }

    const total = Math.max(0, subtotal - montoDescuento);

    // ── Validar que los pagos cubran el total ──
    const sumaPagos = pagos.reduce(
      (acc: number, p: { monto: number }) => acc + Number(p.monto), 0
    );
    if (sumaPagos < total - 0.01) {
      res.status(400).json({
        ok: false,
        message: `El monto pagado (S/. ${sumaPagos.toFixed(2)}) no cubre el total (S/. ${total.toFixed(2)})`,
      });
      return;
    }

    // ── Validar métodos de pago ──
    for (const p of pagos) {
      if (!Object.values(MetodoPago).includes(p.metodo)) {
        res.status(400).json({ ok: false, message: `Método de pago inválido: ${p.metodo}` });
        return;
      }
      if (Number(p.monto) <= 0) {
        res.status(400).json({ ok: false, message: 'El monto de cada método debe ser mayor a 0' });
        return;
      }
    }

    // ── Crear cabecera de pago ──
    const pago = await Pago.create({ ordenId, subtotal, descuento: montoDescuento, total });

    // ── Crear detalle por cada método de pago ──
    await Promise.all(
      pagos.map((p: {
        metodo: string;
        monto: number;
        montoPagado?: number;
        vuelto?: number;
      }) => {
        const vueltoCalculado = p.metodo === MetodoPago.EFECTIVO && p.montoPagado
          ? Math.max(0, Number(p.montoPagado) - Number(p.monto))
          : null;

        return DetallePago.create({
          pagoId:      pago.id,
          metodo:      p.metodo,
          monto:       Number(p.monto),
          montoPagado: p.metodo === MetodoPago.EFECTIVO ? (p.montoPagado ?? null) : null,
          vuelto:      vueltoCalculado,
        });
      })
    );

    // ── Consumir uso del código de descuento ──
    if (codigoUsado) {
      await codigoUsado.increment('usosActuales');
    }

    // ── Cerrar orden y liberar mesa ──
    await orden.update({ estado: EstadoOrden.PAGADA, cerradoEn: new Date() });
    await Mesa.update({ estado: EstadoMesa.LIBRE }, { where: { id: orden.mesaId } });

    // Notificar a todos los clientes del mapa de mesas
    const mesaActualizada = await Mesa.findByPk(orden.mesaId);
    if (mesaActualizada) emitEstadoMesa(mesaActualizada);

    // ── Retornar pago completo con todos los datos para la boleta ──
    const pagoCompleto = await Pago.findByPk(pago.id, {
      include: [
        { model: DetallePago, as: 'detalles' },
        {
          model: Orden, as: 'orden',
          include: [
            { model: Mesa, as: 'mesa' },
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
          ],
        },
      ],
    });

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.ORDEN_COBRADA,
      entidad:   'pagos',
      entidadId: pago.id,
      userId:    req.user!.id,
      antes:     null,
      despues:   { pagoId: pago.id, ordenId, subtotal, descuento: montoDescuento, total },
      meta: {
        mesero:          req.user!.nombre ?? req.user!.username,
        mesa:            mesaActualizada?.numero,
        metodos:         pagos.map((p: { metodo: string; monto: number }) => `${p.metodo}: S/.${p.monto}`),
        codigoDescuento: codigoUsado?.codigo ?? null,
      },
    });

    res.status(201).json({ ok: true, data: pagoCompleto });
  } catch (err) {
    console.error('[Pago] cobrarOrden:', err);
    res.status(500).json({ ok: false, message: 'Error al cobrar orden' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pagos/:id
// Retorna el pago completo con la orden, los items y los métodos de pago.
// Usado para reimprimir boleta o consultar historial.
// ─────────────────────────────────────────────────────────────────────────────
export const getPago = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const pago = await Pago.findByPk(id, {
      include: [
        { model: DetallePago, as: 'detalles' },
        {
          model: Orden, as: 'orden',
          include: [
            { model: Mesa, as: 'mesa' },
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
          ],
        },
      ],
    });

    if (!pago) { res.status(404).json({ ok: false, message: 'Pago no encontrado' }); return; }
    res.json({ ok: true, data: pago });
  } catch (err) {
    console.error('[Pago] getPago:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener pago' });
  }
};