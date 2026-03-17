import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { User } from './User';

/**
 * Acciones auditables del sistema.
 * Se extiende conforme se agreguen más módulos.
 */
export enum AuditAccion {
  // Mesas
  MESA_CREADA      = 'MESA_CREADA',
  MESA_EDITADA     = 'MESA_EDITADA',
  MESA_DESACTIVADA = 'MESA_DESACTIVADA',
  MESA_REACTIVADA  = 'MESA_REACTIVADA',
  MESA_ESTADO      = 'MESA_ESTADO',

  // Usuarios (para cuando llegues a ese módulo)
  USUARIO_CREADO   = 'USUARIO_CREADO',
  USUARIO_EDITADO  = 'USUARIO_EDITADO',
  USUARIO_ELIMINADO = 'USUARIO_ELIMINADO',

  // Productos
  PRODUCTO_CREADO   = 'PRODUCTO_CREADO',
  PRODUCTO_EDITADO  = 'PRODUCTO_EDITADO',
  PRODUCTO_ELIMINADO = 'PRODUCTO_ELIMINADO',

  // Órdenes
  ORDEN_CREADA    = 'ORDEN_CREADA',
  ORDEN_ENVIADA   = 'ORDEN_ENVIADA',
  ORDEN_COBRADA   = 'ORDEN_COBRADA',
  ORDEN_CANCELADA = 'ORDEN_CANCELADA',
}

/**
 * Registro inmutable de cada acción relevante en el sistema.
 * Nunca se edita ni se elimina — solo se inserta.
 *
 * Campos:
 *  - accion:    qué pasó (enum AuditAccion)
 *  - entidad:   nombre de la tabla afectada (ej: 'mesas')
 *  - entidadId: id del registro afectado
 *  - userId:    quién lo hizo (null si fue el sistema)
 *  - antes:     snapshot JSON del registro ANTES del cambio (null en creaciones)
 *  - despues:   snapshot JSON del registro DESPUÉS del cambio (null en eliminaciones)
 *  - meta:      datos extra opcionales (ej: ip, motivo, contexto)
 */
@Table({
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false, // los logs solo tienen createdAt — son inmutables
})
export class AuditLog extends Model {

  @Column({
    type: DataType.STRING(60),
    allowNull: false,
  })
  accion!: string; // valor de AuditAccion

  @Column({
    type: DataType.STRING(60),
    allowNull: false,
  })
  entidad!: string; // nombre de la tabla: 'mesas', 'usuarios', etc.

  @Column({
    type: DataType.INTEGER,
    allowNull: true, // null cuando la acción no es sobre un registro específico
  })
  entidadId!: number | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true, // null = acción del sistema
  })
  userId!: number | null;

  @Column({
    type: DataType.JSON,
    allowNull: true, // null en creaciones
  })
  antes!: object | null;

  @Column({
    type: DataType.JSON,
    allowNull: true, // null en eliminaciones lógicas sin snapshot
  })
  despues!: object | null;

  @Column({
    type: DataType.JSON,
    allowNull: true, // info extra: { ip, motivo, ... }
  })
  meta!: object | null;

  // ─── Relaciones ───────────────────────────────────────

  @BelongsTo(() => User)
  usuario!: User;
}