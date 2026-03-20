// ─── codigoDescuento.routes.ts ────────────────────────────────────────────────
import { Router } from 'express';
import {
  getCodigos, validarCodigo,
  crearCodigo, editarCodigo, eliminarCodigo,
} from '../controllers/codigoDescuento.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// Gestión — admin y encargado
router.get('/',               authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), getCodigos);
router.post('/',              authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), crearCodigo);
router.put('/:id',            authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), editarCodigo);
router.delete('/:id',         authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), eliminarCodigo);

// Validar código — el mesero lo usa al cobrar
router.post('/validar',       authMiddleware, requireRol(Rol.ADMIN, Rol.MESERO, Rol.ENCARGADO), validarCodigo);

export default router;