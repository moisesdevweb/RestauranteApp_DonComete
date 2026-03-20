import { Request, Response } from 'express';
import { ConfigQR } from '../models';
import { MetodoPago } from '../types/enums';
import { subirImagen, eliminarImagen } from '../services/cloudinary.service';

// Métodos que admiten QR (los digitales)
const METODOS_QR = [MetodoPago.YAPE, MetodoPago.PLIN, MetodoPago.TRANSFERENCIA];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/config-qr
// Retorna todos los QR configurados. El mesero los carga al abrir el modal de cobro.
// ─────────────────────────────────────────────────────────────────────────────
export const getQRs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const qrs = await ConfigQR.findAll({
      where: { activo: true },
      order: [['metodo', 'ASC']],
    });
    res.json({ ok: true, data: qrs });
  } catch (err) {
    console.error('[ConfigQR] getQRs:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener QRs' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/config-qr
// Admin sube o reemplaza el QR de un método.
// Si ya existe uno para ese método, lo reemplaza (elimina el anterior de Cloudinary).
// ─────────────────────────────────────────────────────────────────────────────
export const subirQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { metodo, titular, numero } = req.body;

    if (!metodo || !METODOS_QR.includes(metodo as MetodoPago)) {
      res.status(400).json({
        ok: false,
        message: `Método inválido. Debe ser: ${METODOS_QR.join(', ')}`,
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ ok: false, message: 'Imagen QR requerida' });
      return;
    }

    // Subir nueva imagen a Cloudinary
    const resultado = await subirImagen(req.file.buffer, `qr-${metodo}`);

    // Si ya existe uno para ese método, eliminar el anterior de Cloudinary
    const existente = await ConfigQR.findOne({ where: { metodo } });
    if (existente?.imagenPublicId) {
      await eliminarImagen(existente.imagenPublicId);
    }

    const qr = existente
      ? await existente.update({
          imagenUrl:      resultado.url,
          imagenPublicId: resultado.publicId,
          titular:        titular?.trim() || null,
          numero:         numero?.trim()  || null,
          activo:         true,
        })
      : await ConfigQR.create({
          metodo,
          imagenUrl:      resultado.url,
          imagenPublicId: resultado.publicId,
          titular:        titular?.trim() || null,
          numero:         numero?.trim()  || null,
          activo:         true,
        });

    res.status(201).json({ ok: true, data: qr });
  } catch (err) {
    console.error('[ConfigQR] subirQR:', err);
    res.status(500).json({ ok: false, message: 'Error al subir QR' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/config-qr/:metodo — desactiva el QR de un método
// ─────────────────────────────────────────────────────────────────────────────
export const eliminarQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { metodo } = req.params;

    const qr = await ConfigQR.findOne({ where: { metodo } });
    if (!qr) { res.status(404).json({ ok: false, message: 'QR no encontrado' }); return; }

    await qr.update({ activo: false });
    res.json({ ok: true, message: `QR de ${metodo} desactivado` });
  } catch (err) {
    console.error('[ConfigQR] eliminarQR:', err);
    res.status(500).json({ ok: false, message: 'Error al eliminar QR' });
  }
};