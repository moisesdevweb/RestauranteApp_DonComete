'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';

export function AuthInitializer() {
  const { token, user, setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me')
        .then(({ data }) => setAuth(token, data.data))
        .catch(() => logout());
    }
  }, []);

  return null;
}
