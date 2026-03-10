import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Orden, Pago, DetallePago, DetalleOrden, Producto, Mesa, User } from '../models';
import { EstadoOrden } from '../types/enums';

// ─── Helper: rango de fechas UTC explícito ─────────────────────────────────────
const getRango = (desde: string, hasta: string) => ({
  [Op.between]: [
    new Date(desde + 'T00:00:00.000Z'),
    new Date(hasta + 'T23:59:59.999Z'),
  ],
});

// ─── Helper: fecha local sin offset UTC ───────────────────────────────────────
const fmt = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ─── Helper: calcular métodos de pago ──────────────────────────────────────────
const calcularMetodosPago = (pagos: any[]): Record<string, number> => {
  const metodosPago: Record<string, number> = {};
  pagos.forEach(pago => {
    pago.detalles.forEach((d: any) => {
      metodosPago[d.metodo] = (metodosPago[d.metodo] || 0) + Number(d.monto);
    });
  });
  return metodosPago;
};

// ─── Helper: extraer fecha local del string ISO almacenado en BD ──────────────
const parsearFechaISO = (isoStr: string): Date => {
  const [y, m, d] = isoStr.toString().slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

// GET /api/reportes/diario?fecha=2026-02-26
export const getReporteDiario = async (req: Request, res: Response): Promise<void> => {
  try {
    const fecha = (req.query.fecha as string) || new Date().toISOString().split('T')[0];

    const pagos = await Pago.findAll({
      include: [
        {
          model: Orden,
          as: 'orden',
          where: {
            estado: EstadoOrden.PAGADA,
            cerradoEn: getRango(fecha, fecha),
          },
          include: [
            { model: Mesa, as: 'mesa' },
            { model: User, as: 'mesero' },
          ],
        },
        { model: DetallePago, as: 'detalles' },
      ],
    });

    const totalVentas = pagos.reduce((sum, p) => sum + Number(p.total), 0);
    const ordenesPagadas = pagos.length;
    const totalMesas = new Set(pagos.map(p => p.orden.mesaId)).size;
    const ticketPromedio = ordenesPagadas > 0 ? totalVentas / ordenesPagadas : 0;

    const ventasPorHora: Record<number, number> = {};
    pagos.forEach(pago => {
      const hora = parseInt(pago.orden.cerradoEn!.toString().slice(11, 13));
      ventasPorHora[hora] = (ventasPorHora[hora] || 0) + Number(pago.total);
    });

    const metodosPago = calcularMetodosPago(pagos);

    const pedidos = pagos.map(pago => ({
      id:        pago.orden.id,
      mesa:      pago.orden.mesa?.numero,
      mesero:    pago.orden.mesero?.nombre,
      total:     pago.total,
      cerradoEn: pago.orden.cerradoEn,
      metodos:   pago.detalles.map(d => ({ metodo: d.metodo, monto: d.monto })),
    }));

    res.json({
      ok: true,
      data: {
        fecha,
        kpis: {
          totalVentas:     Number(totalVentas.toFixed(2)),
          totalMesas,
          ordenesPagadas,
          ticketPromedio:  Number(ticketPromedio.toFixed(2)),
        },
        ventasPorHora,
        metodosPago,
        pedidos,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte diario' });
  }
};

// GET /api/reportes/semanal?fecha=2026-02-26
export const getReporteSemanal = async (req: Request, res: Response): Promise<void> => {
  try {
    const fechaStr = (req.query.fecha as string) || fmt(new Date());
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);

    const dia   = fecha.getDay();
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() - (dia === 0 ? 6 : dia - 1));

    const desde = fmt(lunes);
    const hasta  = fechaStr;

    const pagos = await Pago.findAll({
      include: [
        {
          model: Orden,
          as: 'orden',
          where: {
            estado: EstadoOrden.PAGADA,
            cerradoEn: getRango(desde, hasta),
          },
        },
        { model: DetallePago, as: 'detalles' },
      ],
    });

    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const ventasPorDia: Record<string, number> = {};
    const mesasPorDia:  Record<string, number> = {};

    pagos.forEach(pago => {
      const fechaPago = parsearFechaISO(pago.orden.cerradoEn!.toString());
      const nombre    = diasNombres[fechaPago.getDay()];
      ventasPorDia[nombre] = (ventasPorDia[nombre] || 0) + Number(pago.total);
      mesasPorDia[nombre]  = (mesasPorDia[nombre]  || 0) + 1;
    });

    const totalVentas = pagos.reduce((sum, p) => sum + Number(p.total), 0);
    const ordenesPagadas = pagos.length;
    const totalMesas = new Set(pagos.map(p => p.orden.mesaId)).size;

    const metodosPago = calcularMetodosPago(pagos);

    res.json({
      ok: true,
      data: {
        desde,
        hasta,
        kpis: {
          totalVentas:    Number(totalVentas.toFixed(2)),
          totalMesas,
          ordenesPagadas,
          ticketPromedio: ordenesPagadas > 0 ? Number((totalVentas / ordenesPagadas).toFixed(2)) : 0,
        },
        ventasPorDia,
        mesasPorDia,
        metodosPago,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte semanal' });
  }
};

// GET /api/reportes/mensual?año=2026&mes=2
export const getReporteMensual = async (req: Request, res: Response): Promise<void> => {
  try {
    const año = parseInt(req.query.año as string) || new Date().getFullYear();
    const mes = parseInt(req.query.mes as string) || new Date().getMonth() + 1;

    const desde    = `${año}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(año, mes, 0).getDate();
    const hasta    = `${año}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

    const pagos = await Pago.findAll({
      include: [
        {
          model: Orden,
          as: 'orden',
          where: {
            estado: EstadoOrden.PAGADA,
            cerradoEn: getRango(desde, hasta),
          },
        },
        { model: DetallePago, as: 'detalles' },
      ],
    });

    const ventasPorDia: Record<number, number> = {};
    const mesasPorDia:  Record<number, number> = {};

    pagos.forEach(pago => {
      const dia = parseInt(pago.orden.cerradoEn!.toString().slice(8, 10));
      ventasPorDia[dia] = (ventasPorDia[dia] || 0) + Number(pago.total);
      mesasPorDia[dia]  = (mesasPorDia[dia]  || 0) + 1;
    });

    const totalVentas = pagos.reduce((sum, p) => sum + Number(p.total), 0);
    const ordenesPagadas = pagos.length;
    const totalMesas = new Set(pagos.map(p => p.orden.mesaId)).size;

    const metodosPago = calcularMetodosPago(pagos);

    res.json({
      ok: true,
      data: {
        año,
        mes,
        desde,
        hasta,
        kpis: {
          totalVentas:    Number(totalVentas.toFixed(2)),
          totalMesas,
          ordenesPagadas,
          ticketPromedio: ordenesPagadas > 0 ? Number((totalVentas / ordenesPagadas).toFixed(2)) : 0,
        },
        ventasPorDia,
        mesasPorDia,
        metodosPago,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte mensual' });
  }
};

// GET /api/reportes/anual?año=2026
export const getReporteAnual = async (req: Request, res: Response): Promise<void> => {
  try {
    const año = parseInt(req.query.año as string) || new Date().getFullYear();

    const pagos = await Pago.findAll({
      include: [
        {
          model: Orden,
          as: 'orden',
          where: {
            estado: EstadoOrden.PAGADA,
            cerradoEn: getRango(`${año}-01-01`, `${año}-12-31`),
          },
        },
        { model: DetallePago, as: 'detalles' },
      ],
    });

    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const ventasPorMes: Record<string, number> = {};
    const mesasPorMes:  Record<string, number> = {};

    mesesNombres.forEach(m => { ventasPorMes[m] = 0; mesasPorMes[m] = 0; });

    pagos.forEach(pago => {
      const mesIndex = parseInt(pago.orden.cerradoEn!.toString().slice(5, 7)) - 1;
      const mes      = mesesNombres[mesIndex];
      ventasPorMes[mes] = (ventasPorMes[mes] || 0) + Number(pago.total);
      mesasPorMes[mes]  = (mesasPorMes[mes]  || 0) + 1;
    });

    const totalVentas = pagos.reduce((sum, p) => sum + Number(p.total), 0);
    const ordenesPagadas = pagos.length;
    const totalMesas = new Set(pagos.map(p => p.orden.mesaId)).size;

    const metodosPago = calcularMetodosPago(pagos);

    res.json({
      ok: true,
      data: {
        año,
        kpis: {
          totalVentas:    Number(totalVentas.toFixed(2)),
          totalMesas,
          ordenesPagadas,
          ticketPromedio: ordenesPagadas > 0 ? Number((totalVentas / ordenesPagadas).toFixed(2)) : 0,
          mejorMes:       Object.entries(ventasPorMes).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
        },
        ventasPorMes,
        mesasPorMes,
        metodosPago,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte anual' });
  }
};

// GET /api/reportes/comparativa
export const getComparativa = async (req: Request, res: Response): Promise<void> => {
  try {
    const hoy  = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    const diaHoy        = hoy.getDay();
    const lunesEsta     = new Date(hoy);
    lunesEsta.setDate(hoy.getDate() - (diaHoy === 0 ? 6 : diaHoy - 1));
    const lunesAnterior = new Date(lunesEsta);
    lunesAnterior.setDate(lunesEsta.getDate() - 7);
    const domingoAnterior = new Date(lunesAnterior);
    domingoAnterior.setDate(lunesAnterior.getDate() + 6);

    const mesActual  = hoy.getMonth() + 1;
    const añoActual  = hoy.getFullYear();
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const añoAnterior = mesActual === 1 ? añoActual - 1 : añoActual;

    const sumarPagos = async (desde: string, hasta: string): Promise<number> => {
      const pagos = await Pago.findAll({
        include: [{
          model: Orden,
          as: 'orden',
          where: { estado: EstadoOrden.PAGADA, cerradoEn: getRango(desde, hasta) },
        }],
      });
      return pagos.reduce((sum, p) => sum + Number(p.total), 0);
    };

    const ultimoDiaMesAnterior = new Date(añoAnterior, mesAnterior, 0).getDate();

    const [
      ventasHoy,
      ventasAyer,
      ventasEstaSemana,
      ventasSemanaAnterior,
      ventasEsteMes,
      ventasMesAnterior,
    ] = await Promise.all([
      sumarPagos(fmt(hoy), fmt(hoy)),
      sumarPagos(fmt(ayer), fmt(ayer)),
      sumarPagos(fmt(lunesEsta), fmt(hoy)),
      sumarPagos(fmt(lunesAnterior), fmt(domingoAnterior)),
      sumarPagos(`${añoActual}-${String(mesActual).padStart(2, '0')}-01`, fmt(hoy)),
      sumarPagos(
        `${añoAnterior}-${String(mesAnterior).padStart(2, '0')}-01`,
        `${añoAnterior}-${String(mesAnterior).padStart(2, '0')}-${ultimoDiaMesAnterior}`,
      ),
    ]);

    const variacion = (actual: number, anterior: number): number =>
      anterior > 0 ? Number(((actual - anterior) / anterior * 100).toFixed(1)) : 0;

    res.json({
      ok: true,
      data: {
        hoyVsAyer: {
          actual:   Number(ventasHoy.toFixed(2)),
          anterior: Number(ventasAyer.toFixed(2)),
          variacion: variacion(ventasHoy, ventasAyer),
        },
        semanaVsSemana: {
          actual:   Number(ventasEstaSemana.toFixed(2)),
          anterior: Number(ventasSemanaAnterior.toFixed(2)),
          variacion: variacion(ventasEstaSemana, ventasSemanaAnterior),
        },
        mesVsMes: {
          actual:   Number(ventasEsteMes.toFixed(2)),
          anterior: Number(ventasMesAnterior.toFixed(2)),
          variacion: variacion(ventasEsteMes, ventasMesAnterior),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar comparativa' });
  }
};

// GET /api/reportes/productos-top?limite=10&desde=2026-02-01&hasta=2026-02-28
export const getProductosTop = async (req: Request, res: Response): Promise<void> => {
  try {
    const limite = parseInt(req.query.limite as string) || 10;
    const desde  = (req.query.desde as string) || fmt(new Date());
    const hasta  = (req.query.hasta as string) || desde;

    const detalles = await DetalleOrden.findAll({
      include: [
        { model: Producto, as: 'producto' },
        {
          model: Orden,
          as: 'orden',
          where: {
            estado: EstadoOrden.PAGADA,
            cerradoEn: getRango(desde, hasta),
          },
        },
      ],
    });

    const productosMap: Record<number, { nombre: string; cantidad: number; total: number }> = {};

    detalles.forEach(d => {
      if (!d.producto) return;
      const pid = d.productoId!;
      if (!productosMap[pid]) {
        productosMap[pid] = { nombre: d.producto.nombre, cantidad: 0, total: 0 };
      }
      productosMap[pid].cantidad += d.cantidad;
      productosMap[pid].total   += Number(d.precioUnitario) * d.cantidad;
    });

    const top = Object.entries(productosMap)
      .map(([id, data]) => ({ id: parseInt(id), ...data, total: Number(data.total.toFixed(2)) }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limite);

    res.json({ ok: true, data: top });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener productos top' });
  }
};
