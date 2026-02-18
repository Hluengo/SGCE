/**
 * TenantContext - Contexto de Multi-Tenancy para la aplicación
 * 
 * Maneja la resolución del tenant (establecimiento) desde:
 * 1. Subdominio (ej: mi-colegio.gestionconvivencia.cl)
 * 2. Header personalizado en API
 * 3. Perfil del usuario autenticado
 * 4. Fallback a demo para desarrollo
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { isUuid } from '@/shared/utils/expedienteRef';

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
  return String(rawRole ?? '').trim().toLowerCase();
}

function canSwitchTenantsByRole(role: string): boolean {
  return role === 'admin' || role === 'sostenedor' || role === 'superadmin';
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [establecimiento, setEstablecimiento] = useState<Establecimiento | null>(null);
  const [establecimientosDisponibles, setEstablecimientosDisponibles] = useState<Establecimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar los datos del establecimiento
  const loadEstablecimiento = async (id: string) => {
    try {
      if (!isUuid(id)) {
        setEstablecimiento(null);
        setError('Tenant inválido: el establecimiento debe ser UUID.');
        return;
      }
      if (!supabase) return;

      const { data, error: fetchError } = await supabase
        .from('establecimientos')
        .select('id, nombre, rbd, activo')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setEstablecimiento(data);
    } catch (err) {
      console.error('Error cargando establecimiento:', err);
      setError('Error al cargar los datos del establecimiento');
    }
  };

  // Función para cargar todos los establecimientos disponibles (para admins)
  const loadEstablecimientos = async (): Promise<Establecimiento[]> => {
    try {
      if (!supabase) return [];

      const { data, error: fetchError } = await supabase
        .from('establecimientos')
        .select('id, nombre, rbd, activo')
        .order('nombre');

      if (fetchError) throw fetchError;
      const establecimientos = data || [];
      setEstablecimientosDisponibles(establecimientos);
      return establecimientos;
    } catch (err) {
      console.error('Error cargando establecimientos:', err);
      return [];
    }
  };

  // Resolver el tenant al iniciar
  useEffect(() => {
    const resolveTenant = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Intentar desde subdominio (prioridad más alta)
        const subdomain = getSubdomain();
        if (subdomain) {
          // Buscar establecimiento por subdominio (RBD como identificador)
          if (supabase) {
            const { data: estData } = await supabase
              .from('establecimientos')
              .select('id')
              .eq('rbd', subdomain.toUpperCase())
              .single();
            
            if (estData) {
              setTenantIdState(estData.id);
              await loadEstablecimiento(estData.id);
              setIsLoading(false);
              return;
            }
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
              .single();

            const profileRole = normalizeRole(perfil?.rol);
            const profileTenantId = perfil?.establecimiento_id as string | null | undefined;
            const profileTenantIds = Array.isArray(perfil?.tenant_ids)
              ? (perfil?.tenant_ids as string[]).filter(Boolean)
              : [];

            // Si puede cambiar tenant, primero cargar la lista disponible.
            const isSuperAdmin = canSwitchTenantsByRole(profileRole);
            const availableTenants = isSuperAdmin ? await loadEstablecimientos() : [];

            const storedTenantId = getStoredTenantId();
            const canUseStoredTenant = !!storedTenantId && (
              canSwitchTenantsByRole(profileRole)
                ? true
                : storedTenantId === profileTenantId || profileTenantIds.includes(storedTenantId)
            );

            const resolvedTenantId = canUseStoredTenant
              ? storedTenantId
              : (profileTenantId || (profileTenantIds[0] ?? null));

            if (!resolvedTenantId && isSuperAdmin && availableTenants.length > 0) {
              const firstEstablecimiento = availableTenants[0];
              setTenantIdState(firstEstablecimiento.id);
              localStorage.setItem('tenant_id', firstEstablecimiento.id);
              setEstablecimiento(firstEstablecimiento);
              setIsLoading(false);
              return;
            }

            if (resolvedTenantId && isUuid(resolvedTenantId)) {
              setTenantIdState(resolvedTenantId);
              localStorage.setItem('tenant_id', resolvedTenantId);
              await loadEstablecimiento(resolvedTenantId);
              setIsLoading(false);
              return;
            }
          }
        }

        // 3. Intentar desde localStorage
        const storedTenantId = getStoredTenantId();
        if (storedTenantId && isUuid(storedTenantId)) {
          setTenantIdState(storedTenantId);
          localStorage.setItem('tenant_id', storedTenantId);
          await loadEstablecimiento(storedTenantId);
          setIsLoading(false);
          return;
        }

        setTenantIdState(null);
        setEstablecimiento(null);
        setError('No se pudo resolver el establecimiento del usuario.');
        
      } catch (err) {
        console.error('Error resolviendo tenant:', err);
        setTenantIdState(null);
        setEstablecimiento(null);
        setError('Error al resolver el establecimiento.');
      } finally {
        setIsLoading(false);
      }
    };

    resolveTenant();
  }, []);

  // Función para cambiar manualmente de tenant
  const setTenantId = (id: string | null) => {
    if (id && isUuid(id)) {
      setTenantIdState(id);
      // Usar sessionStorage para mayor seguridad
      sessionStorage.setItem('tenant_id', id);
      void loadEstablecimiento(id);
    } else {
      setTenantIdState(null);
      setEstablecimiento(null);
      localStorage.removeItem('tenant_id');
      if (id) setError('Tenant inválido: se esperaba UUID.');
    }
  };

  // Función para verificar acceso a establecimiento
  const canAccessEstablecimiento = (establecimientoId: string): boolean => {
    // Si es el establecimiento actual, tiene acceso
    if (tenantId === establecimientoId) return true;
    
    // Si es admin/sostenedor, puede acceder a cualquier establecimiento
    return establecimientosDisponibles.length > 0 && 
           establecimientosDisponibles.some(e => e.id === establecimientoId);
  };

  return (
    <TenantContext.Provider
      value={{
        tenantId,
        establecimiento,
        isLoading,
        error,
        setTenantId,
        canAccessEstablecimiento,
        establecimientosDisponibles
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
