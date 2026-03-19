import { Router } from 'express';
import {
  getMenus,
  getMenuHoy,
  crearMenu,
  editarMenu,
  desactivarMenu,
  duplicarMenu,
} from '../controllers/menuDiario.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// ─── Lectura — todos los autenticados ─────────────────────────────────────────
// El mesero necesita /hoy para mostrar el menú al tomar pedidos
router.get('/',    authMiddleware, getMenus);
router.get('/hoy', authMiddleware, getMenuHoy);

// ─── Gestión — admin y encargado ──────────────────────────────────────────────
router.post(  '/',              authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), crearMenu);
router.put(   '/:id',          authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), editarMenu);
router.delete('/:id',          authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), desactivarMenu);
router.post(  '/:id/duplicar', authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), duplicarMenu);

export default router;