'use client';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChefHat, UtensilsCrossed, CheckCircle2, Clock,
  ChevronRight, ChevronDown, Trash2, Search, X,
} from 'lucide-react';
import { sileo } from 'sileo';
import api from '@/lib/axios';
import { ConfirmModal } from '@/modules/admin/components/shared/ConfirmModal';
import { useSocket }   from '@/hooks/useSocket';
import { KpiCard } from '@/modules/admin/components/shared/KpiCard';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface DetalleItem {
  id: number;
  cantidad: number;
  precioUnitario: number;
  nota: string | null;
  estado: 'pendiente' | 'listo';
  tipo: 'carta' | 'menu_dia';
  producto?: { nombre: string };
  menuDiario?: { precio: number };
}

interface Comensal {
  id: number;
  numero: number;
  nombre: string | null;
  detalles: DetalleItem[];
}

interface DetallePago {
  metodo: string;
  monto: number;
}

interface Orden {
  id: number;
  estado: 'abierta' | 'en_cocina' | 'pagada';
  createdAt: string;
  cerradoEn: string | null;
  mesa?: { numero: number };
  mesero?: { nombre: string; username: string };
  comensales: Comensal[];
  pago?: { total: number; descuento: number; subtotal: number; detalles: DetallePago[] } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const estadoConfig = {
  abierta:   { label: 'Abierta',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'      },
  en_cocina: { label: 'En Cocina', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  pagada:    { label: 'Pagada',    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

const metodoBadge: Record<string, string> = {
  efectivo:      'bg-emerald-500/20 text-emerald-400',
  yape:          'bg-purple-500/20 text-purple-400',
  plin:          'bg-blue-500/20 text-blue-400',
  tarjeta:       'bg-orange-500/20 text-orange-400',
  transferencia: 'bg-cyan-500/20 text-cyan-400',
};

const nombreItem = (d: DetalleItem): string => {
  if (d.tipo === 'carta') return d.producto?.nombre ?? 'Producto';
  if (d.nota) return d.nota.split('|')[0].trim() || 'Menú del Día';
  return 'Menú del Día';
};

const toHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

const toFechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

type AxiosError = { response?: { data?: { message?: string } } };
const getErrMsg = (err: unknown, fb: string) =>
  (err as AxiosError)?.response?.data?.message ?? fb;

// ─── Fila expandible de orden ─────────────────────────────────────────────────
function FilaOrden({
  orden,
  onCancelarItem,
}: {
  orden: Orden;
  onCancelarItem: (itemId: number, nombreItem: string) => void;
}) {
  const [expandida, setExpandida] = useState(false);
  const todosItems = orden.comensales.flatMap(c =>
    c.detalles.map(d => ({ ...d, comensal: c.numero, nombreComensal: c.nombre }))
  );
  const cfg = estadoConfig[orden.estado] ?? estadoConfig.abierta;
  const total = orden.pago?.total ?? todosItems.reduce((s, d) => s + Number(d.precioUnitario) * d.cantidad, 0);

  return (
    <>
      <tr
        onClick={() => setExpandida(!expandida)}
        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        {/* # Orden */}
        <td className="px-5 py-3">
          <span className="text-orange-400 font-mono text-sm font-bold">#{orden.id}</span>
        </td>
        {/* Mesa */}
        <td className="px-5 py-3">
          <span className="text-white text-sm">Mesa {orden.mesa?.numero ?? '—'}</span>
        </td>
        {/* Mesero */}
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 text-xs font-bold flex-shrink-0">
              {(orden.mesero?.nombre ?? '?').charAt(0).toUpperCase()}
            </div>
            <span className="text-white/70 text-sm">{orden.mesero?.nombre ?? '—'}</span>
          </div>
        </td>
        {/* Items */}
        <td className="px-5 py-3">
          <span className="text-white/50 text-sm">{todosItems.length} item{todosItems.length !== 1 ? 's' : ''}</span>
        </td>
        {/* Total */}
        <td className="px-5 py-3">
          <span className="text-emerald-400 font-semibold text-sm">
            S/. {Number(total).toFixed(2)}
          </span>
          {orden.pago?.detalles?.map((d, i) => (
            <span key={i} className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${metodoBadge[d.metodo] ?? 'bg-white/10 text-white/40'}`}>
              {d.metodo}
            </span>
          ))}
        </td>
        {/* Estado */}
        <td className="px-5 py-3">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
        </td>
        {/* Hora */}
        <td className="px-5 py-3">
          <span className="text-white/40 text-sm">{toHora(orden.createdAt)}</span>
          {orden.cerradoEn && (
            <div className="text-white/20 text-xs">Cerrado {toHora(orden.cerradoEn)}</div>
          )}
        </td>
        {/* Expand */}
        <td className="px-5 py-3">
          {expandida
            ? <ChevronDown size={14} className="text-white/30" />
            : <ChevronRight size={14} className="text-white/20" />
          }
        </td>
      </tr>

      {/* Detalle expandido */}
      {expandida && (
        <tr className="bg-[#0f1520] border-b border-white/5">
          <td colSpan={8} className="px-5 py-4">
            <div className="space-y-2">
              {orden.comensales.map(c => (
                <div key={c.id}>
                  <div className="text-white/30 text-xs uppercase tracking-wider mb-1.5">
                    Comensal {c.numero}{c.nombre ? ` — ${c.nombre}` : ''}
                  </div>
                  {c.detalles.map(d => (
                    <div key={d.id}
                      className="flex items-center gap-3 bg-[#1a1f2e] rounded-xl px-4 py-2.5 mb-1.5 border border-white/5 group">
                      {/* Estado item */}
                      <span className={`flex-shrink-0 ${d.estado === 'listo' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {d.estado === 'listo'
                          ? <CheckCircle2 size={14} />
                          : <Clock size={14} />
                        }
                      </span>
                      {/* Nombre */}
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm">{d.cantidad}x {nombreItem(d)}</span>
                        {d.nota && d.tipo === 'carta' && (
                          <div className="text-orange-400/60 text-xs">📝 {d.nota}</div>
                        )}
                        {d.tipo === 'menu_dia' && d.nota?.includes('|') && (
                          <div className="text-orange-400/60 text-xs">📝 {d.nota.split('|')[1]?.trim()}</div>
                        )}
                      </div>
                      {/* Precio */}
                      <span className="text-white/40 text-sm flex-shrink-0">
                        S/. {(Number(d.precioUnitario) * d.cantidad).toFixed(2)}
                      </span>
                      {/* Botón cancelar — solo si la orden no está pagada */}
                      {orden.estado !== 'pagada' && (
                        <button
                          onClick={e => { e.stopPropagation(); onCancelarItem(d.id, nombreItem(d)); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer flex-shrink-0"
                          title="Cancelar item"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function OrdenesPage() {
  const [ordenes,    setOrdenes]    = useState<Orden[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fecha,      setFecha]      = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
  });
  const [busqueda,   setBusqueda]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [itemCancelar, setItemCancelar] = useState<{ id: number; nombre: string } | null>(null);

  // Socket — recargar cuando llega orden nueva o item listo/cancelado
  useSocket({
    'orden:nueva':          () => cargar(),
    'orden:item_listo':     () => cargar(),
    'orden:item_cancelado': () => cargar(),
  });

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ fecha });
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado);
      const res = await api.get(`/ordenes?${params}`);
      setOrdenes(res.data.data);
    } catch { sileo.error({ title: 'Error al cargar órdenes' }); }
    finally { setLoading(false); }
  }, [fecha, filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCancelarItem = async () => {
    if (!itemCancelar) return;
    try {
      await api.delete(`/ordenes/items/${itemCancelar.id}`, {
        data: { motivo: 'Cancelado desde panel admin' },
      });
      sileo.success({ title: `Item "${itemCancelar.nombre}" cancelado` });
      cargar();
    } catch (err) {
      sileo.error({ title: getErrMsg(err, 'Error al cancelar item') });
    } finally { setItemCancelar(null); }
  };

  // Filtros en memoria
  const ordenesFiltradas = ordenes.filter(o => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      String(o.id).includes(q) ||
      o.mesa?.numero?.toString().includes(q) ||
      o.mesero?.nombre?.toLowerCase().includes(q)
    );
  });

  // KPIs
  const pagadas  = ordenes.filter(o => o.estado === 'pagada');
  const enCocina = ordenes.filter(o => o.estado === 'en_cocina');
  const abiertas = ordenes.filter(o => o.estado === 'abierta');
  const totalVentas = pagadas.reduce((s, o) => s + Number(o.pago?.total ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Órdenes</h1>
          <p className="text-white/40 text-sm">Historial y control de pedidos</p>
        </div>
        <button onClick={cargar}
          className="text-xs text-orange-400 border border-orange-400/30 px-3 py-1.5 rounded-lg hover:bg-orange-400/10 transition-colors cursor-pointer">
          ↻ Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Órdenes"  valor={ordenes.length}      icono={UtensilsCrossed} color="blue"    />
        <KpiCard label="En Cocina"      valor={enCocina.length}     icono={ChefHat}         color="orange"  />
        <KpiCard label="Pagadas"        valor={pagadas.length}      icono={CheckCircle2}    color="emerald" />
        <KpiCard label="Ventas del Día" valor={`S/. ${totalVentas.toFixed(2)}`} icono={CheckCircle2} color="purple" />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Fecha */}
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500/50 cursor-pointer" />

        {/* Estado */}
        {['todos', 'abierta', 'en_cocina', 'pagada'].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer capitalize ${
              filtroEstado === e
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a1f2e] text-white/40 border border-white/10 hover:text-white/70'
            }`}>
            {e === 'todos' ? 'Todos' : e === 'en_cocina' ? 'En Cocina' : e.charAt(0).toUpperCase() + e.slice(1)}
          </button>
        ))}

        {/* Búsqueda */}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por #, mesa o mesero..."
            className="bg-[#1a1f2e] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm outline-none focus:border-orange-500/50 placeholder-white/20 w-56" />
          {busqueda && (
            <button onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white cursor-pointer">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['#Orden', 'Mesa', 'Mesero', 'Items', 'Total / Pago', 'Estado', 'Hora', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-white/40 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-5 py-3">
                  <div className="h-4 bg-white/5 rounded animate-pulse" />
                </td></tr>
              ))
            ) : ordenesFiltradas.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-white/20">
                No hay órdenes para esta fecha
              </td></tr>
            ) : (
              ordenesFiltradas.map(orden => (
                <FilaOrden
                  key={orden.id}
                  orden={orden}
                  onCancelarItem={(id, nombre) => setItemCancelar({ id, nombre })}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        abierto={!!itemCancelar}
        titulo={`¿Cancelar "${itemCancelar?.nombre}"?`}
        descripcion="El item se eliminará de la orden. Si tenía stock, se repondrá automáticamente."
        labelConfirmar="Cancelar item"
        onConfirmar={handleCancelarItem}
        onCerrar={() => setItemCancelar(null)}
      />
    </div>
  );
}