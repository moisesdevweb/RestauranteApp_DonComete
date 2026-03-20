import { Router } from 'express';
import { getQRs, subirQR, eliminarQR } from '../controllers/configQR.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { Rol } from '../types/enums';

const router = Router();

// Todos los autenticados pueden ver los QRs (mesero los necesita al cobrar)
router.get('/', authMiddleware, getQRs);

// Solo admin sube o elimina QRs
router.post(  '/',         authMiddleware, requireRol(Rol.ADMIN), uploadSingle, subirQR);
router.delete('/:metodo',  authMiddleware, requireRol(Rol.ADMIN), eliminarQR);

export default router;