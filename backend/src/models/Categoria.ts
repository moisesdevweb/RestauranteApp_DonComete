import {
  Table, Column, Model, DataType, HasMany,
} from 'sequelize-typescript';
import { Producto } from './Producto';

/**
 * Categoría de productos (ej: Comida Criolla, Bebidas Frías, Postres).
 *
 * El campo `requiereCocina` actúa como valor predeterminado para los
 * productos que se creen dentro de esta categoría. Cada producto puede
 * sobreescribir ese valor individualmente.
 *
 * Ejemplos:
 *  - "Bebidas Frías"   → requiereCocina: false (el mesero las sirve directo)
 *  - "Comida Criolla"  → requiereCocina: true  (van a cocina)
 *  - "Bebidas Calientes" → requiereCocina: true (café, té → cocina)
 */
@Table({ tableName: 'categorias', timestamps: true })
export class Categoria extends Model {

  @Column({ type: DataType.STRING(80), allowNull: false })
  nombre!: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  descripcion!: string | null;

  @Column({ type: DataType.STRING(50), allowNull: true })
  icono!: string | null;       // nombre del icono lucide (ej: 'coffee', 'utensils')

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  orden!: number;              // para ordenar categorías en el admin

  /**
   * Si true, los productos de esta categoría van a cocina por defecto.
   * Si false, el mesero los sirve directamente sin notificar a cocina.
   * Cada producto puede sobreescribir este valor.
   */
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  requiereCocina!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  activo!: boolean;

  // ─── Relaciones ───────────────────────────────────────
  @HasMany(() => Producto)
  productos!: Producto[];
}