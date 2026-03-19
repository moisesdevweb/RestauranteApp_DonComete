import { Router } from 'express';
import {
  getCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
} from '../controllers/categoria.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// Todos los autenticados ven categorías (mesero las necesita para la carta)
router.get('/', authMiddleware, getCategorias);

// Admin y encargado gestionan categorías
router.post(  '/',    authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), crearCategoria);
router.put(   '/:id', authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), editarCategoria);
router.delete('/:id', authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), eliminarCategoria);

export default router;