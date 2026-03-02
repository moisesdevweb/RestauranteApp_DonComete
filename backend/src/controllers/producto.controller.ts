import { Request, Response } from 'express';
import { Producto, Categoria } from '../models';
import { parseId } from '../utils/parseId';
import { subirImagen, subirImagenDesdeUrl, eliminarImagen } from '../services/cloudinary.service';

// GET /api/productos
export const getProductos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoriaId } = req.query;
    const where: any = { disponible: true };
    if (categoriaId) where.categoriaId = categoriaId;

    const productos = await Producto.findAll({
      where,
      include: [{ model: Categoria, as: 'categoria' }],
      order: [['nombre', 'ASC']],
    });
    res.json({ ok: true, data: productos });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener productos' });
  }
};

// GET /api/productos/:id
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
    res.status(500).json({ ok: false, message: 'Error al obtener producto' });
  }
};

// POST /api/productos
export const crearProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, precio, categoriaId, imagenUrl } = req.body;

    if (!nombre || !precio || !categoriaId) {
      res.status(400).json({ ok: false, message: 'Nombre, precio y categoría son requeridos' });
      return;
    }

    let urlFinal: string | null = null;
    let publicId: string | null = null;

    // Opción 1: subió archivo desde su dispositivo
    if (req.file) {
      const resultado = await subirImagen(req.file.buffer, nombre);
      urlFinal = resultado.url;
      publicId = resultado.publicId;
    }
    // Opción 2: pegó una URL de internet
    else if (imagenUrl) {
      const resultado = await subirImagenDesdeUrl(imagenUrl);
      urlFinal = resultado.url;
      publicId = resultado.publicId;
    }

    const producto = await Producto.create({
      nombre,
      descripcion,
      precio: parseFloat(precio),
      categoriaId: parseInt(categoriaId),
      imagenUrl: urlFinal,
      imagenPublicId: publicId,
    });

    res.status(201).json({ ok: true, data: producto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al crear producto' });
  }
};

// PUT /api/productos/:id
export const editarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const producto = await Producto.findByPk(id);
    if (!producto) { res.status(404).json({ ok: false, message: 'Producto no encontrado' }); return; }

    const { nombre, descripcion, precio, categoriaId, disponible, agotado, imagenUrl } = req.body;

    let urlFinal = producto.imagenUrl;
    let publicId = producto.imagenPublicId;

    // Si sube imagen nueva → eliminar la anterior de Cloudinary y subir la nueva
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
      nombre,
      descripcion,
      precio: precio ? parseFloat(precio) : producto.precio,
      categoriaId: categoriaId ? parseInt(categoriaId) : producto.categoriaId,
      disponible,
      agotado,
      imagenUrl: urlFinal,
      imagenPublicId: publicId,
    });

    res.json({ ok: true, data: producto });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al editar producto' });
  }
};

// DELETE /api/productos/:id — desactiva y elimina imagen de Cloudinary
export const eliminarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const producto = await Producto.findByPk(id);
    if (!producto) { res.status(404).json({ ok: false, message: 'Producto no encontrado' }); return; }

    if (producto.imagenPublicId) await eliminarImagen(producto.imagenPublicId);
    await producto.update({ disponible: false });

    res.json({ ok: true, message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al eliminar producto' });
  }
};

// PATCH /api/productos/:id/agotado — marcar agotado temporalmente
export const toggleAgotado = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const producto = await Producto.findByPk(id);
    if (!producto) { res.status(404).json({ ok: false, message: 'Producto no encontrado' }); return; }

    await producto.update({ agotado: !producto.agotado });
    res.json({ ok: true, data: producto, message: producto.agotado ? 'Marcado como agotado' : 'Disponible nuevamente' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al actualizar producto' });
  }
};