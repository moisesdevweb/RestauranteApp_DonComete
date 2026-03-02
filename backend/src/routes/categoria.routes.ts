import { Router } from 'express';
import { getCategorias, crearCategoria, editarCategoria, eliminarCategoria } from '../controllers/categoria.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

router.get('/', authMiddleware, getCategorias);
router.post('/', authMiddleware, requireRol(Rol.ADMIN), crearCategoria);
router.put('/:id', authMiddleware, requireRol(Rol.ADMIN), editarCategoria);
router.delete('/:id', authMiddleware, requireRol(Rol.ADMIN), eliminarCategoria);

export default router;