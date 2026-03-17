import { Router } from 'express';
import {
  getReporteDiario, getReporteSemanal, getReporteMensual,
  getReporteAnual, getComparativa, getProductosTop, getDashboard
} from '../controllers/reporte.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// Solo admin ve reportes
router.get('/diario', authMiddleware, requireRol(Rol.ADMIN), getReporteDiario);
router.get('/semanal', authMiddleware, requireRol(Rol.ADMIN), getReporteSemanal);
router.get('/mensual', authMiddleware, requireRol(Rol.ADMIN), getReporteMensual);
router.get('/anual', authMiddleware, requireRol(Rol.ADMIN), getReporteAnual);
router.get('/comparativa', authMiddleware, requireRol(Rol.ADMIN), getComparativa);
router.get('/productos-top', authMiddleware, requireRol(Rol.ADMIN), getProductosTop);

// Dashboard solo para admin
router.get('/dashboard', authMiddleware, requireRol(Rol.ADMIN), getDashboard);

export default router;