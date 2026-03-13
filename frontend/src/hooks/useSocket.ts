'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

type EventHandlers = Record<string, (data: unknown) => void>;

let globalSocket: Socket | null = null;

export const useSocket = (eventos?: EventHandlers) => {
  const { user } = useAuthStore();
  const eventosRef = useRef<EventHandlers | undefined>(eventos);

  // Actualiza la ref sin disparar el efecto
  useEffect(() => {
    eventosRef.current = eventos;
  });

  useEffect(() => {
    if (!user) return;

    // Reusar socket global si ya existe y está conectado
    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });
    }

    const socket = globalSocket;

    const registrarEventos = () => {
      // Unirse a sala según rol
      socket.emit('unirse', { rol: user.rol });

      // Re-registrar todos los eventos en cada conexión/reconexión
      if (eventosRef.current) {
        Object.entries(eventosRef.current).forEach(([evento, handler]) => {
          socket.off(evento); // quitar listener anterior para no duplicar
          socket.on(evento, handler);
        });
      }
    };

    // Si ya está conectado, registrar de inmediato
    if (socket.connected) {
      registrarEventos();
    }

    socket.on('connect', registrarEventos);

    return () => {
      socket.off('connect', registrarEventos);
      // NO desconectamos el socket global al desmontar el componente
      // para que otros componentes sigan recibiendo eventos
    };
  }, [user]);

  const emit = useCallback((evento: string, data?: unknown) => {
    globalSocket?.emit(evento, data);
  }, []);

  return { emit };
};