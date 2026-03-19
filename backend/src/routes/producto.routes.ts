import { Router } from 'express';
import {
  getProductos,
  getProducto,
  crearProducto,
  editarProducto,
  eliminarProducto,
  toggleAgotado,
} from '../controllers/producto.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { Rol } from '../types/enums';

const router = Router();

// ─── Lectura — todos los autenticados ─────────────────────────────────────────
router.get('/',    authMiddleware, getProductos);
router.get('/:id', authMiddleware, getProducto);

// ─── Gestión — admin y encargado ──────────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.ENCARGADO),
  uploadSingle,
  crearProducto,
);
router.put(
  '/:id',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.ENCARGADO),
  uploadSingle,
  editarProducto,
);
router.delete(
  '/:id',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.ENCARGADO),
  eliminarProducto,
);

// Toggle agotado — operación frecuente del encargado durante el servicio
router.patch(
  '/:id/agotado',
  authMiddleware,
  requireRol(Rol.ADMIN, Rol.ENCARGADO),
  toggleAgotado,
);

export default router;