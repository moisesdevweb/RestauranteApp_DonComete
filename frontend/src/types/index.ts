export interface Mesa {
  id: number;
  numero: number;
  piso: number;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'cuenta_pendiente';
  activo: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  categoriaId: number;
  categoria?: Categoria;
  disponible: boolean;
  agotado: boolean;
}

export interface User {
  id: number;
  nombre: string;
  username: string;
  rol: 'admin' | 'mesero' | 'cocina';
  telefono: string | null;
  activo: boolean;
}

export interface Comensal {
  id: number;
  ordenId: number;
  nombre: string | null;
  numero: number;
  detalles?: DetalleOrden[];
}

export interface DetalleOrden {
  id: number;
  ordenId: number;
  comensalId: number;
  tipo: 'carta' | 'menu_dia';
  productoId: number | null;
  menuDiarioId: number | null;
  cantidad: number;
  precioUnitario: number;
  nota: string | null;
  estado: 'pendiente' | 'listo';
  producto?: Producto;
}

export interface Orden {
  id: number;
  mesaId: number;
  userId: number;
  estado: 'abierta' | 'en_cocina' | 'pagada';
  cerradoEn: string | null;
  mesa?: Mesa;
  comensales?: Comensal[];
}

export interface MenuDiarioItem {
  id: number;
  menuDiarioId: number;
  tipo: 'entrada' | 'fondo' | 'postre' | 'bebida';
  nombre: string;
  disponible: boolean;
}

export interface MenuDiario {
  id: number;
  fecha: string;
  precio: number;
  stock: number;
  vendidos: number;
  activo: boolean;
  items?: MenuDiarioItem[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}