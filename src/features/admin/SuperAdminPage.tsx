import { useEffect, useMemo, useReducer, type Dispatch } from 'react';
import { Building2, Users, ShieldCheck, LineChart, Settings2, Wrench, Activity, Database, RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import useAuth from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/context/TenantContext';
import { AsyncState } from '@/shared/components/ui';
import BackendConfigStudio from './configStudio/BackendConfigStudio';

interface TenantRow {
  id: string;
  nombre: string;
  rbd?: string | null;
  activo?: boolean | null;
  created_at?: string | null;
}

interface ProfileRow {
  id: string;
  rol?: string | null;
  establecimiento_id?: string | null;
  activo?: boolean | null;
}

interface FeatureFlag {
  id: string;
  tenant_id: string;
  feature_key: string;
  feature_label: string;
  enabled: boolean;
}

interface MaintenanceLog {
  id: string;
  action: string;
  created_at: string;
  entity_type?: string | null;
  status: 'ok' | 'in_progress';
}

const defaultFlags: Omit<FeatureFlag, 'tenant_id'>[] = [
  { id: 'ff-dashboard-v2', feature_key: 'dashboard.v2', feature_label: 'Dashboard analitico avanzado', enabled: true },
  { id: 'ff-ai-legal', feature_key: 'asistente.legal', feature_label: 'Asistente legal', enabled: true },
  { id: 'ff-auditoria', feature_key: 'auditoria.extendida', feature_label: 'Auditoria extendida', enabled: true },
  { id: 'ff-parent-portal', feature_key: 'portal.apoderados', feature_label: 'Portal apoderados', enabled: false },
];

interface GlobalConfigState {
  enforceStrongPassword: boolean;
  requireMfaForAdmins: boolean;
  auditRetentionDays: number;
  backendReadOnlyWindow: boolean;
}

interface SuperAdminState {
  loading: boolean;
  savingSettings: boolean;
  tenants: TenantRow[];
  profiles: ProfileRow[];
  flags: FeatureFlag[];
  maintenanceLogs: MaintenanceLog[];
  globalConfig: GlobalConfigState;
  error: string | null;
}

type SuperAdminAction =
  | { type: 'PATCH'; payload: Partial<SuperAdminState> }
  | { type: 'SET_GLOBAL_CONFIG'; payload: Partial<GlobalConfigState> }
  | { type: 'TOGGLE_FLAG_OPTIMISTIC'; payload: { featureId: string; enabled: boolean } }
  | { type: 'REVERT_FLAG'; payload: { featureId: string; enabled: boolean } }
  | { type: 'MAINT_PREPEND'; payload: MaintenanceLog }
  | { type: 'MAINT_MARK_OK'; payload: string }
  | { type: 'MAINT_REMOVE'; payload: string };

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

const TenantManagementPanel: React.FC<{
  tenants: TenantRow[];
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
  loadAdminData: () => Promise<void>;
  roleBreakdown: Record<string, number>;
  globalConfig: GlobalConfigState;
  dispatch: Dispatch<SuperAdminAction>;
  saveGlobalSettings: () => Promise<void>;
  savingSettings: boolean;
}> = ({
  tenants,
  tenantId,
  setTenantId,
  loadAdminData,
  roleBreakdown,
  globalConfig,
  dispatch,
  saveGlobalSettings,
  savingSettings,
}) => (
  <article className="xl:col-span-2 rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2"><Building2 className="w-4 h-4 text-cyan-600" />Gestion de Tenants</h2>
        <p className="text-xs text-slate-500 mt-1">Selecciona un colegio para administrar configuracion, permisos y funcionalidades.</p>
      </div>
      <button onClick={() => void loadAdminData()} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 flex items-center gap-2">
        <RefreshCw className="w-3 h-3" />
        Refrescar
      </button>
    </div>

    <div className="overflow-auto border border-slate-100 rounded-2xl">
      {tenants.length === 0 ? (
        <div className="p-4">
          <AsyncState
            state="empty"
            title="Sin tenants disponibles"
            message="No hay establecimientos configurados para administrar."
            compact
          />
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="text-left p-4">Tenant</th>
              <th className="text-left p-4">RBD</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Accion</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t border-slate-100">
                <td className="p-4">
                  <p className="font-bold text-slate-800">{tenant.nombre}</p>
                  <p className="text-slate-500">{tenant.id}</p>
                </td>
                <td className="p-4 text-slate-600">{tenant.rbd ?? '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${tenant.activo === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {tenant.activo === false ? 'inactivo' : 'activo'}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => setTenantId(tenant.id)} className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${tenant.id === tenantId ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {tenant.id === tenantId ? 'Seleccionado' : 'Administrar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <article className="rounded-2xl border border-slate-200 p-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-2"><Users className="w-4 h-4 text-cyan-600" />Roles y permisos</h3>
        <ul className="mt-3 space-y-2 text-xs text-slate-600">
          {Object.entries(roleBreakdown).map(([role, total]) => (
            <li key={role} className="flex items-center justify-between">
              <span>{role}</span>
              <span className="font-black text-slate-800">{total}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-2xl border border-slate-200 p-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-600" />Config global</h3>
        <div className="mt-3 space-y-4 text-xs text-slate-700">
          <label className="flex items-center justify-between">
            <span>Politica de contrasenas robustas</span>
            <input type="checkbox" checked={globalConfig.enforceStrongPassword} onChange={(e) => dispatch({ type: 'SET_GLOBAL_CONFIG', payload: { enforceStrongPassword: e.target.checked } })} />
          </label>
          <label className="flex items-center justify-between">
            <span>MFA para perfiles admin</span>
            <input type="checkbox" checked={globalConfig.requireMfaForAdmins} onChange={(e) => dispatch({ type: 'SET_GLOBAL_CONFIG', payload: { requireMfaForAdmins: e.target.checked } })} />
          </label>
          <label className="flex items-center justify-between">
            <span>Ventana backend solo lectura</span>
            <input type="checkbox" checked={globalConfig.backendReadOnlyWindow} onChange={(e) => dispatch({ type: 'SET_GLOBAL_CONFIG', payload: { backendReadOnlyWindow: e.target.checked } })} />
          </label>
          <label className="flex items-center justify-between">
            <span>Retencion auditoria (dias)</span>
            <input type="number" min={30} value={globalConfig.auditRetentionDays} onChange={(e) => dispatch({ type: 'SET_GLOBAL_CONFIG', payload: { auditRetentionDays: Number(e.target.value) || 30 } })} className="w-20 rounded-lg border border-slate-300 px-2 py-1" />
          </label>
          <button onClick={() => void saveGlobalSettings()} disabled={savingSettings} className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-3 h-3" />
            {savingSettings ? 'Guardando...' : 'Guardar config'}
          </button>
        </div>
      </article>
    </div>
  </article>
);

const SelectedTenantPanel: React.FC<{
  tenantId: string | null;
  selectedTenantFlags: FeatureFlag[];
  toggleFeature: (featureId: string) => Promise<void>;
  runMaintenance: (action: string) => Promise<void>;
  maintenanceLogs: MaintenanceLog[];
}> = ({
  tenantId,
  selectedTenantFlags,
  toggleFeature,
  runMaintenance,
  maintenanceLogs,
}) => (
  <article className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
    <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2"><LineChart className="w-4 h-4 text-cyan-600" />Tenant seleccionado</h2>
    <p className="text-xs text-slate-500">{tenantId ? `ID: ${tenantId}` : 'Selecciona un tenant para editar funcionalidades.'}</p>

    <div className="space-y-2">
      {selectedTenantFlags.map((flag) => (
        <div key={`${flag.tenant_id}-${flag.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-xs">
          <label htmlFor={`tenant-flag-${flag.id}`}>
            <p className="font-bold text-slate-800">{flag.feature_label}</p>
            <p className="text-slate-500">{flag.feature_key}</p>
          </label>
          <input id={`tenant-flag-${flag.id}`} type="checkbox" checked={flag.enabled} onChange={() => void toggleFeature(flag.id)} />
        </div>
      ))}

      {tenantId && selectedTenantFlags.length === 0 && (
        <p className="text-xs text-slate-500">No hay feature flags configuradas para este tenant.</p>
      )}
    </div>

    <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-600" />Monitorizacion y mantenimiento</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => void runMaintenance('Reindexar reportes')} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest">Reindexar</button>
        <button onClick={() => void runMaintenance('Invalidar sesiones')} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest">Sesiones</button>
        <button onClick={() => void runMaintenance('Backup incremental')} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest">Backup</button>
        <button onClick={() => void runMaintenance('Reiniciar workers')} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest">Workers</button>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        {maintenanceLogs.map((log) => (
          <div key={log.id} className="flex items-center justify-between text-xs">
            <span className="text-slate-700">{log.action}</span>
            <span className={`px-2 py-1 rounded-full uppercase font-black ${log.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {log.status === 'ok' ? 'ok' : 'en curso'}
            </span>
          </div>
        ))}
        {maintenanceLogs.length === 0 && <p className="text-xs text-slate-500">Sin ejecuciones recientes.</p>}
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 space-y-1">
      <p className="font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Settings2 className="w-4 h-4 text-cyan-600" />Arquitectura</p>
      <p>Aislamiento por tenant con `establecimiento_id` + filtros automáticos del cliente.</p>
      <p>Permisos granulares por perfil con override por tenant.</p>
      <p>Observabilidad y auditoria para cada accion de superadmin.</p>
    </div>

    <div className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 space-y-1">
      <p className="font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Wrench className="w-4 h-4 text-cyan-600" />Backend</p>
      <p className="flex items-center gap-2"><Database className="w-3 h-3" />Listo para rotacion de claves, politicas de retencion y tareas operativas.</p>
    </div>
  </article>
);

interface TenantMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  enabledFeatures: number;
}

const SuperAdminHero: React.FC<{
  usuario: ReturnType<typeof useAuth>['usuario'];
}> = ({ usuario }) => (
  <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 text-white p-6 md:p-8 shadow-2xl shadow-slate-300/30">
    <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-cyan-200 font-black">Superadministracion</p>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2">Panel Integral Multi-Tenant</h1>
        <p className="text-sm text-slate-200 mt-2">Gestion central de tenants, usuarios, permisos, backend y mantenimiento operativo.</p>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-widest text-cyan-200 font-black">Usuario actual</p>
        <p className="text-sm font-bold mt-1">{usuario?.nombre} {usuario?.apellido}</p>
        <p className="text-xs text-slate-300 mt-1">Rol: {usuario?.rol}</p>
      </div>
    </div>
  </header>
);

const SuperAdminErrorBanner: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
    <AsyncState
      state="error"
      title="No se pudo cargar el panel superadministrador"
      message={error}
      onRetry={onRetry}
      compact
    />
  </div>
);

const SuperAdminMetricsGrid: React.FC<{
  tenantMetrics: TenantMetrics;
  totalFlags: number;
}> = ({ tenantMetrics, totalFlags }) => (
  <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
    <article className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Tenants</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.totalTenants}</p>
      <p className="text-xs text-emerald-600 font-bold mt-1">Activos: {tenantMetrics.activeTenants}</p>
    </article>
    <article className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Usuarios</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.totalUsers}</p>
      <p className="text-xs text-emerald-600 font-bold mt-1">Activos: {tenantMetrics.activeUsers}</p>
    </article>
    <article className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Roles Admin</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.adminUsers}</p>
      <p className="text-xs text-slate-500 mt-1">Superadmin, sostenedor, admin, director</p>
    </article>
    <article className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Features activas</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.enabledFeatures}</p>
      <p className="text-xs text-slate-500 mt-1">Sobre {totalFlags} configuradas</p>
    </article>
  </section>
);

const useSuperAdminData = (
  usuario: ReturnType<typeof useAuth>['usuario'],
  tenantId: string | null,
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
      const [tenantResult, profileResult, flagResult, settingsResult, logResult] = await Promise.all([
        supabase.from('establecimientos').select('id, nombre, rbd, activo, created_at').order('nombre'),
        supabase.from('perfiles').select('id, rol, establecimiento_id, activo'),
        supabase.from('tenant_feature_flags').select('id, tenant_id, feature_key, feature_label, enabled'),
        supabase.from('platform_settings').select('setting_key, setting_value'),
        supabase
          .from('superadmin_audit_logs')
          .select('id, action, entity_type, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (tenantResult.error) throw tenantResult.error;
      if (profileResult.error) throw profileResult.error;
      if (flagResult.error) throw flagResult.error;
      if (settingsResult.error) throw settingsResult.error;
      if (logResult.error) throw logResult.error;

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

  useEffect(() => {
    void loadAdminData();
  }, []);

  const tenantMetrics = useMemo(() => {
    const activeTenants = state.tenants.filter((tenant) => tenant.activo !== false).length;
    const activeUsers = state.profiles.filter((profile) => profile.activo !== false).length;
    const adminUsers = state.profiles.filter((profile) => {
      const role = String(profile.rol ?? '').toUpperCase();
      return role === 'SUPERADMIN' || role === 'SOSTENEDOR' || role === 'ADMIN' || role === 'DIRECTOR';
    }).length;

    return {
      totalTenants: state.tenants.length,
      activeTenants,
      totalUsers: state.profiles.length,
      activeUsers,
      adminUsers,
      enabledFeatures: state.flags.filter((flag) => flag.enabled).length,
    };
  }, [state.flags, state.profiles, state.tenants]);

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
  };
};

const SuperAdminPage = () => {
  const { usuario } = useAuth();
  const { tenantId, setTenantId } = useTenant();
  const {
    state,
    dispatch,
    loadAdminData,
    saveGlobalSettings,
    tenantMetrics,
    roleBreakdown,
    selectedTenantFlags,
    toggleFeature,
    runMaintenance,
  } = useSuperAdminData(usuario, tenantId);

  if (state.loading) {
    return (
      <div className="min-h-full p-8 bg-slate-50">
        <AsyncState
          state="loading"
          title="Cargando panel superadministrador"
          message="Estamos preparando tenants, permisos y configuración global."
          compact
        />
      </div>
    );
  }

  return (
    <main className="min-h-full bg-slate-50 p-4 md:p-8 space-y-6">
      <SuperAdminHero usuario={usuario} />

      {state.error && (
        <SuperAdminErrorBanner
          error={state.error}
          onRetry={() => {
            void loadAdminData();
          }}
        />
      )}

      <SuperAdminMetricsGrid tenantMetrics={tenantMetrics} totalFlags={state.flags.length} />

      <section className="grid xl:grid-cols-3 gap-6">
        <TenantManagementPanel
          tenants={state.tenants}
          tenantId={tenantId}
          setTenantId={setTenantId}
          loadAdminData={loadAdminData}
          roleBreakdown={roleBreakdown}
          globalConfig={state.globalConfig}
          dispatch={dispatch}
          saveGlobalSettings={saveGlobalSettings}
          savingSettings={state.savingSettings}
        />
        <SelectedTenantPanel
          tenantId={tenantId}
          selectedTenantFlags={selectedTenantFlags}
          toggleFeature={toggleFeature}
          runMaintenance={runMaintenance}
          maintenanceLogs={state.maintenanceLogs}
        />
      </section>

      <BackendConfigStudio />
    </main>
  );
};

export default SuperAdminPage;

