import api from '@/lib/axios';
import { Mesa } from '@/types';

export const getMesas = async (): Promise<Mesa[]> => {
  const res = await api.get('/mesas');
  return res.data.data;
};