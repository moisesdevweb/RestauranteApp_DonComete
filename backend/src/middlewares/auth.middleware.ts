import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../services/auth.service';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, message: 'Token requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verificarToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ ok: false, message: 'Token inválido o expirado' });
  }
};