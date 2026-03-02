'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Link as LinkIcon, ImageOff } from 'lucide-react';
import { Producto, Categoria } from '@/modules/admin/types/admin.types';

interface ModalProductoProps {
  producto: Producto | null;
  categorias: Categoria[];
  guardando: boolean;
  onGuardar: (form: FormData) => void;
  onCerrar: () => void;
}

export function ModalProducto({ producto, categorias, guardando, onGuardar, onCerrar }: ModalProductoProps) {
  const [nombre,      setNombre]      = useState(() => producto?.nombre           ?? '');
  const [descripcion, setDescripcion] = useState(() => producto?.descripcion      ?? '');
  const [precio,      setPrecio]      = useState(() => producto?.precio?.toString() ?? '');
  const [categoriaId, setCategoriaId] = useState(() => producto?.categoriaId?.toString() ?? '');
  const [imagenUrl,   setImagenUrl]   = useState(() => producto?.imagenUrl        ?? '');
  const [archivo,     setArchivo]     = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(() => producto?.imagenUrl ?? null);
  const [modoImagen,  setModoImagen]  = useState<'url' | 'archivo'>('url');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('nombre',      nombre);
    form.append('descripcion', descripcion);
    form.append('precio',      precio);
    form.append('categoriaId', categoriaId);
    if (archivo)         form.append('imagen',    archivo);
    else if (imagenUrl)  form.append('imagenUrl', imagenUrl);
    onGuardar(form);
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
        className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
          <button onClick={onCerrar} className="text-white/30 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nombre */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">Nombre del Producto</label>
            <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Lomo Saltado"
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-white/60 text-sm mb-1 block">Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Breve descripción del producto" rows={2}
              className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20 resize-none" />
          </div>

          {/* Categoría + Precio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Categoría</label>
              <select required value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
                className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 cursor-pointer">
                <option value="">Seleccionar...</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Precio (S/.)</label>
              <input type="number" min="0" step="0.10" required value={precio} onChange={e => setPrecio(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
            </div>
          </div>

          {/* Imagen — tabs URL / Archivo */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">Imagen</label>

            {/* Toggle modo */}
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setModoImagen('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  modoImagen === 'url' ? 'bg-orange-500 text-white' : 'bg-[#2a3040] text-white/50'
                }`}>
                <LinkIcon size={12} /> URL
              </button>
              <button type="button" onClick={() => setModoImagen('archivo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  modoImagen === 'archivo' ? 'bg-orange-500 text-white' : 'bg-[#2a3040] text-white/50'
                }`}>
                <Upload size={12} /> Subir archivo
              </button>
            </div>

            {modoImagen === 'url' ? (
              <input type="url" value={imagenUrl} onChange={e => { setImagenUrl(e.target.value); setPreview(e.target.value); }}
                placeholder="https://..."
                className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
            ) : (
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-orange-500/40 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Upload size={20} className="text-white/30" />
                <span className="text-white/40 text-sm">
                  {archivo ? archivo.name : 'Clic para seleccionar imagen'}
                </span>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleArchivo} />
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="mt-3 relative w-full h-36 bg-[#2a3040] rounded-xl overflow-hidden">
                <img src={preview} alt="preview"
                  className="w-full h-full object-cover"
                  onError={() => setPreview(null)}
                />
                <button type="button" onClick={() => { setPreview(null); setImagenUrl(''); setArchivo(null); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            )}

            {!preview && (
              <div className="mt-3 w-full h-36 bg-[#2a3040] rounded-xl flex items-center justify-center">
                <ImageOff size={28} className="text-white/15" />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50">
              {guardando ? 'Guardando...' : producto ? 'Guardar' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
