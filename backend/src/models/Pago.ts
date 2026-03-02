// ══════════════════════════════════════════════════════
// Pago — Cabecera del pago al cerrar una mesa
// ══════════════════════════════════════════════════════
import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo, HasMany
} from 'sequelize-typescript';
import { Orden } from './Orden';
import { DetallePago } from './DetallePago';

@Table({ tableName: 'pagos', timestamps: true })
export class Pago extends Model {

  @ForeignKey(() => Orden)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  ordenId!: number;           // unique: una orden = un pago

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  subtotal!: number;          // suma de todos los items sin descuento

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  descuento!: number;         // monto de descuento si aplica

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  total!: number;             // subtotal - descuento = total a cobrar

  // ─── Relaciones ───────────────────────────────────────
  @BelongsTo(() => Orden)
  orden!: Orden;

  @HasMany(() => DetallePago)
  detalles!: DetallePago[];   // uno o más métodos de pago (mixto)
}