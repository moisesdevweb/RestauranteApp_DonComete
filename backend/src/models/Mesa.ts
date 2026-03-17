import {
  Table, Column, Model, DataType,
  HasMany, Unique,
} from 'sequelize-typescript';
import { EstadoMesa } from '../types/enums';
import { Orden } from './Orden';

/**
 * Representa una mesa física del restaurante.
 *
 * Reglas de negocio:
 *  - El par (numero, piso) debe ser único — no pueden existir dos mesas
 *    con el mismo número en el mismo piso.
 *  - Las mesas no se eliminan físicamente; se desactivan (activo = false).
 *  - Una mesa ocupada no puede ser editada ni desactivada.
 */
@Table({
  tableName: 'mesas',
  timestamps: true,
  indexes: [
    {
      // Unicidad compuesta: mismo número no puede repetirse en el mismo piso
      unique: true,
      fields: ['numero', 'piso'],
      name: 'uq_mesas_numero_piso',
    },
  ],
})
export class Mesa extends Model {

  @Column({ type: DataType.INTEGER, allowNull: false })
  numero!: number;            // número visible de la mesa (ej: 1, 2, 3...)

  @Column({ type: DataType.INTEGER, allowNull: false })
  piso!: number;              // planta del local (1 = planta baja, 2 = segundo piso...)

  @Column({ type: DataType.INTEGER, defaultValue: 4 })
  capacidad!: number;         // máximo de comensales que admite

  @Column({
    type: DataType.ENUM(...Object.values(EstadoMesa)),
    defaultValue: EstadoMesa.LIBRE,
  })
  estado!: EstadoMesa;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  activo!: boolean;           // false = desactivada (oculta para meseros)

  // ─── Relaciones ───────────────────────────────────────

  @HasMany(() => Orden)
  ordenes!: Orden[];
}