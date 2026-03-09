import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo, HasMany
} from 'sequelize-typescript';
import { Categoria } from './Categoria';
import { DetalleOrden } from './DetalleOrden';

@Table({ tableName: 'productos', timestamps: true })
export class Producto extends Model {

  @Column({ type: DataType.STRING(120), allowNull: false })
  nombre!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  descripcion!: string | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  precio!: number;

  @Column({ type: DataType.STRING(500), allowNull: true })
  imagenUrl!: string | null;  // URL de Cloudinary

  @Column({ type: DataType.STRING(500), allowNull: true })
  imagenPublicId!: string | null;  // ID en Cloudinary para poder eliminar

  @ForeignKey(() => Categoria)
  @Column({ type: DataType.INTEGER, allowNull: false })
  categoriaId!: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  disponible!: boolean;       // activo/inactivo desde admin

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  agotado!: boolean;          // agotado temporalmente (sin eliminar)

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  requiereCocina!: boolean; // false = se sirve directo, no va a cocina

  // ─── Relaciones ───────────────────────────────────────
  @BelongsTo(() => Categoria)
  categoria!: Categoria;

  @HasMany(() => DetalleOrden)
  detalles!: DetalleOrden[];
}