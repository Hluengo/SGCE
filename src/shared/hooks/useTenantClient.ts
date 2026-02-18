/**
 * useTenantClient - Hook para operaciones con filtro de tenant automático
 * 
 * Proporciona un cliente de Supabase que filtra automáticamente por
 * el establecimiento actual, garantizando el aislamiento de datos.
 */

import { useMemo } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';

/**
 * Tablas que siempre requieren filtro de tenant
 */
const TENANT_TABLES = new Set([
  'estudiantes',
  'expedientes', 
  'evidencias',
  'bitacora_psicosocial',
  'bitacora_salida',
  'medidas_apoyo',
  'incidentes',
  'logs_auditoria',
  'cursos_inspector',
  'derivaciones_externas',
  'reportes_patio',
  'mediaciones_gcc',
  'compromisos_mediacion',
  'mediaciones_gcc_v2',
  'participantes_gcc_v2',
  'hitos_gcc_v2',
  'actas_gcc_v2',
  'compromisos_gcc_v2',
  'carpetas_documentales',
  'documentos_institucionales'
]);

/**
 * Hook principal para obtener un cliente con filtro de tenant
 * 
 * @example
 * ```tsx
 * const { client, tenantId } = useTenantClient();
 * 
 * // SELECT automático con filtro
 * const { data } = await client.from('expedientes').select('*');
 * 
 * // INSERT automático añade establecimiento_id
 * await client.from('estudiantes').insert({ nombre: 'Juan' });
 * ```
 */
export function useTenantClient() {
  const { tenantId, isLoading, establecimiento } = useTenant();

  const client = useMemo(() => {
    if (!tenantId) {
      return null;
    }

    // Usar cliente base (ya validado en safeSupabase)
    const baseClient = supabase;
    if (!baseClient) {
      return null;
    }

    // Crear un wrapper que añade el filtro automáticamente
    const tenantClient = {
      from: (table: string) => {
        const query = baseClient.from(table);

        if (TENANT_TABLES.has(table)) {
          const originalSelect = query.select.bind(query);
          (query as {
            select: (...args: unknown[]) => ReturnType<typeof query.select>;
          }).select = (...args: unknown[]) =>
            (originalSelect(...(args as Parameters<typeof originalSelect>)) as ReturnType<typeof query.select>)
              .eq('establecimiento_id', tenantId);
        }

        return query;
      },

      // Método especial para inserts que añade automaticamente el tenant
      insert: async (table: string, data: unknown) => {
        if (!TENANT_TABLES.has(table)) {
          return baseClient.from(table).insert(data);
        }

        const dataWithTenant = Array.isArray(data)
          ? data.map((item) => ({ ...(item as Record<string, unknown>), establecimiento_id: tenantId }))
          : { ...(data as Record<string, unknown>), establecimiento_id: tenantId };

        return baseClient.from(table).insert(dataWithTenant);
      },

      // Método especial para updates con filtro de tenant
      update: (table: string, data: Record<string, unknown>) => {
        if (!TENANT_TABLES.has(table)) {
          return baseClient.from(table).update(data);
        }
        return baseClient.from(table).update(data).eq('establecimiento_id', tenantId);
      },

      // Método especial para deletes con filtro de tenant
      delete: (table: string) => {
        if (!TENANT_TABLES.has(table)) {
          return baseClient.from(table).delete();
        }
        return baseClient.from(table).delete().eq('establecimiento_id', tenantId);
      },

      // Acceso directo al cliente base
      base: baseClient,

      // Tenant info
      tenantId,
      establecimiento
    };

    return tenantClient;
  }, [tenantId, establecimiento]);

  return {
    client,
    tenantId,
    isLoading,
    establecimiento
  };
}

/**
 * Hook para verificar acceso a un recurso específico
 * 
 * @example
 * ```tsx
 * const { hasAccess, isLoading } = useTenantAccess('expedientes', expedienteId);
 * ```
 */
export function useTenantAccess(table: string, recordId: string) {
  const { tenantId, isLoading: tenantLoading } = useTenant();

  const checkAccess = async (): Promise<boolean> => {
    if (!supabase || !tenantId || !TENANT_TABLES.has(table)) {
      return true; // Tabla sin tenant o sin configuración
    }

    const { data, error } = await supabase
      .from(table)
      .select('establecimiento_id')
      .eq('id', recordId)
      .single();

    if (error || !data) return false;
    return data.establecimiento_id === tenantId;
  };

  return {
    checkAccess,
    isLoading: tenantLoading
  };
}

/**
 * Hook para obtener datos con filtro de tenant
 * Útil para queries simples
 * 
 * @example
 * ```tsx
 * const { data, loading } = useTenantQuery('expedientes', {
 *   select: 'id,folio,estado_legal',
 *   filter: { tipo_falta: 'grave' },
 *   order: { column: 'fecha_inicio', ascending: false }
 * });
 * ```
 */
export function useTenantQuery<T>(
  table: string,
  options?: {
    select?: string;
      filter?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
) {
  const { tenantId, isLoading } = useTenant();

  const query = async (): Promise<T[] | null> => {
    if (!supabase || !tenantId) {
      return null;
    }

    let queryBuilder = supabase
      .from(table)
      .select(options?.select || '*');

    // Añadir filtro de tenant si corresponde
    if (TENANT_TABLES.has(table)) {
      queryBuilder = queryBuilder.eq('establecimiento_id', tenantId);
    }

    // Aplicar filtros adicionales
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }

    // Aplicar ordenamiento
    if (options?.order) {
      queryBuilder = queryBuilder.order(options.order.column, {
        ascending: options.order.ascending ?? true
      });
    }

    // Aplicar límite
    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error(`Error fetching ${table}:`, error);
      return null;
    }

    return data as T[];
  };

  return {
    query,
    isLoading
  };
}

/**
 * Hook para cambiar de tenant manualmente
 * Útil para admins que necesitan acceder a múltiples establecimientos
 * 
 * @example
 * ```tsx
 * const { switchTenant, currentTenant } = useTenantSwitcher();
 * 
 * <button onClick={() => switchTenant(otroEstablecimientoId)}>
 *   Cambiar a otro colegio
 * </button>
 * ```
 */
export function useTenantSwitcher() {
  const { tenantId, setTenantId, establecimientosDisponibles } = useTenant();

  const switchTenant = (nuevoTenantId: string | null) => {
    setTenantId(nuevoTenantId);
  };

  return {
    currentTenantId: tenantId,
    switchTenant,
    establecimientosDisponibles,
    isMultiTenant: establecimientosDisponibles.length > 1
  };
}

export default useTenantClient;
