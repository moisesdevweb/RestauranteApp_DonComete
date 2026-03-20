import {
  Table, Column, Model, DataType, Index,
} from 'sequelize-typescript';
import { MetodoPago } from '../types/enums';

/**
 * Configuración de QR por método de pago digital.
 * El admin sube una imagen QR (Yape, Plin) desde el panel.
 * Al cobrar, el mesero ve el QR correspondiente para que el cliente escanee.
 *
 * Solo aplica a métodos digitales: yape, plin, transferencia.
 * Un registro por método — se actualiza si el admin sube uno nuevo.
 */
@Table({
  tableName: 'config_qr',
  timestamps: true,
  indexes: [
    {
      // Unicidad por método manejada como índice separado
      // (no inline en el ENUM para evitar error de sintaxis en PostgreSQL)
      unique: true,
      fields: ['metodo'],
      name: 'uq_config_qr_metodo',
    },
  ],
})
export class ConfigQR extends Model {

  @Column({
    type: DataType.ENUM(...Object.values(MetodoPago)),
    allowNull: false,
    // unique: true ← NO usar aquí, causa error en ALTER TABLE con ENUM en PostgreSQL
  })
  metodo!: MetodoPago;

  @Column({ type: DataType.STRING(500), allowNull: false })
  imagenUrl!: string;          // URL de Cloudinary

  @Column({ type: DataType.STRING(500), allowNull: true })
  imagenPublicId!: string | null; // para poder reemplazar en Cloudinary

  @Column({ type: DataType.STRING(100), allowNull: true })
  titular!: string | null;     // ej: "Don Camote SAC"

  @Column({ type: DataType.STRING(20), allowNull: true })
  numero!: string | null;      // número de celular Yape/Plin

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  activo!: boolean;
}