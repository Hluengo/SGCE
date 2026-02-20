import { useEffect, useMemo, useReducer, type CSSProperties, type Dispatch } from 'react';
import { Building2, Users, ShieldCheck, LineChart, Settings2, Wrench, Activity, Database, RefreshCw, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import useAuth, { type Permiso, type RolUsuario } from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/context/TenantContext';
import { AsyncState } from '@/shared/components/ui';
import BackendConfigStudio from './configStudio/BackendConfigStudio';
import { isUuid } from '@/shared/utils/expedienteRef';

interface TenantRow {
  id: string;
  nombre: string;
  rbd?: string | null;
  activo?: boolean | null;
  created_at?: string | null;
}

interface ProfileRow {
  id: string;
  nombre?: string | null;
  apellido?: string | null;
  rol?: string | null;
  permisos?: unknown;
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

const ROLE_OPTIONS: RolUsuario[] = [
  'SUPERADMIN',
  'SOSTENEDOR',
  'DIRECTOR',
  'INSPECTOR_GENERAL',
  'CONVIVENCIA_ESCOLAR',
  'PSICOLOGO',
  'PSICOPEDAGOGO',
  'PROFESOR_JEFE',
  'ADMINISTRADOR',
  'SECRETARIA',
];

const DB_ROLE_MAP: Record<RolUsuario, string> = {
  SUPERADMIN: 'superadmin',
  SOSTENEDOR: 'sostenedor',
  DIRECTOR: 'director',
  INSPECTOR_GENERAL: 'inspector',
  CONVIVENCIA_ESCOLAR: 'convivencia',
  PSICOLOGO: 'dupla',
  PSICOPEDAGOGO: 'dupla',
  PROFESOR_JEFE: 'convivencia',
  ADMINISTRADOR: 'admin',
  SECRETARIA: 'convivencia',
};

const ALL_PERMISSIONS: Permiso[] = [
  'expedientes:crear',
  'expedientes:leer',
  'expedientes:editar',
  'expedientes:eliminar',
  'expedientes:archivar',
  'expedientes:asignar',
  'documentos:subir',
  'documentos:eliminar',
  'reportes:generar',
  'reportes:exportar',
  'usuarios:gestionar',
  'usuarios:roles:gestionar',
  'configuracion:editar',
  'configuracion:tenant:editar',
  'bitacora:ver',
  'bitacora:exportar',
  'tenants:gestionar',
  'dashboard:analitica:ver',
  'monitorizacion:ver',
  'mantenimiento:ejecutar',
  'backend:configurar',
  'system:manage',
];

const mapDbRoleToUiRole = (rawRole: string | null | undefined): RolUsuario => {
  const role = String(rawRole ?? '').trim().toUpperCase();
  switch (role) {
    case 'SUPERADMIN':
      return 'SUPERADMIN';
    case 'SOSTENEDOR':
      return 'SOSTENEDOR';
    case 'DIRECTOR':
      return 'DIRECTOR';
    case 'INSPECTOR':
    case 'INSPECTOR_GENERAL':
      return 'INSPECTOR_GENERAL';
    case 'CONVIVENCIA':
    case 'CONVIVENCIA_ESCOLAR':
      return 'CONVIVENCIA_ESCOLAR';
    case 'DUPLA':
      return 'PSICOLOGO';
    case 'ADMIN':
    case 'ADMINISTRADOR':
      return 'ADMINISTRADOR';
    default:
      return 'CONVIVENCIA_ESCOLAR';
  }
};

const normalizePermisos = (raw: unknown): Permiso[] => {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<Permiso>(ALL_PERMISSIONS);
  return raw
    .map((item) => String(item).trim())
    .filter((item): item is Permiso => valid.has(item as Permiso));
};

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

const SA_THEME_VARS: CSSProperties = {
  '--sa-primary': '#0f172a',
  '--sa-action': '#4f46e5',
  '--sa-surface': '#ffffff',
  '--sa-surface-muted': '#f8fafc',
  '--sa-border': '#e2e8f0',
  '--sa-text': '#0f172a',
  '--sa-text-muted': '#475569',
} as CSSProperties;

const SA_UI = {
  page: 'min-h-full p-4 md:p-8 space-y-6 bg-[var(--sa-surface-muted)]',
  section: 'grid gap-6',
  card: 'rounded-[0.75rem] bg-[var(--sa-surface)] border border-[var(--sa-border)] shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.08)]',
  cardPadding: 'p-4 md:p-6',
  cardTitle: 'text-[0.875rem] font-black uppercase tracking-[0.12em] text-[var(--sa-text)] flex items-center gap-2',
  cardSubtitle: 'text-[0.75rem] text-[var(--sa-text-muted)] mt-1',
  input: 'w-full rounded-[0.75rem] border border-[var(--sa-border)] px-3 py-2 text-[0.8125rem] text-[var(--sa-text)] bg-white transition-all duration-200 ease-in-out hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none',
  buttonPrimary: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--sa-primary)] px-4 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white transition-all duration-200 ease-in-out hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 active:translate-y-[1px] disabled:opacity-50',
  buttonSecondary: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] border border-[var(--sa-border)] px-3 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 active:translate-y-[1px] disabled:opacity-50',
  buttonAction: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--sa-action)] px-3 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white transition-all duration-200 ease-in-out hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-300 active:translate-y-[1px] disabled:opacity-50',
  tableHead: 'bg-slate-50 text-slate-500 uppercase tracking-[0.12em] text-[0.6875rem]',
  muted: 'text-[0.75rem] text-[var(--sa-text-muted)]',
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
  <article className={`xl:col-span-2 ${SA_UI.card} ${SA_UI.cardPadding} space-y-4`}>
    <div className="flex items-center justify-between">
      <div>
        <h2 className={SA_UI.cardTitle}><Building2 className="w-4 h-4 text-indigo-600" />Gestion de Tenants</h2>
        <p className={SA_UI.cardSubtitle}>Selecciona un colegio para administrar configuracion, permisos y funcionalidades.</p>
      </div>
      <button onClick={() => void loadAdminData()} className={SA_UI.buttonSecondary}>
        <RefreshCw className="w-3 h-3" />
        Refrescar
      </button>
    </div>

    <div className="overflow-auto border border-slate-100 rounded-[0.75rem]">
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
        <table className="w-full text-[0.75rem]">
          <thead className={SA_UI.tableHead}>
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
                  <button onClick={() => setTenantId(tenant.id)} className={tenant.id === tenantId ? SA_UI.buttonAction : SA_UI.buttonSecondary}>
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
      <article className={`${SA_UI.card} p-4`}>
        <h3 className={SA_UI.cardTitle}><Users className="w-4 h-4 text-indigo-600" />Roles y permisos</h3>
        <ul className="mt-3 space-y-2 text-[0.75rem] text-slate-600">
          {Object.entries(roleBreakdown).map(([role, total]) => (
            <li key={role} className="flex items-center justify-between">
              <span>{role}</span>
              <span className="font-black text-slate-800">{total}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className={`${SA_UI.card} p-4`}>
        <h3 className={SA_UI.cardTitle}><ShieldCheck className="w-4 h-4 text-indigo-600" />Config global</h3>
        <div className="mt-3 space-y-4 text-[0.75rem] text-slate-700">
          <label className="flex items-center justify-between rounded-[0.75rem] bg-slate-50 px-3 py-2">
            <span>Politica de contrasenas robustas</span>
            <input type="checkbox" checked={globalConfig.enforceStrongPassword} onChange={(e) => dispatch({ type: 'SET_GLOBAL_CONFIG', payload: { enforceStrongPassword: e.target.checked } })} />
          </label>
          <label className="flex items-center justify-between rounded-[0.75rem] bg-slate-50 px-3 py-2">
            <span>MFA para perfiles admin</span>
            <input type="checkbox" checked={globalConfig.requireMfaForAdmins} onChange={(e) => dispatch({ type: 'SET_GLOBAL_CONFIG', payload: { requireMfaForAdmins: e.target.checked } })} />
          </label>
          <label className="flex items-center justify-between rounded-[0.75rem] bg-slate-50 px-3 py-2">
            <span>Ventana backend solo lectura</span>
            <input type="checkbox" checked={globalConfig.backendReadOnlyWindow} onChange={(e) => dispatch({ type: 'SET_GLOBAL_CONFIG', payload: { backendReadOnlyWindow: e.target.checked } })} />
          </label>
          <label className="flex items-center justify-between rounded-[0.75rem] bg-slate-50 px-3 py-2">
            <span>Retencion auditoria (dias)</span>
            <input type="number" min={30} value={globalConfig.auditRetentionDays} onChange={(e) => dispatch({ type: 'SET_GLOBAL_CONFIG', payload: { auditRetentionDays: Number(e.target.value) || 30 } })} className={`${SA_UI.input} w-24`} />
          </label>
          <button onClick={() => void saveGlobalSettings()} disabled={savingSettings} className={`${SA_UI.buttonPrimary} w-full`}>
            <Save className="w-3 h-3" />
            {savingSettings ? 'Guardando...' : 'Guardar config'}
          </button>
        </div>
      </article>
    </div>
  </article>
);

interface RolePermissionFormState {
  profileId: string;
  nombre: string;
  apellido: string;
  establecimientoId: string | null;
  rol: RolUsuario;
  permisos: Permiso[];
  activo: boolean;
}

const createDefaultRoleForm = (tenantId: string | null): RolePermissionFormState => ({
  profileId: '',
  nombre: '',
  apellido: '',
  establecimientoId: tenantId,
  rol: 'CONVIVENCIA_ESCOLAR',
  permisos: [],
  activo: true,
});

interface RolePermissionUiState {
  form: RolePermissionFormState;
  emailLookup: string;
  search: string;
  saving: boolean;
  resolvingEmail: boolean;
  status: string | null;
}

type RolePermissionUiAction =
  | { type: 'SET_FORM'; payload: RolePermissionFormState }
  | { type: 'PATCH_FORM'; payload: Partial<RolePermissionFormState> }
  | { type: 'SET_EMAIL_LOOKUP'; payload: string }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_RESOLVING_EMAIL'; payload: boolean }
  | { type: 'SET_STATUS'; payload: string | null }
  | { type: 'RESET_FORM'; payload: { tenantId: string | null } };

function rolePermissionUiReducer(state: RolePermissionUiState, action: RolePermissionUiAction): RolePermissionUiState {
  switch (action.type) {
    case 'SET_FORM':
      return { ...state, form: action.payload };
    case 'PATCH_FORM':
      return { ...state, form: { ...state.form, ...action.payload } };
    case 'SET_EMAIL_LOOKUP':
      return { ...state, emailLookup: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_RESOLVING_EMAIL':
      return { ...state, resolvingEmail: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'RESET_FORM':
      return { ...state, form: createDefaultRoleForm(action.payload.tenantId), status: null };
    default:
      return state;
  }
}

const RolePermissionManagerPanel: React.FC<{
  tenantId: string | null;
  tenants: TenantRow[];
  profiles: ProfileRow[];
  onSave: (payload: RolePermissionFormState) => Promise<void>;
  onResolveUserByEmail: (email: string) => Promise<{ id: string; email: string } | null>;
}> = ({
  tenantId,
  tenants,
  profiles,
  onSave,
  onResolveUserByEmail,
}) => {
  const [ui, uiDispatch] = useReducer(rolePermissionUiReducer, {
    form: createDefaultRoleForm(tenantId),
    emailLookup: '',
    search: '',
    saving: false,
    resolvingEmail: false,
    status: null,
  });
  const { form, emailLookup, search, saving, resolvingEmail, status } = ui;

  useEffect(() => {
    if (!ui.form.establecimientoId && tenantId) {
      uiDispatch({ type: 'PATCH_FORM', payload: { establecimientoId: tenantId } });
    }
  }, [tenantId]);

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return profiles.slice(0, 60);
    return profiles
      .filter((profile) => {
        const base = `${profile.id} ${profile.nombre ?? ''} ${profile.apellido ?? ''} ${profile.rol ?? ''}`.toLowerCase();
        return base.includes(term);
      })
      .slice(0, 60);
  }, [profiles, search]);

  const loadProfileInForm = (profile: ProfileRow) => {
    uiDispatch({
      type: 'SET_FORM',
      payload: {
        profileId: profile.id,
        nombre: String(profile.nombre ?? ''),
        apellido: String(profile.apellido ?? ''),
        establecimientoId: profile.establecimiento_id ?? tenantId,
        rol: mapDbRoleToUiRole(profile.rol),
        permisos: normalizePermisos(profile.permisos),
        activo: profile.activo !== false,
      },
    });
    uiDispatch({ type: 'SET_STATUS', payload: null });
  };

  const togglePermission = (permission: Permiso) => {
    const hasPermission = form.permisos.includes(permission);
    uiDispatch({
      type: 'PATCH_FORM',
      payload: {
        permisos: hasPermission
          ? form.permisos.filter((item) => item !== permission)
          : [...form.permisos, permission],
      },
    });
  };

  const handleSubmit = async () => {
    const profileId = form.profileId.trim();
    if (!isUuid(profileId)) {
      uiDispatch({ type: 'SET_STATUS', payload: 'Debes ingresar un UUID valido de usuario/perfil.' });
      return;
    }
    uiDispatch({ type: 'SET_SAVING', payload: true });
    uiDispatch({ type: 'SET_STATUS', payload: null });
    try {
      await onSave({ ...form, profileId });
      uiDispatch({ type: 'SET_STATUS', payload: 'Rol y permisos guardados correctamente.' });
    } catch (error) {
      uiDispatch({ type: 'SET_STATUS', payload: error instanceof Error ? error.message : 'No se pudo guardar el perfil.' });
    } finally {
      uiDispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const handleResolveByEmail = async () => {
    const email = emailLookup.trim().toLowerCase();
    if (!email) {
      uiDispatch({ type: 'SET_STATUS', payload: 'Ingresa un email para buscar UUID.' });
      return;
    }
    uiDispatch({ type: 'SET_RESOLVING_EMAIL', payload: true });
    uiDispatch({ type: 'SET_STATUS', payload: null });
    try {
      const resolved = await onResolveUserByEmail(email);
      if (!resolved) {
        uiDispatch({ type: 'SET_STATUS', payload: 'No existe usuario auth para ese email.' });
        return;
      }
      uiDispatch({ type: 'PATCH_FORM', payload: { profileId: resolved.id } });
      uiDispatch({ type: 'SET_STATUS', payload: `UUID cargado desde auth.users: ${resolved.id}` });
    } catch (error) {
      uiDispatch({ type: 'SET_STATUS', payload: error instanceof Error ? error.message : 'No se pudo resolver usuario por email.' });
    } finally {
      uiDispatch({ type: 'SET_RESOLVING_EMAIL', payload: false });
    }
  };

  const statusTone = status?.toLowerCase().includes('no se pudo') || status?.toLowerCase().includes('no existe')
    ? 'error'
    : status?.toLowerCase().includes('guardado') || status?.toLowerCase().includes('cargado')
      ? 'success'
      : null;

  return (
    <article className={`${SA_UI.card} ${SA_UI.cardPadding} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={SA_UI.cardTitle}>
            <Users className="w-4 h-4 text-indigo-600" />
            Gestion de roles y permisos
          </h2>
          <p className={SA_UI.cardSubtitle}>Crear o actualizar rol/permisos de perfiles por tenant.</p>
        </div>
        <button
          onClick={() => {
            uiDispatch({ type: 'RESET_FORM', payload: { tenantId } });
          }}
          className={SA_UI.buttonSecondary}
        >
          Nuevo perfil
        </button>
      </div>

      <div className="grid xl:grid-cols-5 gap-4">
        <section className={`xl:col-span-2 ${SA_UI.card} p-4 space-y-3`}>
          <p className="text-[0.75rem] font-black uppercase tracking-[0.12em] text-slate-500">Perfiles existentes</p>
          <input
            value={search}
            onChange={(e) => uiDispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            placeholder="Buscar por id, nombre o rol"
            className={SA_UI.input}
          />
          <div className="max-h-64 overflow-auto space-y-2 pr-1">
            {filteredProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => loadProfileInForm(profile)}
                className="w-full rounded-[0.75rem] border border-slate-200 p-3 text-left transition-all duration-200 ease-in-out hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 active:translate-y-[1px]"
              >
                <p className="text-[0.75rem] font-black text-slate-800">{profile.nombre ?? 'Sin nombre'} {profile.apellido ?? ''}</p>
                <p className="text-[11px] text-slate-500 break-all">{profile.id}</p>
                <p className="text-[11px] text-cyan-700 font-bold mt-1">{String(profile.rol ?? 'sin rol').toUpperCase()}</p>
              </button>
            ))}
            {filteredProfiles.length === 0 && <p className="text-xs text-slate-500">Sin resultados.</p>}
          </div>
        </section>

        <section className={`xl:col-span-3 ${SA_UI.card} p-4 space-y-4`}>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1 text-xs md:col-span-2">
              <span className="font-black uppercase tracking-widest text-slate-500">Buscar por email (Auth)</span>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  value={emailLookup}
                  onChange={(e) => uiDispatch({ type: 'SET_EMAIL_LOOKUP', payload: e.target.value })}
                  placeholder="usuario@colegio.cl"
                  className={SA_UI.input}
                />
                <button
                  onClick={() => void handleResolveByEmail()}
                  disabled={resolvingEmail}
                  className={SA_UI.buttonSecondary}
                >
                  {resolvingEmail ? 'Buscando...' : 'Obtener UUID'}
                </button>
              </div>
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-black uppercase tracking-widest text-slate-500">User UUID</span>
                <input
                  value={form.profileId}
                  onChange={(e) => uiDispatch({ type: 'PATCH_FORM', payload: { profileId: e.target.value } })}
                  placeholder="UUID auth.users / perfiles.id"
                  className={SA_UI.input}
                />
              </label>
            <label className="space-y-1 text-xs">
              <span className="font-black uppercase tracking-widest text-slate-500">Tenant</span>
                <select
                  value={form.establecimientoId ?? ''}
                  onChange={(e) => uiDispatch({ type: 'PATCH_FORM', payload: { establecimientoId: e.target.value || null } })}
                  className={SA_UI.input}
                >
                <option value="">Sin tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.nombre}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-black uppercase tracking-widest text-slate-500">Nombre</span>
                <input
                  value={form.nombre}
                  onChange={(e) => uiDispatch({ type: 'PATCH_FORM', payload: { nombre: e.target.value } })}
                  className={SA_UI.input}
                />
              </label>
            <label className="space-y-1 text-xs">
              <span className="font-black uppercase tracking-widest text-slate-500">Apellido</span>
                <input
                  value={form.apellido}
                  onChange={(e) => uiDispatch({ type: 'PATCH_FORM', payload: { apellido: e.target.value } })}
                  className={SA_UI.input}
                />
              </label>
            <label className="space-y-1 text-xs">
              <span className="font-black uppercase tracking-widest text-slate-500">Rol</span>
                <select
                  value={form.rol}
                  onChange={(e) => uiDispatch({ type: 'PATCH_FORM', payload: { rol: e.target.value as RolUsuario } })}
                  className={SA_UI.input}
                >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs">
              <span className="font-black uppercase tracking-widest text-slate-500">Activo</span>
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => uiDispatch({ type: 'PATCH_FORM', payload: { activo: e.target.checked } })}
              />
            </label>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Permisos</p>
              <div className="grid md:grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center gap-2 rounded-[0.75rem] border border-slate-200 px-2 py-1.5 text-xs text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.permisos.includes(permission)}
                    onChange={() => togglePermission(permission)}
                  />
                  <span>{permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleSubmit()}
              disabled={saving}
              className={SA_UI.buttonPrimary}
            >
              {saving ? 'Guardando...' : 'Guardar rol/permisos'}
            </button>
            {status && (
              <p className={`inline-flex items-center gap-1 rounded-[0.75rem] px-3 py-2 text-xs ${statusTone === 'error' ? 'bg-rose-50 text-rose-700' : statusTone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>
                {statusTone === 'error' ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {status}
              </p>
            )}
          </div>
        </section>
      </div>
    </article>
  );
};

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
  <article className={`${SA_UI.card} ${SA_UI.cardPadding} space-y-4`}>
    <h2 className={SA_UI.cardTitle}><LineChart className="w-4 h-4 text-indigo-600" />Tenant seleccionado</h2>
    <p className={SA_UI.muted}>{tenantId ? `ID: ${tenantId}` : 'Selecciona un tenant para editar funcionalidades.'}</p>

    <div className="space-y-2">
      {selectedTenantFlags.map((flag) => (
        <div key={`${flag.tenant_id}-${flag.id}`} className="flex items-center justify-between rounded-[0.75rem] border border-slate-200 p-4 text-xs">
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

    <div className={`${SA_UI.card} p-4 space-y-4`}>
      <h3 className={SA_UI.cardTitle}><Activity className="w-4 h-4 text-indigo-600" />Monitorizacion y mantenimiento</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => void runMaintenance('Reindexar reportes')} className={SA_UI.buttonPrimary}>Reindexar</button>
        <button onClick={() => void runMaintenance('Invalidar sesiones')} className={SA_UI.buttonPrimary}>Sesiones</button>
        <button onClick={() => void runMaintenance('Backup incremental')} className={SA_UI.buttonPrimary}>Backup</button>
        <button onClick={() => void runMaintenance('Reiniciar workers')} className={SA_UI.buttonPrimary}>Workers</button>
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

    <div className={`${SA_UI.card} p-4 text-xs text-slate-600 space-y-1`}>
      <p className="font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Settings2 className="w-4 h-4 text-indigo-600" />Arquitectura</p>
      <p>Aislamiento por tenant con `establecimiento_id` + filtros automáticos del cliente.</p>
      <p>Permisos granulares por perfil con override por tenant.</p>
      <p>Observabilidad y auditoria para cada accion de superadmin.</p>
    </div>

    <div className={`${SA_UI.card} p-4 text-xs text-slate-600 space-y-1`}>
      <p className="font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Wrench className="w-4 h-4 text-indigo-600" />Backend</p>
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
  <header className="rounded-[0.75rem] bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-800 text-white p-6 md:p-8 shadow-[0_8px_20px_-8px_rgb(15_23_42_/_0.45)]">
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

const SuperAdminLoadingSkeleton: React.FC = () => (
  <div className={SA_UI.page} style={SA_THEME_VARS}>
    <div className="rounded-[0.75rem] bg-slate-200/70 h-28 animate-pulse" />
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="rounded-[0.75rem] bg-slate-200/70 h-24 animate-pulse" />
      ))}
    </div>
    <div className="grid xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 rounded-[0.75rem] bg-slate-200/70 h-72 animate-pulse" />
      <div className="rounded-[0.75rem] bg-slate-200/70 h-72 animate-pulse" />
    </div>
  </div>
);

const SuperAdminErrorBanner: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div className="rounded-[0.75rem] border border-rose-200 bg-rose-50 p-4">
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
    <article className={`${SA_UI.card} p-4`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Tenants</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.totalTenants}</p>
      <p className="text-xs text-emerald-600 font-bold mt-1">Activos: {tenantMetrics.activeTenants}</p>
    </article>
    <article className={`${SA_UI.card} p-4`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Usuarios</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.totalUsers}</p>
      <p className="text-xs text-emerald-600 font-bold mt-1">Activos: {tenantMetrics.activeUsers}</p>
    </article>
    <article className={`${SA_UI.card} p-4`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Roles Admin</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.adminUsers}</p>
      <p className="text-xs text-slate-500 mt-1">Superadmin, sostenedor, admin, director</p>
    </article>
    <article className={`${SA_UI.card} p-4`}>
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
        supabase.from('perfiles').select('id, nombre, apellido, rol, permisos, establecimiento_id, activo').order('nombre', { ascending: true }),
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

  const saveProfileAccess = async (payload: RolePermissionFormState) => {
    if (!supabase) return;
    const dbRole = DB_ROLE_MAP[payload.rol];
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
    saveProfileAccess,
    resolveUserByEmail,
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
    saveProfileAccess,
    resolveUserByEmail,
  } = useSuperAdminData(usuario, tenantId);

  if (state.loading) {
    return (
      <SuperAdminLoadingSkeleton />
    );
  }

  return (
    <main className={SA_UI.page} style={SA_THEME_VARS}>
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

      <section className={`${SA_UI.section} xl:grid-cols-3`}>
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

      <section>
        <RolePermissionManagerPanel
          tenantId={tenantId}
          tenants={state.tenants}
          profiles={state.profiles}
          onSave={saveProfileAccess}
          onResolveUserByEmail={resolveUserByEmail}
        />
      </section>

      <section>
        <BackendConfigStudio />
      </section>
    </main>
  );
};

export default SuperAdminPage;

