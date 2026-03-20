import {
  Table, Column, Model, DataType,
  HasMany, BeforeCreate, BeforeUpdate,
} from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { Rol } from '../types/enums';
import { Orden } from './Orden';

/**
 * Modelo de usuario del sistema.
 *
 * Roles disponibles: admin, encargado, mesero, cocina.
 * Los usuarios no se eliminan físicamente — se desactivan con activo = false.
 * La contraseña nunca se expone: el hook la hashea antes de guardar
 * y toJSON() la elimina del objeto serializado.
 */
@Table({
  tableName: 'users',
  timestamps: true,
  paranoid:   false, // soft delete manual via activo = false
})
export class User extends Model {

  @Column({ type: DataType.STRING(100), allowNull: false })
  nombre!: string;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  username!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  passwordHash!: string;

  @Column({
    type: DataType.ENUM(...Object.values(Rol)),
    allowNull: false,
    defaultValue: Rol.MESERO,
  })
  rol!: Rol;

  @Column({ type: DataType.STRING(15), allowNull: true })
  telefono!: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  activo!: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  ultimoAcceso!: Date | null;

  // ─── Relaciones ───────────────────────────────────────

  @HasMany(() => Orden)
  ordenes!: Orden[];

  // ─── Hooks ────────────────────────────────────────────

  /**
   * Hashea la contraseña automáticamente antes de crear o actualizar.
   * Solo actúa si el campo passwordHash fue modificado en esta operación.
   */
  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User): Promise<void> {
    if (instance.changed('passwordHash')) {
      instance.passwordHash = await bcrypt.hash(instance.passwordHash, 10);
    }
  }

  // ─── Métodos de instancia ─────────────────────────────

  /** Compara una contraseña en texto plano con el hash almacenado. */
  async verificarPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  /**
   * Serializa el usuario sin exponer el hash de contraseña.
   * Se aplica automáticamente en JSON.stringify y res.json().
   */
  toJSON(): Omit<User, 'passwordHash'> {
    const values = super.toJSON() as Record<string, unknown>;
    delete values.passwordHash;
    return values as Omit<User, 'passwordHash'>;
  }
}