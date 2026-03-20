import { Request, Response } from 'express';
import { Producto, Categoria } from '../models';
import { AuditAccion } from '../models/AuditLog';
import { audit } from '../services/audit.service';
import { parseId } from '../utils/parseId';
import { subirImagen, subirImagenDesdeUrl, eliminarImagen } from '../services/cloudinary.service';

const snapshot = (p: Producto) => {
  const data = p.get({ plain: true }) as Record<string, unknown>;
  delete data.imagenPublicId;
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/productos
// Query: ?categoriaId=1  ?todos=true (incluye no disponibles)
//        ?stockBajo=true  → solo productos con stock ≤ stockMinimo
// ─────────────────────────────────────────────────────────────────────────────
export const getProductos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoriaId, todos, stockBajo } = req.query;
    const where: Record<string, unknown> = {};

    if (todos !== 'true') where.disponible = true;
    if (categoriaId) where.categoriaId = categoriaId;

    const productos = await Producto.findAll({
      where,
      include: [{ model: Categoria, as: 'categoria' }],
      order: [['nombre', 'ASC']],
    });

    // Filtro de stock bajo en memoria para evitar SQL complejo con columna calculada
    if (stockBajo === 'true') {
      const bajos = productos.filter(p =>
        p.stock !== null && p.stock <= p.stockMinimo
      );
      res.json({ ok: true, data: bajos });
      return;
    }

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
// stock y stockMinimo son opcionales.
// Si no se especifica requiereCocina, se hereda de la categoría.
// ─────────────────────────────────────────────────────────────────────────────
export const crearProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, precio, categoriaId, imagenUrl,
            requiereCocina, stock, stockMinimo } = req.body;

    if (!nombre || !precio || !categoriaId) {
      res.status(400).json({ ok: false, message: 'Nombre, precio y categoría son requeridos' });
      return;
    }
    if (parseFloat(precio) <= 0) {
      res.status(400).json({ ok: false, message: 'El precio debe ser mayor a 0' });
      return;
    }

    const categoria = await Categoria.findByPk(parseInt(categoriaId));
    if (!categoria) {
      res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
      return;
    }

    // Validar stock si se provee
    if (stock !== undefined && stock !== null && stock !== '' && Number(stock) < 0) {
      res.status(400).json({ ok: false, message: 'El stock no puede ser negativo' });
      return;
    }

    const cocinaNecesaria = requiereCocina !== undefined
      ? requiereCocina === 'true' || requiereCocina === true
      : categoria.requiereCocina;

    // stock: null = sin control, número = con control
    const stockFinal = (stock !== undefined && stock !== null && stock !== '')
      ? parseInt(stock)
      : null;

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
      stock:          stockFinal,
      stockMinimo:    stockMinimo !== undefined ? parseInt(stockMinimo) : 3,
      // Si se crea con stock 0, marcarlo como agotado automáticamente
      agotado:        stockFinal !== null && stockFinal === 0,
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
// Para quitar el control de stock: enviar stock: null explícitamente
// ─────────────────────────────────────────────────────────────────────────────
export const editarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const producto = await Producto.findByPk(id);
    if (!producto) { res.status(404).json({ ok: false, message: 'Producto no encontrado' }); return; }

    const { nombre, descripcion, precio, categoriaId, disponible,
            agotado, imagenUrl, requiereCocina, stock, stockMinimo } = req.body;

    if (precio !== undefined && parseFloat(precio) <= 0) {
      res.status(400).json({ ok: false, message: 'El precio debe ser mayor a 0' });
      return;
    }

    const estadoAnterior = snapshot(producto);

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

    // Resolver el nuevo stock:
    // - Si se manda 'null' o '' explícito → quitar control de stock
    // - Si se manda número → actualizar
    // - Si no se manda → mantener el actual
    let stockNuevo = producto.stock;
    if (stock !== undefined) {
      stockNuevo = (stock === null || stock === '' || stock === 'null')
        ? null
        : parseInt(stock);
    }

    // Auto-marcar agotado si stock llega a 0
    const agotadoFinal = agotado !== undefined
      ? Boolean(agotado)
      : (stockNuevo !== null && stockNuevo === 0) || producto.agotado;

    await producto.update({
      nombre:         nombre         !== undefined ? nombre.trim()                                      : producto.nombre,
      descripcion:    descripcion    !== undefined ? (descripcion?.trim() || null)                      : producto.descripcion,
      precio:         precio         !== undefined ? parseFloat(precio)                                 : producto.precio,
      categoriaId:    categoriaId    !== undefined ? parseInt(categoriaId)                              : producto.categoriaId,
      disponible:     disponible     !== undefined ? Boolean(disponible)                                : producto.disponible,
      agotado:        agotadoFinal,
      requiereCocina: requiereCocina !== undefined ? (requiereCocina === 'true' || requiereCocina === true) : producto.requiereCocina,
      stock:          stockNuevo,
      stockMinimo:    stockMinimo    !== undefined ? parseInt(stockMinimo)                              : producto.stockMinimo,
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
// DELETE /api/productos/:id — soft delete
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

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/productos/:id/stock — ajuste manual de stock desde admin
// Body: { cantidad: number, motivo?: string }
// cantidad puede ser positivo (reponer) o negativo (ajuste por pérdida)
// ─────────────────────────────────────────────────────────────────────────────
export const ajustarStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const producto = await Producto.findByPk(id);
    if (!producto) { res.status(404).json({ ok: false, message: 'Producto no encontrado' }); return; }

    if (producto.stock === null) {
      res.status(400).json({ ok: false, message: 'Este producto no tiene control de stock activado' });
      return;
    }

    const { cantidad, motivo } = req.body;
    if (cantidad === undefined || isNaN(Number(cantidad))) {
      res.status(400).json({ ok: false, message: 'Cantidad requerida' });
      return;
    }

    const stockAnterior = producto.stock;
    const stockNuevo    = Math.max(0, stockAnterior + Number(cantidad));
    const estadoAnterior = snapshot(producto);

    await producto.update({
      stock:   stockNuevo,
      agotado: stockNuevo === 0,
    });

    await audit({
      accion:    AuditAccion.PRODUCTO_EDITADO,
      entidad:   'productos',
      entidadId: producto.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(producto),
      meta:      { campo: 'stock', stockAnterior, stockNuevo, cantidad: Number(cantidad), motivo: motivo ?? 'Ajuste manual' },
    });

    res.json({ ok: true, data: producto, message: `Stock actualizado: ${stockAnterior} → ${stockNuevo}` });
  } catch (err) {
    console.error('[Producto] ajustarStock:', err);
    res.status(500).json({ ok: false, message: 'Error al ajustar stock' });
  }
};