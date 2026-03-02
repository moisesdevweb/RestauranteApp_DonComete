export enum Rol {
  ADMIN   = 'admin',
  MESERO  = 'mesero',
  COCINA  = 'cocina',
}

export enum EstadoMesa {
  LIBRE             = 'libre',
  OCUPADA           = 'ocupada',
  CUENTA_PENDIENTE  = 'cuenta_pendiente',
}

export enum EstadoOrden {
  ABIERTA    = 'abierta',
  EN_COCINA  = 'en_cocina',
  PAGADA     = 'pagada',
}

export enum EstadoDetalle {
  PENDIENTE = 'pendiente',
  LISTO     = 'listo',
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA  = 'tarjeta',
  YAPE     = 'yape',
  PLIN     = 'plin',
}