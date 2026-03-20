import api from '@/lib/axios';

export interface ConfigQRRes {
  id:          number;
  metodo:      string;
  imagenUrl:   string;
  titular:     string | null;
  numero:      string | null;
  activo:      boolean;
}

export const getQRs = async (): Promise<ConfigQRRes[]> =>
  (await api.get('/config-qr')).data.data;