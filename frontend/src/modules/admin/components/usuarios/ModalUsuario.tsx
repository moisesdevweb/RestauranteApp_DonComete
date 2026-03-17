'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { Usuario } from '@/modules/admin/types/admin.types';

const ROLES = [
  { value: 'mesero'     as const, label: 'Mesero',        color: 'bg-blue-500/20 text-blue-400'    },
  { value: 'cocina'     as const, label: 'Cocinero',       color: 'bg-orange-500/20 text-orange-400' },
  { value: 'encargado'  as const, label: 'Encargado',      color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'admin'      as const, label: 'Administrador',  color: 'bg-purple-500/20 text-purple-400' },
];

interface ModalUsuarioProps {
  usuario: Usuario | null;
  guardando: boolean;
  onGuardar: (data: { nombre: string; username: string; password?: string; rol: string; telefono?: string }) => void;
  onCerrar: () => void;
}

export function ModalUsuario({ usuario, guardando, onGuardar, onCerrar }: ModalUsuarioProps) {
  const [nombre,    setNombre]    = useState(() => usuario?.nombre   ?? '');
  const [username,  setUsername]  = useState(() => usuario?.username ?? '');
  const [password,  setPassword]  = useState('');
  const [rol,       setRol]       = useState(() => usuario?.rol      ?? 'mesero');
  const [telefono,  setTelefono]  = useState(() => usuario?.telefono ?? '');
  const [verPass,   setVerPass]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar({
      nombre, username, rol, telefono,
      ...(password ? { password } : {}),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onCerrar}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">
            {usuario ? 'Editar Usuario' : 'Agregar Usuario'}
          </h3>
          <button onClick={onCerrar} className="text-white/30 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nombre */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">Nombre completo</label>
            <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: María García"
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
          </div>

          {/* Username */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">Usuario</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Ej: maria.garcia"
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
          </div>

          {/* Password */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">
              {usuario ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            </label>
            <div className="relative">
              <input
                type={verPass ? 'text' : 'password'}
                required={!usuario}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={usuario ? '••••••••' : 'Mínimo 4 caracteres'}
                className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-white outline-none focus:border-orange-500/50 placeholder-white/20"
              />
              <button type="button" onClick={() => setVerPass(!verPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white cursor-pointer">
                {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">Teléfono (opcional)</label>
            <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="Ej: 987654321"
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
          </div>

          {/* Rol */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRol(r.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                    rol === r.value
                      ? `${r.color} border-current`
                      : 'bg-[#2a3040] text-white/40 border-transparent hover:text-white/70'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50">
              {guardando ? 'Guardando...' : usuario ? 'Guardar' : 'Agregar Usuario'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}