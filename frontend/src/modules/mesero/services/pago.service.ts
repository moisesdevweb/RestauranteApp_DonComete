import api from '@/lib/axios';

export interface PagoMetodo {
  metodo: 'efectivo' | 'yape' | 'plin' | 'tarjeta' | 'transferencia';
  monto: number;
  montoPagado?: number; // solo efectivo
  vuelto?: number;      // solo efectivo
}

export interface CobrarPayload {
  ordenId: number;
  descuento?: number;
  pagos: PagoMetodo[];
}

export interface DetallePagoRes {
  id: number;
  metodo: string;
  monto: number;
  montoPagado: number | null;
  vuelto: number | null;
}

export interface PagoRes {
  id: number;
  ordenId: number;
  subtotal: number;
  descuento: number;
  total: number;
  detalles: DetallePagoRes[];
}

export const cobrarOrden = async (data: CobrarPayload): Promise<PagoRes> =>
  (await api.post('/pagos', data)).data.data;

export const getPago = async (id: number): Promise<PagoRes> =>
  (await api.get(`/pagos/${id}`)).data.data;
