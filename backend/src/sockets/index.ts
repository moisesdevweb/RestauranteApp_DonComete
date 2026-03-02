import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer;

export const initSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // El cliente se une a una sala según su rol
    // Frontend debe emitir: socket.emit('unirse', { rol: 'cocina' })
    socket.on('unirse', (data: { rol: string }) => {
      socket.join(data.rol); // sala 'cocina', 'mesero', 'admin'
      console.log(`Socket ${socket.id} se unió a sala: ${data.rol}`);
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

// Exportamos getIo para usarlo en los controllers
export const getIo = (): SocketServer => {
  if (!io) throw new Error('Socket.io no inicializado');
  return io;
};