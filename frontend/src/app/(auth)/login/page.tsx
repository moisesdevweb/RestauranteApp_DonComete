'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Lock, LogIn, ChefHat, UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { loginService } from '@/modules/auth/services/auth.service';
import { sileo } from 'sileo';

type Rol = 'admin' | 'mesero' | 'cocina';

const roles: { id: Rol; label: string; icon: React.ReactNode }[] = [
  { id: 'admin',  label: 'Admin',  icon: <ShieldCheck size={16} /> },
  { id: 'mesero', label: 'Mesero', icon: <UtensilsCrossed size={16} /> },
  { id: 'cocina', label: 'Cocina', icon: <ChefHat size={16} /> },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [rolSeleccionado, setRolSeleccionado] = useState<Rol>('mesero');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!username || !password) {
    sileo.error({ title: 'Completa todos los campos' });
    return;
  }

  setLoading(true);
  try {
    const { token, user } = await loginService({ username, password });

    if (user.rol !== rolSeleccionado) {
      sileo.error({
        title: 'Rol incorrecto',
        description: `Esta cuenta es de tipo "${user.rol}"`,
      });
      return;
    }

    setAuth(token, user);
    sileo.success({ title: `Bienvenido, ${user.nombre} 👋` });

    const rutas: Record<string, string> = {
      admin:  '/admin',
      mesero: '/mesero',
      cocina: '/cocina',
    };
    router.push(rutas[user.rol] ?? '/');

  } catch {
    sileo.error({ title: 'Usuario o contraseña incorrectos' });
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1a1f2e] relative overflow-hidden">

      {/* Blobs de fondo */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md px-4"
      >
        {/* Logo y título */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-24 h-24 rounded-2xl bg-[#2a2f3e] border border-white/10 flex items-center justify-center mb-4"
          >
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs text-center leading-tight">Don<br/>Camote</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white text-2xl font-bold"
          >
            Sistema POS
          </motion.h1>
          <p className="text-white/40 text-sm mt-1">Restaurante Familiar</p>
        </div>

        {/* Card formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="bg-[#232836] border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          {/* Selección de rol */}
          <div className="mb-6">
            <label className="text-white/60 text-sm mb-3 block">Seleccionar Rol</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((rol) => (
                <button
                  key={rol.id}
                  type="button"
                  onClick={() => setRolSeleccionado(rol.id)}
                  className={`
                    flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium
                    transition-all duration-200 cursor-pointer
                    ${rolSeleccionado === rol.id
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-[#2a2f3e] text-white/50 hover:text-white/80 hover:bg-[#313849]'
                    }
                  `}
                >
                  {rol.icon}
                  {rol.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Usuario */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Usuario</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full bg-[#2a2f3e] border border-white/10 rounded-xl py-3 pl-10 pr-4
                    text-white placeholder-white/25 text-sm outline-none
                    focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-[#2a2f3e] border border-white/10 rounded-xl py-3 pl-10 pr-4
                    text-white placeholder-white/25 text-sm outline-none
                    focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60
                text-white font-semibold py-3 rounded-xl mt-2
                flex items-center justify-center gap-2
                transition-all duration-200 cursor-pointer
                shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Ingresar al Sistema
                </>
              )}
            </button>
          </form>

          <p className="text-white/25 text-xs text-center mt-6">
            Sistema de gestión para restaurante
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}