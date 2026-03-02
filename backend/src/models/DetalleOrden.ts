import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo
} from 'sequelize-typescript';
import { EstadoDetalle } from '../types/enums';
import { Orden } from './Orden';
import { Comensal } from './Comensal';
import { Producto } from './Producto';
import { MenuDiario } from './MenuDiario';

// Un ítem del pedido puede ser de carta (producto) o menú del día
export type TipoPedido = 'carta' | 'menu_dia';

@Table({ tableName: 'detalle_orden', timestamps: true })
export class DetalleOrden extends Model {

  @ForeignKey(() => Orden)
  @Column({ type: DataType.INTEGER, allowNull: false })
  ordenId!: number;

  @ForeignKey(() => Comensal)
  @Column({ type: DataType.INTEGER, allowNull: false })
  comensalId!: number;

  @Column({
    type: DataType.ENUM('carta', 'menu_dia'),
    allowNull: false,
  })
  tipo!: TipoPedido;

  // Si tipo='carta' → se llena productoId, menuDiarioId queda null
  @ForeignKey(() => Producto)
  @Column({ type: DataType.INTEGER, allowNull: true })
  productoId!: number | null;

  // Si tipo='menu_dia' → se llena menuDiarioId, productoId queda null
  @ForeignKey(() => MenuDiario)
  @Column({ type: DataType.INTEGER, allowNull: true })
  menuDiarioId!: number | null;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  cantidad!: number;

  // ⚠️ IMPORTANTE: se guarda el precio al momento del pedido
  // Así los reportes históricos son correctos aunque el precio cambie mañana
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  precioUnitario!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  nota!: string | null;      // "sin cebolla", "término medio", etc.

  @Column({
    type: DataType.ENUM(...Object.values(EstadoDetalle)),
    defaultValue: EstadoDetalle.PENDIENTE,
  })
  estado!: EstadoDetalle;    // pendiente | listo (solo 2, cocinero lo marca)

  // ─── Relaciones ───────────────────────────────────────
  @BelongsTo(() => Orden)
  orden!: Orden;

  @BelongsTo(() => Comensal)
  comensal!: Comensal;

  @BelongsTo(() => Producto)
  producto!: Producto;

  @BelongsTo(() => MenuDiario)
  menuDiario!: MenuDiario;

  // Helper: subtotal de este ítem
  get subtotal(): number {
    return Number(this.precioUnitario) * this.cantidad;
  }
}