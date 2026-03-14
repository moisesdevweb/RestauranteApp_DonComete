import { Router } from 'express';
import { getUsers, crearUser, editarUser, desactivarUser, cambiarPassword, getAllUsers, reactivarUser } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// Solo admin gestiona usuarios
router.get('/', authMiddleware, requireRol(Rol.ADMIN), getUsers);
// Alias para /api/usuarios
router.get('/usuarios', authMiddleware, requireRol(Rol.ADMIN), getUsers);
router.get('/todos', authMiddleware, requireRol(Rol.ADMIN), getAllUsers);
router.post('/', authMiddleware, requireRol(Rol.ADMIN), crearUser);
router.patch('/:id/reactivar', authMiddleware, requireRol(Rol.ADMIN), reactivarUser);
router.put('/:id', authMiddleware, requireRol(Rol.ADMIN), editarUser);
router.delete('/:id', authMiddleware, requireRol(Rol.ADMIN), desactivarUser);
router.patch('/:id/password', authMiddleware, requireRol(Rol.ADMIN), cambiarPassword);
export default router;