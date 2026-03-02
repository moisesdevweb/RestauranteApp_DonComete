import { Router } from 'express';
import {
  getProductos, getProducto, crearProducto,
  editarProducto, eliminarProducto, toggleAgotado
} from '../controllers/producto.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { Rol } from '../types/enums';

const router = Router();

router.get('/', authMiddleware, getProductos);
router.get('/:id', authMiddleware, getProducto);
router.post('/', authMiddleware, requireRol(Rol.ADMIN), uploadSingle, crearProducto);
router.put('/:id', authMiddleware, requireRol(Rol.ADMIN), uploadSingle, editarProducto);
router.delete('/:id', authMiddleware, requireRol(Rol.ADMIN), eliminarProducto);
router.patch('/:id/agotado', authMiddleware, requireRol(Rol.ADMIN), toggleAgotado);

export default router;