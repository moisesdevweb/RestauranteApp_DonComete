'use client';
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { VistaReporte } from './useReportes';
import {
  ReporteDiario, ReporteSemanal, ReporteMensual, ReporteAnual,
} from '@/modules/admin/types/admin.types';

type DatosReporte = ReporteDiario | ReporteSemanal | ReporteMensual | ReporteAnual | null;

// ─── helpers ─────────────────────────────────────────────────────────────────
const NARANJA  = [249, 115, 22]  as const;
const BLANCO   = [255, 255, 255] as const;
const GRIS     = [160, 160, 160] as const;
const FONDO    = [15,  21,  32]  as const;
const FILA_PAR = [26,  31,  46]  as const;

function pdfHeader(pdf: jsPDF, titulo: string, subtitulo: string) {
  const W = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(...FONDO);
  pdf.rect(0, 0, W, 297, 'F');

  pdf.setFillColor(...NARANJA);
  pdf.rect(0, 0, W, 18, 'F');

  pdf.setTextColor(...BLANCO);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🍠  Don Camote — Reportes de Ventas', 10, 12);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...GRIS);
  pdf.text(`${titulo}  ·  ${subtitulo}`, 10, 24);

  return 32; // y inicial tras el header
}

function pdfSectionTitle(pdf: jsPDF, texto: string, y: number) {
  pdf.setTextColor(...NARANJA);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(texto, 10, y);
  pdf.setDrawColor(...NARANJA);
  pdf.setLineWidth(0.4);
  pdf.line(10, y + 1.5, pdf.internal.pageSize.getWidth() - 10, y + 1.5);
  return y + 7;
}

function pdfTable(
  pdf: jsPDF,
  headers: string[],
  rows: (string | number)[][],
  y: number,
  colWidths?: number[],
) {
  const W       = pdf.internal.pageSize.getWidth();
  const margin  = 10;
  const usable  = W - margin * 2;
  const widths  = colWidths ?? headers.map(() => usable / headers.length);
  const rowH    = 7;
  const headerH = 8;

  // Encabezado
  pdf.setFillColor(...NARANJA);
  pdf.rect(margin, y, usable, headerH, 'F');
  pdf.setTextColor(...BLANCO);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  let x = margin;
  headers.forEach((h, i) => {
    pdf.text(h, x + 2, y + 5.5);
    x += widths[i];
  });
  y += headerH;

  // Filas
  pdf.setFont('helvetica', 'normal');
  rows.forEach((row, ri) => {
    if (y > 275) { pdf.addPage(); y = 20; }
    const color = ri % 2 === 0 ? FILA_PAR : FONDO;
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(margin, y, usable, rowH, 'F');
    pdf.setTextColor(...BLANCO);
    x = margin;
    row.forEach((cell, ci) => {
      pdf.text(String(cell), x + 2, y + 4.8);
      x += widths[ci];
    });
    y += rowH;
  });

  return y + 6;
}

// ─── KPIs en cajitas horizontales ────────────────────────────────────────────
function pdfKpis(pdf: jsPDF, kpis: Record<string, unknown>, y: number) {
  const entries = Object.entries(kpis);
  const W       = pdf.internal.pageSize.getWidth();
  const margin  = 10;
  const gap     = 4;
  const cols    = Math.min(entries.length, 4);
  const boxW    = (W - margin * 2 - gap * (cols - 1)) / cols;
  const boxH    = 18;

  entries.slice(0, 8).forEach(([ key, val ], i) => {
    const col  = i % cols;
    const row  = Math.floor(i / cols);
    const bx   = margin + col * (boxW + gap);
    const by   = y + row * (boxH + gap);

    pdf.setFillColor(...FILA_PAR);
    pdf.roundedRect(bx, by, boxW, boxH, 3, 3, 'F');

    pdf.setTextColor(...GRIS);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(key), bx + 3, by + 5.5);

    pdf.setTextColor(...NARANJA);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(val), bx + 3, by + 14);
  });

  const rows = Math.ceil(entries.length / cols);
  return y + rows * (boxH + gap) + 4;
}

export function useExport(
  vista: VistaReporte,
  datos: DatosReporte,
) {

  // ─── Excel ───────────────────────────────────────────────────────────────────
  const exportarExcel = useCallback(() => {
    if (!datos) return;

    const wb = XLSX.utils.book_new();

    const kpisData = Object.entries(datos.kpis).map(([key, val]) => ({
      Indicador: key,
      Valor:     val,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpisData), 'KPIs');

    const metodosData = Object.entries(datos.metodosPago).map(([metodo, monto]) => ({
      'Método de Pago': metodo,
      'Monto (S/.)':   monto,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metodosData), 'Métodos de Pago');

    if (vista === 'diario') {
      const d = datos as ReporteDiario;

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          Object.entries(d.ventasPorHora)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([hora, monto]) => ({ Hora: `${hora}:00`, 'Ventas (S/.)': monto })),
        ),
        'Ventas por Hora',
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          d.pedidos.map(p => ({
            '#Orden':         p.id,
            Mesa:             `Mesa ${p.mesa}`,
            Mesero:           p.mesero ?? '—',
            'Total (S/.)':    Number(p.total).toFixed(2),
            'Método(s)':      p.metodos.map(m => `${m.metodo} S/.${m.monto}`).join(' | '),
            Hora:             new Date(p.cerradoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          })),
        ),
        'Pedidos del Día',
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          Object.values(d.ventasPorMesero).map(m => ({
            Mesero:                m.nombre,
            Órdenes:               m.ordenes,
            'Total (S/.)':         m.total,
            'Ticket Prom. (S/.)':  m.ticketPromedio,
          })),
        ),
        'Por Mesero',
      );
    }

    if (vista === 'semanal') {
      const s = datos as ReporteSemanal;

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          Object.entries(s.ventasPorDia).map(([dia, monto]) => ({
            Día:           dia,
            'Ventas (S/.)': monto,
            Mesas:         s.mesasPorDia[dia] ?? 0,
          })),
        ),
        'Ventas por Día',
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          s.comparativaSemanas.map(c => ({
            Semana:               c.semana,
            'Este Mes (S/.)':     c.actual,
            'Mes Anterior (S/.)': c.anterior,
            'Diferencia (S/.)':   Number((c.actual - c.anterior).toFixed(2)),
          })),
        ),
        'Comparativa Semanas',
      );
    }

    if (vista === 'mensual') {
      const m = datos as ReporteMensual;

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          Object.entries(m.ventasPorSemana).map(([sem, monto]) => ({
            Semana:         sem,
            'Ventas (S/.)': monto,
          })),
        ),
        'Ventas por Semana',
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          Object.entries(m.tendenciaMeses).map(([mes, monto]) => ({
            Mes:            mes,
            'Ventas (S/.)': monto,
          })),
        ),
        'Tendencia Mensual',
      );
    }

    if (vista === 'anual') {
      const a = datos as ReporteAnual;

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          Object.entries(a.ventasPorMes).map(([mes, monto]) => ({
            Mes:            mes,
            'Ventas (S/.)': monto,
            Mesas:          a.mesasPorMes[mes] ?? 0,
          })),
        ),
        'Ventas por Mes',
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          a.ventasPorAño.map(v => ({
            Año:            v.año,
            'Total (S/.)':  v.total,
          })),
        ),
        'Comparativa Años',
      );
    }

    XLSX.writeFile(wb, `reporte_${vista}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [vista, datos]);

  // ─── PDF ─────────────────────────────────────────────────────────────────────
  const exportarPDF = useCallback(() => {
    if (!datos) return;

    const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const hoy  = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    const sub  = `Vista: ${vista.toUpperCase()}  ·  Generado: ${hoy}`;

    let y = pdfHeader(pdf, 'Reporte de Ventas', sub);

    // KPIs
    y = pdfSectionTitle(pdf, 'Indicadores Clave', y);
    y = pdfKpis(pdf, datos.kpis as unknown as Record<string, unknown>, y);

    // Métodos de pago
    y = pdfSectionTitle(pdf, 'Métodos de Pago', y);
    y = pdfTable(
      pdf,
      ['Método', 'Monto (S/.)'],
      Object.entries(datos.metodosPago).map(([m, v]) => [m, Number(v).toFixed(2)]),
      y,
      [120, 65],
    );

    if (vista === 'diario') {
      const d = datos as ReporteDiario;

      y = pdfSectionTitle(pdf, 'Ventas por Hora', y);
      y = pdfTable(
        pdf,
        ['Hora', 'Ventas (S/.)'],
        Object.entries(d.ventasPorHora)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([h, v]) => [`${h}:00`, Number(v).toFixed(2)]),
        y,
        [120, 65],
      );

      y = pdfSectionTitle(pdf, 'Rendimiento por Mesero', y);
      y = pdfTable(
        pdf,
        ['Mesero', 'Órdenes', 'Total (S/.)', 'Ticket Prom.'],
        Object.values(d.ventasPorMesero).map(m => [
          m.nombre, m.ordenes, m.total.toFixed(2), m.ticketPromedio.toFixed(2),
        ]),
        y,
        [70, 30, 45, 45],
      );

      if (y > 220) { pdf.addPage(); y = 20; }
      y = pdfSectionTitle(pdf, 'Pedidos del Día', y);
      pdfTable(
        pdf,
        ['#', 'Mesa', 'Mesero', 'Total (S/.)', 'Hora'],
        d.pedidos.map(p => [
          `#${p.id}`,
          `Mesa ${p.mesa}`,
          p.mesero ?? '—',
          Number(p.total).toFixed(2),
          new Date(p.cerradoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        ]),
        y,
        [20, 25, 55, 35, 25],
      );
    }

    if (vista === 'semanal') {
      const s = datos as ReporteSemanal;

      y = pdfSectionTitle(pdf, 'Ventas por Día', y);
      y = pdfTable(
        pdf,
        ['Día', 'Ventas (S/.)', 'Mesas'],
        Object.entries(s.ventasPorDia).map(([dia, monto]) => [
          dia, Number(monto).toFixed(2), s.mesasPorDia[dia] ?? 0,
        ]),
        y,
        [80, 55, 55],
      );

      y = pdfSectionTitle(pdf, 'Comparativa de Semanas', y);
      pdfTable(
        pdf,
        ['Semana', 'Este Mes (S/.)', 'Mes Ant. (S/.)', 'Diferencia'],
        s.comparativaSemanas.map(c => [
          c.semana,
          Number(c.actual).toFixed(2),
          Number(c.anterior).toFixed(2),
          (c.actual - c.anterior).toFixed(2),
        ]),
        y,
        [50, 45, 45, 45],
      );
    }

    if (vista === 'mensual') {
      const m = datos as ReporteMensual;

      y = pdfSectionTitle(pdf, 'Ventas por Semana', y);
      y = pdfTable(
        pdf,
        ['Semana', 'Ventas (S/.)'],
        Object.entries(m.ventasPorSemana).map(([s, v]) => [s, Number(v).toFixed(2)]),
        y,
        [120, 65],
      );

      y = pdfSectionTitle(pdf, 'Tendencia Mensual', y);
      pdfTable(
        pdf,
        ['Mes', 'Ventas (S/.)'],
        Object.entries(m.tendenciaMeses).map(([mes, v]) => [mes, Number(v).toFixed(2)]),
        y,
        [120, 65],
      );
    }

    if (vista === 'anual') {
      const a = datos as ReporteAnual;

      y = pdfSectionTitle(pdf, 'Ventas por Mes', y);
      y = pdfTable(
        pdf,
        ['Mes', 'Ventas (S/.)', 'Mesas'],
        Object.entries(a.ventasPorMes).map(([mes, monto]) => [
          mes, Number(monto).toFixed(2), a.mesasPorMes[mes] ?? 0,
        ]),
        y,
        [80, 55, 55],
      );

      y = pdfSectionTitle(pdf, 'Comparativa por Año', y);
      pdfTable(
        pdf,
        ['Año', 'Total (S/.)'],
        a.ventasPorAño.map(v => [v.año, Number(v.total).toFixed(2)]),
        y,
        [120, 65],
      );
    }

    pdf.save(`reporte_${vista}_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [vista, datos]);

  return { exportarExcel, exportarPDF };
}
