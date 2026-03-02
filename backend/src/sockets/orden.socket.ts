import { getIo } from './index';

// Cuando mesero envía orden a cocina
export const emitNuevaOrden = (orden: any): void => {
  const io = getIo();
  // Emite a todos en la sala 'cocina' y 'admin'
  io.to('cocina').to('admin').emit('orden:nueva', orden);
  console.log(`Emitido orden:nueva → cocina (Mesa ${orden.mesa?.numero})`);
};

// Cuando cocina marca un item como listo
export const emitItemListo = (detalle: any): void => {
  const io = getIo();
  // Emite a todos los meseros y admin
  io.to('mesero').to('admin').emit('orden:item_listo', detalle);
  console.log(`Emitido orden:item_listo → mesero`);
};

// Cuando se cambia estado de mesa (libre/ocupada/cuenta_pendiente)
export const emitEstadoMesa = (mesa: any): void => {
  const io = getIo();
  // Emite a todos los conectados
  io.emit('mesa:estado', mesa);
  console.log(`Emitido mesa:estado → todos (Mesa ${mesa.numero}: ${mesa.estado})`);
};