import api from '@/lib/axios';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UserAuth {
  id: number;
  nombre: string;
  username: string;
  rol: string;
}

export interface LoginResponse {
  token: string;
  user: UserAuth;
}

export const loginService = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/login', payload);
  return data.data; // backend: { ok, data: { token, user } }
};

export const meService = async (): Promise<UserAuth> => {
  const { data } = await api.get('/auth/me');
  return data.data;
};
