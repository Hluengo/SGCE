/**
 * Tipos inferidos de la base de datos Supabase
 * Estos tipos mapean directamente a las tablas de la base de datos
 */

import { GravedadFalta, EtapaProceso } from '@/types';

// ============================================================================
// TABLA: estudiantes
// ============================================================================
export interface DbEstudiante {
  id: string;
  nombre_completo: string;
  curso: string | null;
  rut?: string;
  fecha_nacimiento?: string;
}

export interface EstudianteRow {
  id: string;
  nombre_completo: string;
  curso: string | null;
}

// ============================================================================
// TABLA: expedientes
// ============================================================================
export interface DbExpediente {
  id: string;
  folio: string;
  estudiante_id: string;
  estudiante_b_id?: string | null;
  tipo_falta: 'leve' | 'relevante' | 'grave' | 'expulsion';
  estado_legal: string;
  etapa_proceso: string;
  fecha_inicio: string;
  plazo_fatal: string;
  creado_por: string;
  acciones_previas: boolean;
  es_proceso_expulsion: boolean;
  descripcion_hechos?: string;
  fecha_incidente?: string;
  hora_incidente?: string;
  lugar_incidente?: string;
  interaction_type?: string | null;
  additional_data?: Record<string, unknown> | null;
  updated_at?: string;
}

// Tipo flexible para resultados de consulta Supabase (con campos opcionales)
export interface ExpedienteQueryRow {
  id: string;
  folio?: string;
  tipo_falta?: string | null;
  estado_legal?: string | null;
  etapa_proceso?: string | null;
  fecha_inicio?: string | null;
  plazo_fatal?: string | null;
  creado_por?: string | null;
  interaction_type?: string | null;
  additional_data?: Record<string, unknown> | null;
  estudiantes?: Pick<DbEstudiante, 'id' | 'nombre_completo' | 'curso'> | null | Pick<DbEstudiante, 'id' | 'nombre_completo' | 'curso'>[];
  estudiante_a?: Pick<DbEstudiante, 'id' | 'nombre_completo' | 'curso'> | null | Pick<DbEstudiante, 'id' | 'nombre_completo' | 'curso'>[];
  estudiante_b?: Pick<DbEstudiante, 'id' | 'nombre_completo' | 'curso'> | null | Pick<DbEstudiante, 'id' | 'nombre_completo' | 'curso'>[];
}

// ============================================================================
// TABLA: hitos_expediente
// ============================================================================
export interface DbHitoExpediente {
  id: string;
  expediente_id: string;
  titulo: string;
  descripcion: string | null;
  fecha_cumplimiento: string | null;
  completado: boolean;
  requiere_evidencia: boolean;
  evidencia_url?: string | null;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// TABLA: evidencias
// ============================================================================
export interface DbEvidencia {
  id: string;
  expediente_id: string;
  url_storage: string | null;
  tipo_archivo: string;
  nombre: string;
  tipo: 'PDF' | 'IMG' | 'VIDEO' | 'AUDIO' | 'DOC' | 'OTRO';
  fecha: string;
  autor: string;
  fuente: 'ESCUELA' | 'APODERADO' | 'NNA' | 'OTRO';
  creado_por: string;
  created_at: string;
  updated_at?: string;
}

// Tipo flexible para resultados de consulta Supabase (evidencias)
export interface EvidenciaQueryRow {
  id: string;
  nombre?: string;
  tipo?: string;
  fecha?: string;
  url_storage?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

// ============================================================================
// Helper para mapear tipos de base de datos a tipos de aplicación
// ============================================================================

/**
 * Mapea el tipo de falta de la base de datos a GravedadFalta
 */
export const mapDbTipoFaltaToGravedad = (
  tipo: string | null | undefined
): GravedadFalta => {
  switch ((tipo ?? '').toLowerCase()) {
    case 'leve':
      return 'LEVE';
    case 'relevante':
      return 'RELEVANTE';
    case 'grave':
      return 'GRAVE';
    case 'expulsion':
      return 'GRAVISIMA_EXPULSION';
    default:
      return 'RELEVANTE';
  }
};

/**
 * Mapea el estado de la base de datos a EtapaProceso
 */
export const mapDbEstadoToEtapa = (
  estado: string | null | undefined
): EtapaProceso => {
  const normalized = (estado ?? '').toLowerCase();
  switch (normalized) {
    case 'inicio':
    case 'apertura':
      return 'INICIO';
    case 'notificado':
      return 'NOTIFICADO';
    case 'descargos':
      return 'DESCARGOS';
    case 'investigacion':
      return 'INVESTIGACION';
    case 'resolucion_pendiente':
    case 'resolucion':
      return 'RESOLUCION_PENDIENTE';
    case 'reconsideracion':
      return 'RECONSIDERACION';
    case 'cerrado_sancion':
      return 'CERRADO_SANCION';
    case 'cerrado_gcc':
      return 'CERRADO_GCC';
    case 'cerrado':
      return 'CERRADO_SANCION';
    default:
      return 'INVESTIGACION';
  }
};
