'use client';
import { Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Usuario } from '@/modules/admin/types/admin.types';

const rolStyle: Record<string, string> = {
  admin:  'bg-purple-500/20 text-purple-400',
  mesero: 'bg-blue-500/20 text-blue-400',
  cocina: 'bg-orange-500/20 text-orange-400',
};

const rolLabel: Record<string, string> = {
  admin:  'Admin',
  mesero: 'Mesero',
  cocina: 'Cocinero',
};

interface TablaUsuariosProps {
  usuarios:        Usuario[];
  loading:         boolean;
  onEditar:        (u: Usuario) => void;
  onEliminar:      (u: Usuario) => void;
  onReactivar:     (id: number) => void;
}

export function TablaUsuarios({ usuarios, loading, onEditar, onEliminar, onReactivar }: TablaUsuariosProps) {
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {['Usuario', 'Rol', 'Teléfono', 'Fecha Registro', 'Estado', 'Acciones'].map(h => (
              <th key={h} className="text-left px-5 py-3 text-white/40 text-xs font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(4)].map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-5 py-3">
                <div className="h-4 bg-white/5 rounded animate-pulse" />
              </td></tr>
            ))
          ) : usuarios.map(u => (
            // ← fila opaca si está inactivo
            <tr key={u.id}
              className={`border-b border-white/5 transition-colors ${
                u.activo
                  ? 'hover:bg-white/[0.02]'
                  : 'opacity-40 hover:opacity-60'
              }`}>

              {/* Usuario */}
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rolStyle[u.rol] ?? rolStyle.mesero}`}>
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{u.nombre}</div>
                    <div className="text-white/30 text-xs">@{u.username}</div>
                  </div>
                </div>
              </td>

              {/* Rol */}
              <td className="px-5 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${rolStyle[u.rol] ?? rolStyle.mesero}`}>
                  {rolLabel[u.rol] ?? u.rol}
                </span>
              </td>

              {/* Teléfono */}
              <td className="px-5 py-3">
                <span className="text-white/50 text-sm">{u.telefono ?? '—'}</span>
              </td>

              {/* Fecha */}
              <td className="px-5 py-3">
                <span className="text-white/40 text-sm">
                  {new Date(u.createdAt).toLocaleDateString('es-PE')}
                </span>
              </td>

              {/* Estado */}
              <td className="px-5 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  u.activo
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>

              {/* Acciones */}
              <td className="px-5 py-3">
                <div className="flex gap-2">
                  {u.activo ? (
                    <>
                      <button onClick={() => onEditar(u)}
                        className="p-1.5 rounded-lg bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => onEliminar(u)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    // Solo botón reactivar si está inactivo
                    <button onClick={() => onReactivar(u.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors cursor-pointer">
                      <RefreshCw size={13} /> Reactivar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
