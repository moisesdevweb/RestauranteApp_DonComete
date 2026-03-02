// Extiende el tipo Request de Express globalmente
// para agregar la propiedad user que pone el authMiddleware

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        rol: string;
        nombre: string;
      };
    }
  }
}

export {};