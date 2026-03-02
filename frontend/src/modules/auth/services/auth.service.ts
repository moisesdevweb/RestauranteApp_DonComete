import api from '@/lib/axios';

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  ok: boolean;
  data: {
    token: string;
    user: {
      id: number;
      nombre: string;
      username: string;
      rol: string;
    };
  };
}

export const loginService = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await api.post<{
    ok: boolean;
    data: {
      token: string;
      user: { id: number; nombre: string; username: string; rol: string };
    };
  }>('/auth/login', payload);

  return {
    ok: true,
    data: response.data.data, // ← backend devuelve { ok, data: { token, user } }
  };
};