import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Orden, Pago, DetallePago, DetalleOrden, Producto, Mesa, User } from '../models';
import { EstadoOrden } from '../types/enums';

// Peru UTC-5
const OFFSET_MS = 5 * 60 * 60 * 1000;

const toLocalPeru = (isoStr: string): Date =>
  new Date(new Date(isoStr).getTime() - OFFSET_MS);

const getRango = (desde: string, hasta: string) => ({
  [Op.between]: [
    new Date(new Date(desde + 'T00:00:00.000Z').getTime() + OFFSET_MS),
    new Date(new Date(hasta + 'T23:59:59.999Z').getTime() + OFFSET_MS),
  ],
});

const fmt = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const calcularMetodosPago = (pagos: any[]): Record<string, number> => {
  const resultado: Record<string, number> = {};
  pagos.forEach(pago =>
    pago.detalles.forEach((d: any) => {
      resultado[d.metodo] = (resultado[d.metodo] || 0) + Number(d.monto);
    })
  );
  return resultado;
};

// Construye el where de Orden con filtro de mesero opcional
const whereOrden = (extra: object, userId?: number) => ({
  estado: EstadoOrden.PAGADA,
  ...extra,
  ...(userId ? { userId } : {}),
});

// GET /api/reportes/diario?fecha=2026-03-12&userId=2
export const getReporteDiario = async (req: Request, res: Response): Promise<void> => {
  try {
    const fecha  = (req.query.fecha  as string) || fmt(new Date());
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const pagos = await Pago.findAll({
      include: [
        {
          model: Orden,
          as: 'orden',
          where: whereOrden({ cerradoEn: getRango(fecha, fecha) }, userId),
          include: [
            { model: Mesa, as: 'mesa' },
            { model: User, as: 'mesero' },
          ],
        },
        { model: DetallePago, as: 'detalles' },
      ],
    });

    const totalVentas    = pagos.reduce((sum, p) => sum + Number(p.total), 0);
    const ordenesPagadas = pagos.length;
    const totalMesas     = new Set(pagos.map(p => p.orden.mesaId)).size;
    const ticketPromedio = ordenesPagadas > 0 ? totalVentas / ordenesPagadas : 0;

    const ventasPorHora: Record<number, number> = {};
    pagos.forEach(pago => {
      const hora = toLocalPeru(pago.orden.cerradoEn!.toString()).getUTCHours();
      ventasPorHora[hora] = (ventasPorHora[hora] || 0) + Number(pago.total);
    });

    const horaPico = Object.entries(ventasPorHora).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const metodosPago = calcularMetodosPago(pagos);

    // Desglose por mesero
    const ventasPorMeseroMap: Record<string, {
      nombre: string;
      ordenes: number;
      total: number;
      ticketPromedio: number;
    }> = {};

    pagos.forEach(pago => {
      const nombre = pago.orden.mesero?.nombre ?? 'Sin asignar';
      if (!ventasPorMeseroMap[nombre]) {
        ventasPorMeseroMap[nombre] = { nombre, ordenes: 0, total: 0, ticketPromedio: 0 };
      }
      ventasPorMeseroMap[nombre].ordenes += 1;
      ventasPorMeseroMap[nombre].total   += Number(pago.total);
    });

    Object.values(ventasPorMeseroMap).forEach(m => {
      m.total          = Number(m.total.toFixed(2));
      m.ticketPromedio = Number((m.total / m.ordenes).toFixed(2));
    });

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
          totalVentas:    Number(totalVentas.toFixed(2)),
          totalMesas,
          ordenesPagadas,
          ticketPromedio: Number(ticketPromedio.toFixed(2)),
          horaPico:       horaPico ? `${horaPico}:00` : '—',
        },
        ventasPorHora,
        metodosPago,
        ventasPorMesero: ventasPorMeseroMap,
        pedidos,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte diario' });
  }
};


// GET /api/reportes/semanal?fecha=2026-03-12&userId=2
export const getReporteSemanal = async (req: Request, res: Response): Promise<void> => {
  try {
    const fechaStr = (req.query.fecha as string) || fmt(new Date());
    const userId   = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const [year, month] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, parseInt(fechaStr.split('-')[2]));
    const dia   = fecha.getDay();
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() - (dia === 0 ? 6 : dia - 1));

    const desde = fmt(lunes);
    const hasta  = fechaStr;

    // Semana seleccionada
    const pagos = await Pago.findAll({
      include: [
        { model: Orden, as: 'orden', where: whereOrden({ cerradoEn: getRango(desde, hasta) }, userId) },
        { model: DetallePago, as: 'detalles' },
      ],
    });

    // Comparativa: mes actual vs mes anterior por semana
    const mesPrev = month === 1 ? 12 : month - 1;
    const añoPrev = month === 1 ? year - 1 : year;

    const desdeActual = `${year}-${String(month).padStart(2, '0')}-01`;
    const hastaActual = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    const desdePrev   = `${añoPrev}-${String(mesPrev).padStart(2, '0')}-01`;
    const hastaPrev   = `${añoPrev}-${String(mesPrev).padStart(2, '0')}-${new Date(añoPrev, mesPrev, 0).getDate()}`;

    const [pagosActualMes, pagosAnteriorMes] = await Promise.all([
      Pago.findAll({ include: [{ model: Orden, as: 'orden', where: whereOrden({ cerradoEn: getRango(desdeActual, hastaActual) }, userId) }] }),
      Pago.findAll({ include: [{ model: Orden, as: 'orden', where: whereOrden({ cerradoEn: getRango(desdePrev, hastaPrev) }, userId) }] }),
    ]);

    const agruparPorSemana = (ps: any[]): Record<string, number> => {
      const res: Record<string, number> = {};
      ps.forEach(p => {
        const d   = toLocalPeru(p.orden.cerradoEn!.toString()).getUTCDate();
        const sem = `Sem ${Math.min(Math.ceil(d / 7), 4)}`;
        res[sem]  = (res[sem] || 0) + Number(p.total);
      });
      return res;
    };

    const semanasActual   = agruparPorSemana(pagosActualMes);
    const semanasAnterior = agruparPorSemana(pagosAnteriorMes);

    const comparativaSemanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map(s => ({
      semana:   s,
      actual:   semanasActual[s]   || 0,
      anterior: semanasAnterior[s] || 0,
    }));

    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const ventasPorDia: Record<string, number> = {};
    const mesasPorDia:  Record<string, number> = {};

    pagos.forEach(pago => {
      const fechaPago = toLocalPeru(pago.orden.cerradoEn!.toString());
      const nombre    = diasNombres[fechaPago.getUTCDay()];
      ventasPorDia[nombre] = (ventasPorDia[nombre] || 0) + Number(pago.total);
      mesasPorDia[nombre]  = (mesasPorDia[nombre]  || 0) + 1;
    });

    const mejorDia = Object.entries(ventasPorDia).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const peorDia  = Object.entries(ventasPorDia).sort((a, b) => a[1] - b[1])[0]?.[0]  ?? '—';

    const totalVentas    = pagos.reduce((sum, p) => sum + Number(p.total), 0);
    const ordenesPagadas = pagos.length;
    const totalMesas     = new Set(pagos.map(p => p.orden.mesaId)).size;
    const metodosPago    = calcularMetodosPago(pagos);

    res.json({
      ok: true,
      data: {
        desde, hasta,
        kpis: {
          totalVentas:    Number(totalVentas.toFixed(2)),
          totalMesas,
          ordenesPagadas,
          ticketPromedio: ordenesPagadas > 0 ? Number((totalVentas / ordenesPagadas).toFixed(2)) : 0,
          mejorDia,
          peorDia,
        },
        ventasPorDia,
        mesasPorDia,
        comparativaSemanas,
        metodosPago,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte semanal' });
  }
};


// GET /api/reportes/mensual?año=2026&mes=3&userId=2
export const getReporteMensual = async (req: Request, res: Response): Promise<void> => {
  try {
    const año    = parseInt(req.query.año    as string) || new Date().getFullYear();
    const mes    = parseInt(req.query.mes    as string) || new Date().getMonth() + 1;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const desde     = `${año}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(año, mes, 0).getDate();
    const hasta     = `${año}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

    const [pagos, pagosAño] = await Promise.all([
      Pago.findAll({
        include: [
          { model: Orden, as: 'orden', where: whereOrden({ cerradoEn: getRango(desde, hasta) }, userId) },
          { model: DetallePago, as: 'detalles' },
        ],
      }),
      // Tendencia del año completo para la gráfica de comparación
      Pago.findAll({
        include: [{ model: Orden, as: 'orden', where: whereOrden({ cerradoEn: getRango(`${año}-01-01`, `${año}-12-31`) }, userId) }],
      }),
    ]);

    const ventasPorDia:    Record<number, number> = {};
    const mesasPorDia:     Record<number, number> = {};
    const ventasPorSemana: Record<string, number> = { 'Sem 1': 0, 'Sem 2': 0, 'Sem 3': 0, 'Sem 4': 0 };

    pagos.forEach(pago => {
      const fechaLocal = toLocalPeru(pago.orden.cerradoEn!.toString());
      const dia        = fechaLocal.getUTCDate();
      const semana     = `Sem ${Math.min(Math.ceil(dia / 7), 4)}`;
      ventasPorDia[dia]    = (ventasPorDia[dia]    || 0) + Number(pago.total);
      mesasPorDia[dia]     = (mesasPorDia[dia]      || 0) + 1;
      ventasPorSemana[semana] = (ventasPorSemana[semana] || 0) + Number(pago.total);
    });

    const mejorSemana = Object.entries(ventasPorSemana).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    // Tendencia mensual del año (para gráfica de comparación entre meses)
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const tendenciaMeses: Record<string, number> = {};
    mesesNombres.forEach(m => { tendenciaMeses[m] = 0; });
    pagosAño.forEach(pago => {
      const mesIdx = toLocalPeru(pago.orden.cerradoEn!.toString()).getUTCMonth();
      tendenciaMeses[mesesNombres[mesIdx]] = (tendenciaMeses[mesesNombres[mesIdx]] || 0) + Number(pago.total);
    });

    const totalVentas    = pagos.reduce((sum, p) => sum + Number(p.total), 0);
    const ordenesPagadas = pagos.length;
    const totalMesas     = new Set(pagos.map(p => p.orden.mesaId)).size;
    const metodosPago    = calcularMetodosPago(pagos);

    res.json({
      ok: true,
      data: {
        año, mes, desde, hasta,
        kpis: {
          totalVentas:    Number(totalVentas.toFixed(2)),
          totalMesas,
          ordenesPagadas,
          ticketPromedio: ordenesPagadas > 0 ? Number((totalVentas / ordenesPagadas).toFixed(2)) : 0,
          mejorSemana,
        },
        ventasPorDia,
        mesasPorDia,
        ventasPorSemana,
        tendenciaMeses,
        metodosPago,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte mensual' });
  }
};


// GET /api/reportes/anual?año=2026&userId=2
export const getReporteAnual = async (req: Request, res: Response): Promise<void> => {
  try {
    const año    = parseInt(req.query.año    as string) || new Date().getFullYear();
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const [pagos, pagosAñoAnterior, totalesPorAño] = await Promise.all([
      Pago.findAll({
        include: [
          { model: Orden, as: 'orden', where: whereOrden({ cerradoEn: getRango(`${año}-01-01`, `${año}-12-31`) }, userId) },
          { model: DetallePago, as: 'detalles' },
        ],
      }),
      Pago.findAll({
        include: [{ model: Orden, as: 'orden', where: whereOrden({ cerradoEn: getRango(`${año - 1}-01-01`, `${año - 1}-12-31`) }, userId) }],
      }),
      // Comparativa entre años: últimos 3 años
      Promise.all([año - 2, año - 1, año].map(async a => {
        const ps = await Pago.findAll({
          include: [{ model: Orden, as: 'orden', where: whereOrden({ cerradoEn: getRango(`${a}-01-01`, `${a}-12-31`) }, userId) }],
        });
        return { año: a, total: Number(ps.reduce((sum, p) => sum + Number(p.total), 0).toFixed(2)) };
      })),
    ]);

    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const ventasPorMes: Record<string, number> = {};
    const mesasPorMes:  Record<string, number> = {};
    mesesNombres.forEach(m => { ventasPorMes[m] = 0; mesasPorMes[m] = 0; });

    pagos.forEach(pago => {
      const mesIndex = toLocalPeru(pago.orden.cerradoEn!.toString()).getUTCMonth();
      const mes      = mesesNombres[mesIndex];
      ventasPorMes[mes] = (ventasPorMes[mes] || 0) + Number(pago.total);
      mesasPorMes[mes]  = (mesasPorMes[mes]  || 0) + 1;
    });

    const totalVentas         = pagos.reduce((sum, p) => sum + Number(p.total), 0);
    const totalVentasAnterior = pagosAñoAnterior.reduce((sum, p) => sum + Number(p.total), 0);
    const crecimiento         = totalVentasAnterior > 0
      ? Number(((totalVentas - totalVentasAnterior) / totalVentasAnterior * 100).toFixed(1))
      : 0;

    const ordenesPagadas = pagos.length;
    const totalMesas     = new Set(pagos.map(p => p.orden.mesaId)).size;
    const metodosPago    = calcularMetodosPago(pagos);
    const mejorMes       = Object.entries(ventasPorMes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    res.json({
      ok: true,
      data: {
        año,
        kpis: {
          totalVentas:    Number(totalVentas.toFixed(2)),
          totalMesas,
          ordenesPagadas,
          ticketPromedio: ordenesPagadas > 0 ? Number((totalVentas / ordenesPagadas).toFixed(2)) : 0,
          mejorMes,
          crecimiento,
        },
        ventasPorMes,
        mesasPorMes,
        ventasPorAño: totalesPorAño,
        metodosPago,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar reporte anual' });
  }
};


// GET /api/reportes/comparativa?userId=2
export const getComparativa = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const hoy  = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    const diaHoy          = hoy.getDay();
    const lunesEsta       = new Date(hoy);
    lunesEsta.setDate(hoy.getDate() - (diaHoy === 0 ? 6 : diaHoy - 1));
    const lunesAnterior   = new Date(lunesEsta);
    lunesAnterior.setDate(lunesEsta.getDate() - 7);
    const domingoAnterior = new Date(lunesAnterior);
    domingoAnterior.setDate(lunesAnterior.getDate() + 6);

    const mesActual   = hoy.getMonth() + 1;
    const añoActual   = hoy.getFullYear();
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const añoAnterior = mesActual === 1 ? añoActual - 1 : añoActual;

    const sumarPagos = async (desde: string, hasta: string): Promise<number> => {
      const pagos = await Pago.findAll({
        include: [{
          model: Orden,
          as: 'orden',
          where: whereOrden({ cerradoEn: getRango(desde, hasta) }, userId),
        }],
      });
      return pagos.reduce((sum, p) => sum + Number(p.total), 0);
    };

    const ultimoDiaMesAnterior = new Date(añoAnterior, mesAnterior, 0).getDate();

    const [
      ventasHoy, ventasAyer,
      ventasEstaSemana, ventasSemanaAnterior,
      ventasEsteMes, ventasMesAnterior,
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
        hoyVsAyer:      { actual: Number(ventasHoy.toFixed(2)),         anterior: Number(ventasAyer.toFixed(2)),           variacion: variacion(ventasHoy, ventasAyer) },
        semanaVsSemana: { actual: Number(ventasEstaSemana.toFixed(2)),   anterior: Number(ventasSemanaAnterior.toFixed(2)), variacion: variacion(ventasEstaSemana, ventasSemanaAnterior) },
        mesVsMes:       { actual: Number(ventasEsteMes.toFixed(2)),      anterior: Number(ventasMesAnterior.toFixed(2)),    variacion: variacion(ventasEsteMes, ventasMesAnterior) },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al generar comparativa' });
  }
};

// GET /api/reportes/productos-top?limite=5&desde=2026-03-01&hasta=2026-03-12&userId=2
export const getProductosTop = async (req: Request, res: Response): Promise<void> => {
  try {
    const limite = parseInt(req.query.limite as string) || 5;
    const desde  = (req.query.desde  as string) || fmt(new Date());
    const hasta  = (req.query.hasta  as string) || desde;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    const detalles = await DetalleOrden.findAll({
      include: [
        { model: Producto, as: 'producto' },
        {
          model: Orden,
          as: 'orden',
          where: whereOrden({ cerradoEn: getRango(desde, hasta) }, userId),
        },
      ],
    });

    const productosMap: Record<number, { nombre: string; cantidad: number; total: number }> = {};

    detalles.forEach(d => {
      if (!d.producto) return;
      const pid = d.productoId!;
      if (!productosMap[pid]) productosMap[pid] = { nombre: d.producto.nombre, cantidad: 0, total: 0 };
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
