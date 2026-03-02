import { Request, Response } from 'express';
import { Mesa } from '../models';
import { EstadoMesa } from '../types/enums';
import { parseId } from '../utils/parseId';
import { emitEstadoMesa } from '../sockets/orden.socket';
export const getMesas = async (req: Request, res: Response): Promise<void> => {
  try {
    const mesas = await Mesa.findAll({
      where: { activo: true },
      order: [['piso', 'ASC'], ['numero', 'ASC']],
    });
    res.json({ ok: true, data: mesas });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener mesas' });
  }
};

export const crearMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { numero, piso, capacidad } = req.body;
    if (!numero || !piso) {
      res.status(400).json({ ok: false, message: 'Número y piso son requeridos' });
      return;
    }
    const mesa = await Mesa.create({ numero, piso, capacidad: capacidad || 4 });
    res.status(201).json({ ok: true, data: mesa });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al crear mesa' });
  }
};

export const editarMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ ok: false, message: 'ID inválido' });
      return;
    }
    const mesa = await Mesa.findByPk(id);
    if (!mesa) {
      res.status(404).json({ ok: false, message: 'Mesa no encontrada' });
      return;
    }
    const { numero, piso, capacidad } = req.body;
    await mesa.update({ numero, piso, capacidad });
    res.json({ ok: true, data: mesa });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al editar mesa' });
  }
};

export const cambiarEstadoMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ ok: false, message: 'ID inválido' });
      return;
    }
    const mesa = await Mesa.findByPk(id);
    if (!mesa) {
      res.status(404).json({ ok: false, message: 'Mesa no encontrada' });
      return;
    }
    const { estado } = req.body;
    if (!Object.values(EstadoMesa).includes(estado)) {
      res.status(400).json({ ok: false, message: 'Estado inválido' });
      return;
    }
    await mesa.update({ estado });
    emitEstadoMesa(mesa);  // ← emit a todos los conectados
    res.json({ ok: true, data: mesa });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al cambiar estado' });
  }
};

export const desactivarMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ ok: false, message: 'ID inválido' });
      return;
    }
    const mesa = await Mesa.findByPk(id);
    if (!mesa) {
      res.status(404).json({ ok: false, message: 'Mesa no encontrada' });
      return;
    }
    await mesa.update({ activo: false });
    res.json({ ok: true, message: 'Mesa desactivada' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al desactivar mesa' });
  }
};