'use client';
import { useState } from 'react';
import { MenuDiario, MenuDiarioPayload, TipoItem } from '@/modules/admin/types/admin.types';
import { SeccionItems } from './SeccionItems';

interface FormMenuDiarioProps {
  menuEditar?: MenuDiario | null;
  guardando:   boolean;
  onGuardar:   (data: MenuDiarioPayload) => void;
  onCancelar:  () => void;
}

const itemsPorTipo = (menu: MenuDiario | null | undefined, tipo: TipoItem): string[] =>
  menu?.items.filter(i => i.tipo === tipo).map(i => i.nombre) ?? [];

export function FormMenuDiario({ menuEditar, guardando, onGuardar, onCancelar }: FormMenuDiarioProps) {
  const hoy = new Date().toISOString().split('T')[0];

  const [fecha,    setFecha]    = useState(menuEditar?.fecha   ?? hoy);
  const [precio,   setPrecio]   = useState(menuEditar?.precio?.toString() ?? '15.00');
  const [stock,    setStock]    = useState(menuEditar?.stock?.toString()  ?? '50');
  const [entradas, setEntradas] = useState<string[]>(itemsPorTipo(menuEditar, 'entrada'));
  const [fondos,   setFondos]   = useState<string[]>(itemsPorTipo(menuEditar, 'fondo'));
  const [postres,  setPostres]  = useState<string[]>(itemsPorTipo(menuEditar, 'postre'));
  const [bebidas,  setBebidas]  = useState<string[]>(itemsPorTipo(menuEditar, 'bebida'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar requeridos
    const entradasValidas = entradas.filter(Boolean);
    const fondosValidos   = fondos.filter(Boolean);
    if (!entradasValidas.length || !fondosValidos.length) {
      alert('Entradas y Platos de Fondo son requeridos');
      return;
    }

    const items = [
      ...entradasValidas.map(nombre => ({ tipo: 'entrada' as TipoItem, nombre })),
      ...fondosValidos.map(nombre   => ({ tipo: 'fondo'   as TipoItem, nombre })),
      ...postres.filter(Boolean).map(nombre  => ({ tipo: 'postre'  as TipoItem, nombre })),
      ...bebidas.filter(Boolean).map(nombre  => ({ tipo: 'bebida'  as TipoItem, nombre })),
    ];

    onGuardar({ fecha, precio: parseFloat(precio), stock: parseInt(stock) || 50, items });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 space-y-5">
      <h2 className="text-white font-bold text-lg">
        {menuEditar ? 'Editar Menú del Día' : 'Crear Nuevo Menú del Día'}
      </h2>

      {/* Fecha / Precio / Stock */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-white/60 text-sm mb-1 block">Fecha <span className="text-red-400">*</span></label>
          <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)}
            disabled={!!menuEditar} // no se puede cambiar la fecha al editar
            className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 disabled:opacity-40 cursor-pointer" />
        </div>
        <div>
          <label className="text-white/60 text-sm mb-1 block">Precio (S/.) <span className="text-red-400">*</span></label>
          <input type="number" min="0" step="0.50" required value={precio} onChange={e => setPrecio(e.target.value)}
            className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50" />
        </div>
        <div>
          <label className="text-white/60 text-sm mb-1 block">Stock del Día</label>
          <input type="number" min="1" value={stock} onChange={e => setStock(e.target.value)}
            className="w-full bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50" />
        </div>
      </div>

      {/* Items */}
      <div className="grid grid-cols-2 gap-4">
        <SeccionItems titulo="Entradas"       emoji="🤌" color="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          items={entradas} onChange={setEntradas} placeholder="Nombre de la entrada"  requerido />
        <SeccionItems titulo="Platos de Fondo" emoji="🍽️" color="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
          items={fondos}   onChange={setFondos}   placeholder="Nombre del plato de fondo" requerido />
        <SeccionItems titulo="Postres"         emoji="🍮" color="bg-pink-500/20 text-pink-400 hover:bg-pink-500/30"
          items={postres}  onChange={setPostres}  placeholder="Nombre del postre" />
        <SeccionItems titulo="Bebidas"         emoji="🥤" color="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          items={bebidas}  onChange={setBebidas}  placeholder="Nombre de la bebida" />
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancelar}
          className="px-6 py-2.5 rounded-xl bg-[#2a3040] text-white/60 hover:text-white transition-colors cursor-pointer">
          Cancelar
        </button>
        <button type="submit" disabled={guardando}
          className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50">
          {guardando ? 'Guardando...' : menuEditar ? 'Guardar Cambios' : 'Crear Menú'}
        </button>
      </div>
    </form>
  );
}
