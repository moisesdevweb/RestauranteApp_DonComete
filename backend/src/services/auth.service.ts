import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;
const EXPIRES = '8h';

export interface JwtPayload {
  id: number;
  username: string;
  rol: string;
  nombre: string;
}

export const generarToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
};

export const verificarToken = (token: string): JwtPayload => {
  return jwt.verify(token, SECRET) as JwtPayload;
};