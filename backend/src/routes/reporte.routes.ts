import { Router } from 'express';
import {
  getReporteDiario, getReporteSemanal, getReporteMensual,
  getReporteAnual, getComparativa, getProductosTop, getDashboard
} from '../controllers/reporte.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// Admin y encargado tienen acceso a todos los reportes
// El encargado necesita ver ventas para gestionar el turno
const gestores = [authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO)];

router.get('/diario',        ...gestores, getReporteDiario);
router.get('/semanal',       ...gestores, getReporteSemanal);
router.get('/mensual',       ...gestores, getReporteMensual);
router.get('/anual',         ...gestores, getReporteAnual);
router.get('/comparativa',   ...gestores, getComparativa);
router.get('/productos-top', ...gestores, getProductosTop);
router.get('/dashboard',     ...gestores, getDashboard);

export default router;