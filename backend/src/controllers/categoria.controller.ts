import { Request, Response } from 'express';
import { Categoria } from '../models';
import { parseId } from '../utils/parseId';

export const getCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await Categoria.findAll({
      where: { activo: true },
      order: [['orden', 'ASC']],
    });
    res.json({ ok: true, data: categorias });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener categorías' });
  }
};

export const crearCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, icono, orden } = req.body;
    if (!nombre) {
      res.status(400).json({ ok: false, message: 'El nombre es requerido' });
      return;
    }
    const categoria = await Categoria.create({ nombre, descripcion, icono, orden: orden || 0 });
    res.status(201).json({ ok: true, data: categoria });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al crear categoría' });
  }
};

export const editarCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ ok: false, message: 'ID inválido' });
      return;
    }
    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
      return;
    }
    const { nombre, descripcion, icono, orden, activo } = req.body;
    await categoria.update({ nombre, descripcion, icono, orden, activo });
    res.json({ ok: true, data: categoria });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al editar categoría' });
  }
};

export const eliminarCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ ok: false, message: 'ID inválido' });
      return;
    }
    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
      return;
    }
    await categoria.update({ activo: false });
    res.json({ ok: true, message: 'Categoría desactivada' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al eliminar categoría' });
  }
};