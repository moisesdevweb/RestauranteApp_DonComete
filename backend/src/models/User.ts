import {
  Table, Column, Model, DataType,
  HasMany, BeforeCreate, BeforeUpdate
} from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { Rol } from '../types/enums';
import { Orden } from './Orden';

@Table({
  tableName: 'users',
  timestamps: true,           // crea createdAt y updatedAt automático
  paranoid: false,            // no borrado suave, desactivamos con activo=false
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
  // Hashea la contraseña antes de crear o actualizar
  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('passwordHash')) {
      instance.passwordHash = await bcrypt.hash(instance.passwordHash, 10);
    }
  }

  // Método para verificar contraseña al hacer login
  async verificarPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Método para devolver usuario sin la contraseña
  toJSON() {
    const values = super.toJSON() as any;
    delete values.passwordHash;
    return values;
  }
}