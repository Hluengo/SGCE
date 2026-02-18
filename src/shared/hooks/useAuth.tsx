import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabaseClient';
import { isUuid } from '@/shared/utils/expedienteRef';

export type RolUsuario =
  | 'SUPERADMIN'
  | 'SOSTENEDOR'
  | 'DIRECTOR'
  | 'INSPECTOR_GENERAL'
  | 'CONVIVENCIA_ESCOLAR'
  | 'PSICOLOGO'
  | 'PSICOPEDAGOGO'
  | 'PROFESOR_JEFE'
  | 'ADMINISTRADOR'
  | 'SECRETARIA';

export type Permiso =
  | 'expedientes:crear'
  | 'expedientes:leer'
  | 'expedientes:editar'
  | 'expedientes:eliminar'
  | 'expedientes:archivar'
  | 'expedientes:asignar'
  | 'documentos:subir'
  | 'documentos:eliminar'
  | 'reportes:generar'
  | 'reportes:exportar'
  | 'usuarios:gestionar'
  | 'usuarios:roles:gestionar'
  | 'configuracion:editar'
  | 'configuracion:tenant:editar'
  | 'bitacora:ver'
  | 'bitacora:exportar'
  | 'tenants:gestionar'
  | 'dashboard:analitica:ver'
  | 'monitorizacion:ver'
  | 'mantenimiento:ejecutar'
  | 'backend:configurar'
  | 'system:manage';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  permisos: Permiso[];
  establecimientoId: string;
  tenantIds: string[];
  activo: boolean;
}

interface SessionMetadata {
  lastActivityAt: number;
  expiresAt: number | null;
  isNearExpiry: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPasswordRecovery: boolean;
  sessionMetadata: SessionMetadata;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  tienePermiso: (permiso: Permiso) => boolean;
  tieneAlgunPermiso: (permisos: Permiso[]) => boolean;
  tieneTodosLosPermisos: (permisos: Permiso[]) => boolean;
  puedeAccederExpediente: (expediente: { responsableId?: string; establecimientoId?: string }) => boolean;
  canAccessTenant: (tenantId: string | null | undefined) => boolean;
}

const DEMO_TENANT = '';
// Timeout de inactividad configurable desde variable de entorno (default: 8 horas)
const INACTIVITY_TIMEOUT_MS = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MS) || 1000 * 60 * 60 * 8;
const EXPIRY_WARNING_SECONDS = 1000;

const MATRIZ_PERMISOS: Record<RolUsuario, Permiso[]> = {
  SUPERADMIN: [
    'expedientes:crear', 'expedientes:leer', 'expedientes:editar', 'expedientes:eliminar', 'expedientes:archivar', 'expedientes:asignar',
    'documentos:subir', 'documentos:eliminar',
    'reportes:generar', 'reportes:exportar',
    'usuarios:gestionar', 'usuarios:roles:gestionar',
    'configuracion:editar', 'configuracion:tenant:editar',
    'bitacora:ver', 'bitacora:exportar',
    'tenants:gestionar', 'dashboard:analitica:ver', 'monitorizacion:ver', 'mantenimiento:ejecutar', 'backend:configurar',
    'system:manage',
  ],
  SOSTENEDOR: [
    'expedientes:leer', 'reportes:generar', 'reportes:exportar',
    'usuarios:gestionar', 'usuarios:roles:gestionar',
    'configuracion:editar', 'configuracion:tenant:editar',
    'bitacora:ver', 'bitacora:exportar',
    'tenants:gestionar', 'dashboard:analitica:ver', 'monitorizacion:ver', 'mantenimiento:ejecutar', 'backend:configurar',
    'system:manage',
  ],
  DIRECTOR: [
    'expedientes:crear', 'expedientes:leer', 'expedientes:editar', 'expedientes:archivar', 'expedientes:asignar',
    'documentos:subir', 'documentos:eliminar',
    'reportes:generar', 'reportes:exportar',
    'usuarios:gestionar', 'configuracion:editar',
    'bitacora:ver', 'bitacora:exportar',
    'dashboard:analitica:ver', 'monitorizacion:ver',
  ],
  INSPECTOR_GENERAL: [
    'expedientes:crear', 'expedientes:leer', 'expedientes:editar', 'expedientes:archivar', 'expedientes:asignar',
    'documentos:subir', 'documentos:eliminar',
    'reportes:generar', 'reportes:exportar',
    'bitacora:ver', 'bitacora:exportar',
    'dashboard:analitica:ver',
  ],
  CONVIVENCIA_ESCOLAR: [
    'expedientes:crear', 'expedientes:leer', 'expedientes:editar', 'expedientes:archivar', 'expedientes:asignar',
    'documentos:subir', 'documentos:eliminar',
    'reportes:generar', 'reportes:exportar',
    'bitacora:ver', 'bitacora:exportar',
  ],
  PSICOLOGO: [
    'expedientes:leer', 'documentos:subir', 'reportes:generar', 'bitacora:ver',
  ],
  PSICOPEDAGOGO: [
    'expedientes:leer', 'documentos:subir', 'reportes:generar', 'bitacora:ver',
  ],
  PROFESOR_JEFE: [
    'expedientes:leer', 'documentos:subir', 'reportes:generar',
  ],
  ADMINISTRADOR: [
    'expedientes:crear', 'expedientes:leer', 'expedientes:editar', 'expedientes:eliminar', 'expedientes:archivar', 'expedientes:asignar',
    'documentos:subir', 'documentos:eliminar',
    'reportes:generar', 'reportes:exportar',
    'usuarios:gestionar', 'configuracion:editar',
    'bitacora:ver', 'bitacora:exportar',
    'dashboard:analitica:ver',
  ],
  SECRETARIA: [
    'expedientes:crear', 'expedientes:leer', 'documentos:subir', 'reportes:generar',
  ],
};

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeRole(rawRole: string | null | undefined): RolUsuario {
  const role = (rawRole ?? '').trim().toUpperCase();

  switch (role) {
    case 'SUPERADMIN':
    case 'SOSTENEDOR':
    case 'DIRECTOR':
    case 'INSPECTOR_GENERAL':
    case 'CONVIVENCIA_ESCOLAR':
    case 'PSICOLOGO':
    case 'PSICOPEDAGOGO':
    case 'PROFESOR_JEFE':
    case 'ADMINISTRADOR':
    case 'SECRETARIA':
      return role;
    case 'ADMIN':
      return 'ADMINISTRADOR';
    default:
      return 'CONVIVENCIA_ESCOLAR';
  }
}

function parsePermisos(raw: unknown, role: RolUsuario): Permiso[] {
  if (Array.isArray(raw)) {
    return raw
      .map(item => String(item).trim())
      .filter(Boolean)
      .filter((item): item is Permiso => item in PERMISSION_SET);
  }
  return MATRIZ_PERMISOS[role];
}

const PERMISSION_SET: Record<Permiso, true> = Object.keys(MATRIZ_PERMISOS)
  .flatMap((key) => MATRIZ_PERMISOS[key as RolUsuario])
  .reduce((acc, permission) => {
    acc[permission] = true;
    return acc;
  }, {} as Record<Permiso, true>);

function createDemoUsuario(user: User): Usuario {
  return {
    id: user.id,
    email: user.email ?? 'demo@gestionconvivencia.cl',
    nombre: 'Usuario',
    apellido: 'Demo',
    rol: 'CONVIVENCIA_ESCOLAR',
    permisos: MATRIZ_PERMISOS.CONVIVENCIA_ESCOLAR,
    establecimientoId: DEMO_TENANT,
    tenantIds: DEMO_TENANT ? [DEMO_TENANT] : [],
    activo: true,
  };
}

function getInitialSessionMetadata(): SessionMetadata {
  return {
    lastActivityAt: Date.now(),
    expiresAt: null,
    isNearExpiry: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata>(getInitialSessionMetadata());

  const syncSessionMetadata = (nextSession: Session | null) => {
    const expiresAt = nextSession?.expires_at ? nextSession.expires_at * 1000 : null;
    const now = Date.now();

    setSessionMetadata({
      lastActivityAt: now,
      expiresAt,
      isNearExpiry: expiresAt !== null ? expiresAt - now < EXPIRY_WARNING_SECONDS * 1000 : false,
    });
  };

  const loadProfile = async (targetSession: Session | null) => {
    if (!targetSession?.user) {
      setUsuario(null);
      return;
    }

    if (!supabase) {
      setUsuario(createDemoUsuario(targetSession.user));
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', targetSession.user.id)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Perfil no disponible, usando fallback:', error.message);
      }

      const role = normalizeRole(
        profile?.rol as string | null | undefined
          ?? (targetSession.user.app_metadata?.role as string | undefined)
          ?? (targetSession.user.user_metadata?.role as string | undefined)
      );

      const tenantFromProfile = String((profile?.establecimiento_id as string | undefined) ?? '').trim();
      const tenantFromMetadata = String((targetSession.user.user_metadata?.establecimiento_id as string | undefined) ?? '').trim();
      const tenantFromProfileSafe = isUuid(tenantFromProfile) ? tenantFromProfile : '';
      const tenantFromMetadataSafe = isUuid(tenantFromMetadata) ? tenantFromMetadata : '';
      const establecimientoId = tenantFromProfileSafe || tenantFromMetadataSafe || DEMO_TENANT;

      const explicitTenantIds = Array.isArray(profile?.tenant_ids)
        ? (profile?.tenant_ids as unknown[]).map(String).filter((id) => isUuid(id))
        : [];

      const tenantIds = Array.from(new Set([establecimientoId, ...explicitTenantIds]));
      const permisos = parsePermisos(profile?.permisos, role);
      const nombre = String(profile?.nombre ?? targetSession.user.user_metadata?.nombre ?? 'Usuario');
      const apellido = String(profile?.apellido ?? targetSession.user.user_metadata?.apellido ?? '');
      const activo = profile?.activo === false ? false : true;

      setUsuario({
        id: targetSession.user.id,
        email: targetSession.user.email ?? '',
        nombre,
        apellido,
        rol: role,
        permisos,
        establecimientoId,
        tenantIds,
        activo,
      });
    } catch (error) {
      console.error('[Auth] Error cargando perfil:', error);
      setUsuario(createDemoUsuario(targetSession.user));
    }
  };

  const refreshProfile = async () => {
    await loadProfile(session);
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    const authClient = supabase;

    let isMounted = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await authClient.auth.getSession();
        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        // Only update if session has changed or not yet set
        if (data.session?.user?.id !== session?.user?.id) {
          setSession(data.session);
          await loadProfile(data.session);
        } else if (!usuario && data.session) {
          // If session is same but no user profile, try loading profile
          await loadProfile(data.session);
        }
        syncSessionMetadata(data.session);
      } catch (error) {
        console.error('[Auth] Error inicializando sesion:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    const { data: authSubscription } = authClient.auth.onAuthStateChange((event, nextSession) => {
      // Avoid redundant updates if session hasn't meaningfully changed
      if (nextSession?.access_token === session?.access_token && nextSession?.expires_at === session?.expires_at) {
        return; // Skip if token is identical
      }
      
      setSession(nextSession);
      syncSessionMetadata(nextSession);
      setIsPasswordRecovery(event === 'PASSWORD_RECOVERY');
      
      // Debounce profile loading or skip if session is null
      if (nextSession?.user?.id !== session?.user?.id) {
        void loadProfile(nextSession);
      }
      
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    const authClient = supabase;

    const trackActivity = () => {
      setSessionMetadata(prev => ({ ...prev, lastActivityAt: Date.now() }));
    };

    const events = ['click', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, trackActivity, { passive: true }));

    const interval = window.setInterval(() => {
      setSessionMetadata(prev => {
        const now = Date.now();
        const isNearExpiry = prev.expiresAt !== null ? prev.expiresAt - now < EXPIRY_WARNING_SECONDS * 1000 : false;
        const isInactive = now - prev.lastActivityAt > INACTIVITY_TIMEOUT_MS;

        if (isInactive && authClient) {
          void authClient.auth.signOut();
        }

        return {
          ...prev,
          isNearExpiry,
        };
      });
    }, 30 * 1000);

    return () => {
      window.clearInterval(interval);
      events.forEach((eventName) => window.removeEventListener(eventName, trackActivity));
    };
  }, [session]);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!supabase) {
      return { error: new Error('Supabase no configurado') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: new Error(error.message) };
      }

      setSession(data.session);
      syncSessionMetadata(data.session);
      await loadProfile(data.session);
      return { error: null };
    } catch {
      return { error: new Error('Error al iniciar sesion') };
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    // Limpiar datos sensibles del almacenamiento local
    try {
      // Limpiar solo datos sensibles, preservando preferencias de usuario
      const keysToPreserve = ['theme', 'language'];
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && !keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      sessionStorage.clear();
    } catch (err) {
      // Error silencioso - no exponer información en consola en producción
      if (import.meta.env.DEV) {
        console.warn('Error limpiando almacenamiento:', err);
      }
    }

    setSession(null);
    setUsuario(null);
    setIsPasswordRecovery(false);
    setSessionMetadata(getInitialSessionMetadata());
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase) {
      throw new Error('Supabase no configurado');
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      throw new Error(error.message);
    }

    setIsPasswordRecovery(false);
  };

  const requestPasswordReset = async (email: string): Promise<{ error: Error | null }> => {
    if (!supabase) {
      return { error: new Error('Supabase no configurado') };
    }

    const redirectTo = `${window.location.origin}/auth?mode=reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  const permissionSet = useMemo(() => {
    return new Set(usuario?.permisos ?? []);
  }, [usuario]);

  const tienePermiso = (permiso: Permiso) => permissionSet.has(permiso);

  const tieneAlgunPermiso = (permisos: Permiso[]) => {
    for (const permiso of permisos) {
      if (permissionSet.has(permiso)) {
        return true;
      }
    }
    return false;
  };

  const tieneTodosLosPermisos = (permisos: Permiso[]) => permisos.every(permiso => permissionSet.has(permiso));

  const canAccessTenant = (tenantId: string | null | undefined) => {
    if (!usuario || !tenantId) {
      return false;
    }

    if (usuario.rol === 'SUPERADMIN' || usuario.rol === 'SOSTENEDOR' || permissionSet.has('tenants:gestionar')) {
      return true;
    }

    return usuario.tenantIds.includes(tenantId) || usuario.establecimientoId === tenantId;
  };

  const puedeAccederExpediente = (expediente: { responsableId?: string; establecimientoId?: string }) => {
    if (!usuario) {
      return false;
    }

    if (tienePermiso('system:manage') || tienePermiso('expedientes:editar')) {
      return true;
    }

    if (expediente.responsableId && expediente.responsableId === usuario.id) {
      return true;
    }

    return canAccessTenant(expediente.establecimientoId);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        usuario,
        isLoading,
        isAuthenticated: Boolean(session && usuario?.activo !== false),
        isPasswordRecovery,
        sessionMetadata,
        signIn,
        signOut,
        updatePassword,
        requestPasswordReset,
        refreshProfile,
        tienePermiso,
        tieneAlgunPermiso,
        tieneTodosLosPermisos,
        puedeAccederExpediente,
        canAccessTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

export function tieneRol(roles: RolUsuario[]): (usuario: Usuario | null) => boolean {
  return (candidate: Usuario | null) => (candidate ? roles.includes(candidate.rol) : false);
}

export function esAdministrador(usuario: Usuario | null): boolean {
  return usuario ? ['SUPERADMIN', 'SOSTENEDOR', 'ADMINISTRADOR', 'DIRECTOR', 'INSPECTOR_GENERAL'].includes(usuario.rol) : false;
}

export function esEquipoConvivencia(usuario: Usuario | null): boolean {
  return usuario ? ['CONVIVENCIA_ESCOLAR', 'INSPECTOR_GENERAL', 'DIRECTOR', 'SUPERADMIN', 'SOSTENEDOR'].includes(usuario.rol) : false;
}

export default useAuth;
