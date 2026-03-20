import {
  Table, Column, Model, DataType,
} from 'sequelize-typescript';

/**
 * Códigos de descuento que el admin crea y comparte con clientes.
 *
 * Tipos:
 *  - porcentaje: descuenta un % del total (ej: 10%)
 *  - monto_fijo: descuenta una cantidad fija (ej: S/.5)
 *
 * Reglas:
 *  - usosMaximos null = ilimitado
 *  - fechaExpira null = sin vencimiento
 *  - activo false = desactivado manualmente por admin
 */
@Table({ tableName: 'codigos_descuento', timestamps: true })
export class CodigoDescuento extends Model {

  @Column({ type: DataType.STRING(30), allowNull: false, unique: true })
  codigo!: string;             // ej: "PROMO10", "CUMPLE20"

  @Column({ type: DataType.STRING(100), allowNull: true })
  descripcion!: string | null; // ej: "10% descuento fidelidad"

  @Column({
    type: DataType.ENUM('porcentaje', 'monto_fijo'),
    allowNull: false,
  })
  tipo!: 'porcentaje' | 'monto_fijo';

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  valor!: number;              // 10 = 10% o S/.10 según tipo

  @Column({ type: DataType.INTEGER, allowNull: true })
  usosMaximos!: number | null; // null = ilimitado

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  usosActuales!: number;       // cuántas veces se ha usado

  @Column({ type: DataType.DATE, allowNull: true })
  fechaExpira!: Date | null;   // null = sin vencimiento

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  activo!: boolean;
}