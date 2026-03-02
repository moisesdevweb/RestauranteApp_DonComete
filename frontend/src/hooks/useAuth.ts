'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export function useAuth() {
  const { token, user, setAuth, logout, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  // Si hay token pero no user (recarga), valida con /me
  useEffect(() => {
    if (!_hasHydrated) return;
    if (token && !user) {
      api.get('/auth/me')
        .then(({ data }) => setAuth(token, data.data))
        .catch(() => logout());
    }
  }, [_hasHydrated, token]);

  const handleLogin = async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    const { token: newToken, user: newUser } = data.data;
    setAuth(newToken, newUser);
    const rutas: Record<string, string> = {
      admin:  '/admin',
      mesero: '/mesero',
      cocina: '/cocina',
    };
    router.push(rutas[newUser.rol] ?? '/');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return {
    token, user,
    hidratado: _hasHydrated,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
  };
}
