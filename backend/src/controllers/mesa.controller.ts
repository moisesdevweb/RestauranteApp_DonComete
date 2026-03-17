import { Request, Response } from 'express';
import { UniqueConstraintError } from 'sequelize';
import { Mesa } from '../models';
import { AuditAccion } from '../models/AuditLog';
import { audit } from '../services/audit.service';
import { EstadoMesa, Rol } from '../types/enums';
import { parseId } from '../utils/parseId';
import { emitEstadoMesa } from '../sockets/orden.socket';

// ─── Estados que indican que una mesa está en uso activo ──────────────────────
const ESTADOS_BLOQUEADOS: EstadoMesa[] = [EstadoMesa.OCUPADA, EstadoMesa.CUENTA_PENDIENTE];

// ─── Helper: extrae un snapshot plano de una mesa (sin métodos de Sequelize) ──
const snapshot = (mesa: Mesa) => mesa.get({ plain: true });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mesas
// Roles: todos los autenticados
// Query: ?todos=true  → incluye mesas inactivas (solo admin debería usarlo)
// ─────────────────────────────────────────────────────────────────────────────
export const getMesas = async (req: Request, res: Response): Promise<void> => {
  try {
    const incluirInactivas = req.query.todos === 'true';
    const where = incluirInactivas ? {} : { activo: true };

    const mesas = await Mesa.findAll({
      where,
      order: [
        ['piso',   'ASC'],
        ['numero', 'ASC'],
      ],
    });

    res.json({ ok: true, data: mesas });
  } catch (err) {
    console.error('[Mesa] getMesas:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener mesas' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/mesas
// Roles: admin
// Valida: numero + piso requeridos, unicidad número-piso, capacidad mínima
// ─────────────────────────────────────────────────────────────────────────────
export const crearMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { numero, piso, capacidad } = req.body;

    // ── Validaciones de entrada ──
    if (!numero || !piso) {
      res.status(400).json({ ok: false, message: 'Número y piso son requeridos' });
      return;
    }
    if (Number(numero) < 1 || Number(piso) < 1) {
      res.status(400).json({ ok: false, message: 'Número y piso deben ser mayores a 0' });
      return;
    }
    if (capacidad !== undefined && Number(capacidad) < 1) {
      res.status(400).json({ ok: false, message: 'La capacidad debe ser al menos 1' });
      return;
    }

    const mesa = await Mesa.create({
      numero:    Number(numero),
      piso:      Number(piso),
      capacidad: capacidad ? Number(capacidad) : 4,
    });

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.MESA_CREADA,
      entidad:   'mesas',
      entidadId: mesa.id,
      userId:    req.user!.id,
      antes:     null,
      despues:   snapshot(mesa),
    });

    res.status(201).json({ ok: true, data: mesa });
  } catch (err) {
    // Sequelize lanza UniqueConstraintError cuando viola el índice numero+piso
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({
        ok: false,
        message: `Ya existe una mesa ${req.body.numero} en el piso ${req.body.piso}`,
      });
      return;
    }
    console.error('[Mesa] crearMesa:', err);
    res.status(500).json({ ok: false, message: 'Error al crear mesa' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/mesas/:id
// Roles: admin
// Bloquea: mesas ocupadas o con cuenta pendiente no se pueden editar
// Valida: unicidad número-piso si cambian esos campos
// ─────────────────────────────────────────────────────────────────────────────
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

    // ── Regla de negocio: mesa en uso no se puede editar ──
    if (ESTADOS_BLOQUEADOS.includes(mesa.estado)) {
      res.status(409).json({
        ok: false,
        message: `No se puede editar la mesa ${mesa.numero} porque está ${mesa.estado.toLowerCase().replace('_', ' ')}`,
      });
      return;
    }

    const { numero, piso, capacidad } = req.body;

    // ── Validaciones de entrada ──
    if (numero !== undefined && Number(numero) < 1) {
      res.status(400).json({ ok: false, message: 'El número de mesa debe ser mayor a 0' });
      return;
    }
    if (piso !== undefined && Number(piso) < 1) {
      res.status(400).json({ ok: false, message: 'El piso debe ser mayor a 0' });
      return;
    }
    if (capacidad !== undefined && Number(capacidad) < 1) {
      res.status(400).json({ ok: false, message: 'La capacidad debe ser al menos 1' });
      return;
    }

    // Guardar snapshot antes de modificar para el log de auditoría
    const estadoAnterior = snapshot(mesa);

    await mesa.update({
      numero:    numero    !== undefined ? Number(numero)    : mesa.numero,
      piso:      piso      !== undefined ? Number(piso)      : mesa.piso,
      capacidad: capacidad !== undefined ? Number(capacidad) : mesa.capacidad,
    });

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.MESA_EDITADA,
      entidad:   'mesas',
      entidadId: mesa.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(mesa),
    });

    res.json({ ok: true, data: mesa });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      res.status(409).json({
        ok: false,
        message: `Ya existe una mesa ${req.body.numero} en el piso ${req.body.piso}`,
      });
      return;
    }
    console.error('[Mesa] editarMesa:', err);
    res.status(500).json({ ok: false, message: 'Error al editar mesa' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/mesas/:id/estado
// Roles: admin, mesero
// Reglas de negocio por rol:
//   - Solo admin puede reservar mesas
//   - Admin no puede cambiar estado de una mesa ocupada manualmente
//     (eso lo gestiona el flujo de órdenes)
// ─────────────────────────────────────────────────────────────────────────────
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
    const rolUsuario = req.user?.rol;

    // ── Validar que el estado sea un valor válido del enum ──
    if (!Object.values(EstadoMesa).includes(estado)) {
      res.status(400).json({ ok: false, message: 'Estado inválido' });
      return;
    }

    // ── Regla: el admin no cambia manualmente mesas en uso ──
    // El flujo de órdenes (crear orden / cobrar) es el que gestiona esos estados
    if (ESTADOS_BLOQUEADOS.includes(mesa.estado) && rolUsuario === Rol.ADMIN) {
      res.status(409).json({
        ok: false,
        message: 'El estado de una mesa en uso solo cambia a través del flujo de órdenes',
      });
      return;
    }

    // ── Regla: solo el admin puede reservar ──
    if (estado === EstadoMesa.RESERVADA && rolUsuario === Rol.MESERO) {
      res.status(403).json({
        ok: false,
        message: 'Solo el administrador puede reservar mesas',
      });
      return;
    }

    const estadoAnterior = snapshot(mesa);
    await mesa.update({ estado });

    // Notificar a todos los clientes conectados en tiempo real
    emitEstadoMesa(mesa);

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.MESA_ESTADO,
      entidad:   'mesas',
      entidadId: mesa.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(mesa),
      meta:      { estadoAnterior: estadoAnterior.estado, estadoNuevo: estado },
    });

    res.json({ ok: true, data: mesa });
  } catch (err) {
    console.error('[Mesa] cambiarEstadoMesa:', err);
    res.status(500).json({ ok: false, message: 'Error al cambiar estado' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/mesas/:id
// Roles: admin
// Soft delete: marca activo = false. Bloquea mesas en uso.
// ─────────────────────────────────────────────────────────────────────────────
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

    // ── Regla: no se puede desactivar una mesa en uso ──
    if (ESTADOS_BLOQUEADOS.includes(mesa.estado)) {
      res.status(409).json({
        ok: false,
        message: `No se puede desactivar la mesa ${mesa.numero} porque está ${mesa.estado.toLowerCase().replace('_', ' ')}`,
      });
      return;
    }

    if (!mesa.activo) {
      res.status(409).json({ ok: false, message: 'La mesa ya está desactivada' });
      return;
    }

    const estadoAnterior = snapshot(mesa);
    await mesa.update({ activo: false });

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.MESA_DESACTIVADA,
      entidad:   'mesas',
      entidadId: mesa.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(mesa),
    });

    res.json({ ok: true, message: `Mesa ${mesa.numero} desactivada correctamente` });
  } catch (err) {
    console.error('[Mesa] desactivarMesa:', err);
    res.status(500).json({ ok: false, message: 'Error al desactivar mesa' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/mesas/:id/reactivar
// Roles: admin
// ─────────────────────────────────────────────────────────────────────────────
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

    if (mesa.activo) {
      res.status(409).json({ ok: false, message: 'La mesa ya está activa' });
      return;
    }

    const estadoAnterior = snapshot(mesa);
    await mesa.update({ activo: true });

    // ── Auditoría ──
    await audit({
      accion:    AuditAccion.MESA_REACTIVADA,
      entidad:   'mesas',
      entidadId: mesa.id,
      userId:    req.user!.id,
      antes:     estadoAnterior,
      despues:   snapshot(mesa),
    });

    res.json({ ok: true, data: mesa });
  } catch (err) {
    console.error('[Mesa] reactivarMesa:', err);
    res.status(500).json({ ok: false, message: 'Error al reactivar mesa' });
  }
};