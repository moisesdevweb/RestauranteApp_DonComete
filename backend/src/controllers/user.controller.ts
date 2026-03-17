import { Request, Response } from 'express';
import { UniqueConstraintError } from 'sequelize';
import { User } from '../models';
import { AuditAccion } from '../models/AuditLog';
import { audit } from '../services/audit.service';
import { Rol } from '../types/enums';
import { parseId } from '../utils/parseId';

// ─── Roles que un encargado puede gestionar ───────────────────────────────────
// El encargado NO puede crear/editar/desactivar admins ni otros encargados.
const ROLES_GESTIONABLES_POR_ENCARGADO: Rol[] = [Rol.MESERO, Rol.COCINA];

// ─── Helper: snapshot seguro sin passwordHash ─────────────────────────────────
const snapshot = (user: User) => {
  const data = user.get({ plain: true }) as Record<string, unknown>;
  delete data.passwordHash;
  return data;
};

// ─── Helper: verifica si el solicitante tiene permiso sobre el rol objetivo ───
const puedeGestionar = (rolSolicitante: Rol, rolObjetivo: Rol): boolean => {
  if (rolSolicitante === Rol.ADMIN) return true;
  if (rolSolicitante === Rol.ENCARGADO) {
    return ROLES_GESTIONABLES_POR_ENCARGADO.includes(rolObjetivo);
  }
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users
// Query: ?rol=mesero  ?activo=false
// Roles: admin (todos), encargado (solo mesero y cocina)
// ─────────────────────────────────────────────────────────────────────────────
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rol, activo } = req.query;
    const rolSolicitante = req.user!.rol as Rol;

    const where: Record<string, unknown> = {
      activo: activo === 'false' ? false : true,
    };

    // El encargado solo ve meseros y cocineros
    if (rolSolicitante === Rol.ENCARGADO) {
      where.rol = ROLES_GESTIONABLES_POR_ENCARGADO;
    } else if (rol && Object.values(Rol).includes(rol as Rol)) {
      where.rol = rol;
    }

    const users = await User.findAll({
      where,
      order: [['nombre', 'ASC']],
    });

    res.json({ ok: true, data: users });
  } catch (err) {
    console.error('[User] getUsers:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener usuarios' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/todos — activos e inactivos
// Roles: admin, encargado (filtrado por rango)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const rolSolicitante = req.user!.rol as Rol;

    const where: Record<string, unknown> =
      rolSolicitante === Rol.ENCARGADO
        ? { rol: ROLES_GESTIONABLES_POR_ENCARGADO }
        : {};

    const users = await User.findAll({
      where,
      order: [['nombre', 'ASC']],
    });

    res.json({ ok: true, data: users });
  } catch (err) {
    console.error('[User] getAllUsers:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener usuarios' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users
// Roles: admin (cualquier rol), encargado (solo mesero y cocina)
// ─────────────────────────────────────────────────────────────────────────────
export const crearUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, username, password, rol, telefono } = req.body;
    const rolSolicitante = req.user!.rol as Rol;

    // ── Validaciones de entrada ──
    if (!nombre || !username || !password || !rol) {
      res.status(400).json({ ok: false, message: 'Nombre, usuario, contraseña y rol son requeridos' });
      return;
    }
    if (!Object.values(Rol).includes(rol as Rol)) {
      res.status(400).json({ ok: false, message: 'Rol inválido' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 4 caracteres' });
      return;
    }

    // ── Validación de rango: el encargado no puede crear admins/encargados ──
    if (!puedeGestionar(rolSolicitante, rol as Rol)) {
      res.status(403).json({
        ok: false,
        message: 'No tienes permiso para crear usuarios con ese rol',
      });
      return;
    }

    const user = await User.create({
      nombre:       nombre.trim(),
      username:     username.trim().toLowerCase(),
      passwordHash: password, // hook BeforeCreate lo hashea
      rol,
      telefono:     telefono?.trim() || null,
      activo:       true,
    });

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.USUARIO_CREADO,
      entidad:   'users',
      entidadId: user.id,
      userId:    req.user!.id,
      antes:     null,
      despues:   snapshot(user),
      meta:      { creadoPor: req.user!.nombre ?? req.user!.username },
    });

    res.status(201).json({ ok: true, data: user });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({ ok: false, message: 'El nombre de usuario ya está en uso' });
      return;
    }
    console.error('[User] crearUser:', err);
    res.status(500).json({ ok: false, message: 'Error al crear usuario' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/:id
// Registra exactamente qué campos cambiaron (antes/después)
// ─────────────────────────────────────────────────────────────────────────────
export const editarUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }

    const rolSolicitante = req.user!.rol as Rol;

    // ── Validación de rango ──
    if (!puedeGestionar(rolSolicitante, user.rol)) {
      res.status(403).json({
        ok: false,
        message: 'No tienes permiso para editar usuarios con ese rol',
      });
      return;
    }

    // Si intentan cambiar el rol, verificar que el nuevo rol también sea gestionable
    if (req.body.rol && !puedeGestionar(rolSolicitante, req.body.rol as Rol)) {
      res.status(403).json({
        ok: false,
        message: 'No puedes asignar ese rol',
      });
      return;
    }

    const { nombre, username, rol, telefono } = req.body;

    // Snapshot antes de cualquier cambio
    const estadoAnterior = snapshot(user);

    await user.update({
      nombre:   nombre   !== undefined ? nombre.trim()                    : user.nombre,
      username: username !== undefined ? username.trim().toLowerCase()    : user.username,
      rol:      rol      !== undefined ? rol                              : user.rol,
      telefono: telefono !== undefined ? (telefono?.trim() || null)       : user.telefono,
    });

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.USUARIO_EDITADO,
      entidad:   'users',
      entidadId: user.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(user),
      meta:      { editadoPor: req.user!.nombre ?? req.user!.username },
    });

    res.json({ ok: true, data: user });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({ ok: false, message: 'El nombre de usuario ya está en uso' });
      return;
    }
    console.error('[User] editarUser:', err);
    res.status(500).json({ ok: false, message: 'Error al editar usuario' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/users/:id — soft delete (activo = false)
// No se puede desactivar a uno mismo ni a usuarios de mayor rango
// ─────────────────────────────────────────────────────────────────────────────
export const desactivarUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }

    const rolSolicitante = req.user!.rol as Rol;

    // ── No puede desactivarse a sí mismo ──
    if (user.id === req.user!.id) {
      res.status(400).json({ ok: false, message: 'No puedes desactivarte a ti mismo' });
      return;
    }

    // ── Validación de rango ──
    if (!puedeGestionar(rolSolicitante, user.rol)) {
      res.status(403).json({
        ok: false,
        message: 'No tienes permiso para desactivar usuarios con ese rol',
      });
      return;
    }

    if (!user.activo) {
      res.status(409).json({ ok: false, message: 'El usuario ya está desactivado' });
      return;
    }

    const estadoAnterior = snapshot(user);
    await user.update({ activo: false });

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.USUARIO_ELIMINADO,
      entidad:   'users',
      entidadId: user.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(user),
      meta:      { desactivadoPor: req.user!.nombre ?? req.user!.username },
    });

    res.json({ ok: true, message: `Usuario ${user.nombre} desactivado` });
  } catch (err) {
    console.error('[User] desactivarUser:', err);
    res.status(500).json({ ok: false, message: 'Error al desactivar usuario' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/users/:id/reactivar
// ─────────────────────────────────────────────────────────────────────────────
export const reactivarUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }

    const rolSolicitante = req.user!.rol as Rol;

    if (!puedeGestionar(rolSolicitante, user.rol)) {
      res.status(403).json({
        ok: false,
        message: 'No tienes permiso para reactivar usuarios con ese rol',
      });
      return;
    }

    if (user.activo) {
      res.status(409).json({ ok: false, message: 'El usuario ya está activo' });
      return;
    }

    const estadoAnterior = snapshot(user);
    await user.update({ activo: true });

    await audit({
      accion:    AuditAccion.USUARIO_EDITADO,
      entidad:   'users',
      entidadId: user.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(user),
      meta:      { reactivadoPor: req.user!.nombre ?? req.user!.username },
    });

    res.json({ ok: true, data: user });
  } catch (err) {
    console.error('[User] reactivarUser:', err);
    res.status(500).json({ ok: false, message: 'Error al reactivar usuario' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/users/:id/password
// El hash lo maneja el hook BeforeUpdate del modelo.
// Solo registra que cambió — nunca guarda la contraseña en el log.
// ─────────────────────────────────────────────────────────────────────────────
export const cambiarPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ ok: false, message: 'ID inválido' }); return; }

    const user = await User.findByPk(id);
    if (!user) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }

    const rolSolicitante = req.user!.rol as Rol;

    if (!puedeGestionar(rolSolicitante, user.rol)) {
      res.status(403).json({
        ok: false,
        message: 'No tienes permiso para cambiar la contraseña de este usuario',
      });
      return;
    }

    const { password } = req.body;
    if (!password || password.length < 4) {
      res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 4 caracteres' });
      return;
    }

    await user.update({ passwordHash: password }); // hook la hashea

    // ── Auditoría — nunca registrar la contraseña, solo el evento ──
    await audit({
      accion:    AuditAccion.USUARIO_EDITADO,
      entidad:   'users',
      entidadId: user.id,
      userId:    req.user!.id,
      antes:     null, // nunca loggear contraseñas
      despues:   null,
      meta:      {
        campo:      'password',
        cambiadoPor: req.user!.nombre ?? req.user!.username,
        usuario:    user.username,
      },
    });

    res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    console.error('[User] cambiarPassword:', err);
    res.status(500).json({ ok: false, message: 'Error al cambiar contraseña' });
  }
};