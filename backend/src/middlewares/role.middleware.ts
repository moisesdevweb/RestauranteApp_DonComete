import { Request, Response, NextFunction } from 'express';
import { Rol } from '../types/enums';

// Uso: requireRol(Rol.ADMIN) o requireRol(Rol.ADMIN, Rol.MESERO)
export const requireRol = (...roles: Rol[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ ok: false, message: 'No autenticado' });
      return;
    }

    // Cast a Rol porque req.user.rol es string en el .d.ts global
    // pero en runtime siempre será uno de los valores del enum
    if (!roles.includes(req.user.rol as Rol)) {
      res.status(403).json({ ok: false, message: 'No tienes permiso para esto' });
      return;
    }

    next();
  };
};