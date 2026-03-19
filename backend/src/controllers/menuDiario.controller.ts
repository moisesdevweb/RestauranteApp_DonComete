import { Request, Response } from 'express';
import { MenuDiario, MenuDiarioItem } from '../models';
import { AuditAccion } from '../models/AuditLog';
import { audit } from '../services/audit.service';
import { parseId } from '../utils/parseId';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: fecha de hoy en zona horaria de Perú (UTC-5)
// Sin esto, a las 7pm en Perú el servidor UTC ya es "mañana" y el menú
// desaparece antes de que termine la jornada.
// ─────────────────────────────────────────────────────────────────────────────
const hoyEnPeru = (): string => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  // en-CA devuelve formato YYYY-MM-DD, compatible con DATEONLY de Sequelize
};

const TIPOS_VALIDOS = ['entrada', 'fondo', 'postre', 'bebida'] as const;
type TipoItem = typeof TIPOS_VALIDOS[number];

interface ItemPayload {
  tipo: TipoItem;
  nombre: string;
  disponible?: boolean;
}

/**
 * Valida que cada item tenga tipo válido y nombre.
 * Devuelve true si todo está bien, false si ya respondió con error.
 */
const validarItems = (items: ItemPayload[], res: Response): boolean => {
  for (const item of items) {
    if (!TIPOS_VALIDOS.includes(item.tipo)) {
      res.status(400).json({
        ok: false,
        message: `Tipo inválido: "${item.tipo}". Debe ser: ${TIPOS_VALIDOS.join(', ')}`,
      });
      return false;
    }
    if (!item.nombre?.trim()) {
      res.status(400).json({ ok: false, message: 'Cada item debe tener un nombre' });
      return false;
    }
  }
  return true;
};

const snapshot = (menu: MenuDiario) => menu.get({ plain: true });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/menu-diario
// Query: ?fecha=2026-03-15  → filtra por fecha exacta
// Roles: todos los autenticados
// ─────────────────────────────────────────────────────────────────────────────
export const getMenus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha } = req.query;
    const where: Record<string, unknown> = { activo: true };
    if (fecha) where.fecha = fecha;

    const menus = await MenuDiario.findAll({
      where,
      include: [{ model: MenuDiarioItem, as: 'items' }],
      order: [['fecha', 'DESC']],
    });

    res.json({ ok: true, data: menus });
  } catch (err) {
    console.error('[MenuDiario] getMenus:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener menús' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/menu-diario/hoy
// Usa zona horaria de Perú para calcular "hoy" correctamente.
// ─────────────────────────────────────────────────────────────────────────────
export const getMenuHoy = async (_req: Request, res: Response): Promise<void> => {
  try {
    const hoy = hoyEnPeru();

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
    console.error('[MenuDiario] getMenuHoy:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener menú de hoy' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/menu-diario
// Roles: admin, encargado
// Un solo menú por fecha — si ya existe devuelve 409
// ─────────────────────────────────────────────────────────────────────────────
export const crearMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha, precio, stock, items } = req.body;

    if (!fecha || !precio) {
      res.status(400).json({ ok: false, message: 'Fecha y precio son requeridos' });
      return;
    }
    if (parseFloat(precio) <= 0) {
      res.status(400).json({ ok: false, message: 'El precio debe ser mayor a 0' });
      return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ ok: false, message: 'Debe incluir al menos un item en el menú' });
      return;
    }
    if (!validarItems(items, res)) return;

    // Verificar unicidad por fecha
    const existe = await MenuDiario.findOne({ where: { fecha } });
    if (existe) {
      res.status(409).json({ ok: false, message: `Ya existe un menú para el ${fecha}` });
      return;
    }

    const menu = await MenuDiario.create({
      fecha,
      precio:   parseFloat(precio),
      stock:    stock ?? 50,
      vendidos: 0,
      activo:   true,
    });

    await Promise.all(
      items.map((item: ItemPayload) =>
        MenuDiarioItem.create({
          menuDiarioId: menu.id,
          tipo:         item.tipo,
          nombre:       item.nombre.trim(),
          disponible:   item.disponible !== false,
        })
      )
    );

    const menuCompleto = await MenuDiario.findByPk(menu.id, {
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });

    await audit({
      accion:    AuditAccion.MENU_CREADO,
      entidad:   'menu_diario',
      entidadId: menu.id,
      userId:    req.user!.id,
      antes:     null,
      despues:   snapshot(menu),
      meta:      { fecha, itemsCount: items.length },
    });

    res.status(201).json({ ok: true, data: menuCompleto });
  } catch (err) {
    console.error('[MenuDiario] crearMenu:', err);
    res.status(500).json({ ok: false, message: 'Error al crear menú' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/menu-diario/:id
// Roles: admin, encargado
// Si se mandan items, reemplaza todos los anteriores
// ─────────────────────────────────────────────────────────────────────────────
export const editarMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const menu = await MenuDiario.findByPk(id, {
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });
    if (!menu) { res.status(404).json({ ok: false, message: 'Menú no encontrado' }); return; }

    const { precio, stock, activo, items } = req.body;

    if (precio !== undefined && parseFloat(precio) <= 0) {
      res.status(400).json({ ok: false, message: 'El precio debe ser mayor a 0' });
      return;
    }

    const estadoAnterior = snapshot(menu);

    await menu.update({
      precio: precio !== undefined ? parseFloat(precio) : menu.precio,
      stock:  stock  !== undefined ? stock              : menu.stock,
      activo: activo !== undefined ? Boolean(activo)    : menu.activo,
    });

    // Reemplazar items solo si se mandan nuevos
    if (items && Array.isArray(items) && items.length > 0) {
      if (!validarItems(items, res)) return;
      await MenuDiarioItem.destroy({ where: { menuDiarioId: id } });
      await Promise.all(
        items.map((item: ItemPayload) =>
          MenuDiarioItem.create({
            menuDiarioId: id,
            tipo:         item.tipo,
            nombre:       item.nombre.trim(),
            disponible:   item.disponible !== false,
          })
        )
      );
    }

    const menuActualizado = await MenuDiario.findByPk(id, {
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });

    await audit({
      accion:    AuditAccion.MENU_EDITADO,
      entidad:   'menu_diario',
      entidadId: menu.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(menu),
    });

    res.json({ ok: true, data: menuActualizado });
  } catch (err) {
    console.error('[MenuDiario] editarMenu:', err);
    res.status(500).json({ ok: false, message: 'Error al editar menú' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/menu-diario/:id — soft delete
// Roles: admin, encargado
// ─────────────────────────────────────────────────────────────────────────────
export const desactivarMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const menu = await MenuDiario.findByPk(id);
    if (!menu) { res.status(404).json({ ok: false, message: 'Menú no encontrado' }); return; }

    if (!menu.activo) {
      res.status(409).json({ ok: false, message: 'El menú ya está desactivado' });
      return;
    }

    const estadoAnterior = snapshot(menu);
    await menu.update({ activo: false });

    await audit({
      accion:    AuditAccion.MENU_DESACTIVADO,
      entidad:   'menu_diario',
      entidadId: menu.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(menu),
    });

    res.json({ ok: true, message: 'Menú desactivado' });
  } catch (err) {
    console.error('[MenuDiario] desactivarMenu:', err);
    res.status(500).json({ ok: false, message: 'Error al desactivar menú' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/menu-diario/:id/duplicar
// Roles: admin, encargado
// Copia el menú a una fecha nueva — útil para reutilizar menús frecuentes
// ─────────────────────────────────────────────────────────────────────────────
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

    // Verificar que no exista ya un menú para esa fecha
    const existe = await MenuDiario.findOne({ where: { fecha } });
    if (existe) {
      res.status(409).json({ ok: false, message: `Ya existe un menú para el ${fecha}` });
      return;
    }

    const nuevoMenu = await MenuDiario.create({
      fecha,
      precio:   menuOriginal.precio,
      stock:    menuOriginal.stock,
      vendidos: 0,
      activo:   true,
    });

    await Promise.all(
      menuOriginal.items.map((item: MenuDiarioItem) =>
        MenuDiarioItem.create({
          menuDiarioId: nuevoMenu.id,
          tipo:         item.tipo,
          nombre:       item.nombre,
          disponible:   item.disponible,
        })
      )
    );

    const menuCompleto = await MenuDiario.findByPk(nuevoMenu.id, {
      include: [{ model: MenuDiarioItem, as: 'items' }],
    });

    await audit({
      accion:    AuditAccion.MENU_CREADO,
      entidad:   'menu_diario',
      entidadId: nuevoMenu.id,
      userId:    req.user!.id,
      antes:     null,
      despues:   snapshot(nuevoMenu),
      meta:      { duplicadoDe: id, fecha },
    });

    res.status(201).json({ ok: true, data: menuCompleto });
  } catch (err) {
    console.error('[MenuDiario] duplicarMenu:', err);
    res.status(500).json({ ok: false, message: 'Error al duplicar menú' });
  }
};