'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, List } from 'lucide-react';
import { useCategorias } from '@/modules/admin/hooks/useCategorias';
import { KpiCard } from '@/modules/admin/components/shared/KpiCard';
import { ConfirmModal } from '@/modules/admin/components/shared/ConfirmModal';
import { ModalCategoria } from '@/modules/admin/components/categorias/ModalCategoria';
import { ListaCategorias } from '@/modules/admin/components/categorias/ListaCategorias';
import { Categoria } from '@/modules/admin/types/admin.types';

export default function CategoriasPage() {
  const {
    categorias, loading, guardando,
    categoriaEditar, modalAbierto,
    handleGuardar, handleEliminar,
    abrirCrear, abrirEditar, cerrarModal,
  } = useCategorias();

  const [catAEliminar, setCatAEliminar] = useState<Categoria | null>(null);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Gestión de Categorías</h1>
          <p className="text-white/40 text-sm">Organiza y administra las categorías del menú</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl font-medium transition-colors cursor-pointer">
          <Plus size={18} /> Nueva Categoría
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Categorías" valor={categorias.length}                        icono={List} color="blue"    />
        <KpiCard label="Activas"          valor={categorias.filter(c => c.activo).length}  icono={List} color="emerald" />
        <KpiCard label="Inactivas"        valor={categorias.filter(c => !c.activo).length} icono={List} color="red"     />
      </div>

      {/* Lista */}
      <ListaCategorias
        categorias={categorias}
        loading={loading}
        onEditar={abrirEditar}
        onEliminar={setCatAEliminar}
      />

      {/* Modales */}
      <AnimatePresence>
        {modalAbierto && (
          <ModalCategoria
            key={categoriaEditar?.id ?? 'nueva'}
            categoria={categoriaEditar}
            guardando={guardando}
            onGuardar={handleGuardar}
            onCerrar={cerrarModal}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        abierto={!!catAEliminar}
        titulo={`¿Eliminar categoría "${catAEliminar?.nombre}"?`}
        descripcion="Los productos de esta categoría no serán eliminados."
        onConfirmar={() => { handleEliminar(catAEliminar!.id); setCatAEliminar(null); }}
        onCerrar={() => setCatAEliminar(null)}
      />
    </div>
  );
}
