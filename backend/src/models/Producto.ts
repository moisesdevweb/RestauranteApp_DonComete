import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo, HasMany,
} from 'sequelize-typescript';
import { Categoria } from './Categoria';
import { DetalleOrden } from './DetalleOrden';

/**
 * Producto de la carta del restaurante.
 *
 * Control de stock (opcional):
 *  - stock = null         → sin control (comportamiento por defecto)
 *  - stock = número       → se descuenta al marcar el item como listo en cocina
 *  - stockMinimo          → umbral de alerta (notificación cuando stock ≤ stockMinimo)
 *
 * Un producto con stock = 0 se marca automáticamente como agotado.
 * El campo requiereCocina hereda el valor de su categoría si no se especifica.
 */
@Table({ tableName: 'productos', timestamps: true })
export class Producto extends Model {

  @Column({ type: DataType.STRING(120), allowNull: false })
  nombre!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  descripcion!: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  precio!: number;

  @Column({ type: DataType.STRING(500), allowNull: true })
  imagenUrl!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  imagenPublicId!: string | null;

  @ForeignKey(() => Categoria)
  @Column({ type: DataType.INTEGER, allowNull: false })
  categoriaId!: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  disponible!: boolean;        // activo/inactivo desde admin

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  agotado!: boolean;           // agotado temporalmente

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  requiereCocina!: boolean;    // false = el mesero lo sirve directo sin notificar cocina

  /**
   * Unidades disponibles en inventario.
   * null = sin control de stock (la mayoría de platos cocinados).
   * número = stock activo — se descuenta al marcar el pedido como listo.
   */
  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: null })
  stock!: number | null;

  /**
   * Umbral de alerta de stock bajo.
   * Cuando stock ≤ stockMinimo se emite una notificación al admin y mesero.
   * Solo aplica si stock no es null.
   */
  @Column({ type: DataType.INTEGER, defaultValue: 3 })
  stockMinimo!: number;

  // ─── Relaciones ───────────────────────────────────────

  @BelongsTo(() => Categoria)
  categoria!: Categoria;

  @HasMany(() => DetalleOrden)
  detalles!: DetalleOrden[];
}