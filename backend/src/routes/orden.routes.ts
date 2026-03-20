import { Router } from 'express';
import {
  crearOrden,
  agregarItems,
  enviarACocina,
  getOrdenescocina,
  marcarItemListo,
  getOrdenMesa,
  getOrdenes,
  cancelarItem,
} from '../controllers/orden.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// ─── Mesero — toma y envía pedidos ───────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.MESERO),
  crearOrden,
);
router.post(
  '/:id/items',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.MESERO),
  agregarItems,
);
router.patch(
  '/:id/enviar',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.MESERO),
  enviarACocina,
);
router.get(
  '/mesa/:mesaId',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.MESERO),
  getOrdenMesa,
);

// ─── Cocina — ve y marca pedidos ──────────────────────────────────────────────
router.get(
  '/cocina',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.COCINA),
  getOrdenescocina,
);
router.patch(
  '/items/:itemId/listo',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.COCINA),
  marcarItemListo,
);

// ─── Admin/encargado — gestión de órdenes ────────────────────────────────────
router.get(
  '/',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.ENCARGADO),
  getOrdenes,
);
router.delete(
  '/items/:itemId',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.ENCARGADO),
  cancelarItem,
);

export default router;