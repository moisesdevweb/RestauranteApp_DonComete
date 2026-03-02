import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  nombre: string;
  username: string;
  rol: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Storage que guarda en cookie Y localStorage
const cookieStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    // Cookie que dura 12 horas — el middleware puede leerla
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 12}`;
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    document.cookie = `${name}=;path=/;max-age=0`;
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        set({ token, user });
      },
      logout: () => {
        set({ token: null, user: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);