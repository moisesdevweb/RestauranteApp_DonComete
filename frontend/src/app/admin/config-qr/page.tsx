'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QrCode, Upload, X, Trash2, Edit2, CheckCircle, Smartphone, CreditCard, Building } from 'lucide-react';
import { sileo } from 'sileo';
import api from '@/lib/axios';
import { ConfirmModal } from '@/modules/admin/components/shared/ConfirmModal';

interface ConfigQR {
  id: number;
  metodo: string;
  imagenUrl: string;
  titular: string | null;
  numero: string | null;
  activo: boolean;
}

type AxiosError = { response?: { data?: { message?: string } } };
const getErrMsg = (err: unknown, fallback: string) =>
  (err as AxiosError)?.response?.data?.message ?? fallback;

const METODOS_QR = [
  { id: 'yape',          label: 'Yape',          icono: Smartphone,   color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  { id: 'plin',          label: 'Plin',          icono: Smartphone,   color: 'text-blue-400',    bg: 'bg-blue-500/10'   },
  { id: 'transferencia', label: 'Transferencia', icono: Building,     color: 'text-emerald-400', bg: 'bg-emerald-500/10'},
];

function ModalQR({
  metodo, qrExistente, onGuardar, onCerrar,
}: {
  metodo: typeof METODOS_QR[number];
  qrExistente: ConfigQR | null;
  onGuardar: () => void;
  onCerrar: () => void;
}) {
  const [titular,  setTitular]  = useState(qrExistente?.titular  ?? '');
  const [numero,   setNumero]   = useState(qrExistente?.numero   ?? '');
  const [archivo,  setArchivo]  = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(qrExistente?.imagenUrl ?? null);
  const [guardando, setGuardando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleGuardar = async () => {
    if (!archivo && !qrExistente) {
      sileo.error({ title: 'Selecciona una imagen QR' });
      return;
    }
    setGuardando(true);
    try {
      const form = new FormData();
      form.append('metodo', metodo.id);
      if (titular) form.append('titular', titular);
      if (numero)  form.append('numero',  numero);
      if (archivo) form.append('imagen',  archivo);
      await api.post('/config-qr', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      sileo.success({ title: `QR de ${metodo.label} guardado` });
      onGuardar();
    } catch (err) {
      sileo.error({ title: getErrMsg(err, 'Error al guardar QR') });
    } finally { setGuardando(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onCerrar}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm">

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <QrCode size={18} className={metodo.color} />
            <h3 className="text-white font-bold">QR de {metodo.label}</h3>
          </div>
          <button onClick={onCerrar} className="text-white/30 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Imagen QR */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">Imagen QR</label>
            {preview ? (
              <div className="relative bg-white rounded-2xl p-3 flex justify-center">
                <img src={preview} alt="QR" className="w-48 h-48 object-contain" />
                <button onClick={() => { setPreview(null); setArchivo(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-orange-500/40 rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors">
                <Upload size={24} className="text-white/30" />
                <span className="text-white/40 text-sm">Clic para subir imagen QR</span>
                <span className="text-white/20 text-xs">PNG, JPG recomendado</span>
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleArchivo} />
          </div>

          {/* Titular */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">Titular (opcional)</label>
            <input type="text" value={titular} onChange={e => setTitular(e.target.value)}
              placeholder="Ej: Don Camote SAC"
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
          </div>

          {/* Número */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">
              {metodo.id === 'transferencia' ? 'N° de cuenta' : 'N° de celular (opcional)'}
            </label>
            <input type="text" value={numero} onChange={e => setNumero(e.target.value)}
              placeholder={metodo.id === 'transferencia' ? 'Ej: 00-123-456789' : 'Ej: 987654321'}
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar QR'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ConfigQRPage() {
  const [qrs,      setQrs]      = useState<ConfigQR[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<typeof METODOS_QR[number] | null>(null);
  const [eliminar, setEliminar] = useState<ConfigQR | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get('/config-qr');
      setQrs(res.data.data);
    } catch { sileo.error({ title: 'Error al cargar QRs' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleEliminar = async () => {
    if (!eliminar) return;
    try {
      await api.delete(`/config-qr/${eliminar.metodo}`);
      setQrs(prev => prev.filter(q => q.metodo !== eliminar.metodo));
      sileo.success({ title: `QR de ${eliminar.metodo} eliminado` });
    } catch (err) { sileo.error({ title: getErrMsg(err, 'Error al eliminar QR') }); }
    finally { setEliminar(null); }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Códigos QR de Pago</h1>
        <p className="text-white/40 text-sm">
          Sube los QR de Yape, Plin y Transferencia — aparecerán automáticamente al cobrar
        </p>
      </div>

      {/* Cards por método */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {METODOS_QR.map(metodo => {
          const qr = qrs.find(q => q.metodo === metodo.id);
          const Icono = metodo.icono;
          return (
            <div key={metodo.id}
              className="bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden">

              {/* Header card */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${metodo.bg} rounded-lg flex items-center justify-center`}>
                    <Icono size={16} className={metodo.color} />
                  </div>
                  <span className="text-white font-semibold">{metodo.label}</span>
                </div>
                {qr ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} /> Configurado
                  </span>
                ) : (
                  <span className="text-xs bg-white/5 text-white/30 px-2 py-0.5 rounded-full">
                    Sin QR
                  </span>
                )}
              </div>

              {/* Contenido */}
              <div className="p-5">
                {loading ? (
                  <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
                ) : qr ? (
                  <>
                    <div className="bg-white rounded-2xl p-3 flex justify-center mb-4">
                      <img src={qr.imagenUrl} alt={`QR ${metodo.label}`}
                        className="w-40 h-40 object-contain" />
                    </div>
                    {qr.titular && (
                      <div className="text-white/60 text-sm text-center mb-1">{qr.titular}</div>
                    )}
                    {qr.numero && (
                      <div className="text-white/40 text-xs text-center font-mono">{qr.numero}</div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setModal(metodo)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#2a3040] text-white/60 hover:text-white text-sm transition-colors cursor-pointer">
                        <Edit2 size={13} /> Actualizar
                      </button>
                      <button onClick={() => setEliminar(qr)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-colors cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className={`w-16 h-16 ${metodo.bg} rounded-2xl flex items-center justify-center`}>
                      <QrCode size={28} className={metodo.color} />
                    </div>
                    <div className="text-white/30 text-sm text-center">
                      No hay QR configurado para {metodo.label}
                    </div>
                    <button onClick={() => setModal(metodo)}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                      <Upload size={14} /> Subir QR
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-blue-400/80 text-sm">
          💡 Los QR aparecen automáticamente en la pantalla de cobro cuando el mesero selecciona
          el método de pago correspondiente. El cliente puede escanear el QR directamente desde ahí.
        </p>
      </div>

      <AnimatePresence>
        {modal && (
          <ModalQR
            metodo={modal}
            qrExistente={qrs.find(q => q.metodo === modal.id) ?? null}
            onGuardar={() => { cargar(); setModal(null); }}
            onCerrar={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        abierto={!!eliminar}
        titulo={`¿Eliminar QR de ${eliminar?.metodo}?`}
        descripcion="El QR dejará de aparecer al cobrar con este método."
        labelConfirmar="Eliminar"
        onConfirmar={handleEliminar}
        onCerrar={() => setEliminar(null)}
      />
    </div>
  );
}