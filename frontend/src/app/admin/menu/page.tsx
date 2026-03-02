'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, UtensilsCrossed, ShoppingBag, Tag } from 'lucide-react';
import { useProductos } from '@/modules/admin/hooks/useProductos';
import { KpiCard } from '@/modules/admin/components/shared/KpiCard';
import { ConfirmModal } from '@/modules/admin/components/shared/ConfirmModal';
import { ModalProducto } from '@/modules/admin/components/productos/ModalProducto';
import { GridProductos } from '@/modules/admin/components/productos/GridProductos';
import { Producto } from '@/modules/admin/types/admin.types';

export default function MenuPage() {
  const {
    productos, categorias, loading, guardando,
    productoEditar, modalAbierto, categoriaFiltro, setCategoriaFiltro,
    handleGuardar, handleEliminar, handleToggleAgotado,
    abrirCrear, abrirEditar, cerrarModal,
  } = useProductos();

  const [prodAEliminar, setProdAEliminar] = useState<Producto | null>(null);

  // KPIs sobre todos los productos (sin filtro)
  const totalSinFiltro = categorias.length;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Gestión del Menú</h1>
          <p className="text-white/40 text-sm">Administra los productos de la carta del restaurante</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl font-medium transition-colors cursor-pointer">
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Productos" valor={productos.length}                         icono={UtensilsCrossed} color="blue"    />
        <KpiCard label="Disponibles"     valor={productos.filter(p => !p.agotado).length} icono={ShoppingBag}     color="emerald" />
        <KpiCard label="Categorías"      valor={totalSinFiltro}                            icono={Tag}             color="orange"  />
      </div>

      {/* Filtro categorías */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategoriaFiltro(null)}
          className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            categoriaFiltro === null ? 'bg-orange-500 text-white' : 'bg-[#1a1f2e] text-white/50 border border-white/10'
          }`}>
          Todos
        </button>
        {categorias.map(cat => (
          <button key={cat.id} onClick={() => setCategoriaFiltro(cat.id)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              categoriaFiltro === cat.id ? 'bg-orange-500 text-white' : 'bg-[#1a1f2e] text-white/50 border border-white/10'
            }`}>
            {cat.icono} {cat.nombre}
          </button>
        ))}
      </div>

      {/* Grid */}
      <GridProductos
        productos={productos}
        loading={loading}
        onEditar={abrirEditar}
        onEliminar={setProdAEliminar}
        onToggleAgotado={handleToggleAgotado}
      />

      {/* Modales */}
      <AnimatePresence>
        {modalAbierto && (
          <ModalProducto
            key={productoEditar?.id ?? 'nuevo'}
            producto={productoEditar}
            categorias={categorias}
            guardando={guardando}
            onGuardar={handleGuardar}
            onCerrar={cerrarModal}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        abierto={!!prodAEliminar}
        titulo={`¿Eliminar "${prodAEliminar?.nombre}"?`}
        descripcion="La imagen también será eliminada de Cloudinary."
        onConfirmar={() => { handleEliminar(prodAEliminar!.id); setProdAEliminar(null); }}
        onCerrar={() => setProdAEliminar(null)}
      />
    </div>
  );
}
