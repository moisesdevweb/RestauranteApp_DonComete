'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { MenuDiario } from '@/types';
import { SeleccionMenu } from '@/modules/mesero/hooks/useMesaPedido';

interface MenuDiarioSelectorProps {
  menu: MenuDiario;
  onAgregar: (seleccion: SeleccionMenu) => void;
}

export function MenuDiarioSelector({ menu, onAgregar }: MenuDiarioSelectorProps) {
  const entradas = menu.items?.filter(i => i.tipo === 'entrada' && i.disponible) || [];
  const fondos   = menu.items?.filter(i => i.tipo === 'fondo'   && i.disponible) || [];
  const bebidas  = menu.items?.filter(i => i.tipo === 'bebida'  && i.disponible) || [];
  const postres  = menu.items?.filter(i => i.tipo === 'postre'  && i.disponible) || [];

  const [entradaSel, setEntradaSel] = useState('');
  const [fondoSel,   setFondoSel]   = useState('');
  const [nota,       setNota]       = useState('');

  const puedeAgregar = entradaSel && fondoSel;

  return (
    <div className="max-w-2xl space-y-4">

      {/* Encabezado precio */}
      <div className="bg-[#1a1f2e] border border-orange-500/30 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-bold text-lg">Menú del Día</h3>
          <span className="text-orange-400 font-bold text-xl">S/. {Number(menu.precio).toFixed(2)}</span>
        </div>
        <p className="text-white/40 text-sm">
          Incluye entrada + fondo
          {bebidas.length > 0 ? ' + bebida' : ''}
          {postres.length > 0 ? ' + postre' : ''}
        </p>
      </div>

      {/* Entrada */}
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-white/50 text-xs uppercase tracking-wider">Elige tu Entrada</span>
          {entradaSel && <span className="ml-auto text-green-400 text-xs">✓ Seleccionada</span>}
        </div>
        <div className="space-y-2">
          {entradas.map(item => (
            <button key={item.id} onClick={() => setEntradaSel(item.nombre)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                entradaSel === item.nombre
                  ? 'bg-orange-500 text-white font-medium'
                  : 'bg-[#2a3040] text-white/70 hover:text-white hover:bg-[#323a4a]'
              }`}
            >
              {item.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Fondo */}
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-orange-400 rounded-full" />
          <span className="text-white/50 text-xs uppercase tracking-wider">Elige tu Plato de Fondo</span>
          {fondoSel && <span className="ml-auto text-green-400 text-xs">✓ Seleccionado</span>}
        </div>
        <div className="space-y-2">
          {fondos.map(item => (
            <button key={item.id} onClick={() => setFondoSel(item.nombre)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                fondoSel === item.nombre
                  ? 'bg-orange-500 text-white font-medium'
                  : 'bg-[#2a3040] text-white/70 hover:text-white hover:bg-[#323a4a]'
              }`}
            >
              {item.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Bebida incluida */}
      {bebidas.length > 0 && (
        <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-white/50 text-xs uppercase tracking-wider">Bebida Incluida</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {bebidas.map(item => (
              <span key={item.id} className="bg-[#2a3040] text-white/60 text-sm px-4 py-2 rounded-xl">
                {item.nombre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Postre incluido */}
      {postres.length > 0 && (
        <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-pink-400 rounded-full" />
            <span className="text-white/50 text-xs uppercase tracking-wider">Postre Incluido</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {postres.map(item => (
              <span key={item.id} className="bg-[#2a3040] text-white/60 text-sm px-4 py-2 rounded-xl">
                {item.nombre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nota opcional */}
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4">
        <span className="text-white/50 text-xs uppercase tracking-wider block mb-3">Nota para Cocina (opcional)</span>
        <textarea
          value={nota}
          onChange={e => setNota(e.target.value)}
          placeholder="Ej: Sin ensalada, extra arroz..."
          rows={2}
          className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-orange-500/50 resize-none"
        />
      </div>

      {/* Botón agregar */}
      <button
        onClick={() => puedeAgregar && onAgregar({ entrada: entradaSel, fondo: fondoSel, nota })}
        disabled={!puedeAgregar}
        className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
          puedeAgregar
            ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-lg shadow-orange-500/25'
            : 'bg-[#2a3040] text-white/30 cursor-not-allowed'
        }`}
      >
        <Plus size={18} />
        {puedeAgregar
          ? `Agregar — ${entradaSel} + ${fondoSel}`
          : 'Selecciona entrada y fondo para continuar'}
      </button>
    </div>
  );
}
