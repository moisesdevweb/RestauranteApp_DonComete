import { getIo } from './index';
import { Orden } from '../models/Orden';
import { DetalleOrden } from '../models/DetalleOrden';
import { Mesa } from '../models/Mesa';

// ─────────────────────────────────────────────────────────────────────────────
// Emisores de Socket.io para eventos del flujo de órdenes.
//
// Salas usadas:
//   'cocina'    — pantalla de cocina (recibe nuevos pedidos)
//   'mesero'    — vista del mesero  (recibe items listos y estado de mesas)
//   'admin'     — panel admin       (recibe todo para monitoreo en tiempo real)
//   'encargado' — igual que admin
//   broadcast   — todos los conectados (cambios de estado de mesa)
// ─────────────────────────────────────────────────────────────────────────────

/** Emite una nueva orden a cocina y admin. */
export const emitNuevaOrden = (orden: Orden | null): void => {
  if (!orden) return;
  const io = getIo();
  io.to('cocina').to('admin').to('encargado').emit('orden:nueva', orden);
  const mesa = (orden as Orden & { mesa?: Mesa }).mesa;
  console.log(`[Socket] orden:nueva → cocina (Mesa ${mesa?.numero ?? orden.mesaId})`);
};

/** Emite a meseros y admin que un item fue marcado como listo. */
export const emitItemListo = (detalle: DetalleOrden): void => {
  const io = getIo();
  io.to('mesero').to('admin').to('encargado').emit('orden:item_listo', detalle);
  console.log(`[Socket] orden:item_listo → mesero (item #${detalle.id})`);
};

/**
 * Emite a meseros que un item fue cancelado por el admin.
 * El mesero actualiza el carrito y la carta en tiempo real.
 * Payload incluye el productoId y el stock para que el mesero pueda actualizar
 * el estado visual de la card del producto inmediatamente.
 */
export const emitItemCancelado = (payload: {
  itemId:     number;
  ordenId:    number;
  productoId: number | null;
  agotado:    boolean;
  stock?:     number | null; 
}): void => {
  const io = getIo();
  //Emitimos a cocina para que actualice la orden en tiempo real, y a meseros para que actualicen su vista.
  io.to('cocina').to('mesero').to('admin').to('encargado').emit('orden:item_cancelado', payload);
  console.log(`[Socket] orden:item_cancelado → cocina/mesero (item #${payload.itemId})`);
};

/** Alerta de stock bajo — se emite cuando stock ≤ stockMinimo. */
interface AlertaStock {
  id:          number;
  nombre:      string;
  stock:       number;
  stockMinimo: number;
  agotado:     boolean;
}

export const emitStockBajo = (alerta: AlertaStock): void => {
  const io = getIo();
  io.to('mesero').to('admin').to('encargado').emit('producto:stock_bajo', alerta);
  console.log(`[Socket] producto:stock_bajo → ${alerta.nombre} (stock: ${alerta.stock})`);
};

/** Emite el nuevo estado de una mesa a todos los conectados. */
export const emitEstadoMesa = (mesa: Mesa): void => {
  const io = getIo();
  io.emit('mesa:estado', mesa);
  console.log(`[Socket] mesa:estado → todos (Mesa ${mesa.numero}: ${mesa.estado})`);
};