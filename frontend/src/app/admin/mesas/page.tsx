'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Building2, Users, LayoutGrid } from 'lucide-react';
import { useMesas } from '@/modules/admin/hooks/useMesas';
import { KpiCard } from '@/modules/admin/components/shared/KpiCard';
import { ConfirmModal } from '@/modules/admin/components/shared/ConfirmModal';
import { CardMesa } from '@/modules/admin/components/mesas/CardMesa';
import { TablaMesas } from '@/modules/admin/components/mesas/TablaMesas';
import { ModalMesa } from '@/modules/admin/components/mesas/ModalMesa';
import { Mesa } from '@/modules/admin/types/admin.types';

export default function MesasPage() {
  const {
    mesas, loading, guardando,
    mesaEditar, modalAbierto, pisos,
    handleGuardar, handleEliminar,
    abrirCrear, abrirEditar, cerrarModal,
  } = useMesas();

  const [pisoActivo,    setPisoActivo]    = useState<number | null>(null);
  const [mesaAEliminar, setMesaAEliminar] = useState<Mesa | null>(null);

  const mesasFiltradas = pisoActivo ? mesas.filter(m => m.piso === pisoActivo) : mesas;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Gestión de Mesas</h1>
          <p className="text-white/40 text-sm">Administra las mesas del restaurante</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl font-medium transition-colors cursor-pointer">
          <Plus size={18} /> Agregar Mesa
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Mesas"     valor={mesas.length}                       icono={LayoutGrid} color="blue"    />
        <KpiCard label="Mesas Activas"   valor={mesas.filter(m => m.activo).length} icono={Building2}  color="emerald" />
        <KpiCard label="Capacidad Total" valor={mesas.reduce((s, m) => s + m.capacidad, 0)} icono={Users} color="purple" />
        <KpiCard label="Pisos"           valor={pisos.length}                        icono={Building2}  color="orange"  />
      </div>

      {/* Filtro piso */}
      <div className="flex gap-2">
        <button onClick={() => setPisoActivo(null)}
          className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            pisoActivo === null ? 'bg-orange-500 text-white' : 'bg-[#1a1f2e] text-white/50 border border-white/10'
          }`}>
          Todos
        </button>
        {pisos.map(p => (
          <button key={p} onClick={() => setPisoActivo(p)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              pisoActivo === p ? 'bg-orange-500 text-white' : 'bg-[#1a1f2e] text-white/50 border border-white/10'
            }`}>
            Piso {p}
          </button>
        ))}
      </div>

      {/* Cards por piso */}
      {pisos.filter(p => pisoActivo === null || p === pisoActivo).map(piso => (
        <div key={piso}>
          <h2 className="text-white/50 text-sm font-medium mb-3 flex items-center gap-2">
            <Building2 size={14} /> Piso {piso} — {mesas.filter(m => m.piso === piso).length} mesas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mesas.filter(m => m.piso === piso).map(mesa => (
              <CardMesa key={mesa.id} mesa={mesa}
                onEditar={() => abrirEditar(mesa)}
                onEliminar={() => setMesaAEliminar(mesa)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Tabla */}
      <TablaMesas
        mesas={mesasFiltradas}
        loading={loading}
        onEditar={abrirEditar}
        onEliminar={setMesaAEliminar}
      />

      {/* Modales */}
        <AnimatePresence>
        {modalAbierto && (
            <ModalMesa
            key={mesaEditar?.id ?? 'nueva'}
            mesa={mesaEditar}
            guardando={guardando}
            onGuardar={handleGuardar}
            onCerrar={cerrarModal}
            />
        )}
        </AnimatePresence>

      <ConfirmModal
        abierto={!!mesaAEliminar}
        titulo={`¿Eliminar Mesa ${mesaAEliminar?.numero}?`}
        descripcion="Esta acción no se puede deshacer."
        onConfirmar={() => { handleEliminar(mesaAEliminar!.id); setMesaAEliminar(null); }}
        onCerrar={() => setMesaAEliminar(null)}
      />
    </div>
  );
}
