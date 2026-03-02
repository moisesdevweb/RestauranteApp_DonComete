import {
  Table, Column, Model, DataType, HasMany
} from 'sequelize-typescript';
import { EstadoMesa } from '../types/enums';
import { Orden } from './Orden';

@Table({ tableName: 'mesas', timestamps: true })
export class Mesa extends Model {

  @Column({ type: DataType.INTEGER, allowNull: false })
  numero!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  piso!: number;             // 1 o 2

  @Column({ type: DataType.INTEGER, defaultValue: 4 })
  capacidad!: number;        // cuántas personas entran

  @Column({
    type: DataType.ENUM(...Object.values(EstadoMesa)),
    defaultValue: EstadoMesa.LIBRE,
  })
  estado!: EstadoMesa;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  activo!: boolean;          // para desactivar mesas sin borrarlas

  // ─── Relaciones ───────────────────────────────────────
  @HasMany(() => Orden)
  ordenes!: Orden[];
}