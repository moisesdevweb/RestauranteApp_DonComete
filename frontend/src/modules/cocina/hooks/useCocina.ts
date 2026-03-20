'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sileo } from 'sileo';
import { useAuthStore } from '@/store/auth.store';
import { getOrdenescocina, marcarItemListo } from '@/modules/cocina/services/cocina.service';
import { useSocket } from '@/hooks/useSocket';
import { OrdenCocina } from '@/modules/cocina/types/cocina.types';

export function useCocina() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const [ordenesNuevas, setOrdenesNuevas]           = useState<OrdenCocina[]>([]);
  const [ordenesListas, setOrdenesListas]           = useState<OrdenCocina[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada]   = useState<OrdenCocina | null>(null);
  const [marcando, setMarcando]                     = useState(false);
  const [loading, setLoading]                       = useState(true);

  const cargarOrdenes = useCallback(async () => {
    try {
      const data = await getOrdenescocina();
      setOrdenesNuevas(data.filter((o: OrdenCocina) => o.estado === 'en_cocina'));
      setOrdenesListas(data.filter((o: OrdenCocina) => o.estado === 'lista' || o.estado === 'pagada'));
    } catch {
      console.error('Error al cargar ordenes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarOrdenes(); }, [cargarOrdenes]);

  useSocket({
    'orden:nueva': (data: unknown) => {
      const orden = data as OrdenCocina;
      // Si la mesa ya estaba en listos y pide mas, regresa a nuevos
      setOrdenesListas(prev => prev.filter(o => o.id !== orden.id));
      setOrdenesNuevas(prev => {
        const existe = prev.find(o => o.id === orden.id);
        if (existe) return prev.map(o => o.id === orden.id ? orden : o);
        return [orden, ...prev];
      });
      sileo.action({
        title: `Mesa ${orden.mesa.numero} — Nuevos items`,
        description: `${orden.comensales?.flatMap(c => c.detalles).length || 0} items`,
      });
    },

    // ── MAGIA SENIOR: Event-Driven Refetching ──
    'orden:item_cancelado': () => {
      // 1. Recargamos la data fresca desde la BD
      cargarOrdenes();
      
      // 2. Cerramos el modal por si el cocinero lo tenía abierto
      setOrdenSeleccionada(null);
      
      // 3. Avisamos visualmente
      sileo.action({
        title: '🔄 Pedido actualizado',
        description: 'Administración canceló un item de una mesa',
      });
    }
  });

  const handleMarcarListo = async () => {
    if (!ordenSeleccionada) return;
    setMarcando(true);
    try {
      const itemsPendientes = ordenSeleccionada.comensales
        .flatMap(c => c.detalles)
        .filter(d => d.estado === 'pendiente');

      await Promise.all(itemsPendientes.map(item => marcarItemListo(item.id)));

      setOrdenesNuevas(prev => prev.filter(o => o.id !== ordenSeleccionada.id));
      setOrdenesListas(prev => {
        const existe = prev.find(o => o.id === ordenSeleccionada.id);
        if (existe) return prev;
        return [{ ...ordenSeleccionada, estado: 'lista' as OrdenCocina['estado'] }, ...prev];
      });
      setOrdenSeleccionada(null);

      sileo.success({
        title: `Mesa ${ordenSeleccionada.mesa.numero} lista`,
        description: 'El mesero fue notificado',
      });
    } catch {
      sileo.error({ title: 'Error al marcar como listo' });
    } finally {
      setMarcando(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return {
    ordenesNuevas, ordenesListas,
    ordenSeleccionada, setOrdenSeleccionada,
    marcando, loading,
    handleMarcarListo, handleLogout,
  };
}