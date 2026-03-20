import { Router } from 'express';
import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRol } from '../middlewares/role.middleware';
import { Rol } from '../types/enums';

const router = Router();

// GET /api/audit-logs — solo admin y encargado
router.get('/', authMiddleware, requireRol(Rol.ADMIN, Rol.ENCARGADO), async (_req: Request, res: Response) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['nombre', 'username', 'rol'],
        required: false,
      }],
      order: [['createdAt', 'DESC']],
      limit: 500, // últimos 500 registros — suficiente para la UI
    });
    res.json({ ok: true, data: logs });
  } catch (err) {
    console.error('[AuditLog] getAll:', err);
    res.status(500).json({ ok: false, message: 'Error al obtener logs' });
  }
});

export default router;