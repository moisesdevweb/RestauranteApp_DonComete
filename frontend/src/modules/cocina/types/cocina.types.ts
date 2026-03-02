export interface DetalleOrden {
  id: number;
  nombre?: string;
  cantidad: number;
  nota: string | null;
  estado: 'pendiente' | 'listo';
  tipo: 'carta' | 'menu_dia';
  producto?: { nombre: string };
}

export interface Comensal {
  id: number;
  numero: number;
  nombre: string | null;
  detalles: DetalleOrden[];
}

export interface OrdenCocina {
  id: number;
  estado: string;
  mesa: { numero: number };
  comensales: Comensal[];
  creadoEn?: string;
  updatedAt?: string;
}
