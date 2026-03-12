import { Router } from 'express';
import { getMesas, crearMesa, editarMesa, cambiarEstadoMesa, desactivarMesa, reactivarMesa } from '../controllers/mesa.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// Todos los roles autenticados pueden ver mesas
router.get('/', authMiddleware, getMesas);

// Solo admin puede crear, editar, desactivar
router.post('/', authMiddleware, requireRol(Rol.ADMIN), crearMesa);
router.put('/:id', authMiddleware, requireRol(Rol.ADMIN), editarMesa);
router.delete('/:id', authMiddleware, requireRol(Rol.ADMIN), desactivarMesa);

// Mesero y admin pueden cambiar estado
router.patch('/:id/estado', authMiddleware, requireRol(Rol.ADMIN, Rol.MESERO), cambiarEstadoMesa);

// sólo admin puede reactivar mesas inactivas
router.patch('/:id/reactivar', authMiddleware, requireRol(Rol.ADMIN), reactivarMesa);

export default router;