'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

type EventHandlers = Record<string, (data: unknown) => void>;

export const useSocket = (eventos?: EventHandlers) => {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const eventosRef = useRef<EventHandlers | undefined>(eventos); // ← aquí

  // Actualiza la ref sin disparar el efecto
  useEffect(() => {
    eventosRef.current = eventos;
  });

  useEffect(() => {
    if (!user) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('unirse', { rol: user.rol });
    });

    if (eventosRef.current) {
      Object.entries(eventosRef.current).forEach(([evento, handler]) => {
        socket.on(evento, handler);
      });
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]); // ← solo [user], no [eventos]

  const emit = useCallback((evento: string, data?: unknown) => {
    socketRef.current?.emit(evento, data);
  }, []);

  return { emit };
};