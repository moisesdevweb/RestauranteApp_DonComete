'use client';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Tag, Hash, Percent, DollarSign, Calendar, ToggleLeft, ToggleRight, Trash2, Edit2, X, CheckCircle } from 'lucide-react';
import { sileo } from 'sileo';
import api from '@/lib/axios';
import { KpiCard } from '@/modules/admin/components/shared/KpiCard';
import { ConfirmModal } from '@/modules/admin/components/shared/ConfirmModal';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface CodigoDescuento {
  id: number;
  codigo: string;
  descripcion: string | null;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  usosMaximos: number | null;
  usosActuales: number;
  fechaExpira: string | null;
  activo: boolean;
  createdAt: string;
}

interface CodigoPayload {
  codigo: string;
  descripcion?: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  usosMaximos?: number;
  fechaExpira?: string;
}

type AxiosError = { response?: { data?: { message?: string } } };
const getErrMsg = (err: unknown, fallback: string) =>
  (err as AxiosError)?.response?.data?.message ?? fallback;

// ─── Modal crear/editar ───────────────────────────────────────────────────────
function ModalCodigo({
  codigo, guardando, onGuardar, onCerrar,
}: {
  codigo: CodigoDescuento | null;
  guardando: boolean;
  onGuardar: (data: CodigoPayload) => void;
  onCerrar: () => void;
}) {
  const [form, setForm] = useState<CodigoPayload>({
    codigo:      codigo?.codigo      ?? '',
    descripcion: codigo?.descripcion ?? '',
    tipo:        codigo?.tipo        ?? 'porcentaje',
    valor:       codigo?.valor       ?? 10,
    usosMaximos: codigo?.usosMaximos ?? undefined,
    fechaExpira: codigo?.fechaExpira ? codigo.fechaExpira.split('T')[0] : '',
  });

  const set = (k: keyof CodigoPayload, v: unknown) =>
    setForm(p => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onCerrar}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md">

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">
            {codigo ? 'Editar Código' : 'Nuevo Código de Descuento'}
          </h3>
          <button onClick={onCerrar} className="text-white/30 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Código */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">Código</label>
            <input type="text" value={form.codigo}
              onChange={e => set('codigo', e.target.value.toUpperCase())}
              disabled={!!codigo}
              placeholder="Ej: PROMO10, CUMPLE20"
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono tracking-wider outline-none focus:border-orange-500/50 disabled:opacity-50 placeholder-white/20" />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">Descripción (opcional)</label>
            <input type="text" value={form.descripcion ?? ''}
              onChange={e => set('descripcion', e.target.value)}
              placeholder="Ej: Descuento fidelidad 10%"
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
          </div>

          {/* Tipo + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => set('tipo', 'porcentaje')}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                    form.tipo === 'porcentaje'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-[#2a3040] text-white/40 border-transparent'
                  }`}>
                  <Percent size={13} /> %
                </button>
                <button type="button" onClick={() => set('tipo', 'monto_fijo')}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                    form.tipo === 'monto_fijo'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-[#2a3040] text-white/40 border-transparent'
                  }`}>
                  <DollarSign size={13} /> S/.
                </button>
              </div>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">
                Valor {form.tipo === 'porcentaje' ? '(%)' : '(S/.)'}
              </label>
              <input type="number" min="0" step="0.5"
                value={form.valor}
                onChange={e => set('valor', parseFloat(e.target.value))}
                className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50" />
            </div>
          </div>

          {/* Usos máximos + Fecha expira */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Usos máximos</label>
              <input type="number" min="1"
                value={form.usosMaximos ?? ''}
                onChange={e => set('usosMaximos', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ilimitado"
                className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Vence el</label>
              <input type="date"
                value={form.fechaExpira ?? ''}
                onChange={e => set('fechaExpira', e.target.value || undefined)}
                className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={() => onGuardar(form)} disabled={guardando || !form.codigo || !form.valor}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50">
            {guardando ? 'Guardando...' : codigo ? 'Guardar' : 'Crear Código'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function DescuentosPage() {
  const [codigos,    setCodigos]    = useState<CodigoDescuento[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [guardando,  setGuardando]  = useState(false);
  const [modal,      setModal]      = useState(false);
  const [editar,     setEditar]     = useState<CodigoDescuento | null>(null);
  const [eliminar,   setEliminar]   = useState<CodigoDescuento | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get('/descuentos');
      setCodigos(res.data.data);
    } catch { sileo.error({ title: 'Error al cargar códigos' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardar = async (data: CodigoPayload) => {
    setGuardando(true);
    try {
      if (editar) {
        const res = await api.put(`/descuentos/${editar.id}`, data);
        setCodigos(prev => prev.map(c => c.id === editar.id ? res.data.data : c));
        sileo.success({ title: 'Código actualizado' });
      } else {
        const res = await api.post('/descuentos', data);
        setCodigos(prev => [res.data.data, ...prev]);
        sileo.success({ title: 'Código creado' });
      }
      setModal(false); setEditar(null);
    } catch (err) { sileo.error({ title: getErrMsg(err, 'Error al guardar código') }); }
    finally { setGuardando(false); }
  };

  const handleToggle = async (c: CodigoDescuento) => {
    try {
      const res = await api.put(`/descuentos/${c.id}`, { activo: !c.activo });
      setCodigos(prev => prev.map(x => x.id === c.id ? res.data.data : x));
    } catch (err) { sileo.error({ title: getErrMsg(err, 'Error al actualizar') }); }
  };

  const handleEliminar = async () => {
    if (!eliminar) return;
    try {
      await api.delete(`/descuentos/${eliminar.id}`);
      setCodigos(prev => prev.map(c => c.id === eliminar.id ? { ...c, activo: false } : c));
      sileo.success({ title: 'Código desactivado' });
    } catch (err) { sileo.error({ title: getErrMsg(err, 'Error al eliminar') }); }
    finally { setEliminar(null); }
  };

  const activos   = codigos.filter(c => c.activo);
  const totalUsos = codigos.reduce((a, c) => a + c.usosActuales, 0);

  const estaVencido = (c: CodigoDescuento) =>
    !!c.fechaExpira && new Date() > new Date(c.fechaExpira);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Códigos de Descuento</h1>
          <p className="text-white/40 text-sm">Crea y gestiona cupones para tus clientes</p>
        </div>
        <button onClick={() => { setEditar(null); setModal(true); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl font-medium transition-colors cursor-pointer">
          <Plus size={18} /> Nuevo Código
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Códigos"  valor={codigos.length}  icono={Tag}      color="blue"    />
        <KpiCard label="Activos"        valor={activos.length}  icono={CheckCircle} color="emerald" />
        <KpiCard label="Total Usos"     valor={totalUsos}       icono={Hash}     color="orange"  />
        <KpiCard label="Vencidos"       valor={codigos.filter(estaVencido).length} icono={Calendar} color="red" />
      </div>

      {/* Tabla */}
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <h2 className="text-white font-semibold">Todos los Códigos</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Código', 'Tipo / Valor', 'Usos', 'Vence', 'Estado', 'Acciones'].map(h => (
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
            ) : codigos.map(c => (
              <tr key={c.id} className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${!c.activo ? 'opacity-50' : ''}`}>
                <td className="px-5 py-3">
                  <div className="font-mono font-bold text-white tracking-wider">{c.codigo}</div>
                  {c.descripcion && <div className="text-white/30 text-xs mt-0.5">{c.descripcion}</div>}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-sm font-bold ${c.tipo === 'porcentaje' ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {c.tipo === 'porcentaje' ? `${c.valor}%` : `S/. ${Number(c.valor).toFixed(2)}`}
                  </span>
                  <div className="text-white/30 text-xs">{c.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo'}</div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-white text-sm">{c.usosActuales}</span>
                  {c.usosMaximos && (
                    <span className="text-white/30 text-xs"> / {c.usosMaximos}</span>
                  )}
                  {!c.usosMaximos && <div className="text-white/30 text-xs">Ilimitado</div>}
                </td>
                <td className="px-5 py-3">
                  {c.fechaExpira ? (
                    <span className={`text-sm ${estaVencido(c) ? 'text-red-400' : 'text-white/60'}`}>
                      {new Date(c.fechaExpira).toLocaleDateString('es-PE')}
                      {estaVencido(c) && <span className="ml-1 text-xs">(vencido)</span>}
                    </span>
                  ) : (
                    <span className="text-white/30 text-sm">Sin vencimiento</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    c.activo && !estaVencido(c)
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {c.activo && !estaVencido(c) ? 'Activo' : estaVencido(c) ? 'Vencido' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditar(c); setModal(true); }}
                      className="p-1.5 rounded-lg bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleToggle(c)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        c.activo ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}>
                      {c.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button onClick={() => setEliminar(c)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modal && (
          <ModalCodigo key={editar?.id ?? 'nuevo'} codigo={editar}
            guardando={guardando} onGuardar={handleGuardar}
            onCerrar={() => { setModal(false); setEditar(null); }} />
        )}
      </AnimatePresence>

      <ConfirmModal
        abierto={!!eliminar}
        titulo={`¿Desactivar código "${eliminar?.codigo}"?`}
        descripcion="El código no podrá ser usado hasta que lo reactives."
        labelConfirmar="Desactivar"
        onConfirmar={handleEliminar}
        onCerrar={() => setEliminar(null)}
      />
    </div>
  );
}