import api from '@/lib/axios';

export interface ValidarCodigoRes {
  codigo:          string;
  descripcion:     string | null;
  tipo:            'porcentaje' | 'monto_fijo';
  valor:           number;
  montoDescuento:  number;
}

export const validarCodigo = async (codigo: string, subtotal: number): Promise<ValidarCodigoRes> =>
  (await api.post('/descuentos/validar', { codigo, subtotal })).data.data;