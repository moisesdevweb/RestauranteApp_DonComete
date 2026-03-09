'use client';
import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import { Usuario } from '@/modules/admin/types/admin.types';
import { UsuarioPayload, getUsuarios, crearUsuario, editarUsuario, desactivarUsuario, reactivarUsuario } from '@/modules/admin/services/usuario.service';

export function useUsuarios() {
  const [usuarios, setUsuarios]             = useState<Usuario[]>([]);
  const [loading, setLoading]               = useState(true);
  const [guardando, setGuardando]           = useState(false);
  const [usuarioEditar, setUsuarioEditar]   = useState<Usuario | null>(null);
  const [modalAbierto, setModalAbierto]     = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch {
      sileo.error({ title: 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardar = async (data: UsuarioPayload) => {
    setGuardando(true);
    try {
      if (usuarioEditar) {
        const actualizado = await editarUsuario(usuarioEditar.id, data);
        setUsuarios(prev => prev.map(u => u.id === usuarioEditar.id ? actualizado : u));
        sileo.success({ title: 'Usuario actualizado ' });
      } else {
        const nuevo = await crearUsuario(data);
        setUsuarios(prev => [...prev, nuevo]);
        sileo.success({ title: 'Usuario creado ' });
      }
      setModalAbierto(false);
      setUsuarioEditar(null);
    } catch {
      sileo.error({ title: 'Error al guardar usuario' });
    } finally {
      setGuardando(false);
    }
  };
  const handleReactivar = async (id: number) => {
  try {
    const actualizado = await reactivarUsuario(id);
    setUsuarios(prev => prev.map(u => u.id === id ? actualizado : u));
    sileo.success({ title: 'Usuario reactivado ' });
  } catch {
    sileo.error({ title: 'Error al reactivar usuario' });
  }
};
  const handleEliminar = async (id: number) => {
    try {
      await desactivarUsuario(id);
      setUsuarios(prev => prev.filter(u => u.id !== id));
      sileo.success({ title: 'Usuario desactivado' });
    } catch {
      sileo.error({ title: 'Error al desactivar usuario' });
    }
  };

  const abrirCrear  = () => { setUsuarioEditar(null); setModalAbierto(true); };
  const abrirEditar = (u: Usuario) => { setUsuarioEditar(u); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setUsuarioEditar(null); };

  const conteo = {
    total:   usuarios.length,
    meseros: usuarios.filter(u => u.rol === 'mesero').length,
    cocina:  usuarios.filter(u => u.rol === 'cocina').length,
    activos: usuarios.filter(u => u.activo).length,
  };

  return {
    usuarios, loading, guardando,
    usuarioEditar, modalAbierto,
    conteo,
    handleGuardar, handleEliminar, handleReactivar,
    abrirCrear, abrirEditar, cerrarModal,
  };
}
