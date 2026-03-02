// ══════════════════════════════════════════════════════
// DetallePago — Una fila por cada método de pago usado
// Permite pagos MIXTOS: S/.62 Yape + S/.58 Efectivo
// ══════════════════════════════════════════════════════
import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo
} from 'sequelize-typescript';
import { MetodoPago } from '../types/enums';
import { Pago } from './Pago';

@Table({ tableName: 'detalle_pagos', timestamps: false })
export class DetallePago extends Model {

  @ForeignKey(() => Pago)
  @Column({ type: DataType.INTEGER, allowNull: false })
  pagoId!: number;

  @Column({
    type: DataType.ENUM(...Object.values(MetodoPago)),
    allowNull: false,
  })
  metodo!: MetodoPago;        // efectivo | tarjeta | yape | plin

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  monto!: number;             // cuánto se paga con ESTE método

  // Solo aplica si metodo = 'efectivo'
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  montoPagado!: number | null; // cuánto entregó el cliente en billetes

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  vuelto!: number | null;     // montoPagado - monto (calculado al guardar)

  // ─── Relaciones ───────────────────────────────────────
  @BelongsTo(() => Pago)
  pago!: Pago;
}