import { Router } from 'express';
import {
  getMenus, getMenuHoy, crearMenu,
  editarMenu, desactivarMenu, duplicarMenu
} from '../controllers/menuDiario.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// Todos ven el menú del día (mesero lo necesita para tomar pedidos)
router.get('/', authMiddleware, getMenus);
router.get('/hoy', authMiddleware, getMenuHoy);

// Solo admin gestiona el menú diario
router.post('/', authMiddleware, requireRol(Rol.ADMIN), crearMenu);
router.put('/:id', authMiddleware, requireRol(Rol.ADMIN), editarMenu);
router.delete('/:id', authMiddleware, requireRol(Rol.ADMIN), desactivarMenu);
router.post('/:id/duplicar', authMiddleware, requireRol(Rol.ADMIN), duplicarMenu);

export default router;