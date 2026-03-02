import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo, HasMany
} from 'sequelize-typescript';
import { Orden } from './Orden';
import { DetalleOrden } from './DetalleOrden';

@Table({ tableName: 'comensales', timestamps: false })
export class Comensal extends Model {

  @ForeignKey(() => Orden)
  @Column({ type: DataType.INTEGER, allowNull: false })
  ordenId!: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  nombre!: string | null;     // "Ana", "Carlos" o null → se muestra "Comensal 1"

  @Column({ type: DataType.INTEGER, allowNull: false })
  numero!: number;            // 1, 2, 3, 4 — para ordenar y mostrar en pantalla

  // ─── Relaciones ───────────────────────────────────────
  @BelongsTo(() => Orden)
  orden!: Orden;

  @HasMany(() => DetalleOrden)
  detalles!: DetalleOrden[];

  // Helper: devuelve el nombre a mostrar en pantalla
  get nombreMostrar(): string {
    return this.nombre || `Comensal ${this.numero}`;
  }
}