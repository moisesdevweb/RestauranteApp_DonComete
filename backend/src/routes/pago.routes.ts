import { Router } from 'express';
import { getCuenta, registrarPago } from '../controllers/pago.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

router.get('/orden/:ordenId', authMiddleware, requireRol(Rol.ADMIN, Rol.MESERO), getCuenta);
router.post('/', authMiddleware, requireRol(Rol.ADMIN, Rol.MESERO), registrarPago);

export default router;