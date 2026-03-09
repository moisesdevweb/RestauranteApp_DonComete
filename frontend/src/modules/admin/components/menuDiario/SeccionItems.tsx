'use client';
import { Plus, Trash2 } from 'lucide-react';

interface SeccionItemsProps {
  titulo:      string;
  emoji:       string;
  color:       string;
  items:       string[];
  placeholder: string;
  requerido?:  boolean;
  onChange:    (items: string[]) => void;
}

export function SeccionItems({ titulo, emoji, color, items, placeholder, requerido, onChange }: SeccionItemsProps) {
  const agregar = () => onChange([...items, '']);

  const actualizar = (i: number, val: string) => {
    const copia = [...items];
    copia[i] = val;
    onChange(copia);
  };

  const eliminar = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span className="text-white font-medium text-sm">{titulo}</span>
          {requerido && <span className="text-red-400 text-xs">*</span>}
        </div>
        <button type="button" onClick={agregar}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${color}`}>
          + Agregar
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={e => actualizar(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-[#2a3040] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-orange-500/50 placeholder-white/20"
            />
            <button type="button" onClick={() => eliminar(i)}
              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-white/20 text-xs italic px-1">
            {requerido ? 'Al menos un item requerido' : 'Opcional — puedes dejarlo vacío'}
          </p>
        )}
      </div>
    </div>
  );
}
