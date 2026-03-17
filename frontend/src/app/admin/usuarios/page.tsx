'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Users, UserCheck, ChefHat, UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { useUsuarios } from '@/modules/admin/hooks/useUsuarios';
import { KpiCard } from '@/modules/admin/components/shared/KpiCard';
import { ConfirmModal } from '@/modules/admin/components/shared/ConfirmModal';
import { ModalUsuario } from '@/modules/admin/components/usuarios/ModalUsuario';
import { TablaUsuarios } from '@/modules/admin/components/usuarios/TablaUsuarios';
import { Usuario } from '@/modules/admin/types/admin.types';

export default function UsuariosPage() {
  const {
    usuarios, loading, guardando,
    usuarioEditar, modalAbierto,
    conteo,
    handleGuardar, handleEliminar, handleReactivar,
    abrirCrear, abrirEditar, cerrarModal,
  } = useUsuarios();

  const [userAEliminar, setUserAEliminar] = useState<Usuario | null>(null);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-white/40 text-sm">Administra meseros, cocineros y administradores</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl font-medium transition-colors cursor-pointer">
          <Plus size={18} /> Agregar Usuario
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Total Usuarios" valor={conteo.total}      icono={Users}          color="blue"    />
        <KpiCard label="Meseros"        valor={conteo.meseros}    icono={UtensilsCrossed} color="purple"  />
        <KpiCard label="Cocineros"      valor={conteo.cocina}     icono={ChefHat}         color="orange"  />
        <KpiCard label="Encargados"     valor={conteo.encargados} icono={ShieldCheck}     color="yellow"  />
        <KpiCard label="Activos"        valor={conteo.activos}    icono={UserCheck}       color="emerald" />
      </div>

      {/* Tabla */}
      <TablaUsuarios
        usuarios={usuarios}
        loading={loading}
        onEditar={abrirEditar}
        onEliminar={setUserAEliminar}
        onReactivar={handleReactivar}
      />

      {/* Modales */}
      <AnimatePresence>
        {modalAbierto && (
          <ModalUsuario
            key={usuarioEditar?.id ?? 'nuevo'}
            usuario={usuarioEditar}
            guardando={guardando}
            onGuardar={handleGuardar}
            onCerrar={cerrarModal}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        abierto={!!userAEliminar}
        titulo={`¿Desactivar a "${userAEliminar?.nombre}"?`}
        descripcion="El usuario no podrá iniciar sesión hasta que sea reactivado."
        labelConfirmar="Desactivar"
        onConfirmar={() => { handleEliminar(userAEliminar!.id); setUserAEliminar(null); }}
        onCerrar={() => setUserAEliminar(null)}
      />
    </div>
  );
}