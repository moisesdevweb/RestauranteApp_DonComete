export { User }           from './User';
export { Mesa }           from './Mesa';
export { Categoria }      from './Categoria';
export { Producto }       from './Producto';
export { MenuDiario }     from './MenuDiario';
export { MenuDiarioItem } from './MenuDiarioItem';
export { Orden }          from './Orden';
export { Comensal }       from './Comensal';
export { DetalleOrden }   from './DetalleOrden';
export { Pago }           from './Pago';
export { DetallePago }    from './DetallePago';
export { AuditLog }       from './AuditLog';
export { CodigoDescuento }  from './CodigoDescuento';  
export { ConfigQR }         from './ConfigQR';         
export const setupAssociations = () => {
  console.log('Asociaciones de modelos configuradas');
};