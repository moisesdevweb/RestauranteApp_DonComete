import { Request, Response } from 'express';
import { User } from '../models';
import { generarToken } from '../services/auth.service';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'Usuario y contraseña requeridos' });
    }

    // Buscar usuario activo
    const user = await User.findOne({ where: { username, activo: true } });
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
    }

    // Verificar contraseña
    const passwordValida = await user.verificarPassword(password);
    if (!passwordValida) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
    }

    // Actualizar último acceso
    await user.update({ ultimoAcceso: new Date() });

    // Generar token
    const token = generarToken({
      id: user.id,
      username: user.username,
      rol: user.rol,
      nombre: user.nombre,
    });

    return res.json({
      ok: true,
      data: {
        token,
        user: user.toJSON(), // toJSON() ya elimina el passwordHash
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
};

export const me = async (req: Request, res: Response) => {
  // req.user lo pone el middleware de auth
  return res.json({ ok: true, data: req.user });
};