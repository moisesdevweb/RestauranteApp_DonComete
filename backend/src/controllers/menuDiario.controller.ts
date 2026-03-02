import { Request, Response } from 'express';
import { MenuDiario, MenuDiarioItem } from '../models';
import { parseId } from '../utils/parseId';

const tiposValidos = ['entrada', 'fondo', 'postre', 'bebida'];

const validarItems = (items: any[], res: Response): boolean => {
  for (const item of items) {
    if (!tiposValidos.includes(item.tipo)) {
      res.status(400).json({ ok: false, message: `Tipo inválido: ${item.tipo}. Debe ser entrada, fondo, postre o bebida` });
      return false;
    }
    if (!item.nombre) {
      res.status(400).json({ ok: false, message: 'Cada item debe tener un nombre' });
      return false;
    }
  }
  return true;
};

// GET /api/menu-diario
export const getMenus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha } = req.query;
    const where: any = { activo: true };
    if (fecha) where.fecha = fecha;

    const menus = await MenuDiario.findAll({
      where,
      include: [{ model: MenuDiarioItem, as: 'items' }],
      order: [['fecha', 'DESC']],
    });
    res.json({ ok: true, data: menus });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener menús' });
  }
};

// GET /api/menu-diario/hoy
export const getMenuHoy = async (_req: Request, res: Response): Promise<void> => {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const menu = await MenuDiario.findOne({
      where: { fecha: hoy, activo: true },
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });

    if (!menu) {
      res.status(404).json({ ok: false, message: 'No hay menú del día para hoy' });
      return;
    }

    res.json({ ok: true, data: menu });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener menú de hoy' });
  }
};

// POST /api/menu-diario
export const crearMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha, precio, stock, items } = req.body;

    if (!fecha || !precio) {
      res.status(400).json({ ok: false, message: 'Fecha y precio son requeridos' });
      return;
    }

    const existe = await MenuDiario.findOne({ where: { fecha } });
    if (existe) {
      res.status(400).json({ ok: false, message: `Ya existe un menú para ${fecha}` });
      return;
    }

    const menu = await MenuDiario.create({
      fecha,
      precio: parseFloat(precio),
      stock: stock || 50,
      vendidos: 0,
      activo: true,
    });

    if (items && items.length) {
      if (!validarItems(items, res)) return;

      await Promise.all(
        items.map((item: { tipo: string; nombre: string; disponible?: boolean }) =>
          MenuDiarioItem.create({
            menuDiarioId: menu.id,
            tipo: item.tipo,
            nombre: item.nombre,
            disponible: item.disponible !== false,
          })
        )
      );
    }

    const menuCompleto = await MenuDiario.findByPk(menu.id, {
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });

    res.status(201).json({ ok: true, data: menuCompleto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al crear menú' });
  }
};

// PUT /api/menu-diario/:id
export const editarMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const menu = await MenuDiario.findByPk(id, {
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });
    if (!menu) { res.status(404).json({ ok: false, message: 'Menú no encontrado' }); return; }

    const { precio, stock, activo, items } = req.body;

    await menu.update({
      precio: precio ? parseFloat(precio) : menu.precio,
      stock: stock !== undefined ? stock : menu.stock,
      activo: activo !== undefined ? activo : menu.activo,
    });

    if (items && items.length) {
      if (!validarItems(items, res)) return;

      // Reemplaza todos los items anteriores por los nuevos
      await MenuDiarioItem.destroy({ where: { menuDiarioId: id } });
      await Promise.all(
        items.map((item: { tipo: string; nombre: string; disponible?: boolean }) =>
          MenuDiarioItem.create({
            menuDiarioId: id,
            tipo: item.tipo,
            nombre: item.nombre,
            disponible: item.disponible !== false,
          })
        )
      );
    }

    const menuActualizado = await MenuDiario.findByPk(id, {
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });

    res.json({ ok: true, data: menuActualizado });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al editar menú' });
  }
};

// DELETE /api/menu-diario/:id
export const desactivarMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const menu = await MenuDiario.findByPk(id);
    if (!menu) { res.status(404).json({ ok: false, message: 'Menú no encontrado' }); return; }

    await menu.update({ activo: false });
    res.json({ ok: true, message: 'Menú desactivado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al desactivar menú' });
  }
};

// POST /api/menu-diario/:id/duplicar
export const duplicarMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const { fecha } = req.body;
    if (!fecha) { res.status(400).json({ ok: false, message: 'Fecha destino requerida' }); return; }

    const menuOriginal = await MenuDiario.findByPk(id, {
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });
    if (!menuOriginal) { res.status(404).json({ ok: false, message: 'Menú no encontrado' }); return; }

    const existe = await MenuDiario.findOne({ where: { fecha } });
    if (existe) {
      res.status(400).json({ ok: false, message: `Ya existe un menú para ${fecha}` });
      return;
    }

    const nuevoMenu = await MenuDiario.create({
      fecha,
      precio: menuOriginal.precio,
      stock: menuOriginal.stock,
      vendidos: 0,
      activo: true,
    });

    await Promise.all(
      menuOriginal.items.map((item: MenuDiarioItem) =>
        MenuDiarioItem.create({
          menuDiarioId: nuevoMenu.id,
          tipo: item.tipo,
          nombre: item.nombre,
          disponible: item.disponible,
        })
      )
    );

    const menuCompleto = await MenuDiario.findByPk(nuevoMenu.id, {
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });

    res.status(201).json({ ok: true, data: menuCompleto });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al duplicar menú' });
  }
};