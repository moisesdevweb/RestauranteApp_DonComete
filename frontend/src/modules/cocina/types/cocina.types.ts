// ─── Tipos de la vista de cocina ──────────────────────────────────────────────

export interface DetalleOrden {
  id: number;
  nombre?: string;
  cantidad: number;
  nota: string | null;
  estado: 'pendiente' | 'listo';
  tipo: 'carta' | 'menu_dia';
  /** Producto de carta — presente cuando tipo === 'carta' */
  producto?: { nombre: string };
  /** Menú del día — presente cuando tipo === 'menu_dia' */
  menuDiario?: { precio: number };
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

// ─── Helper ───────────────────────────────────────────────────────────────────
/**
 * Devuelve el nombre legible de un detalle para mostrarlo en cocina.
 *
 * - Carta:    usa el nombre del producto (ej: "Lomo Saltado")
 * - Menú día: extrae entrada+fondo de la nota guardada por el mesero.
 *             Formato de nota: "Menú: {entrada} + {fondo}"
 *             Si no hay nota o no tiene ese formato → "Menú del Día"
 */
export const getNombreDetalle = (detalle: DetalleOrden): string => {
  if (detalle.tipo === 'carta') {
    return detalle.producto?.nombre ?? 'Producto';
  }
  // Para menú del día la nota tiene el formato: "Entrada + Fondo | nota extra"
  // o simplemente "Entrada + Fondo" si no hay nota adicional.
  // Mostramos solo la parte de entrada+fondo (antes del "|") como nombre principal.
  if (detalle.nota) {
    const partes = detalle.nota.split('|');
    const platos = partes[0].trim();
    if (platos.length > 0) return platos;
  }
  return 'Menú del Día';
};

/**
 * Devuelve la nota adicional del comensal para un menú del día (lo que va después del "|").
 * Retorna null si no hay nota extra.
 * Ejemplo: "Caldo + Lomo Saltado | Sin ensalada" → "Sin ensalada"
 */
export const getNotaMenuDia = (detalle: DetalleOrden): string | null => {
  if (detalle.tipo !== 'menu_dia' || !detalle.nota) return null;
  const partes = detalle.nota.split('|');
  if (partes.length < 2) return null;
  const nota = partes[1].trim();
  return nota.length > 0 ? nota : null;
};