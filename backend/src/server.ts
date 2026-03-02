import 'reflect-metadata';
import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { syncDb } from './config/database';
import { initSocket } from './sockets';  // ← agregar
import { User } from './models';
import { Rol } from './types/enums';

const PORT = process.env.PORT || 3000;

async function main() {
  await syncDb();

  const crearAdminInicial = async () => {
    const existe = await User.findOne({ where: { username: 'admin' } });
    if (!existe) {
      await User.create({
        nombre: 'Administrador',
        username: 'admin',
        passwordHash: '123456',
        rol: Rol.ADMIN,
        activo: true,
      });
      console.log(chalk.bgYellow.black(' 👤 Admin inicial creado: admin / 123456 '));
    }
  };
  await crearAdminInicial();

  const server = http.createServer(app);
  
  // Inicializar Socket.io con el servidor HTTP
  initSocket(server);  // ← agregar
  
  server.listen(PORT, () => {
    console.log(chalk.bgGreen.black(' 🚀 SERVIDOR CORRIENDO ') + chalk.green(` http://localhost:${PORT}`));
    console.log(chalk.cyan(`📋 Health check: http://localhost:${PORT}/api/health`));
    console.log(chalk.magenta(`🔌 Socket.io activo`));
  });
}

main().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});