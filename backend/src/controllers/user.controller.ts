import { Request, Response } from 'express';
import { User } from '../models';
import { Rol } from '../types/enums';
import { parseId } from '../utils/parseId';

// GET /api/users?rol=mesero&activo=true
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rol, activo } = req.query;

    const where: Record<string, unknown> = {};

    // Filtro activo: por defecto solo activos, salvo que manden activo=false
    if (activo === 'false') {
      where.activo = false;
    } else {
      where.activo = true;
    }

    // Filtro por rol opcional
    if (rol && Object.values(Rol).includes(rol as Rol)) {
      where.rol = rol;
    }

    const users = await User.findAll({
      where,
      order: [['nombre', 'ASC']],
    });

    res.json({ ok: true, data: users });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener usuarios' });
  }
};


// GET /api/users/todos — trae activos e inactivos (solo admin)
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      order: [['nombre', 'ASC']],
      // sin where: { activo: true } — trae todos
    });
    res.json({ ok: true, data: users });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener usuarios' });
  }
};

// POST /api/users
export const crearUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, username, password, rol, telefono } = req.body;

    if (!nombre || !username || !password || !rol) {
      res.status(400).json({ ok: false, message: 'Nombre, usuario, contraseña y rol son requeridos' });
      return;
    }

    if (!Object.values(Rol).includes(rol)) {
      res.status(400).json({ ok: false, message: 'Rol inválido' });
      return;
    }

    // Verificar que el username no exista
    const existe = await User.findOne({ where: { username } });
    if (existe) {
      res.status(400).json({ ok: false, message: 'El nombre de usuario ya está en uso' });
      return;
    }

    const user = await User.create({
      nombre,
      username,
      passwordHash: password, // el hook BeforeCreate lo hashea automático
      rol,
      telefono: telefono || null,
      activo: true,
    });

    res.status(201).json({ ok: true, data: user }); // toJSON() quita el hash
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al crear usuario' });
  }
};

// PATCH /api/users/:id/reactivar
export const reactivarUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }

    await user.update({ activo: true });
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al reactivar usuario' });
  }
};

// PUT /api/users/:id
export const editarUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }

    const { nombre, username, password, rol, telefono } = req.body;

    // Si manda nueva contraseña la actualizamos (el hook la hashea)
    if (password) {
      await user.update({ passwordHash: password });
    }

    await user.update({
      nombre: nombre || user.nombre,
      username: username || user.username,
      rol: rol || user.rol,
      telefono: telefono !== undefined ? telefono : user.telefono,
    });

    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al editar usuario' });
  }
};

// DELETE /api/users/:id — desactivar sin borrar
export const desactivarUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }

    // No permitir desactivar al propio admin logueado
    if (user.id === req.user?.id) {
      res.status(400).json({ ok: false, message: 'No puedes desactivarte a ti mismo' });
      return;
    }

    await user.update({ activo: false });
    res.json({ ok: true, message: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al desactivar usuario' });
  }
};

// PATCH /api/users/:id/password — cambiar contraseña
export const cambiarPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }

    const { password } = req.body;
    if (!password || password.length < 4) {
      res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 4 caracteres' });
      return;
    }

    await user.update({ passwordHash: password }); // hook la hashea
    res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al cambiar contraseña' });
  }
};