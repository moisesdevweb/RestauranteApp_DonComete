import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo, HasMany, HasOne
} from 'sequelize-typescript';
import { EstadoOrden } from '../types/enums';
import { Mesa } from './Mesa';
import { User } from './User';
import { Comensal } from './Comensal';
import { Pago } from './Pago';

@Table({ tableName: 'ordenes', timestamps: true })
export class Orden extends Model {

  @ForeignKey(() => Mesa)
  @Column({ type: DataType.INTEGER, allowNull: false })
  mesaId!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;            // mesero que tomó el pedido

  @Column({
    type: DataType.ENUM(...Object.values(EstadoOrden)),
    defaultValue: EstadoOrden.ABIERTA,
  })
  estado!: EstadoOrden;

  @Column({ type: DataType.DATE, allowNull: true })
  cerradoEn!: Date | null;   // cuando se paga

  // ─── Relaciones ───────────────────────────────────────
  @BelongsTo(() => Mesa)
  mesa!: Mesa;

  @BelongsTo(() => User)
  mesero!: User;

  @HasMany(() => Comensal)
  comensales!: Comensal[];

  @HasOne(() => Pago)
  pago!: Pago;
}