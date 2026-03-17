import { Router } from 'express';
import {
  getUsers,
  getAllUsers,
  crearUser,
  editarUser,
  desactivarUser,
  reactivarUser,
  cambiarPassword,
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// ─── Middleware base: solo admin y encargado gestionan usuarios ───────────────
const soloGestores = [authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO)];

// ─── Lectura ──────────────────────────────────────────────────────────────────
router.get('/',      ...soloGestores, getUsers);
router.get('/todos', ...soloGestores, getAllUsers);

// ─── Gestión ──────────────────────────────────────────────────────────────────
// Cada controller valida internamente el rango (encargado no toca admins/encargados)
router.post('/',                ...soloGestores, crearUser);
router.put('/:id',              ...soloGestores, editarUser);
router.delete('/:id',           ...soloGestores, desactivarUser);
router.patch('/:id/reactivar',  ...soloGestores, reactivarUser);
router.patch('/:id/password',   ...soloGestores, cambiarPassword);

export default router;