import { Request, Response } from 'express';
import { Producto, Categoria } from '../models';
import { AuditAccion } from '../models/AuditLog';
import { audit } from '../services/audit.service';
import { parseId } from '../utils/parseId';
import { subirImagen, subirImagenDesdeUrl, eliminarImagen } from '../services/cloudinary.service';

const snapshot = (p: Producto) => {
  const data = p.get({ plain: true }) as Record<string, unknown>;
  // No loggear el publicId de cloudinary en el audit (dato interno)
  delete data.imagenPublicId;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/productos
// Roles: todos los autenticados
// Query: ?categoriaId=1  ?todos=true (incluye no disponibles, solo admin/encargado)
// ─────────────────────────────────────────────────────────────────────────────
export const getProductos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoriaId, todos } = req.query;
    const where: Record<string, unknown> = {};

    // Por defecto solo productos disponibles; con ?todos=true el admin ve todos
    if (todos !== 'true') where.disponible = true;
    if (categoriaId) where.categoriaId = categoriaId;

    const productos = await Producto.findAll({
      where,
      include: [{ model: Categoria, as: 'categoria' }],
      order: [['nombre', 'ASC']],
    });

    res.json({ ok: true, data: productos });
  } catch (err) {
    console.error('[Producto] getProductos:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener productos' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/productos/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const producto = await Producto.findByPk(id, {
      include: [{ model: Categoria, as: 'categoria' }],
    });
    if (!producto) { res.status(404).json({ ok: false, message: 'Producto no encontrado' }); return; }

    res.json({ ok: true, data: producto });
  } catch (err) {
    console.error('[Producto] getProducto:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener producto' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/productos
// Roles: admin, encargado
// requiereCocina: si no se manda explícitamente, se hereda de la categoría
// ─────────────────────────────────────────────────────────────────────────────
export const crearProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, precio, categoriaId, imagenUrl, requiereCocina } = req.body;

    if (!nombre || !precio || !categoriaId) {
      res.status(400).json({ ok: false, message: 'Nombre, precio y categoría son requeridos' });
      return;
    }
    if (parseFloat(precio) <= 0) {
      res.status(400).json({ ok: false, message: 'El precio debe ser mayor a 0' });
      return;
    }

    // Verificar que la categoría exista y obtener su requiereCocina como fallback
    const categoria = await Categoria.findByPk(parseInt(categoriaId));
    if (!categoria) {
      res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
      return;
    }

    // Si el admin no especifica requiereCocina, se hereda de la categoría
    const cocinaNecesaria = requiereCocina !== undefined
      ? requiereCocina === 'true' || requiereCocina === true
      : categoria.requiereCocina;

    // ── Imagen: archivo subido o URL externa ──
    let urlFinal: string | null = null;
    let publicId: string | null = null;

    if (req.file) {
      const resultado = await subirImagen(req.file.buffer, nombre);
      urlFinal = resultado.url;
      publicId = resultado.publicId;
    } else if (imagenUrl) {
      const resultado = await subirImagenDesdeUrl(imagenUrl);
      urlFinal = resultado.url;
      publicId = resultado.publicId;
    }

    const producto = await Producto.create({
      nombre:         nombre.trim(),
      descripcion:    descripcion?.trim() || null,
      precio:         parseFloat(precio),
      categoriaId:    parseInt(categoriaId),
      imagenUrl:      urlFinal,
      imagenPublicId: publicId,
      requiereCocina: cocinaNecesaria,
    });

    await audit({
      accion:    AuditAccion.PRODUCTO_CREADO,
      entidad:   'productos',
      entidadId: producto.id,
      userId:    req.user!.id,
      antes:     null,
      despues:   snapshot(producto),
    });

    res.status(201).json({ ok: true, data: producto });
  } catch (err) {
    console.error('[Producto] crearProducto:', err);
    res.status(500).json({ ok: false, message: 'Error al crear producto' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/productos/:id
// Roles: admin, encargado
// ─────────────────────────────────────────────────────────────────────────────
export const editarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const producto = await Producto.findByPk(id);
    if (!producto) { res.status(404).json({ ok: false, message: 'Producto no encontrado' }); return; }

    const { nombre, descripcion, precio, categoriaId, disponible, agotado, imagenUrl, requiereCocina } = req.body;

    if (precio !== undefined && parseFloat(precio) <= 0) {
      res.status(400).json({ ok: false, message: 'El precio debe ser mayor a 0' });
      return;
    }

    const estadoAnterior = snapshot(producto);

    // ── Imagen: actualizar solo si cambió ──
    let urlFinal = producto.imagenUrl;
    let publicId = producto.imagenPublicId;

    if (req.file) {
      if (producto.imagenPublicId) await eliminarImagen(producto.imagenPublicId);
      const resultado = await subirImagen(req.file.buffer, nombre || producto.nombre);
      urlFinal = resultado.url;
      publicId = resultado.publicId;
    } else if (imagenUrl && imagenUrl !== producto.imagenUrl) {
      if (producto.imagenPublicId) await eliminarImagen(producto.imagenPublicId);
      const resultado = await subirImagenDesdeUrl(imagenUrl);
      urlFinal = resultado.url;
      publicId = resultado.publicId;
    }

    await producto.update({
      nombre:         nombre         !== undefined ? nombre.trim()          : producto.nombre,
      descripcion:    descripcion    !== undefined ? descripcion?.trim() || null : producto.descripcion,
      precio:         precio         !== undefined ? parseFloat(precio)     : producto.precio,
      categoriaId:    categoriaId    !== undefined ? parseInt(categoriaId)  : producto.categoriaId,
      disponible:     disponible     !== undefined ? Boolean(disponible)    : producto.disponible,
      agotado:        agotado        !== undefined ? Boolean(agotado)       : producto.agotado,
      requiereCocina: requiereCocina !== undefined
        ? (requiereCocina === 'true' || requiereCocina === true)
        : producto.requiereCocina,
      imagenUrl:      urlFinal,
      imagenPublicId: publicId,
    });

    await audit({
      accion:    AuditAccion.PRODUCTO_EDITADO,
      entidad:   'productos',
      entidadId: producto.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(producto),
    });

    res.json({ ok: true, data: producto });
  } catch (err) {
    console.error('[Producto] editarProducto:', err);
    res.status(500).json({ ok: false, message: 'Error al editar producto' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/productos/:id — soft delete + elimina imagen de Cloudinary
// Roles: admin, encargado
// ─────────────────────────────────────────────────────────────────────────────
export const eliminarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const producto = await Producto.findByPk(id);
    if (!producto) { res.status(404).json({ ok: false, message: 'Producto no encontrado' }); return; }

    const estadoAnterior = snapshot(producto);

    if (producto.imagenPublicId) await eliminarImagen(producto.imagenPublicId);
    await producto.update({ disponible: false });

    await audit({
      accion:    AuditAccion.PRODUCTO_ELIMINADO,
      entidad:   'productos',
      entidadId: producto.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(producto),
    });

    res.json({ ok: true, message: `Producto "${producto.nombre}" eliminado` });
  } catch (err) {
    console.error('[Producto] eliminarProducto:', err);
    res.status(500).json({ ok: false, message: 'Error al eliminar producto' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/productos/:id/agotado — toggle agotado sin eliminar
// Roles: admin, encargado
// ─────────────────────────────────────────────────────────────────────────────
export const toggleAgotado = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const producto = await Producto.findByPk(id);
    if (!producto) { res.status(404).json({ ok: false, message: 'Producto no encontrado' }); return; }

    const estadoAnterior = snapshot(producto);
    await producto.update({ agotado: !producto.agotado });

    await audit({
      accion:    AuditAccion.PRODUCTO_EDITADO,
      entidad:   'productos',
      entidadId: producto.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(producto),
      meta:      { campo: 'agotado', nuevoValor: producto.agotado },
    });

    res.json({
      ok: true,
      data: producto,
      message: producto.agotado ? 'Marcado como agotado' : 'Disponible nuevamente',
    });
  } catch (err) {
    console.error('[Producto] toggleAgotado:', err);
    res.status(500).json({ ok: false, message: 'Error al actualizar estado' });
  }
};