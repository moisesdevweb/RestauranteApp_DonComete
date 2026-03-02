// ══════════════════════════════════════════════════════
// MenuDiarioItem — Cada plato dentro del menú del día
// Ej: "Sopa de Pollo" (entrada), "Lomo Saltado" (fondo)
// ══════════════════════════════════════════════════════
import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo
} from 'sequelize-typescript';
import { MenuDiario } from './MenuDiario';

// Tipos de curso dentro del menú del día
export type TipoCurso = 'entrada' | 'fondo' | 'postre' | 'bebida';

@Table({ tableName: 'menu_diario_items', timestamps: false })
export class MenuDiarioItem extends Model {

  @ForeignKey(() => MenuDiario)
  @Column({ type: DataType.INTEGER, allowNull: false })
  menuDiarioId!: number;

  @Column({
    type: DataType.ENUM('entrada', 'fondo', 'postre', 'bebida'),
    allowNull: false,
  })
  tipo!: TipoCurso;

  @Column({ type: DataType.STRING(120), allowNull: false })
  nombre!: string;            // nombre del plato en texto libre

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  disponible!: boolean;       // si ese curso está disponible hoy

  // ─── Relaciones ───────────────────────────────────────
  @BelongsTo(() => MenuDiario)
  menuDiario!: MenuDiario;
}