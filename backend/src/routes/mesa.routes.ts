import { Router } from 'express';
import {
  getMesas,
  crearMesa,
  editarMesa,
  cambiarEstadoMesa,
  desactivarMesa,
  reactivarMesa,
} from '../controllers/mesa.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// ─── Lectura ──────────────────────────────────────────────────────────────────
// Todos los roles autenticados pueden ver las mesas.
// ?todos=true  → incluye mesas inactivas (el frontend admin lo usa)
router.get(
  '/',
  authMiddleware,
  getMesas,
);

// ─── Gestión (solo admin) ─────────────────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  requireRol(Rol.ADMIN),
  crearMesa,
);

router.put(
  '/:id',
  authMiddleware,
  requireRol(Rol.ADMIN),
  editarMesa,
);

// Soft delete — no borra físicamente, marca activo = false
router.delete(
  '/:id',
  authMiddleware,
  requireRol(Rol.ADMIN),
  desactivarMesa,
);

// Reactivar una mesa previamente desactivada
router.patch(
  '/:id/reactivar',
  authMiddleware,
  requireRol(Rol.ADMIN),
  reactivarMesa,
);

// ─── Estado (admin + mesero) ──────────────────────────────────────────────────
// El mesero puede marcar libre/ocupada; el admin puede reservar.
// Las mesas ocupadas/cuenta_pendiente solo cambian de estado
// a través del flujo de órdenes (crear orden / cobrar).
router.patch(
  '/:id/estado',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.MESERO),
  cambiarEstadoMesa,
);

export default router;