// ══════════════════════════════════════════════════════
// MenuDiario — El combo del día (entrada+fondo+postre+bebida)
// ══════════════════════════════════════════════════════
import {
  Table, Column, Model, DataType, HasMany
} from 'sequelize-typescript';
import { MenuDiarioItem } from './MenuDiarioItem';
import { DetalleOrden } from './DetalleOrden';

@Table({ tableName: 'menu_diario', timestamps: true })
export class MenuDiario extends Model {

  @Column({ type: DataType.DATEONLY, allowNull: false })
  fecha!: string;             // '2026-02-25' — un menú por día

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  precio!: number;            // precio del combo completo (ej: S/.15)

  @Column({ type: DataType.INTEGER, defaultValue: 50 })
  stock!: number;             // cuántos menús disponibles hoy

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  vendidos!: number;          // lleva la cuenta de vendidos

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  activo!: boolean;

  // ─── Relaciones ───────────────────────────────────────
  @HasMany(() => MenuDiarioItem)
  items!: MenuDiarioItem[];   // los platos que componen el menú

  @HasMany(() => DetalleOrden)
  detalles!: DetalleOrden[];
}