/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Printer, CheckCircle,
  Tag, QrCode, ChevronRight, AlertCircle,
} from 'lucide-react';
import { cobrarOrden, PagoMetodo, PagoRes } from '@/modules/mesero/services/pago.service';
import { validarCodigo } from '@/modules/mesero/services/descuento.service';
import { getQRs, ConfigQRRes } from '@/modules/mesero/services/configqr.service';
import { sileo } from 'sileo';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DetalleItem {
  id: number;
  cantidad: number;
  precioUnitario: number;
  nota: string | null;
  tipo: 'carta' | 'menu_dia';
  producto?: { nombre: string };
  nota_display?: string; // nombre legible para boleta
}

interface ComensalBoleta {
  numero: number;
  nombre: string | null;
  detalles: DetalleItem[];
}

interface OrdenBoleta {
  mesa: { numero: number };
  comensales: ComensalBoleta[];
}

interface ModalCobroProps {
  ordenId:   number;
  total:     number;
  mesa:      string;
  orden?:    OrdenBoleta; // datos completos para la boleta detallada
  onCobrado: (pago: PagoRes) => void;
  onCerrar:  () => void;
}

const METODOS = [
  { id: 'efectivo',       label: 'Efectivo',       emoji: '💵', esDigital: false },
  { id: 'yape',           label: 'Yape',            emoji: '📱', esDigital: true  },
  { id: 'plin',           label: 'Plin',            emoji: '📱', esDigital: true  },
  { id: 'tarjeta',        label: 'Tarjeta',         emoji: '💳', esDigital: false },
  { id: 'transferencia',  label: 'Transferencia',   emoji: '🏦', esDigital: true  },
] as const;

type MetodoId = typeof METODOS[number]['id'];

interface FilaPago {
  metodo: MetodoId;
  monto:       string;
  montoPagado: string; // solo efectivo
}

// ─── Helper: nombre legible del item para la boleta ──────────────────────────
const nombreItemBoleta = (item: DetalleItem): string => {
  if (item.tipo === 'carta') return item.producto?.nombre ?? 'Producto';
  // Para menú del día la nota tiene "Entrada + Fondo | nota extra"
  if (item.nota) return item.nota.split('|')[0].trim() || 'Menú del Día';
  return 'Menú del Día';
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function ModalCobro({ ordenId, total, mesa, orden, onCobrado, onCerrar }: ModalCobroProps) {

  // ── Estado del cobro ──
  const [descuento,       setDescuento]       = useState('0');
  const [codigoCupon,     setCodigoCupon]      = useState('');
  const [cuponAplicado,   setCuponAplicado]    = useState<{ codigo: string; montoDescuento: number; descripcion: string | null } | null>(null);
  const [validandoCupon,  setValidandoCupon]   = useState(false);
  const [filas,           setFilas]            = useState<FilaPago[]>([{ metodo: 'efectivo', monto: '', montoPagado: '' }]);
  const [cobrando,        setCobrando]         = useState(false);
  const [pagoHecho,       setPagoHecho]        = useState<PagoRes | null>(null);

  // ── QRs disponibles ──
  const [qrs,             setQrs]              = useState<ConfigQRRes[]>([]);
  const [qrVisible,       setQrVisible]        = useState<string | null>(null); // metodo activo

  // ── Cálculos ──
  const descuentoManual     = parseFloat(descuento || '0');
  const descuentoCupon      = cuponAplicado?.montoDescuento ?? 0;
  const descuentoTotal      = Math.max(0, descuentoCupon || descuentoManual);
  const totalConDescuento   = Math.max(0, total - descuentoTotal);
  const sumaPagos           = filas.reduce((acc, f) => acc + parseFloat(f.monto || '0'), 0);
  const faltante            = Math.max(0, totalConDescuento - sumaPagos);
  const vuelto              = Math.max(0, sumaPagos - totalConDescuento);

  // ── Cargar QRs al montar ──
  useEffect(() => {
    getQRs().then(setQrs).catch(() => {});
  }, []);

  // ── Auto-rellenar monto si hay una sola fila ──
  useEffect(() => {
    if (filas.length === 1) {
      setFilas(prev => [{ ...prev[0], monto: totalConDescuento.toFixed(2) }]);
    }
  }, [totalConDescuento]);

  // ── Mostrar QR automáticamente al seleccionar método digital ──
  useEffect(() => {
    const primerDigital = filas.find(f => METODOS.find(m => m.id === f.metodo)?.esDigital);
    if (primerDigital) {
      const qrDisponible = qrs.find(q => q.metodo === primerDigital.metodo);
      if (qrDisponible) setQrVisible(primerDigital.metodo);
    }
  }, [filas, qrs]);

  // ── Validar código de descuento ──
  const handleValidarCupon = useCallback(async () => {
    if (!codigoCupon.trim()) return;
    setValidandoCupon(true);
    try {
      const res = await validarCodigo(codigoCupon.trim(), total);
      setCuponAplicado({ codigo: res.codigo, montoDescuento: res.montoDescuento, descripcion: res.descripcion });
      setDescuento('0'); // el cupon reemplaza el descuento manual
      sileo.success({ title: `✓ Código aplicado — S/. ${res.montoDescuento.toFixed(2)} de descuento` });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Código inválido';
      sileo.error({ title: msg });
    } finally {
      setValidandoCupon(false);
    }
  }, [codigoCupon, total]);

  const quitarCupon = () => { setCuponAplicado(null); setCodigoCupon(''); };

  // ── Métodos de pago ──
  const agregarMetodo = () => {
    if (filas.length >= 3) return;
    setFilas(prev => [...prev, { metodo: 'yape', monto: faltante.toFixed(2), montoPagado: '' }]);
  };

  const actualizarFila = (i: number, campo: keyof FilaPago, valor: string) => {
    setFilas(prev => prev.map((f, idx) => {
      if (idx !== i) return f;
      const nueva = { ...f, [campo]: valor };
      // Al cambiar método, mostrar QR si corresponde
      if (campo === 'metodo') {
        const qrDisponible = qrs.find(q => q.metodo === valor);
        if (qrDisponible) setQrVisible(valor);
      }
      return nueva;
    }));
  };

  const quitarFila = (i: number) => {
    if (filas.length === 1) return;
    setFilas(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Cobrar ──
  const handleCobrar = async () => {
    if (faltante > 0.01) {
      sileo.error({ title: `Faltan S/. ${faltante.toFixed(2)} por cubrir` });
      return;
    }
    const pagos: PagoMetodo[] = filas.map(f => {
      const monto = parseFloat(f.monto || '0');
      const montoPagadoNum = f.metodo === 'efectivo' && f.montoPagado
        ? parseFloat(f.montoPagado) : undefined;
      return { metodo: f.metodo, monto, montoPagado: montoPagadoNum,
        vuelto: montoPagadoNum ? Math.max(0, montoPagadoNum - monto) : undefined };
    });

    try {
      setCobrando(true);
      const pago = await cobrarOrden({
        ordenId,
        descuento:       cuponAplicado ? 0 : parseFloat(descuento || '0'),
        codigoDescuento: cuponAplicado?.codigo,
        pagos,
      });
      setPagoHecho(pago);
      sileo.success({ title: '¡Cobro exitoso! 🎉' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      sileo.error({ title: msg ?? 'Error al cobrar' });
    } finally {
      setCobrando(false);
    }
  };

  const qrActivo = qrs.find(q => q.metodo === qrVisible);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 print:bg-white print:p-0"
      onClick={!pagoHecho ? onCerrar : undefined}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#12172a] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden shadow-2xl print:bg-white print:border-0 print:rounded-none print:max-w-none print:w-full print:shadow-none"
      >
        <AnimatePresence mode="wait">
          {!pagoHecho ? (

            /* ═══════════════════════ PANTALLA COBRO ═══════════════════════ */
            <motion.div key="cobro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-h-[92vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10 sticky top-0 bg-[#12172a] z-10">
                <div>
                  <h2 className="text-white font-bold text-xl">Cobrar — {mesa}</h2>
                  <p className="text-white/40 text-sm">Selecciona los métodos de pago</p>
                </div>
                <button onClick={onCerrar} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* ── Total ── */}
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl p-5 text-center">
                  <div className="text-orange-400/70 text-sm mb-1">Total a cobrar</div>
                  <div className="text-orange-400 font-bold text-5xl tracking-tight">
                    S/. {totalConDescuento.toFixed(2)}
                  </div>
                  {descuentoTotal > 0 && (
                    <div className="text-white/40 text-xs mt-2 flex items-center justify-center gap-2">
                      <span>Subtotal S/. {total.toFixed(2)}</span>
                      <span className="text-emerald-400">— S/. {descuentoTotal.toFixed(2)} descuento</span>
                    </div>
                  )}
                </div>

                {/* ── Código de descuento ── */}
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <Tag size={12} /> Código de descuento
                  </label>
                  {cuponAplicado ? (
                    <div className="flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-4 py-3">
                      <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-emerald-400 font-bold text-sm">{cuponAplicado.codigo}</div>
                        {cuponAplicado.descripcion && (
                          <div className="text-emerald-400/60 text-xs">{cuponAplicado.descripcion}</div>
                        )}
                      </div>
                      <button onClick={quitarCupon} className="text-white/30 hover:text-red-400 cursor-pointer transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={codigoCupon}
                        onChange={e => setCodigoCupon(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleValidarCupon()}
                        placeholder="Ej: PROMO10"
                        className="flex-1 bg-[#1e2535] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-orange-500/50 placeholder-white/20 font-mono tracking-wider"
                      />
                      <button
                        onClick={handleValidarCupon}
                        disabled={!codigoCupon.trim() || validandoCupon}
                        className="px-4 py-2.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl text-sm font-medium hover:bg-orange-500/30 transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap"
                      >
                        {validandoCupon ? '...' : 'Aplicar'}
                      </button>
                    </div>
                  )}
                  {/* Descuento manual solo si no hay cupón */}
                  {!cuponAplicado && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-white/30 text-xs">o descuento manual S/.</span>
                      <input type="number" min="0" step="0.50" value={descuento}
                        onChange={e => setDescuento(e.target.value)}
                        className="w-24 bg-[#1e2535] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-orange-500/50" />
                    </div>
                  )}
                </div>

                {/* ── QR del método activo ── */}
                <AnimatePresence>
                  {qrActivo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#1e2535] border border-white/10 rounded-2xl overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <QrCode size={14} className="text-blue-400" />
                          <span className="text-white/70 text-sm font-medium capitalize">
                            QR {qrActivo.metodo}
                          </span>
                          {qrActivo.titular && (
                            <span className="text-white/30 text-xs">— {qrActivo.titular}</span>
                          )}
                        </div>
                        <button onClick={() => setQrVisible(null)}
                          className="text-white/20 hover:text-white/50 cursor-pointer transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="p-4 flex justify-center">
                        <img src={qrActivo.imagenUrl} alt={`QR ${qrActivo.metodo}`}
                          className="w-48 h-48 object-contain rounded-xl bg-white p-2" />
                      </div>
                      {qrActivo.numero && (
                        <div className="text-center pb-3 text-white/40 text-xs">
                          {qrActivo.numero}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Métodos de pago ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white/50 text-xs uppercase tracking-wider">Métodos de pago</label>
                    {filas.length < 3 && (
                      <button onClick={agregarMetodo}
                        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 cursor-pointer transition-colors">
                        <Plus size={12} /> Agregar método
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {filas.map((fila, i) => {
                      const metodoInfo = METODOS.find(m => m.id === fila.metodo);
                      const qrDeEstaFila = qrs.find(q => q.metodo === fila.metodo);
                      return (
                        <div key={i} className="bg-[#1e2535] rounded-2xl p-3 space-y-2 border border-white/5">
                          <div className="flex gap-2">
                            <select value={fila.metodo}
                              onChange={e => actualizarFila(i, 'metodo', e.target.value as MetodoId)}
                              className="flex-1 bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none cursor-pointer">
                              {METODOS.map(m => (
                                <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>
                              ))}
                            </select>
                            <input type="number" min="0" step="0.50"
                              value={fila.monto}
                              onChange={e => actualizarFila(i, 'monto', e.target.value)}
                              placeholder="Monto"
                              className="w-28 bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500/50 placeholder-white/20" />
                            {filas.length > 1 && (
                              <button onClick={() => quitarFila(i)}
                                className="text-red-400/50 hover:text-red-400 cursor-pointer transition-colors">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          {/* Campo billete — solo efectivo */}
                          {fila.metodo === 'efectivo' && (
                            <div className="flex gap-2 items-center">
                              <input type="number" min="0" step="1"
                                value={fila.montoPagado}
                                onChange={e => actualizarFila(i, 'montoPagado', e.target.value)}
                                placeholder="¿Con cuánto paga?"
                                className="flex-1 bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500/50 placeholder-white/20" />
                              {fila.montoPagado && parseFloat(fila.montoPagado) >= parseFloat(fila.monto || '0') && (
                                <div className="text-emerald-400 text-sm font-bold whitespace-nowrap">
                                  Vuelto: S/. {(parseFloat(fila.montoPagado) - parseFloat(fila.monto || '0')).toFixed(2)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Botón ver QR para métodos digitales */}
                          {metodoInfo?.esDigital && qrDeEstaFila && (
                            <button
                              onClick={() => setQrVisible(qrVisible === fila.metodo ? null : fila.metodo)}
                              className="w-full flex items-center justify-center gap-2 py-1.5 text-blue-400/70 hover:text-blue-400 text-xs transition-colors cursor-pointer"
                            >
                              <QrCode size={12} />
                              {qrVisible === fila.metodo ? 'Ocultar QR' : 'Ver QR de pago'}
                              <ChevronRight size={12} className={`transition-transform ${qrVisible === fila.metodo ? 'rotate-90' : ''}`} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Resumen ── */}
                <div className="bg-[#1e2535] rounded-2xl p-4 space-y-2 border border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Suma de pagos</span>
                    <span className="text-white font-medium">S/. {sumaPagos.toFixed(2)}</span>
                  </div>
                  {faltante > 0.01 && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} /> Faltante
                      </span>
                      <span className="text-red-400 font-bold">S/. {faltante.toFixed(2)}</span>
                    </div>
                  )}
                  {vuelto > 0.01 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">Vuelto</span>
                      <span className="text-emerald-400 font-bold">S/. {vuelto.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* ── Botón cobrar ── */}
                <button onClick={handleCobrar} disabled={cobrando || faltante > 0.01}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 text-lg shadow-lg shadow-emerald-500/20">
                  {cobrando
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircle size={20} /> Cobrar S/. {totalConDescuento.toFixed(2)}</>
                  }
                </button>
              </div>
            </motion.div>

          ) : (

            /* ═══════════════════════ BOLETA DETALLADA ══════════════════════ */
            <motion.div key="boleta"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-h-[92vh] overflow-y-auto print:overflow-visible"
            >
              <div className="p-6 print:p-8">

                {/* Cabecera boleta */}
                <div className="text-center mb-6 print:mb-4">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 print:hidden">
                    <CheckCircle size={30} className="text-emerald-400" />
                  </div>
                  <h2 className="text-white font-bold text-2xl print:text-black print:text-3xl">Don Camote</h2>
                  <p className="text-white/40 text-sm print:text-gray-500">Restaurante Familiar</p>
                  <div className="text-white/30 text-xs mt-1 print:text-gray-400">
                    {new Date().toLocaleString('es-PE', {
                      weekday: 'long', year: 'numeric', month: 'long',
                      day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                  <div className="mt-2 text-orange-400 font-bold print:text-black">
                    {mesa}
                  </div>
                </div>

                {/* Detalle por comensal — solo si tenemos la orden */}
                {orden?.comensales && orden.comensales.length > 0 && (
                  <div className="mb-5">
                    <div className="text-white/30 text-xs uppercase tracking-wider mb-3 print:text-gray-400">
                      Detalle del pedido
                    </div>
                    {orden.comensales.map(c => (
                      <div key={c.numero} className="mb-4">
                        <div className="text-white/50 text-xs font-semibold mb-1 print:text-gray-500">
                          Comensal {c.numero}{c.nombre ? ` — ${c.nombre}` : ''}
                        </div>
                        {c.detalles.map(d => (
                          <div key={d.id} className="flex justify-between text-sm py-1 border-b border-white/5 print:border-gray-100">
                            <div className="flex-1">
                              <span className="text-white print:text-black">{nombreItemBoleta(d)}</span>
                              {d.nota && d.tipo === 'carta' && (
                                <div className="text-white/30 text-xs print:text-gray-400">📝 {d.nota}</div>
                              )}
                              {d.tipo === 'menu_dia' && d.nota?.includes('|') && (
                                <div className="text-white/30 text-xs print:text-gray-400">
                                  📝 {d.nota.split('|')[1]?.trim()}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              <span className="text-white/60 text-xs print:text-gray-500">
                                {d.cantidad}x S/. {Number(d.precioUnitario).toFixed(2)}
                              </span>
                              <div className="text-white font-medium print:text-black">
                                S/. {(Number(d.precioUnitario) * d.cantidad).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Totales */}
                <div className="border-t border-white/10 print:border-gray-200 pt-4 mb-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50 print:text-gray-500">Subtotal</span>
                    <span className="text-white print:text-black">S/. {Number(pagoHecho.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(pagoHecho.descuento) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Tag size={11} /> Descuento
                      </span>
                      <span className="text-emerald-400">− S/. {Number(pagoHecho.descuento).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xl border-t border-white/10 print:border-gray-200 pt-2 mt-2">
                    <span className="text-white print:text-black">TOTAL</span>
                    <span className="text-orange-400 print:text-black">S/. {Number(pagoHecho.total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Métodos pagados */}
                <div className="mb-5">
                  <div className="text-white/30 text-xs uppercase tracking-wider mb-2 print:text-gray-400">
                    Forma de pago
                  </div>
                  {pagoHecho.detalles.map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-sm py-1">
                      <span className="text-white/60 capitalize print:text-gray-600 flex items-center gap-2">
                        {METODOS.find(m => m.id === d.metodo)?.emoji} {d.metodo}
                      </span>
                      <div className="text-right">
                        <span className="text-white print:text-black">S/. {Number(d.monto).toFixed(2)}</span>
                        {d.vuelto && Number(d.vuelto) > 0 && (
                          <div className="text-emerald-400 text-xs">vuelto S/. {Number(d.vuelto).toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center text-white/20 text-xs mb-6 print:text-gray-400">
                  ¡Gracias por su visita! 🙏<br />
                  Vuelva pronto — Don Camote
                </div>

                {/* Botones */}
                <div className="flex gap-3 print:hidden">
                  <button onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1e2535] text-white/60 hover:text-white border border-white/10 transition-all cursor-pointer">
                    <Printer size={16} /> Imprimir
                  </button>
                  <button onClick={() => { if (pagoHecho) onCobrado(pagoHecho); onCerrar(); }}
                    className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-all cursor-pointer">
                    Finalizar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}