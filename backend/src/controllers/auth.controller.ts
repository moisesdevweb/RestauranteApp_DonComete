import { Request, Response } from 'express';
import { User } from '../models';
import { generarToken } from '../services/auth.service';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Autentica un usuario activo con username + password.
// Devuelve JWT con payload { id, username, rol, nombre } y el usuario sin hash.
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ ok: false, message: 'Usuario y contraseña requeridos' });
      return;
    }

    // Solo usuarios activos pueden iniciar sesión
    const user = await User.findOne({ where: { username, activo: true } });
    if (!user) {
      // Mismo mensaje para usuario no encontrado y contraseña incorrecta
      // — no revelar si el usuario existe o no
      res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
      return;
    }

    const passwordValida = await user.verificarPassword(password);
    if (!passwordValida) {
      res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
      return;
    }

    // Registrar último acceso para el log de actividad
    await user.update({ ultimoAcceso: new Date() });

    const token = generarToken({
      id:       user.id,
      username: user.username,
      rol:      user.rol,
      nombre:   user.nombre,
    });

    res.json({
      ok: true,
      data: {
        token,
        user: user.toJSON(), // toJSON() elimina passwordHash
      },
    });
  } catch (err) {
    console.error('[Auth] login:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Devuelve el payload del token del usuario autenticado.
// Útil para que el frontend verifique si la sesión sigue activa.
// ─────────────────────────────────────────────────────────────────────────────
export const me = (req: Request, res: Response): void => {
  res.json({ ok: true, data: req.user });
};