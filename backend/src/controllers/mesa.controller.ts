import { Request, Response } from 'express';
import { Mesa } from '../models';
import { EstadoMesa, Rol } from '../types/enums';
import { parseId } from '../utils/parseId';
import { emitEstadoMesa } from '../sockets/orden.socket';
export const getMesas = async (req: Request, res: Response): Promise<void> => {
  try {
    // si se pasa ?todos=true el admin quiere ver también las inactivas
    const includeInactive = req.query.todos === 'true';
    const where: any = includeInactive ? {} : { activo: true };
    const mesas = await Mesa.findAll({
      where,
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
    // validación básica del enum
    if (!Object.values(EstadoMesa).includes(estado)) {
      res.status(400).json({ ok: false, message: 'Estado inválido' });
      return;
    }

    // reglas de negocio
    const rolUsuario = req.user?.rol;
    // un admin no puede manipular una mesa que ya esté ocupada
    if (mesa.estado === EstadoMesa.OCUPADA && rolUsuario === Rol.ADMIN) {
      res.status(400).json({ ok: false, message: 'No se puede cambiar el estado de una mesa ocupada' });
      return;
    }
    // sólo el admin puede reservar mesas
    if (rolUsuario === Rol.MESERO && estado === EstadoMesa.RESERVADA) {
      res.status(403).json({ ok: false, message: 'Sólo el administrador puede reservar mesas' });
      return;
    }

    // al tomar la orden en una mesa reservada, el mesero sí puede marcarla como ocupada
    // (el controlador de órdenes maneja la conversión cuando se crea la orden)

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

export const reactivarMesa = async (req: Request, res: Response): Promise<void> => {
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
    await mesa.update({ activo: true });
    res.json({ ok: true, data: mesa });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al reactivar mesa' });
  }
};