import {
  Table, Column, Model, DataType, HasMany
} from 'sequelize-typescript';
import { Producto } from './Producto';

@Table({ tableName: 'categorias', timestamps: true })
export class Categoria extends Model {

  @Column({ type: DataType.STRING(80), allowNull: false })
  nombre!: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  descripcion!: string | null;

  @Column({ type: DataType.STRING(50), allowNull: true })
  icono!: string | null;     // nombre del icono (ej: 'utensils', 'coffee')

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  orden!: number;            // para drag&drop en el admin

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  activo!: boolean;

  // ─── Relaciones ───────────────────────────────────────
  @HasMany(() => Producto)
  productos!: Producto[];
}