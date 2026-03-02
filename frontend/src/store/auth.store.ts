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
  _hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setHasHydrated: (val: boolean) => void;
}

const cookieStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 12};SameSite=Lax`;
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
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => cookieStorage),
      // ← Zustand llama esto cuando termina de leer la cookie
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
