import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Rutas 
import authRoutes from './routes/auth.routes';
import mesaRoutes from './routes/mesa.routes';
import categoriaRoutes from './routes/categoria.routes';
import productoRoutes from './routes/producto.routes';
import userRoutes from './routes/user.routes';
import ordenRoutes from './routes/orden.routes';
import pagoRoutes from './routes/pago.routes';

// rutas admin
import menuDiarioRoutes from './routes/menuDiario.routes';
import reporteRoutes from './routes/reporte.routes';
const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — para saber si el server está vivo
app.get('/api/health', (_, res) => {
  res.json({ ok: true, message: 'Don Camote API corriendo excelente' });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/pagos', pagoRoutes);

//rutas admin
app.use('/api/menu-diario', menuDiarioRoutes);
app.use('/api/reportes', reporteRoutes);
export default app;