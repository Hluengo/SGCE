/**
 * Tenant-aware Supabase Client
 * 
 * Este cliente automáticamente añade el filtro de tenant (establecimiento_id)
 * a todas las consultas que lo requieran, garantizando el aislamiento de datos.
 * 
 * CARACTERÍSTICAS:
 * - Filtro automático por establecimiento_id en tablas relevantes
 * - Soporte para múltiples estrategias de resolución de tenant
 * - Compatible con el cliente estándar de Supabase
 * - Tipado completo para TypeScript
 */

import { supabase } from './supabaseClient';

/**
 * Tablas que requieren filtro de tenant obligatorio
 * Estas tablas tienen establecimiento_id y deben filtrarse siempre
 */
const TABLES_REQUIRING_TENANT_FILTER = [
  'estudiantes',
  'expedientes',
  'evidencias',
  'bitacora_psicosocial',
  'medidas_apoyo',
  'incidentes',
  'logs_auditoria',
  'cursos_inspector',
  'hitos_expediente',
  'derivaciones_externas',
  'bitacora_salida',
  'reportes_patio',
  'mediaciones_gcc',
  'compromisos_mediacion',
  'carpetas_documentales',
  'documentos_institucionales'
];

/**
 * Tablas que NO requieren filtro de tenant
 * (tablas globales o de configuración)
 */
const TABLES_EXCLUDED_FROM_FILTER = [
  'establecimientos',
  'feriados_chile',
  'auth.users',
  'auth.sessions'
];

/**
 * Verifica si una tabla requiere filtro de tenant
 */
export function requiresTenantFilter(tableName: string): boolean {
  const cleanTableName = tableName.replace(/^public\./, '').toLowerCase();
  
  // Verificar en lista de tablas que requieren filtro
  if (TABLES_REQUIRING_TENANT_FILTER.includes(cleanTableName)) {
    return true;
  }
  
  // Verificar si es una tabla de la lista excluida
  if (TABLES_EXCLUDED_FROM_FILTER.some(t => cleanTableName === t.toLowerCase())) {
    return false;
  }
  
  // Por defecto, asumir que requiere filtro
  return true;
}

/**
 * Opciones para el cliente de tenant
 */
export interface TenantClientOptions {
  /** ID del tenant (establecimiento_id) */
  tenantId: string | null;
  /** Si es true, añade header x-establishment-id a las peticiones */
  includeHeader?: boolean;
}

/**
 * Crea un cliente de Supabase con filtro de tenant automático
 * 
 * @param options - Opciones del cliente de tenant
 * @returns Cliente de Supabase con filtros aplicados
 */
export function createTenantClient(options: TenantClientOptions) {
  const { tenantId, includeHeader = true } = options;
  const baseClient = supabase;
  
  if (!baseClient) {
    console.warn('TenantClient: Supabase no está configurado, operando en modo mock');
    return null;
  }

  /**
   * Wrapper que añade automáticamente el filtro de tenant
   */
  const tenantClient = {
    /**
     * SELECT con filtro automático de tenant
     */
    from: (table: string) => {
      const baseQuery = baseClient.from(table);
      
      // Si la tabla requiere filtro y tenemos tenantId, añadir filtro
      if (requiresTenantFilter(table) && tenantId) {
        return baseQuery.select('*').eq('establecimiento_id', tenantId);
      }
      
      return baseQuery;
    },

    /**
     * INSERT con establecimiento_id automático
     */
    insert: async (table: string, data: unknown) => {
      const needsFilter = requiresTenantFilter(table) && !!tenantId;
      
      // Si es un array, procesar cada elemento
      if (Array.isArray(data)) {
        const dataWithTenant = data.map(item => ({
          ...(typeof item === 'object' && item !== null ? item : {}),
          ...(needsFilter ? { establecimiento_id: tenantId } : {})
        }));
        return baseClient.from(table).insert(dataWithTenant);
      }

      const baseData = typeof data === 'object' && data !== null ? data : {};
      const dataWithTenant = {
        ...baseData,
        ...(needsFilter ? { establecimiento_id: tenantId } : {})
      };
      return baseClient.from(table).insert(dataWithTenant);
    },

    /**
     * UPDATE con filtro de tenant y establecimiento_id
     */
    update: (table: string, data: Record<string, unknown>) => {
      if (requiresTenantFilter(table) && tenantId) {
        return baseClient.from(table).update(data).eq('establecimiento_id', tenantId);
      }
      return baseClient.from(table).update(data);
    },

    /**
     * DELETE con filtro de tenant
     */
    delete: (table: string) => {
      if (requiresTenantFilter(table) && tenantId) {
        return baseClient.from(table).delete().eq('establecimiento_id', tenantId);
      }
      return baseClient.from(table).delete();
    },

    /**
     * RPC con header de tenant
     */
    rpc: (fn: string, params?: Record<string, unknown>) => {
      if (includeHeader && tenantId) {
        return baseClient.rpc(fn, {
          ...(params ?? {}),
          p_establecimiento_id: tenantId
        });
      }
      return baseClient.rpc(fn, params);
    },

    // Exponer el cliente base para operaciones especiales
    base: baseClient
  };

  return tenantClient;
}

/**
 * Middleware para añadir header de tenant a requests
 * Útil para Edge Functions o APIs externas
 */
export function getTenantHeaders(tenantId: string | null): Record<string, string> {
  if (!tenantId) return {};
  
  return {
    'x-establishment-id': tenantId
  };
}

/**
 * Utilidad para verificar si una operación está permitida
 * basándose en el aislamiento de tenant
 */
export async function verifyTenantAccess(
  table: string,
  recordId: string,
  tenantId: string | null
): Promise<boolean> {
  if (!supabase || !tenantId) return false;

  const { data, error } = await supabase
    .from(table)
    .select('establecimiento_id')
    .eq('id', recordId)
    .single();

  if (error || !data) return false;
  
  return data.establecimiento_id === tenantId;
}

// Tipos para mejorar el autocompletado
export type TenantClient = ReturnType<typeof createTenantClient>;

/**
 * Sanitiza una respuesta de datos para asegurar que sólo pertenezcan al tenant actual
 */
export function sanitizeResponse<T extends { establecimiento_id?: string }>(data: T[], tenantId: string): T[] {
  return data.filter(item => item.establecimiento_id === tenantId);
}

/**
 * Registra intentos de acceso cruzado entre tenants en la tabla de auditoría
 */
export async function logCrossTenantAccess(userId: string, attemptedTenant: string, action: string) {
  if (!supabase) return;
  await supabase.from('logs_auditoria').insert([
    {
      user_id: userId,
      attempted_tenant: attemptedTenant,
      action,
      timestamp: new Date().toISOString(),
    }
  ]);
}
