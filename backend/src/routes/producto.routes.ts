import { Router } from 'express';
import {
  getProductos, getProducto, crearProducto,
  editarProducto, eliminarProducto, toggleAgotado, ajustarStock,
} from '../controllers/producto.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { Rol } from '../types/enums';

const router = Router();

const gestores = [authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO)];

// Lectura — todos los autenticados
router.get('/',    authMiddleware, getProductos);
router.get('/:id', authMiddleware, getProducto);

// Gestión — admin y encargado
router.post(  '/',           ...gestores, uploadSingle, crearProducto);
router.put(   '/:id',        ...gestores, uploadSingle, editarProducto);
router.delete('/:id',        ...gestores, eliminarProducto);
router.patch( '/:id/agotado',...gestores, toggleAgotado);

// Control de stock — admin y encargado
// PATCH con cantidad positiva = reponer, negativa = ajuste por pérdida/error
router.patch('/:id/stock', ...gestores, ajustarStock);

export default router;