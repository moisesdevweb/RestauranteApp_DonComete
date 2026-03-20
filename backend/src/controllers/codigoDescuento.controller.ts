import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { CodigoDescuento } from '../models';
import { parseId } from '../utils/parseId';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/descuentos
// Lista todos los códigos. Admin/encargado lo usan en el panel.
// ─────────────────────────────────────────────────────────────────────────────
export const getCodigos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const codigos = await CodigoDescuento.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ ok: true, data: codigos });
  } catch (err) {
    console.error('[Descuento] getCodigos:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener códigos' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/descuentos/validar
// El mesero ingresa un código al cobrar — valida si aplica y retorna el monto.
// No consume el uso todavía (eso se hace al confirmar el pago).
// ─────────────────────────────────────────────────────────────────────────────
export const validarCodigo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codigo, subtotal } = req.body;

    if (!codigo?.trim()) {
      res.status(400).json({ ok: false, message: 'Código requerido' });
      return;
    }

    const descuento = await CodigoDescuento.findOne({
      where: { codigo: codigo.trim().toUpperCase(), activo: true },
    });

    if (!descuento) {
      res.status(404).json({ ok: false, message: 'Código no válido o inactivo' });
      return;
    }

    // Verificar vencimiento
    if (descuento.fechaExpira && new Date() > descuento.fechaExpira) {
      res.status(400).json({ ok: false, message: 'Este código ha expirado' });
      return;
    }

    // Verificar usos
    if (descuento.usosMaximos !== null && descuento.usosActuales >= descuento.usosMaximos) {
      res.status(400).json({ ok: false, message: 'Este código ya alcanzó su límite de usos' });
      return;
    }

    // Calcular monto de descuento
    const montoDescuento = descuento.tipo === 'porcentaje'
      ? (Number(subtotal) * Number(descuento.valor)) / 100
      : Number(descuento.valor);

    res.json({
      ok: true,
      data: {
        codigo:          descuento.codigo,
        descripcion:     descuento.descripcion,
        tipo:            descuento.tipo,
        valor:           descuento.valor,
        montoDescuento:  Math.min(montoDescuento, Number(subtotal)), // no puede superar el total
      },
    });
  } catch (err) {
    console.error('[Descuento] validarCodigo:', err);
    res.status(500).json({ ok: false, message: 'Error al validar código' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/descuentos
// Admin/encargado crea un nuevo código.
// ─────────────────────────────────────────────────────────────────────────────
export const crearCodigo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codigo, descripcion, tipo, valor, usosMaximos, fechaExpira } = req.body;

    if (!codigo || !tipo || valor === undefined) {
      res.status(400).json({ ok: false, message: 'Código, tipo y valor son requeridos' });
      return;
    }
    if (!['porcentaje', 'monto_fijo'].includes(tipo)) {
      res.status(400).json({ ok: false, message: 'Tipo inválido: porcentaje o monto_fijo' });
      return;
    }
    if (tipo === 'porcentaje' && (Number(valor) <= 0 || Number(valor) > 100)) {
      res.status(400).json({ ok: false, message: 'El porcentaje debe estar entre 1 y 100' });
      return;
    }
    if (tipo === 'monto_fijo' && Number(valor) <= 0) {
      res.status(400).json({ ok: false, message: 'El monto debe ser mayor a 0' });
      return;
    }

    const nuevo = await CodigoDescuento.create({
      codigo:      codigo.trim().toUpperCase(),
      descripcion: descripcion?.trim() || null,
      tipo,
      valor:       Number(valor),
      usosMaximos: usosMaximos ? Number(usosMaximos) : null,
      fechaExpira: fechaExpira ? new Date(fechaExpira) : null,
      activo:      true,
    });

    res.status(201).json({ ok: true, data: nuevo });
  } catch (err: unknown) {
    if ((err as any)?.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ ok: false, message: `El código "${req.body.codigo}" ya existe` });
      return;
    }
    console.error('[Descuento] crearCodigo:', err);
    res.status(500).json({ ok: false, message: 'Error al crear código' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/descuentos/:id
// ─────────────────────────────────────────────────────────────────────────────
export const editarCodigo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const codigo = await CodigoDescuento.findByPk(id);
    if (!codigo) { res.status(404).json({ ok: false, message: 'Código no encontrado' }); return; }

    const { descripcion, tipo, valor, usosMaximos, fechaExpira, activo } = req.body;

    await codigo.update({
      descripcion: descripcion !== undefined ? descripcion?.trim() || null : codigo.descripcion,
      tipo:        tipo        !== undefined ? tipo                        : codigo.tipo,
      valor:       valor       !== undefined ? Number(valor)               : codigo.valor,
      usosMaximos: usosMaximos !== undefined ? (usosMaximos ? Number(usosMaximos) : null) : codigo.usosMaximos,
      fechaExpira: fechaExpira !== undefined ? (fechaExpira ? new Date(fechaExpira) : null) : codigo.fechaExpira,
      activo:      activo      !== undefined ? Boolean(activo)             : codigo.activo,
    });

    res.json({ ok: true, data: codigo });
  } catch (err) {
    console.error('[Descuento] editarCodigo:', err);
    res.status(500).json({ ok: false, message: 'Error al editar código' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/descuentos/:id — desactiva el código
// ─────────────────────────────────────────────────────────────────────────────
export const eliminarCodigo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const codigo = await CodigoDescuento.findByPk(id);
    if (!codigo) { res.status(404).json({ ok: false, message: 'Código no encontrado' }); return; }

    await codigo.update({ activo: false });
    res.json({ ok: true, message: 'Código desactivado' });
  } catch (err) {
    console.error('[Descuento] eliminarCodigo:', err);
    res.status(500).json({ ok: false, message: 'Error al eliminar código' });
  }
};