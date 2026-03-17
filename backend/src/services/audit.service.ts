import { AuditLog, AuditAccion } from '../models/AuditLog';

interface AuditParams {
  accion: AuditAccion;
  entidad: string;
  entidadId?: number | null;
  userId?: number | null;
  antes?: object | null;
  despues?: object | null;
  meta?: object | null;
}

/**
 * Registra una acción en el log de auditoría.
 * Nunca lanza excepción — un fallo en auditoría no debe romper la operación principal.
 */
export const audit = async (params: AuditParams): Promise<void> => {
  try {
    await AuditLog.create({
      accion:    params.accion,
      entidad:   params.entidad,
      entidadId: params.entidadId ?? null,
      userId:    params.userId    ?? null,
      antes:     params.antes     ?? null,
      despues:   params.despues   ?? null,
      meta:      params.meta      ?? null,
    });
  } catch (err) {
    // El log de auditoría nunca debe bloquear la operación principal
    console.error('[AuditLog] Error al registrar auditoría:', err);
  }
};