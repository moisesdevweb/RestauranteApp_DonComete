import { Router } from 'express';
import { cobrarOrden, getPago } from '../controllers/pago.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

router.post('/',    authMiddleware, requireRol(Rol.ADMIN, Rol.MESERO), cobrarOrden);
router.get('/:id', authMiddleware, requireRol(Rol.ADMIN, Rol.MESERO), getPago);

export default router;
