import { getIo } from './index';
import { Orden } from '../models/Orden';
import { DetalleOrden } from '../models/DetalleOrden';
import { Mesa } from '../models/Mesa';

// ─────────────────────────────────────────────────────────────────────────────
// Emisores de Socket.io para eventos del flujo de órdenes.
//
// Salas usadas:
//   'cocina'  — pantalla de cocina (recibe nuevos pedidos)
//   'mesero'  — vista del mesero  (recibe items listos y estado de mesas)
//   'admin'   — panel admin       (recibe todo para monitoreo en tiempo real)
//   broadcast — todos los conectados (cambios de estado de mesa)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emite una nueva orden (o actualización de orden existente) a cocina y admin.
 * Solo incluye los items con estado PENDIENTE — los que cocina debe preparar.
 * Se llama desde enviarACocina después de filtrar items directos (sin cocina).
 */
export const emitNuevaOrden = (orden: Orden | null): void => {
  if (!orden) return;
  const io = getIo();
  io.to('cocina').to('admin').emit('orden:nueva', orden);
  const mesa = (orden as Orden & { mesa?: Mesa }).mesa;
  console.log(`[Socket] orden:nueva → cocina (Mesa ${mesa?.numero ?? orden.mesaId})`);
};

/**
 * Emite a los meseros y admin que un item específico fue marcado como listo.
 * El mesero usa este evento para actualizar el badge del carrito en tiempo real
 * y habilitar el botón "Cobrar Mesa" cuando todos los items están listos.
 */
export const emitItemListo = (detalle: DetalleOrden): void => {
  const io = getIo();
  io.to('mesero').to('admin').emit('orden:item_listo', detalle);
  console.log(`[Socket] orden:item_listo → mesero (item #${detalle.id})`);
};

/**
 * Emite el nuevo estado de una mesa a todos los conectados.
 * Actualiza el mapa de mesas del mesero en tiempo real sin necesidad de recargar.
 * Se llama cuando: se crea una orden (libre→ocupada) o se cobra (ocupada→libre).
 */
// ─────────────────────────────────────────────────────────────────────────────
// Interfaz del payload de alerta de stock bajo
// ─────────────────────────────────────────────────────────────────────────────
interface AlertaStock {
  id:          number;
  nombre:      string;
  stock:       number;
  stockMinimo: number;
  agotado:     boolean;
}

/**
 * Emite una alerta de stock bajo a admin y meseros.
 * Se dispara cuando el stock de un producto llega al mínimo configurado o a 0.
 * El frontend muestra un toast de advertencia/error según si está agotado o no.
 */
export const emitStockBajo = (alerta: AlertaStock): void => {
  const io = getIo();
  io.to('mesero').to('admin').to('encargado').emit('producto:stock_bajo', alerta);
  console.log(`[Socket] producto:stock_bajo → ${alerta.nombre} (stock: ${alerta.stock})`);
};

export const emitEstadoMesa = (mesa: Mesa): void => {
  const io = getIo();
  io.emit('mesa:estado', mesa);
  console.log(`[Socket] mesa:estado → todos (Mesa ${mesa.numero}: ${mesa.estado})`);
};