// ─── SHARED ───────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── MESAS ────────────────────────────────────────────────────────────────────
// nota: ‘inactiva’ no es un valor real de la base de datos, usamos el booleano `activo`
export type EstadoMesa = 'libre' | 'ocupada' | 'reservada' | 'cuenta_pendiente';

export interface Mesa {
  id: number;
  numero: number;
  piso: number;               // added so admin can filter/group by floor
  capacidad: number;
  estado: EstadoMesa;
  qrToken: string;
  activo: boolean;
  createdAt: string;
}

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
  /** Si false, los productos de esta categoría se sirven directo sin pasar por cocina */
  requiereCocina: boolean;
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
  /** Si false, el mesero sirve este producto directo sin notificar a cocina */
  requiereCocina: boolean;
  /** null = sin control de stock | número = unidades disponibles */
  stock:       number | null;
  /** Umbral de alerta — notifica cuando stock ≤ stockMinimo */
  stockMinimo: number;
  categoriaId: number;
  categoria?: Pick<Categoria, 'id' | 'nombre' | 'icono'>;
  createdAt: string;
}
// ─── MENÚ DIARIO ──────────────────────────────────────────────────────────────
export type TipoItem = 'entrada' | 'fondo' | 'postre' | 'bebida';

export interface MenuDiarioItem {
  id: number;
  menuDiarioId: number;
  tipo: TipoItem;
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
  items: MenuDiarioItem[];
  createdAt: string;
}

export interface MenuDiarioPayload {
  fecha: string;
  precio: number;
  stock?: number;
  items: { tipo: TipoItem; nombre: string }[];
}


// ─── USUARIOS ─────────────────────────────────────────────────────────────────
export type RolUsuario = 'admin' | 'encargado' | 'mesero' | 'cocina';

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

// ─── REPORTES ─────────────────────────────────────────────────────────────────

export interface KpisDiario {
  totalVentas:    number;
  totalMesas:     number;
  ordenesPagadas: number;
  ticketPromedio: number;
  horaPico:       string;
}

export interface KpisSemanal {
  totalVentas:    number;
  totalMesas:     number;
  ordenesPagadas: number;
  ticketPromedio: number;
  mejorDia:       string;
  peorDia:        string;
}

export interface KpisMensual {
  totalVentas:    number;
  totalMesas:     number;
  ordenesPagadas: number;
  ticketPromedio: number;
  mejorSemana:    string;
}

export interface KpisAnual {
  totalVentas:    number;
  totalMesas:     number;
  ordenesPagadas: number;
  ticketPromedio: number;
  mejorMes:       string;
  crecimiento:    number;
}

export interface PedidoResumen {
  id:        number;
  mesa:      number;
  mesero:    string;
  total:     number;
  cerradoEn: string;
  metodos:   { metodo: string; monto: number }[];
}

export interface ComparativaSemana {
  semana:   string;
  actual:   number;
  anterior: number;
}

export interface VentaAño {
  año:   number;
  total: number;
}

export interface MeseroStats {
  nombre:         string;
  ordenes:        number;
  total:          number;
  ticketPromedio: number;
}

//ReporteDiario
export interface ReporteDiario {
  fecha:             string;
  kpis:              KpisDiario;
  ventasPorHora:     Record<number, number>;
  metodosPago:       Record<string, number>;
  ventasPorMesero:   Record<string, MeseroStats>;
  pedidos:           PedidoResumen[];
}


//ReporteSemanal
export interface ReporteSemanal {
  desde:              string;
  hasta:              string;
  kpis:               KpisSemanal;
  ventasPorDia:       Record<string, number>;
  mesasPorDia:        Record<string, number>;
  comparativaSemanas: ComparativaSemana[];
  metodosPago:        Record<string, number>;
}

//ReporteMensual
export interface ReporteMensual {
  año:             number;
  mes:             number;
  desde:           string;
  hasta:           string;
  kpis:            KpisMensual;
  ventasPorDia:    Record<number, number>;
  mesasPorDia:     Record<number, number>;
  ventasPorSemana: Record<string, number>;
  tendenciaMeses:  Record<string, number>;
  metodosPago:     Record<string, number>;
}

// ReporteAnual
export interface ReporteAnual {
  año:          number;
  kpis:         KpisAnual;
  ventasPorMes: Record<string, number>;
  mesasPorMes:  Record<string, number>;
  ventasPorAño: VentaAño[];
  metodosPago:  Record<string, number>;
}

export interface Comparativa {
  hoyVsAyer:      { actual: number; anterior: number; variacion: number };
  semanaVsSemana: { actual: number; anterior: number; variacion: number };
  mesVsMes:       { actual: number; anterior: number; variacion: number };
}

export interface ProductoTop {
  id:       number;
  nombre:   string;
  cantidad: number;
  total:    number;
}

// Tipo union para KPIs en ResumenKpis
export type KpisReporte = KpisDiario | KpisSemanal | KpisMensual | KpisAnual;