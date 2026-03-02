// ─── SHARED ───────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── MESAS ────────────────────────────────────────────────────────────────────
export type EstadoMesa = 'libre' | 'ocupada' | 'reservada' | 'inactiva';

export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  qrToken: string;
  activa: boolean;
  createdAt: string;
}

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activo: boolean;
  createdAt: string;
}

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────
export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagenUrl?: string;
  disponible: boolean;
  agotado: boolean;
  categoriaId: number;
  categoria?: Pick<Categoria, 'id' | 'nombre' | 'icono'>;
  createdAt: string;
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
export type RolUsuario = 'admin' | 'mesero' | 'cocina';

export interface Usuario {
  id: number;
  nombre: string;
  username: string;
  rol: RolUsuario;
  telefono?: string;
  activo: boolean;
  createdAt: string;
}

export interface ConteoUsuarios {
  total: number;
  meseros: number;
  cocina: number;
  activos: number;
}

// ─── ÓRDENES ──────────────────────────────────────────────────────────────────
export type EstadoOrden =
  | 'pendiente'
  | 'en_proceso'
  | 'listo'
  | 'entregado'
  | 'completada'
  | 'cancelada';

export interface ItemOrden {
  id: number;
  productoId: number;
  producto: Pick<Producto, 'id' | 'nombre' | 'precio' | 'imagenUrl'>;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
  estado: EstadoOrden;
}

export interface Orden {
  id: number;
  mesaId: number;
  mesa?: Pick<Mesa, 'id' | 'numero'>;
  usuarioId?: number;
  mesero?: string;
  estado: EstadoOrden;
  total: number;
  items: ItemOrden[];
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

// ─── REPORTES — respuestas reales del backend ─────────────────────────────────

export interface KpisReporte {
  totalVentas: number;
  totalMesas: number;
  ticketPromedio: number;
}

export interface ReporteDiario {
  fecha: string;
  kpis: KpisReporte;
  ventasPorHora: Record<number, number>;
  metodosPago: Record<string, number>;
  pedidos: PedidoResumen[];
}

export interface PedidoResumen {
  id: number;
  mesa: number;
  mesero: string;
  total: number;
  cerradoEn: string;
  metodos: { metodo: string; monto: number }[];
}

export interface ReporteSemanal {
  desde: string;
  hasta: string;
  kpis: KpisReporte;
  ventasPorDia: Record<string, number>;
  mesasPorDia: Record<string, number>;
  metodosPago: Record<string, number>;
}

export interface ReporteMensual {
  año: number;
  mes: number;
  desde: string;
  hasta: string;
  kpis: KpisReporte;
  ventasPorDia: Record<number, number>;
  mesasPorDia: Record<number, number>;
  metodosPago: Record<string, number>;
}

export interface ReporteAnual {
  año: number;
  kpis: KpisReporte & { mejorMes: string };
  ventasPorMes: Record<string, number>;
  mesasPorMes: Record<string, number>;
  metodosPago: Record<string, number>;
}

export interface Comparativa {
  hoyVsAyer:        { actual: number; anterior: number; variacion: number };
  semanaVsSemana:   { actual: number; anterior: number; variacion: number };
  mesVsMes:         { actual: number; anterior: number; variacion: number };
}

// ProductoTop — ya lo teníamos, solo ajustar campo "total" → viene como "total" del backend
export interface ProductoTop {
  id: number;
  nombre: string;
  cantidad: number;
  total: number;   // ← backend devuelve "total", no "ingresos"
}