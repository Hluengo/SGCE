/**
 * TenantContext - Contexto de Multi-Tenancy para la aplicación
 * 
 * Maneja la resolución del tenant (establecimiento) desde:
 * 1. Subdominio (ej: mi-colegio.gestionconvivencia.cl)
 * 2. Header personalizado en API
 * 3. Perfil del usuario autenticado
 * 4. Fallback a demo para desarrollo
 */

import { createContext, useContext, useEffect, useReducer, useCallback, type ReactNode } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { isUuid } from '@/shared/utils/expedienteRef';
import { useAuth } from '@/shared/hooks/useAuth';

export interface Establecimiento {
  id: string;
  nombre: string;
  rbd?: string;
  activo?: boolean;
}

export interface TenantContextType {
  /** ID del establecimiento actual (tenant) */
  tenantId: string | null;
  /** Datos del establecimiento actual */
  establecimiento: Establecimiento | null;
  /** Indica si está cargando la resolución del tenant */
  isLoading: boolean;
  /** Error si falla la resolución del tenant */
  error: string | null;
  /** Función para cambiar manualmente de tenant (solo para admins) */
  setTenantId: (id: string | null) => void;
  /** Verifica si el usuario tiene acceso a un establecimiento específico */
  canAccessEstablecimiento: (establecimientoId: string) => boolean;
  /** Lista de establecimientos disponibles para el usuario */
  establecimientosDisponibles: Establecimiento[];
}

const TenantContext = createContext<TenantContextType | null>(null);

interface TenantState {
  tenantId: string | null;
  establecimiento: Establecimiento | null;
  establecimientosDisponibles: Establecimiento[];
  isLoading: boolean;
  error: string | null;
}

type TenantAction =
  | { type: 'START_RESOLUTION' }
  | {
      type: 'RESOLVE_SUCCESS';
      payload: {
        tenantId: string | null;
        establecimiento: Establecimiento | null;
        establecimientosDisponibles: Establecimiento[];
      };
    }
  | { type: 'RESOLVE_FAILURE'; payload: string }
  | {
      type: 'SET_TENANT_MANUAL';
      payload: {
        tenantId: string | null;
        establecimiento: Establecimiento | null;
        error: string | null;
      };
    };

const initialTenantState: TenantState = {
  tenantId: null,
  establecimiento: null,
  establecimientosDisponibles: [],
  isLoading: true,
  error: null,
};

function tenantReducer(state: TenantState, action: TenantAction): TenantState {
  switch (action.type) {
    case 'START_RESOLUTION':
      return { ...state, isLoading: true, error: null };
    case 'RESOLVE_SUCCESS':
      return {
        ...state,
        tenantId: action.payload.tenantId,
        establecimiento: action.payload.establecimiento,
        establecimientosDisponibles: action.payload.establecimientosDisponibles,
        isLoading: false,
        error: null,
      };
    case 'RESOLVE_FAILURE':
      return {
        ...state,
        tenantId: null,
        establecimiento: null,
        isLoading: false,
        error: action.payload,
      };
    case 'SET_TENANT_MANUAL':
      return {
        ...state,
        tenantId: action.payload.tenantId,
        establecimiento: action.payload.establecimiento,
        error: action.payload.error,
      };
    default:
      return state;
  }
}

/**
 * Obtiene el subdominio actual de la URL
 * Ej: "mi-colegio" de "mi-colegio.gestionconvivencia.cl"
 */
function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // En desarrollo local, no hay subdominio
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  
  // Extraer subdominio (todo antes del primer punto, excepto si es IP)
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

/**
 * Obtiene el tenant ID desde el sessionStorage o variable de entorno
 * Nota: Usamos sessionStorage para mayor seguridad - se limpia al cerrar el navegador
 */
function getStoredTenantId(): string | null {
  // Primero intentar desde sessionStorage (más seguro)
  const stored = sessionStorage.getItem('tenant_id');
  if (stored && isUuid(stored)) return stored;
  
  // Fallback a localStorage para compatibilidad con sesiones existentes
  const localStored = localStorage.getItem('tenant_id');
  if (localStored && isUuid(localStored)) {
    // Migrar a sessionStorage
    sessionStorage.setItem('tenant_id', localStored);
    localStorage.removeItem('tenant_id');
    return localStored;
  }
  
  // Desde variable de entorno (para desarrollo/demo)
  const envTenant = import.meta.env.VITE_DEFAULT_TENANT_ID;
  if (envTenant && isUuid(envTenant)) return envTenant;
  
  return null;
}

function normalizeRole(rawRole: string | null | undefined): string {
  const role = String(rawRole ?? '').trim().toLowerCase();
  if (role === 'administrador') return 'admin';
  if (role === 'superadmin') return 'superadmin';
  if (role === 'sostenedor') return 'sostenedor';
  return role;
}

function canSwitchTenantsByRole(role: string): boolean {
  return role === 'admin' || role === 'sostenedor' || role === 'superadmin';
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tenantReducer, initialTenantState);
  const { usuario, isLoading: isAuthLoading, session } = useAuth();

  // Función para cargar los datos del establecimiento
  const loadEstablecimiento = async (id: string): Promise<Establecimiento | null> => {
    if (!isUuid(id) || !supabase) return null;
    const { data, error: fetchError } = await supabase
      .from('establecimientos')
      .select('id, nombre, rbd, activo')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    return data as Establecimiento | null;
  };

  // Función para cargar todos los establecimientos disponibles (para admins)
  const loadEstablecimientos = async (): Promise<Establecimiento[]> => {
    if (!supabase) return [];
    const { data, error: fetchError } = await supabase
      .from('establecimientos')
      .select('id, nombre, rbd, activo')
      .order('nombre');
    if (fetchError) throw fetchError;
    return (data ?? []) as Establecimiento[];
  };

  const resolveTenant = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    dispatch({ type: 'START_RESOLUTION' });

    try {
      let nextTenantId: string | null = null;
      let nextEstablecimiento: Establecimiento | null = null;
      let nextDisponibles: Establecimiento[] = [];

      // 1. Intentar desde subdominio (prioridad más alta)
      const subdomain = getSubdomain();
      if (subdomain) {
        // Buscar establecimiento por subdominio (RBD como identificador)
        if (supabase) {
          const { data: estData } = await supabase
            .from('establecimientos')
            .select('id')
            .eq('rbd', subdomain.toUpperCase())
            .maybeSingle();

          if (estData) {
            nextTenantId = estData.id;
            nextEstablecimiento = await loadEstablecimiento(estData.id);
            dispatch({
              type: 'RESOLVE_SUCCESS',
              payload: {
                tenantId: nextTenantId,
                establecimiento: nextEstablecimiento,
                establecimientosDisponibles: nextDisponibles,
              },
            });
            return;
          }
        }
      }

      // 2. Priorizar contexto ya resuelto por AuthProvider (evita carrera de carga inicial)
      if (usuario) {
        const profileRole = normalizeRole(usuario.rol);
        const profileTenantId = isUuid(usuario.establecimientoId) ? usuario.establecimientoId : null;
        const profileTenantIds = Array.isArray(usuario.tenantIds)
          ? usuario.tenantIds.filter((id) => isUuid(id))
          : [];

        const isSuperAdmin = canSwitchTenantsByRole(profileRole);
        const availableTenants = isSuperAdmin ? await loadEstablecimientos() : [];
        nextDisponibles = availableTenants;

        const storedTenantId = getStoredTenantId();
        const canUseStoredTenant = !!storedTenantId && (
          isSuperAdmin ? true : storedTenantId === profileTenantId
        );

        const resolvedTenantId = canUseStoredTenant
          ? storedTenantId
          : (profileTenantId || (isSuperAdmin ? (profileTenantIds[0] ?? null) : null));

        if (!resolvedTenantId && isSuperAdmin && availableTenants.length > 0) {
          const firstEstablecimiento = availableTenants[0];
          nextTenantId = firstEstablecimiento.id;
          nextEstablecimiento = firstEstablecimiento;
          sessionStorage.setItem('tenant_id', firstEstablecimiento.id);
          localStorage.removeItem('tenant_id');
          dispatch({
            type: 'RESOLVE_SUCCESS',
            payload: {
              tenantId: nextTenantId,
              establecimiento: nextEstablecimiento,
              establecimientosDisponibles: nextDisponibles,
            },
          });
          return;
        }

        if (resolvedTenantId && isUuid(resolvedTenantId)) {
          nextTenantId = resolvedTenantId;
          sessionStorage.setItem('tenant_id', resolvedTenantId);
          localStorage.removeItem('tenant_id');
          nextEstablecimiento = await loadEstablecimiento(resolvedTenantId);
          dispatch({
            type: 'RESOLVE_SUCCESS',
            payload: {
              tenantId: nextTenantId,
              establecimiento: nextEstablecimiento,
              establecimientosDisponibles: nextDisponibles,
            },
          });
          return;
        }
      }

      // 2. Intentar desde sesión de usuario (perfil)
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Obtener establecimiento del perfil del usuario
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('establecimiento_id, rol, tenant_ids')
            .eq('id', user.id)
            .maybeSingle();

          const profileRole = normalizeRole(perfil?.rol);
          const profileTenantId = perfil?.establecimiento_id as string | null | undefined;
          const profileTenantIds = Array.isArray(perfil?.tenant_ids)
            ? (perfil?.tenant_ids as string[]).filter(Boolean)
            : [];

          // Si puede cambiar tenant, primero cargar la lista disponible.
          const isSuperAdmin = canSwitchTenantsByRole(profileRole);
          const availableTenants = isSuperAdmin ? await loadEstablecimientos() : [];
          nextDisponibles = availableTenants;

          const storedTenantId = getStoredTenantId();
          // Roles no administrativos deben quedar anclados a su establecimiento_id
          // para evitar desalineación entre UI tenant y contexto RLS del backend.
          const canUseStoredTenant = !!storedTenantId && (
            canSwitchTenantsByRole(profileRole)
              ? true
              : storedTenantId === profileTenantId
          );

          const resolvedTenantId = canUseStoredTenant
            ? storedTenantId
            : (profileTenantId || (canSwitchTenantsByRole(profileRole) ? (profileTenantIds[0] ?? null) : null));

          if (!resolvedTenantId && isSuperAdmin && availableTenants.length > 0) {
            const firstEstablecimiento = availableTenants[0];
            nextTenantId = firstEstablecimiento.id;
            nextEstablecimiento = firstEstablecimiento;
            sessionStorage.setItem('tenant_id', firstEstablecimiento.id);
            localStorage.removeItem('tenant_id');
            dispatch({
              type: 'RESOLVE_SUCCESS',
              payload: {
                tenantId: nextTenantId,
                establecimiento: nextEstablecimiento,
                establecimientosDisponibles: nextDisponibles,
              },
            });
            return;
          }

          if (resolvedTenantId && isUuid(resolvedTenantId)) {
            nextTenantId = resolvedTenantId;
            sessionStorage.setItem('tenant_id', resolvedTenantId);
            localStorage.removeItem('tenant_id');
            nextEstablecimiento = await loadEstablecimiento(resolvedTenantId);
            dispatch({
              type: 'RESOLVE_SUCCESS',
              payload: {
                tenantId: nextTenantId,
                establecimiento: nextEstablecimiento,
                establecimientosDisponibles: nextDisponibles,
              },
            });
            return;
          }
        }
      }

      // 3. Intentar desde localStorage
      const storedTenantId = getStoredTenantId();
      if (storedTenantId && isUuid(storedTenantId)) {
        nextTenantId = storedTenantId;
        sessionStorage.setItem('tenant_id', storedTenantId);
        localStorage.removeItem('tenant_id');
        nextEstablecimiento = await loadEstablecimiento(storedTenantId);
        dispatch({
          type: 'RESOLVE_SUCCESS',
          payload: {
            tenantId: nextTenantId,
            establecimiento: nextEstablecimiento,
            establecimientosDisponibles: nextDisponibles,
          },
        });
        return;
      }

      dispatch({ type: 'RESOLVE_FAILURE', payload: 'No se pudo resolver el establecimiento del usuario.' });

    } catch (err) {
      console.error('Error resolviendo tenant:', err);
      dispatch({ type: 'RESOLVE_FAILURE', payload: 'Error al resolver el establecimiento.' });
    }
  }, [isAuthLoading, usuario]);

  // Resolver el tenant al iniciar
  useEffect(() => {
    void resolveTenant();
    if (!supabase) return;

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event) => {
      void resolveTenant();
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [resolveTenant]);

  // Reintento explícito cuando cambia sesión/perfil en AuthProvider.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!session?.user && !usuario) return;
    void resolveTenant();
  }, [isAuthLoading, resolveTenant, session?.user?.id, usuario?.establecimientoId, usuario?.id, usuario?.rol]);

  // Función para cambiar manualmente de tenant
  const setTenantId = (id: string | null) => {
    if (id && isUuid(id)) {
      // Usar sessionStorage para mayor seguridad
      sessionStorage.setItem('tenant_id', id);
      void (async () => {
        try {
          const nextEstablecimiento = await loadEstablecimiento(id);
          dispatch({
            type: 'SET_TENANT_MANUAL',
            payload: {
              tenantId: id,
              establecimiento: nextEstablecimiento,
              error: nextEstablecimiento ? null : 'No se encontraron datos del tenant seleccionado.',
            },
          });
        } catch (err) {
          console.error('Error cargando establecimiento manual:', err);
          dispatch({
            type: 'SET_TENANT_MANUAL',
            payload: {
              tenantId: id,
              establecimiento: null,
              error: 'Error al cargar los datos del establecimiento',
            },
          });
        }
      })();
    } else {
      sessionStorage.removeItem('tenant_id');
      localStorage.removeItem('tenant_id');
      dispatch({
        type: 'SET_TENANT_MANUAL',
        payload: {
          tenantId: null,
          establecimiento: null,
          error: id ? 'Tenant inválido: se esperaba UUID.' : null,
        },
      });
    }
  };

  // Función para verificar acceso a establecimiento
  const canAccessEstablecimiento = (establecimientoId: string): boolean => {
    // Si es el establecimiento actual, tiene acceso
    if (state.tenantId === establecimientoId) return true;
    
    // Si es admin/sostenedor, puede acceder a cualquier establecimiento
    return state.establecimientosDisponibles.length > 0 && 
           state.establecimientosDisponibles.some(e => e.id === establecimientoId);
  };

  return (
    <TenantContext.Provider
      value={{
        tenantId: state.tenantId,
        establecimiento: state.establecimiento,
        isLoading: state.isLoading,
        error: state.error,
        setTenantId,
        canAccessEstablecimiento,
        establecimientosDisponibles: state.establecimientosDisponibles
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de tenant
 */
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe ser usado dentro de un TenantProvider');
  }
  return context;
}

export default TenantContext;
