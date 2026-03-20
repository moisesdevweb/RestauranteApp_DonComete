'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, Clock, User, Database } from 'lucide-react';
import api from '@/lib/axios';

interface AuditLogEntry {
  id: number;
  accion: string;
  entidad: string;
  entidadId: number | null;
  userId: number | null;
  antes: object | null;
  despues: object | null;
  meta: object | null;
  createdAt: string;
  usuario?: { nombre: string; username: string; rol: string } | null;
}

// ─── Color por módulo ─────────────────────────────────────────────────────────
const colorAccion = (accion: string): string => {
  if (accion.startsWith('MESA'))     return 'bg-blue-500/20 text-blue-400';
  if (accion.startsWith('USUARIO'))  return 'bg-purple-500/20 text-purple-400';
  if (accion.startsWith('PRODUCTO')) return 'bg-orange-500/20 text-orange-400';
  if (accion.startsWith('CATEGORIA'))return 'bg-yellow-500/20 text-yellow-400';
  if (accion.startsWith('MENU'))     return 'bg-green-500/20 text-green-400';
  if (accion.startsWith('ORDEN'))    return 'bg-red-500/20 text-red-400';
  return 'bg-white/10 text-white/50';
};

const labelAccion = (accion: string): string =>
  accion.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

// ─── Fila expandible ──────────────────────────────────────────────────────────
function FilaLog({ entry }: { entry: AuditLogEntry }) {
  const [expandido, setExpandido] = useState(false);
  const tieneDetalle = entry.antes || entry.despues || entry.meta;

  return (
    <>
      <tr
        onClick={() => tieneDetalle && setExpandido(!expandido)}
        className={`border-b border-white/5 transition-colors ${
          tieneDetalle ? 'hover:bg-white/[0.02] cursor-pointer' : ''
        }`}
      >
        {/* Fecha/hora */}
        <td className="px-5 py-3 whitespace-nowrap">
          <div className="text-white/70 text-sm">
            {new Date(entry.createdAt).toLocaleDateString('es-PE')}
          </div>
          <div className="text-white/30 text-xs">
            {new Date(entry.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </td>

        {/* Usuario */}
        <td className="px-5 py-3">
          {entry.usuario ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 text-xs font-bold flex-shrink-0">
                {entry.usuario.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{entry.usuario.nombre}</div>
                <div className="text-white/30 text-xs capitalize">{entry.usuario.rol}</div>
              </div>
            </div>
          ) : (
            <span className="text-white/20 text-sm">Sistema</span>
          )}
        </td>

        {/* Acción */}
        <td className="px-5 py-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorAccion(entry.accion)}`}>
            {labelAccion(entry.accion)}
          </span>
        </td>

        {/* Entidad */}
        <td className="px-5 py-3">
          <span className="text-white/50 text-sm capitalize">{entry.entidad.replace(/_/g, ' ')}</span>
          {entry.entidadId && (
            <span className="text-white/20 text-xs ml-1">#{entry.entidadId}</span>
          )}
        </td>

        {/* Meta resumen */}
        <td className="px-5 py-3">
          {entry.meta && (
            <span className="text-white/30 text-xs truncate max-w-[180px] block">
              {Object.entries(entry.meta as Record<string, unknown>)
                .slice(0, 2)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ')}
            </span>
          )}
        </td>

        {/* Expand */}
        <td className="px-5 py-3">
          {tieneDetalle && (
            <span className="text-white/20">
              {expandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
        </td>
      </tr>

      {/* Fila expandida con antes/después */}
      {expandido && tieneDetalle && (
        <tr className="bg-[#0f1520] border-b border-white/5">
          <td colSpan={6} className="px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {entry.antes && (
                <div>
                  <div className="text-red-400/70 text-xs uppercase tracking-wider mb-2">Antes</div>
                  <pre className="text-white/50 text-xs bg-[#1a1f2e] rounded-xl p-3 overflow-auto max-h-48 font-mono">
                    {JSON.stringify(entry.antes, null, 2)}
                  </pre>
                </div>
              )}
              {entry.despues && (
                <div>
                  <div className="text-emerald-400/70 text-xs uppercase tracking-wider mb-2">Después</div>
                  <pre className="text-white/50 text-xs bg-[#1a1f2e] rounded-xl p-3 overflow-auto max-h-48 font-mono">
                    {JSON.stringify(entry.despues, null, 2)}
                  </pre>
                </div>
              )}
              {entry.meta && (
                <div>
                  <div className="text-blue-400/70 text-xs uppercase tracking-wider mb-2">Contexto</div>
                  <pre className="text-white/50 text-xs bg-[#1a1f2e] rounded-xl p-3 overflow-auto max-h-48 font-mono">
                    {JSON.stringify(entry.meta, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AuditLogPage() {
  const [logs,      setLogs]      = useState<AuditLogEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [busqueda,  setBusqueda]  = useState('');
  const [filtroModulo, setFiltroModulo] = useState('todos');
  const [pagina,    setPagina]    = useState(1);
  const POR_PAGINA = 30;

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      setLogs(res.data.data);
    } catch { console.error('Error al cargar audit logs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Filtros
  const logsFiltrados = logs.filter(l => {
    const matchBusqueda = !busqueda ||
      l.accion.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.entidad.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.usuario?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.usuario?.username.toLowerCase().includes(busqueda.toLowerCase());

    const matchModulo = filtroModulo === 'todos' ||
      l.accion.startsWith(filtroModulo.toUpperCase());

    return matchBusqueda && matchModulo;
  });

  const totalPaginas = Math.ceil(logsFiltrados.length / POR_PAGINA);
  const logsPaginados = logsFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const MODULOS = ['todos', 'mesa', 'usuario', 'producto', 'categoria', 'menu', 'orden'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Log de Auditoría</h1>
          <p className="text-white/40 text-sm">
            Historial completo de acciones en el sistema — {logs.length} registros
          </p>
        </div>
        <button onClick={cargar}
          className="text-xs text-orange-400 border border-orange-400/30 px-3 py-1.5 rounded-lg hover:bg-orange-400/10 transition-colors cursor-pointer">
          ↻ Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
            placeholder="Buscar por acción, usuario..."
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm outline-none focus:border-orange-500/50 placeholder-white/20" />
        </div>

        {/* Filtro módulo */}
        <div className="flex gap-2 flex-wrap">
          {MODULOS.map(m => (
            <button key={m} onClick={() => { setFiltroModulo(m); setPagina(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer capitalize ${
                filtroModulo === m
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#1a1f2e] text-white/40 border border-white/10 hover:text-white/70'
              }`}>
              {m === 'todos' ? 'Todos' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Fecha/Hora', 'Usuario', 'Acción', 'Entidad', 'Detalle', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-white/40 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-3">
                  <div className="h-4 bg-white/5 rounded animate-pulse" />
                </td></tr>
              ))
            ) : logsPaginados.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-white/20">
                No hay registros que coincidan
              </td></tr>
            ) : (
              logsPaginados.map(entry => <FilaLog key={entry.id} entry={entry} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-white/30 text-sm">
            {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, logsFiltrados.length)} de {logsFiltrados.length}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="px-3 py-1.5 rounded-lg bg-[#1a1f2e] text-white/50 hover:text-white border border-white/10 text-sm disabled:opacity-30 cursor-pointer transition-colors">
              ← Anterior
            </button>
            <span className="px-3 py-1.5 text-white/50 text-sm">
              {pagina} / {totalPaginas}
            </span>
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
              className="px-3 py-1.5 rounded-lg bg-[#1a1f2e] text-white/50 hover:text-white border border-white/10 text-sm disabled:opacity-30 cursor-pointer transition-colors">
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}