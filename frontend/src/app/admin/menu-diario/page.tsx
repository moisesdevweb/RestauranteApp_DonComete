'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, History } from 'lucide-react';
import { useMenuDiario } from '@/modules/admin/hooks/useMenuDiario';
import { FormMenuDiario } from '@/modules/admin/components/menuDiario/FormMenuDiario';
import { CardMenuHoy } from '@/modules/admin/components/menuDiario/CardMenuHoy';
import { HistorialMenus } from '@/modules/admin/components/menuDiario/HistorialMenus';
import { ConfirmModal } from '@/modules/admin/components/shared/ConfirmModal';
import { useState } from 'react';
import { MenuDiario } from '@/modules/admin/types/admin.types';

export default function MenuDiarioPage() {
  const {
    menus, menuHoy, historial,
    loading, guardando,
    menuEditar, setMenuEditar,
    mostrarForm, setMostrarForm,
    mostrarHistorial, setMostrarHistorial,
    handleCrear, handleEditar,
    handleDesactivar, handleReactivar, handleDuplicar,
  } = useMenuDiario();

  const [menuAEliminar, setMenuAEliminar] = useState<MenuDiario | null>(null);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Menú Diario</h1>
          <p className="text-white/40 text-sm">Gestiona los menús del día que cambian diariamente</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1f2e] border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer">
            <History size={16} />
            {mostrarHistorial ? 'Ocultar Historial' : 'Ver Historial'}
          </button>
          {!mostrarForm && !menuEditar && (
            <button onClick={() => setMostrarForm(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl font-medium transition-colors cursor-pointer">
              <Plus size={18} /> Crear Menú del Día
            </button>
          )}
        </div>
      </div>

      {/* Historial */}
      <AnimatePresence>
        {mostrarHistorial && historial.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}>
            <HistorialMenus
              historial={historial}
              guardando={guardando}
              onDuplicar={handleDuplicar}
              onReactivar={handleReactivar}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario crear */}
      <AnimatePresence>
        {mostrarForm && !menuEditar && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}>
            <FormMenuDiario
              guardando={guardando}
              onGuardar={handleCrear}
              onCancelar={() => setMostrarForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario editar */}
      <AnimatePresence>
        {menuEditar && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}>
            <FormMenuDiario
              menuEditar={menuEditar}
              guardando={guardando}
              onGuardar={data => handleEditar(menuEditar.id, data)}
              onCancelar={() => setMenuEditar(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 bg-[#1a1f2e] rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Lista de menús */}
      {!loading && menus.length === 0 && !mostrarForm && (
        <div className="text-center py-16 text-white/30">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium">No hay menús creados aún</p>
          <p className="text-sm mt-1">Crea el menú del día para comenzar</p>
        </div>
      )}

      {!loading && menus.map(menu => (
        <CardMenuHoy
          key={menu.id}
          menu={menu}
          onEditar={() => { setMenuEditar(menu); setMostrarForm(false); }}
          onDesactivar={() => handleDesactivar(menu.id)}
          onReactivar={() => handleReactivar(menu.id)}
          onEliminar={() => setMenuAEliminar(menu)}
        />
      ))}

      {/* Confirm eliminar */}
      <ConfirmModal
        abierto={!!menuAEliminar}
        titulo={`¿Desactivar menú del ${menuAEliminar?.fecha}?`}
        descripcion="El menú quedará inactivo pero podrás reactivarlo desde el historial."
        labelConfirmar="Desactivar"
        onConfirmar={() => { handleDesactivar(menuAEliminar!.id); setMenuAEliminar(null); }}
        onCerrar={() => setMenuAEliminar(null)}
      />
    </div>
  );
}
