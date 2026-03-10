'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { cobrarOrden, PagoMetodo, PagoRes } from '@/modules/mesero/services/pago.service';
import { sileo } from 'sileo';

const METODOS = [
  { id: 'efectivo',      label: 'Efectivo',       emoji: '💵' },
  { id: 'yape',         label: 'Yape',            emoji: '📱' },
  { id: 'plin',         label: 'Plin',            emoji: '📱' },
  { id: 'tarjeta',      label: 'Tarjeta',         emoji: '💳' },
  { id: 'transferencia',label: 'Transferencia',   emoji: '🏦' },
] as const;

type MetodoId = typeof METODOS[number]['id'];

interface FilaPago {
  metodo: MetodoId;
  monto: string;
  montoPagado: string; // solo efectivo
}

interface ModalCobroProps {
  ordenId:   number;
  total:     number;
  mesa:      string;
  onCobrado: (pago: PagoRes) => void;
  onCerrar:  () => void;
}

export function ModalCobro({ ordenId, total, mesa, onCobrado, onCerrar }: ModalCobroProps) {
  const [descuento,  setDescuento]  = useState('0');
  const [filas,      setFilas]      = useState<FilaPago[]>([{ metodo: 'efectivo', monto: '', montoPagado: '' }]);
  const [cobrando,   setCobrando]   = useState(false);
  const [pagoHecho,  setPagoHecho]  = useState<PagoRes | null>(null);

  const totalConDescuento = Math.max(0, total - parseFloat(descuento || '0'));

  const sumaPagos = filas.reduce((acc, f) => acc + parseFloat(f.monto || '0'), 0);
  const faltante  = Math.max(0, totalConDescuento - sumaPagos);
  const vuelto    = Math.max(0, sumaPagos - totalConDescuento);

  // Auto-rellenar monto de la primera fila si hay solo una
  useEffect(() => {
    if (filas.length === 1) {
      setFilas([{ ...filas[0], monto: totalConDescuento.toFixed(2) }]);
    }
  }, [totalConDescuento]);

  const agregarMetodo = () => {
    if (filas.length >= 3) return;
    setFilas(prev => [...prev, { metodo: 'yape', monto: faltante.toFixed(2), montoPagado: '' }]);
  };

  const actualizarFila = (i: number, campo: keyof FilaPago, valor: string) => {
    setFilas(prev => prev.map((f, idx) => idx === i ? { ...f, [campo]: valor } : f));
  };

  const quitarFila = (i: number) => {
    if (filas.length === 1) return;
    setFilas(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleCobrar = async () => {
    if (faltante > 0.01) {
      sileo.error({ title: `Faltan S/. ${faltante.toFixed(2)} por cubrir` });
      return;
    }

    const pagos: PagoMetodo[] = filas.map(f => {
      const monto = parseFloat(f.monto || '0');
      const montoPagadoNum = f.metodo === 'efectivo' && f.montoPagado
        ? parseFloat(f.montoPagado)
        : undefined;
      return {
        metodo: f.metodo,
        monto,
        montoPagado: montoPagadoNum,
        vuelto: montoPagadoNum ? Math.max(0, montoPagadoNum - monto) : undefined,
      };
    });

    try {
      setCobrando(true);
      const pago = await cobrarOrden({
        ordenId,
        descuento: parseFloat(descuento || '0'),
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

  const handleImprimir = () => window.print();

  const handleFinalizar = () => {
    if (pagoHecho) onCobrado(pagoHecho);
    onCerrar();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:bg-white print:p-0"
      onClick={!pagoHecho ? onCerrar : undefined}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden print:bg-white print:border-0 print:rounded-none print:max-w-none print:w-full"
      >
        {/* ─── PANTALLA DE COBRO ─── */}
        <AnimatePresence mode="wait">
          {!pagoHecho ? (
            <motion.div key="cobro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div>
                  <h2 className="text-white font-bold text-lg">Cobrar — {mesa}</h2>
                  <p className="text-white/40 text-sm">Total a cobrar</p>
                </div>
                <button onClick={onCerrar} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">

                {/* Total */}
                <div className="bg-[#2a3040] rounded-2xl p-4 text-center">
                  <div className="text-white/50 text-sm mb-1">Total</div>
                  <div className="text-orange-400 font-bold text-4xl">
                    S/. {totalConDescuento.toFixed(2)}
                  </div>
                  {parseFloat(descuento) > 0 && (
                    <div className="text-white/30 text-xs mt-1">
                      Subtotal S/. {total.toFixed(2)} · Descuento S/. {parseFloat(descuento).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Descuento */}
                <div>
                  <label className="text-white/50 text-sm mb-1 block">Descuento (S/.)</label>
                  <input type="number" min="0" step="0.50" value={descuento}
                    onChange={e => setDescuento(e.target.value)}
                    className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50" />
                </div>

                {/* Métodos de pago */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white/50 text-sm">Métodos de pago</label>
                    {filas.length < 3 && (
                      <button onClick={agregarMetodo}
                        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 cursor-pointer">
                        <Plus size={13} /> Agregar método
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {filas.map((fila, i) => (
                      <div key={i} className="bg-[#2a3040] rounded-xl p-3 space-y-2">
                        <div className="flex gap-2">
                          {/* Selector método */}
                          <select value={fila.metodo}
                            onChange={e => actualizarFila(i, 'metodo', e.target.value as MetodoId)}
                            className="flex-1 bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none cursor-pointer">
                            {METODOS.map(m => (
                              <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>
                            ))}
                          </select>
                          {/* Monto */}
                          <input type="number" min="0" step="0.50"
                            value={fila.monto}
                            onChange={e => actualizarFila(i, 'monto', e.target.value)}
                            placeholder="Monto"
                            className="w-28 bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500/50" />
                          {filas.length > 1 && (
                            <button onClick={() => quitarFila(i)}
                              className="text-red-400/60 hover:text-red-400 cursor-pointer">
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
                              className="flex-1 bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500/50" />
                            {fila.montoPagado && parseFloat(fila.montoPagado) >= parseFloat(fila.monto || '0') && (
                              <div className="text-emerald-400 text-sm font-medium whitespace-nowrap">
                                Vuelto: S/. {(parseFloat(fila.montoPagado) - parseFloat(fila.monto || '0')).toFixed(2)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-[#2a3040] rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Suma de pagos</span>
                    <span className="text-white">S/. {sumaPagos.toFixed(2)}</span>
                  </div>
                  {faltante > 0.01 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-400">Faltante</span>
                      <span className="text-red-400 font-bold">S/. {faltante.toFixed(2)}</span>
                    </div>
                  )}
                  {vuelto > 0.01 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">Vuelto general</span>
                      <span className="text-emerald-400 font-bold">S/. {vuelto.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Botón cobrar */}
                <button onClick={handleCobrar} disabled={cobrando || faltante > 0.01}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 text-lg">
                  {cobrando
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircle size={22} /> Cobrar S/. {totalConDescuento.toFixed(2)}</>
                  }
                </button>
              </div>
            </motion.div>

          ) : (
            /* ─── PANTALLA BOLETA ─── */
            <motion.div key="boleta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-6">

              {/* Encabezado boleta */}
              <div className="text-center mb-5 print:mb-3">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 print:hidden">
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <h2 className="text-white font-bold text-xl print:text-black">Don Camote</h2>
                <p className="text-white/40 text-sm print:text-gray-500">Restaurante Familiar</p>
                <div className="text-white/30 text-xs mt-1 print:text-gray-400">
                  {new Date().toLocaleString('es-PE')}
                </div>
              </div>

              <div className="border-t border-white/10 print:border-gray-200 pt-4 mb-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50 print:text-gray-500">Mesa</span>
                  <span className="text-white print:text-black font-medium">{mesa}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50 print:text-gray-500">Subtotal</span>
                  <span className="text-white print:text-black">S/. {Number(pagoHecho.subtotal).toFixed(2)}</span>
                </div>
                {Number(pagoHecho.descuento) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50 print:text-gray-500">Descuento</span>
                    <span className="text-emerald-400">- S/. {Number(pagoHecho.descuento).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-white/10 print:border-gray-200 pt-2 mt-2">
                  <span className="text-white print:text-black">TOTAL</span>
                  <span className="text-orange-400 print:text-black">S/. {Number(pagoHecho.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Métodos pagados */}
              <div className="space-y-1 mb-5">
                <div className="text-white/40 text-xs uppercase tracking-wider mb-2 print:text-gray-400">
                  Pagado con
                </div>
                {pagoHecho.detalles.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white/70 capitalize print:text-gray-600">{d.metodo}</span>
                    <span className="text-white print:text-black">S/. {Number(d.monto).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="text-center text-white/30 text-xs mb-5 print:text-gray-400">
                ¡Gracias por su visita! 🙏
              </div>

              {/* Botones */}
              <div className="flex gap-3 print:hidden">
                <button onClick={handleImprimir}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
                  <Printer size={16} /> Imprimir
                </button>
                <button onClick={handleFinalizar}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors cursor-pointer">
                  Finalizar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
