import { Request, Response } from 'express';
import { Categoria } from '../models';
import { AuditAccion } from '../models/AuditLog';
import { audit } from '../services/audit.service';
import { parseId } from '../utils/parseId';

const snapshot = (cat: Categoria) => cat.get({ plain: true });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/categorias
// Roles: todos los autenticados (el mesero las necesita para la carta)
// ─────────────────────────────────────────────────────────────────────────────
export const getCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await Categoria.findAll({
      where: { activo: true },
      order: [['orden', 'ASC'], ['nombre', 'ASC']],
    });
    res.json({ ok: true, data: categorias });
  } catch (err) {
    console.error('[Categoria] getCategorias:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener categorías' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/categorias
// Roles: admin, encargado
// ─────────────────────────────────────────────────────────────────────────────
export const crearCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, icono, orden, requiereCocina } = req.body;

    if (!nombre?.trim()) {
      res.status(400).json({ ok: false, message: 'El nombre es requerido' });
      return;
    }

    // Verificar nombre duplicado
    const existe = await Categoria.findOne({ where: { nombre: nombre.trim(), activo: true } });
    if (existe) {
      res.status(409).json({ ok: false, message: `Ya existe una categoría llamada "${nombre}"` });
      return;
    }

    const categoria = await Categoria.create({
      nombre:        nombre.trim(),
      descripcion:   descripcion?.trim() || null,
      icono:         icono?.trim()       || null,
      orden:         orden               ?? 0,
      // Si no se especifica, por defecto va a cocina (comportamiento seguro)
      requiereCocina: requiereCocina !== undefined ? Boolean(requiereCocina) : true,
    });

    await audit({
      accion:    AuditAccion.CATEGORIA_CREADA,
      entidad:   'categorias',
      entidadId: categoria.id,
      userId:    req.user!.id,
      antes:     null,
      despues:   snapshot(categoria),
    });

    res.status(201).json({ ok: true, data: categoria });
  } catch (err) {
    console.error('[Categoria] crearCategoria:', err);
    res.status(500).json({ ok: false, message: 'Error al crear categoría' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/categorias/:id
// Roles: admin, encargado
// ─────────────────────────────────────────────────────────────────────────────
export const editarCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const categoria = await Categoria.findByPk(id);
    if (!categoria) { res.status(404).json({ ok: false, message: 'Categoría no encontrada' }); return; }

    const { nombre, descripcion, icono, orden, activo, requiereCocina } = req.body;

    // Verificar nombre duplicado (excluyendo la categoría actual)
    if (nombre && nombre.trim() !== categoria.nombre) {
      const existe = await Categoria.findOne({
        where: { nombre: nombre.trim(), activo: true },
      });
      if (existe && existe.id !== id) {
        res.status(409).json({ ok: false, message: `Ya existe una categoría llamada "${nombre}"` });
        return;
      }
    }

    const estadoAnterior = snapshot(categoria);

    await categoria.update({
      nombre:         nombre         !== undefined ? nombre.trim()               : categoria.nombre,
      descripcion:    descripcion    !== undefined ? (descripcion?.trim() || null): categoria.descripcion,
      icono:          icono          !== undefined ? (icono?.trim() || null)      : categoria.icono,
      orden:          orden          !== undefined ? orden                        : categoria.orden,
      activo:         activo         !== undefined ? Boolean(activo)              : categoria.activo,
      requiereCocina: requiereCocina !== undefined ? Boolean(requiereCocina)      : categoria.requiereCocina,
    });

    await audit({
      accion:    AuditAccion.CATEGORIA_EDITADA,
      entidad:   'categorias',
      entidadId: categoria.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(categoria),
    });

    res.json({ ok: true, data: categoria });
  } catch (err) {
    console.error('[Categoria] editarCategoria:', err);
    res.status(500).json({ ok: false, message: 'Error al editar categoría' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/categorias/:id — soft delete
// Roles: admin, encargado
// Bloquea si tiene productos activos asociados
// ─────────────────────────────────────────────────────────────────────────────
export const eliminarCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const categoria = await Categoria.findByPk(id, {
      include: [{ association: 'productos', where: { disponible: true }, required: false }],
    });
    if (!categoria) { res.status(404).json({ ok: false, message: 'Categoría no encontrada' }); return; }

    // No eliminar si tiene productos activos — evita dejar productos huérfanos
    if (categoria.productos?.length > 0) {
      res.status(409).json({
        ok: false,
        message: `No se puede eliminar: la categoría tiene ${categoria.productos.length} producto(s) activo(s)`,
      });
      return;
    }

    const estadoAnterior = snapshot(categoria);
    await categoria.update({ activo: false });

    await audit({
      accion:    AuditAccion.CATEGORIA_ELIMINADA,
      entidad:   'categorias',
      entidadId: categoria.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(categoria),
    });

    res.json({ ok: true, message: 'Categoría desactivada' });
  } catch (err) {
    console.error('[Categoria] eliminarCategoria:', err);
    res.status(500).json({ ok: false, message: 'Error al eliminar categoría' });
  }
};