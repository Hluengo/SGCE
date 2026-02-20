import { useEffect, useMemo, useReducer } from 'react';
import type { RolUsuario } from '@/shared/hooks/useAuth';
import { supabase } from '@/shared/lib/supabaseClient';
import type { TenantMetrics } from '../components/SuperAdminLayoutPieces';
import type {
  FeatureFlag,
  GlobalConfigState,
  MaintenanceLog,
  RolePermissionFormState,
  SuperAdminAction,
  SuperAdminState,
  TenantRow,
  ProfileRow,
} from '../types';

type ProfileAccessPayload = RolePermissionFormState;

const defaultFlags: Omit<FeatureFlag, 'tenant_id'>[] = [
  { id: 'ff-dashboard-v2', feature_key: 'dashboard.v2', feature_label: 'Dashboard analitico avanzado', enabled: true },
  { id: 'ff-ai-legal', feature_key: 'asistente.legal', feature_label: 'Asistente legal', enabled: true },
  { id: 'ff-auditoria', feature_key: 'auditoria.extendida', feature_label: 'Auditoria extendida', enabled: true },
  { id: 'ff-parent-portal', feature_key: 'portal.apoderados', feature_label: 'Portal apoderados', enabled: false },
];

const initialGlobalConfig: GlobalConfigState = {
  enforceStrongPassword: true,
  requireMfaForAdmins: true,
  auditRetentionDays: 365,
  backendReadOnlyWindow: false,
};

const initialState: SuperAdminState = {
  loading: true,
  savingSettings: false,
  tenants: [],
  profiles: [],
  flags: [],
  maintenanceLogs: [],
  deletedProfilesCount: 0,
  deactivatedProfilesCount: 0,
  globalConfig: initialGlobalConfig,
  error: null,
};

function superAdminReducer(state: SuperAdminState, action: SuperAdminAction): SuperAdminState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, ...action.payload };
    case 'SET_GLOBAL_CONFIG':
      return { ...state, globalConfig: { ...state.globalConfig, ...action.payload } };
    case 'TOGGLE_FLAG_OPTIMISTIC':
      return {
        ...state,
        flags: state.flags.map((feature) =>
          feature.id === action.payload.featureId ? { ...feature, enabled: action.payload.enabled } : feature
        ),
      };
    case 'REVERT_FLAG':
      return {
        ...state,
        flags: state.flags.map((feature) =>
          feature.id === action.payload.featureId ? { ...feature, enabled: action.payload.enabled } : feature
        ),
      };
    case 'MAINT_PREPEND':
      return { ...state, maintenanceLogs: [action.payload, ...state.maintenanceLogs] };
    case 'MAINT_MARK_OK':
      return {
        ...state,
        maintenanceLogs: state.maintenanceLogs.map((log) =>
          log.id === action.payload ? { ...log, status: 'ok' } : log
        ),
      };
    case 'MAINT_REMOVE':
      return {
        ...state,
        maintenanceLogs: state.maintenanceLogs.filter((log) => log.id !== action.payload),
      };
    default:
      return state;
  }
}

const parseBooleanValue = (raw: unknown, fallback: boolean) => {
  if (typeof raw === 'boolean') return raw;
  if (raw && typeof raw === 'object' && 'enabled' in (raw as Record<string, unknown>)) {
    const value = (raw as Record<string, unknown>).enabled;
    return typeof value === 'boolean' ? value : fallback;
  }
  return fallback;
};

const parseNumberValue = (raw: unknown, fallback: number) => {
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object' && 'value' in (raw as Record<string, unknown>)) {
    const value = (raw as Record<string, unknown>).value;
    return typeof value === 'number' ? value : fallback;
  }
  return fallback;
};

export const useSuperAdminData = (
  usuario: { id?: string | null } | null,
  tenantId: string | null,
  dbRoleMap: Record<RolUsuario, string>,
) => {
  const [state, dispatch] = useReducer(superAdminReducer, initialState);

  const loadAdminData = async () => {
    dispatch({ type: 'PATCH', payload: { loading: true, error: null } });

    const mockTenants: TenantRow[] = [
      { id: 'demo-establecimiento', nombre: 'Colegio Demo', rbd: 'DEMO', activo: true },
    ];

    if (!supabase) {
      dispatch({
        type: 'PATCH',
        payload: {
          tenants: mockTenants,
          profiles: [{ id: '1', rol: 'SUPERADMIN', establecimiento_id: 'demo-establecimiento', activo: true }],
          flags: mockTenants.flatMap((tenant) => defaultFlags.map((flag) => ({ ...flag, tenant_id: tenant.id }))),
          loading: false,
        },
      });
      return;
    }

    try {
      const [tenantResult, profileResult, flagResult, settingsResult, logResult, deletedProfilesResult, deactivatedProfilesResult] = await Promise.all([
        supabase.from('establecimientos').select('id, nombre, rbd, activo, created_at').order('nombre'),
        supabase.from('perfiles').select('id, nombre, apellido, rol, permisos, establecimiento_id, activo, created_at').order('nombre', { ascending: true }),
        supabase.from('tenant_feature_flags').select('id, tenant_id, feature_key, feature_label, enabled'),
        supabase.from('platform_settings').select('setting_key, setting_value'),
        supabase
          .from('superadmin_audit_logs')
          .select('id, action, entity_type, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('superadmin_audit_logs').select('id', { count: 'exact', head: true }).eq('action', 'profile_delete'),
        supabase.from('superadmin_audit_logs').select('id', { count: 'exact', head: true }).eq('action', 'profile_deactivate'),
      ]);

      if (tenantResult.error) throw tenantResult.error;
      if (profileResult.error) throw profileResult.error;
      if (flagResult.error) throw flagResult.error;
      if (settingsResult.error) throw settingsResult.error;
      if (logResult.error) throw logResult.error;
      if (deletedProfilesResult.error) throw deletedProfilesResult.error;
      if (deactivatedProfilesResult.error) throw deactivatedProfilesResult.error;

      const dbTenants = (tenantResult.data as TenantRow[]) ?? [];
      const dbProfiles = (profileResult.data as ProfileRow[]) ?? [];
      const dbFlags = (flagResult.data as FeatureFlag[]) ?? [];

      const settingsMap = new Map((settingsResult.data ?? []).map((row) => [row.setting_key, row.setting_value]));
      const nextGlobalConfig: GlobalConfigState = {
        enforceStrongPassword: parseBooleanValue(settingsMap.get('security.enforce_strong_password'), true),
        requireMfaForAdmins: parseBooleanValue(settingsMap.get('security.require_mfa_for_admins'), true),
        auditRetentionDays: parseNumberValue(settingsMap.get('audit.retention_days'), 365),
        backendReadOnlyWindow: parseBooleanValue(settingsMap.get('backend.read_only_window'), false),
      };

      const nextLogs: MaintenanceLog[] = (
        ((logResult.data ?? []) as Array<{ id: string; action: string; entity_type?: string; created_at: string }>).map((log) => ({
          id: log.id,
          action: log.action,
          entity_type: log.entity_type,
          created_at: log.created_at,
          status: 'ok' as const,
        }))
      );

      dispatch({
        type: 'PATCH',
        payload: {
          tenants: dbTenants.length ? dbTenants : mockTenants,
          profiles: dbProfiles,
          flags: dbFlags,
          deletedProfilesCount: deletedProfilesResult.count ?? 0,
          deactivatedProfilesCount: deactivatedProfilesResult.count ?? 0,
          globalConfig: nextGlobalConfig,
          maintenanceLogs: nextLogs,
        },
      });
    } catch (loadError) {
      console.error('[SuperAdmin] Error cargando datos:', loadError);
      dispatch({
        type: 'PATCH',
        payload: {
          error: 'No se pudo cargar la configuracion real de superadmin.',
          tenants: mockTenants,
          profiles: [],
          flags: mockTenants.flatMap((tenant) => defaultFlags.map((flag) => ({ ...flag, tenant_id: tenant.id }))),
        },
      });
    } finally {
      dispatch({ type: 'PATCH', payload: { loading: false } });
    }
  };

  const trackAction = async (
    action: string,
    entityType: string,
    entityId?: string | null,
    targetTenantId?: string | null,
    payload?: Record<string, unknown>
  ) => {
    if (!supabase) return;

    await supabase.rpc('log_superadmin_action', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId ?? null,
      p_tenant_id: targetTenantId ?? null,
      p_payload: payload ?? {},
      p_user_agent: navigator.userAgent,
      p_ip_address: null,
    });
  };

  const persistFeatureToggle = async (feature: FeatureFlag, enabled: boolean) => {
    if (!supabase) return;

    const { error: upsertError } = await supabase.from('tenant_feature_flags').upsert(
      {
        id: feature.id,
        tenant_id: feature.tenant_id,
        feature_key: feature.feature_key,
        feature_label: feature.feature_label,
        enabled,
        updated_by: usuario?.id ?? null,
      },
      { onConflict: 'tenant_id,feature_key' }
    );

    if (upsertError) {
      throw upsertError;
    }

    await trackAction('feature_flag_toggle', 'tenant_feature_flags', feature.id, feature.tenant_id, {
      feature_key: feature.feature_key,
      enabled,
    });
  };

  const saveGlobalSettings = async () => {
    if (!supabase) return;

    dispatch({ type: 'PATCH', payload: { savingSettings: true, error: null } });

    try {
      const rows = [
        {
          setting_key: 'security.enforce_strong_password',
          setting_value: { enabled: state.globalConfig.enforceStrongPassword },
          updated_by: usuario?.id ?? null,
        },
        {
          setting_key: 'security.require_mfa_for_admins',
          setting_value: { enabled: state.globalConfig.requireMfaForAdmins },
          updated_by: usuario?.id ?? null,
        },
        {
          setting_key: 'audit.retention_days',
          setting_value: { value: state.globalConfig.auditRetentionDays },
          updated_by: usuario?.id ?? null,
        },
        {
          setting_key: 'backend.read_only_window',
          setting_value: { enabled: state.globalConfig.backendReadOnlyWindow },
          updated_by: usuario?.id ?? null,
        },
      ];

      const { error: upsertError } = await supabase.from('platform_settings').upsert(rows, { onConflict: 'setting_key' });
      if (upsertError) throw upsertError;

      await trackAction('platform_settings_update', 'platform_settings', null, tenantId ?? undefined, {
        enforceStrongPassword: state.globalConfig.enforceStrongPassword,
        requireMfaForAdmins: state.globalConfig.requireMfaForAdmins,
        auditRetentionDays: state.globalConfig.auditRetentionDays,
        backendReadOnlyWindow: state.globalConfig.backendReadOnlyWindow,
      });

      await loadAdminData();
    } catch (saveError) {
      console.error('[SuperAdmin] Error guardando settings:', saveError);
      dispatch({ type: 'PATCH', payload: { error: 'No se pudo guardar la configuracion global.' } });
    } finally {
      dispatch({ type: 'PATCH', payload: { savingSettings: false } });
    }
  };

  const saveProfileAccess = async (payload: ProfileAccessPayload) => {
    if (!supabase) return;
    const dbRole = dbRoleMap[payload.rol];
    const { data, error } = await supabase.rpc('superadmin_upsert_profile_access', {
      p_user_id: payload.profileId,
      p_rol: dbRole,
      p_permisos: payload.permisos,
      p_establecimiento_id: payload.establecimientoId,
      p_activo: payload.activo,
      p_nombre: payload.nombre.trim() || null,
      p_apellido: payload.apellido.trim() || null,
    });

    if (error) {
      throw new Error(`No se pudo guardar rol/permisos: ${error.message}`);
    }

    const success = Boolean((data as { success?: boolean } | null)?.success);
    if (!success) {
      const errorCode = String((data as { error?: string } | null)?.error ?? 'ERROR_DESCONOCIDO');
      throw new Error(`No se pudo guardar rol/permisos (${errorCode}).`);
    }

    await trackAction('profile_access_upsert', 'perfiles', payload.profileId, payload.establecimientoId, {
      rol: payload.rol,
      permisos_count: payload.permisos.length,
      activo: payload.activo,
    });

    await loadAdminData();
  };

  const resolveUserByEmail = async (email: string): Promise<{ id: string; email: string } | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('superadmin_find_auth_user_by_email', {
      p_email: email,
    });

    if (error) {
      throw new Error(`No se pudo buscar usuario auth: ${error.message}`);
    }

    if (!data || typeof data !== 'object') {
      return null;
    }

    const row = data as { success?: boolean; id?: string; email?: string; error?: string };
    if (!row.success) {
      if (row.error === 'NOT_FOUND') return null;
      throw new Error(`No se pudo buscar usuario auth (${row.error ?? 'ERROR_DESCONOCIDO'}).`);
    }
    if (!row.id || !row.email) {
      return null;
    }
    return { id: row.id, email: row.email };
  };

  const deactivateProfile = async (profileId: string, reason?: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('safe_deactivate_profile', {
      p_profile_id: profileId,
      p_reason: reason ?? null,
    });

    if (error) {
      throw new Error(`No se pudo desactivar perfil: ${error.message}`);
    }

    const success = Boolean((data as { success?: boolean } | null)?.success);
    if (!success) {
      const errorCode = String((data as { error?: string } | null)?.error ?? 'ERROR_DESCONOCIDO');
      throw new Error(`No se pudo desactivar perfil (${errorCode}).`);
    }

    await loadAdminData();
  };

  const deleteProfile = async (profileId: string) => {
    if (!supabase) return;
    const normalizedProfileId = profileId.trim().toLowerCase();
    const existsInPerfiles = state.profiles.some((profile) => profile.id.toLowerCase() === normalizedProfileId);
    if (!existsInPerfiles) {
      throw new Error('No existe un perfil en tabla perfiles para ese UUID. Primero crea/carga el perfil y luego intenta borrarlo.');
    }

    const { data, error } = await supabase.rpc('safe_delete_profile_if_unreferenced', {
      p_profile_id: profileId,
    });

    if (error) {
      throw new Error(`No se pudo eliminar perfil: ${error.message}`);
    }

    const row = (Array.isArray(data) ? data[0] : data) as { success?: boolean; error?: string; reference_count?: number } | null;
    if (!row?.success) {
      if (row?.error === 'PROFILE_REFERENCED') {
        throw new Error(`No se puede borrar: perfil con referencias (${row.reference_count ?? 0}).`);
      }
      if (row?.error === 'PROFILE_NOT_FOUND') {
        await loadAdminData();
        throw new Error('No existe el perfil en base de datos (puede haber sido borrado previamente o nunca creado en perfiles).');
      }
      throw new Error(`No se pudo eliminar perfil (${row?.error ?? 'ERROR_DESCONOCIDO'}).`);
    }

    await loadAdminData();
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const tenantMetrics = useMemo<TenantMetrics>(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeTenants = state.tenants.filter((tenant) => tenant.activo !== false).length;
    const activeUsers = state.profiles.filter((profile) => profile.activo !== false).length;
    const inactiveUsers = state.profiles.filter((profile) => profile.activo === false).length;
    const newUsers7d = state.profiles.filter((profile) => {
      if (!profile.created_at) return false;
      const created = new Date(profile.created_at).getTime();
      return Number.isFinite(created) && created >= sevenDaysAgo;
    }).length;
    const adminUsers = state.profiles.filter((profile) => {
      const role = String(profile.rol ?? '').toUpperCase();
      return role === 'SUPERADMIN' || role === 'SOSTENEDOR' || role === 'ADMIN' || role === 'DIRECTOR';
    }).length;

    return {
      totalTenants: state.tenants.length,
      activeTenants,
      totalUsers: state.profiles.length,
      activeUsers,
      newUsers7d,
      inactiveUsers,
      adminUsers,
      deletedProfiles: state.deletedProfilesCount,
      deactivatedProfiles: state.deactivatedProfilesCount,
      enabledFeatures: state.flags.filter((flag) => flag.enabled).length,
    };
  }, [state.deactivatedProfilesCount, state.deletedProfilesCount, state.flags, state.profiles, state.tenants]);

  const roleBreakdown = useMemo(() => {
    return state.profiles.reduce<Record<string, number>>((acc, profile) => {
      const role = String(profile.rol ?? 'SIN_ROL').toUpperCase();
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
  }, [state.profiles]);

  const selectedTenantFlags = useMemo(() => {
    if (!tenantId) return [];
    return state.flags.filter((flag) => flag.tenant_id === tenantId);
  }, [state.flags, tenantId]);

  const toggleFeature = async (featureId: string) => {
    if (!tenantId) return;

    const target = state.flags.find((feature) => feature.id === featureId && feature.tenant_id === tenantId);
    if (!target) return;

    const nextValue = !target.enabled;
    dispatch({ type: 'TOGGLE_FLAG_OPTIMISTIC', payload: { featureId, enabled: nextValue } });

    try {
      await persistFeatureToggle(target, nextValue);
    } catch (toggleError) {
      console.error('[SuperAdmin] Error toggling feature:', toggleError);
      dispatch({ type: 'PATCH', payload: { error: 'No se pudo actualizar la feature flag.' } });
      dispatch({ type: 'REVERT_FLAG', payload: { featureId, enabled: target.enabled } });
    }
  };

  const runMaintenance = async (action: string) => {
    const optimistic: MaintenanceLog = {
      id: crypto.randomUUID(),
      action,
      created_at: new Date().toISOString(),
      status: 'in_progress',
      entity_type: 'maintenance',
    };

    dispatch({ type: 'MAINT_PREPEND', payload: optimistic });

    try {
      await trackAction(action, 'maintenance', null, tenantId ?? undefined, { mode: 'manual' });
      dispatch({ type: 'MAINT_MARK_OK', payload: optimistic.id });
    } catch (maintenanceError) {
      console.error('[SuperAdmin] Error registrando mantenimiento:', maintenanceError);
      dispatch({ type: 'PATCH', payload: { error: 'No se pudo registrar la accion de mantenimiento en auditoria.' } });
      dispatch({ type: 'MAINT_REMOVE', payload: optimistic.id });
    }
  };

  return {
    state,
    dispatch,
    loadAdminData,
    saveGlobalSettings,
    tenantMetrics,
    roleBreakdown,
    selectedTenantFlags,
    toggleFeature,
    runMaintenance,
    saveProfileAccess,
    resolveUserByEmail,
    deactivateProfile,
    deleteProfile,
  };
};
