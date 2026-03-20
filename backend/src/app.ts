import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes           from './routes/auth.routes';
import mesaRoutes           from './routes/mesa.routes';
import categoriaRoutes      from './routes/categoria.routes';
import productoRoutes       from './routes/producto.routes';
import userRoutes           from './routes/user.routes';
import ordenRoutes          from './routes/orden.routes';
import pagoRoutes           from './routes/pago.routes';
import menuDiarioRoutes     from './routes/menuDiario.routes';
import reporteRoutes        from './routes/reporte.routes';
import descuentoRoutes      from './routes/codigodescuento.routes'; 
import configQRRoutes       from './routes/configqr.routes';  
import auditLogRoutes      from './routes/auditLog.routes';        

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_, res) => {
  res.json({ ok: true, message: 'Don Camote API corriendo excelente' });
});

app.use('/api/auth',        authRoutes);
app.use('/api/mesas',       mesaRoutes);
app.use('/api/categorias',  categoriaRoutes);
app.use('/api/productos',   productoRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/ordenes',     ordenRoutes);
app.use('/api/pagos',       pagoRoutes);
app.use('/api/menu-diario', menuDiarioRoutes);
app.use('/api/reportes',    reporteRoutes);
app.use('/api/descuentos',  descuentoRoutes);  
app.use('/api/config-qr',   configQRRoutes);   
app.use('/api/audit-logs',  auditLogRoutes);

export default app;