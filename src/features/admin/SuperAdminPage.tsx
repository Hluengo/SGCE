import { useEffect, useMemo, useReducer, useState, type CSSProperties } from 'react';
import useAuth, { type Permiso, type RolUsuario } from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/context/TenantContext';
import { supabase } from '@/shared/lib/supabaseClient';
import BackendConfigStudio from './configStudio/BackendConfigStudio';
import { ConfirmActionModal, ProfilesTablePanel, ProfileAccessFormPanel, type ConfirmAction } from './components/SuperAdminProfilePanels';
import { SelectedTenantPanel, TenantManagementPanel } from './components/SuperAdminOverviewPanels';
import { useSuperAdminData } from './hooks/useSuperAdminData';
import type { ProfileRow, RolePermissionFormState, TenantRow } from './types';
import {
  SuperAdminErrorBanner,
  SuperAdminHero,
  SuperAdminLoadingSkeleton,
  SuperAdminMetricsGrid,
  SuperAdminTabs,
  SuperAdminToastStack,
  type SuperAdminTab,
  type ToastMessage,
} from './components/SuperAdminLayoutPieces';
import { isUuid } from '@/shared/utils/expedienteRef';

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
  'archivo:sostenedor:ver',
  'sie:ver',
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
  page: 'w-full min-h-full p-4 md:p-8 space-y-6 bg-[var(--sa-surface-muted)]',
  section: 'grid gap-6',
  card: 'rounded-[0.75rem] bg-[var(--sa-surface)] border border-[var(--sa-border)] shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.08)]',
  cardPadding: 'p-4 md:p-6',
  cardTitle: 'text-[0.875rem] font-black uppercase tracking-[0.12em] text-[var(--sa-text)] flex items-center gap-2',
  cardSubtitle: 'text-[0.75rem] text-[var(--sa-text-muted)] mt-1',
  input: 'w-full rounded-[0.75rem] border border-[var(--sa-border)] px-3 py-2 text-[0.8125rem] text-[var(--sa-text)] bg-white transition-all duration-200 ease-in-out hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none',
  buttonPrimary: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--sa-primary)] px-4 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white transition-all duration-200 ease-in-out hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 active:translate-y-[1px] disabled:opacity-50',
  buttonSecondary: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] border border-[var(--sa-border)] px-3 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 active:translate-y-[1px] disabled:opacity-50',
  buttonAction: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--sa-action)] px-3 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white transition-all duration-200 ease-in-out hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-300 active:translate-y-[1px] disabled:opacity-50',
  buttonDanger: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] bg-rose-600 px-3 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white transition-all duration-200 ease-in-out hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 active:translate-y-[1px] disabled:opacity-50',
  tableHead: 'bg-slate-50 text-slate-500 uppercase tracking-[0.12em] text-[0.6875rem]',
  muted: 'text-[0.75rem] text-[var(--sa-text-muted)]',
};

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

interface RolePermissionListState {
  roleFilter: RolUsuario | 'ALL';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  permissionLevelFilter: 'Basico' | 'Operativo' | 'Critico';
  currentPage: number;
  confirmAction: ConfirmAction | null;
}

type RolePermissionListAction =
  | { type: 'PATCH'; payload: Partial<RolePermissionListState> }
  | { type: 'RESET_PAGE' };

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

const initialRolePermissionListState: RolePermissionListState = {
  roleFilter: 'ALL',
  statusFilter: 'ALL',
  permissionLevelFilter: 'Basico',
  currentPage: 1,
  confirmAction: null,
};

function rolePermissionListReducer(state: RolePermissionListState, action: RolePermissionListAction): RolePermissionListState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, ...action.payload };
    case 'RESET_PAGE':
      return { ...state, currentPage: 1 };
    default:
      return state;
  }
}

interface SuperAdminFoldersState {
  folders: Array<{ id: string; nombre: string; created_at: string }>;
  foldersLoading: boolean;
  folderName: string;
  creatingFolder: boolean;
}

type SuperAdminFoldersAction =
  | { type: 'PATCH'; payload: Partial<SuperAdminFoldersState> }
  | { type: 'RESET_FOLDER_NAME' };

const initialSuperAdminFoldersState: SuperAdminFoldersState = {
  folders: [],
  foldersLoading: false,
  folderName: '',
  creatingFolder: false,
};

function superAdminFoldersReducer(state: SuperAdminFoldersState, action: SuperAdminFoldersAction): SuperAdminFoldersState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, ...action.payload };
    case 'RESET_FOLDER_NAME':
      return { ...state, folderName: '' };
    default:
      return state;
  }
}


const RolePermissionManagerPanel: React.FC<{
  tenantId: string | null;
  tenants: TenantRow[];
  profiles: ProfileRow[];
  grantorLabel: string;
  onSave: (payload: RolePermissionFormState) => Promise<void>;
  onResolveUserByEmail: (email: string) => Promise<{ id: string; email: string } | null>;
  onDeactivateProfile: (profileId: string, reason?: string) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
}> = ({
  tenantId,
  tenants,
  profiles,
  grantorLabel,
  onSave,
  onResolveUserByEmail,
  onDeactivateProfile,
  onDeleteProfile,
}) => {
  const [listState, listDispatch] = useReducer(rolePermissionListReducer, initialRolePermissionListState);
  const { roleFilter, statusFilter, permissionLevelFilter, currentPage, confirmAction } = listState;
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
    return profiles.filter((profile) => {
      if (roleFilter !== 'ALL' && mapDbRoleToUiRole(profile.rol) !== roleFilter) return false;
      if (statusFilter === 'ACTIVE' && profile.activo === false) return false;
      if (statusFilter === 'INACTIVE' && profile.activo !== false) return false;
      if (!term) return true;
      const base = `${profile.id} ${profile.nombre ?? ''} ${profile.apellido ?? ''} ${profile.rol ?? ''}`.toLowerCase();
      return base.includes(term);
    });
  }, [profiles, roleFilter, search, statusFilter]);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProfiles.slice(start, start + pageSize);
  }, [currentPage, filteredProfiles]);

  useEffect(() => {
    if (currentPage > totalPages) listDispatch({ type: 'PATCH', payload: { currentPage: totalPages } });
  }, [currentPage, totalPages]);
  const trimmedProfileId = form.profileId.trim();
  const profileIdLooksValid = isUuid(trimmedProfileId);
  const profileExistsInPerfiles = useMemo(() => {
    if (!profileIdLooksValid) return false;
    const normalizedProfileId = trimmedProfileId.toLowerCase();
    return profiles.some((profile) => profile.id.toLowerCase() === normalizedProfileId);
  }, [profileIdLooksValid, profiles, trimmedProfileId]);
  const profileIdInputClassName = profileIdLooksValid
    ? profileExistsInPerfiles
      ? `${SA_UI.input} border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200`
      : `${SA_UI.input} border-amber-300 focus:border-amber-500 focus:ring-amber-200`
    : SA_UI.input;

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

  const handleDeactivate = async () => {
    const profileId = form.profileId.trim();
    if (!isUuid(profileId)) {
      uiDispatch({ type: 'SET_STATUS', payload: 'Ingresa un UUID valido para desactivar.' });
      return;
    }

    const confirmation = window.confirm('Se desactivará el perfil seleccionado. ¿Deseas continuar?');
    if (!confirmation) return;

    uiDispatch({ type: 'SET_SAVING', payload: true });
    uiDispatch({ type: 'SET_STATUS', payload: null });
    try {
      await onDeactivateProfile(profileId, 'desactivado desde panel superadmin');
      uiDispatch({ type: 'SET_STATUS', payload: 'Perfil desactivado correctamente.' });
    } catch (error) {
      uiDispatch({ type: 'SET_STATUS', payload: error instanceof Error ? error.message : 'No se pudo desactivar el perfil.' });
    } finally {
      uiDispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const handleRowAction = async () => {
    if (!confirmAction) return;
    uiDispatch({ type: 'SET_SAVING', payload: true });
    uiDispatch({ type: 'SET_STATUS', payload: null });
    try {
      if (confirmAction.type === 'deactivate') {
        await onDeactivateProfile(confirmAction.profile.id, 'desactivado desde panel superadmin');
        uiDispatch({ type: 'SET_STATUS', payload: 'Perfil desactivado correctamente.' });
      } else {
        await onDeleteProfile(confirmAction.profile.id);
        uiDispatch({ type: 'SET_STATUS', payload: 'Perfil eliminado físicamente.' });
      }
      listDispatch({ type: 'PATCH', payload: { confirmAction: null } });
      uiDispatch({ type: 'RESET_FORM', payload: { tenantId } });
    } catch (error) {
      uiDispatch({ type: 'SET_STATUS', payload: error instanceof Error ? error.message : 'No se pudo ejecutar la acción.' });
    } finally {
      uiDispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const handleHardDelete = async () => {
    const profileId = trimmedProfileId;
    if (!isUuid(profileId)) {
      uiDispatch({ type: 'SET_STATUS', payload: 'Ingresa un UUID valido para borrar.' });
      return;
    }
    if (!profileExistsInPerfiles) {
      uiDispatch({ type: 'SET_STATUS', payload: 'Ese UUID no existe en tabla perfiles. Carga un perfil existente antes de borrar.' });
      return;
    }

    const confirmation = window.confirm('Borrado físico: esta acción no se puede deshacer. ¿Continuar?');
    if (!confirmation) return;

    uiDispatch({ type: 'SET_SAVING', payload: true });
    uiDispatch({ type: 'SET_STATUS', payload: null });
    try {
      await onDeleteProfile(profileId);
      uiDispatch({ type: 'SET_STATUS', payload: 'Perfil eliminado físicamente.' });
      uiDispatch({ type: 'RESET_FORM', payload: { tenantId } });
    } catch (error) {
      uiDispatch({ type: 'SET_STATUS', payload: error instanceof Error ? error.message : 'No se pudo eliminar el perfil.' });
    } finally {
      uiDispatch({ type: 'SET_SAVING', payload: false });
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
            Autorizaciones de acceso
          </h2>
          <p className={SA_UI.cardSubtitle}>Define qué puede hacer cada persona, en qué colegio y con qué nivel de privilegio.</p>
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
        <ProfilesTablePanel
          ui={SA_UI}
          search={search}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          roleOptions={ROLE_OPTIONS}
          paginatedProfiles={paginatedProfiles}
          currentPage={currentPage}
          totalPages={totalPages}
          onSearchChange={(value) => {
            listDispatch({ type: 'RESET_PAGE' });
            uiDispatch({ type: 'SET_SEARCH', payload: value });
          }}
          onRoleFilterChange={(value) => {
            listDispatch({ type: 'PATCH', payload: { currentPage: 1, roleFilter: value } });
          }}
          onStatusFilterChange={(value) => {
            listDispatch({ type: 'PATCH', payload: { currentPage: 1, statusFilter: value } });
          }}
          onLoadProfile={loadProfileInForm}
          onOpenConfirm={(value) => listDispatch({ type: 'PATCH', payload: { confirmAction: value } })}
          onPrevPage={() => listDispatch({ type: 'PATCH', payload: { currentPage: Math.max(1, currentPage - 1) } })}
          onNextPage={() => listDispatch({ type: 'PATCH', payload: { currentPage: Math.min(totalPages, currentPage + 1) } })}
        />

        <ProfileAccessFormPanel
          ui={SA_UI}
          roleOptions={ROLE_OPTIONS}
          allPermissions={ALL_PERMISSIONS}
          grantorLabel={grantorLabel}
          tenants={tenants}
          form={form}
          emailLookup={emailLookup}
          resolvingEmail={resolvingEmail}
          saving={saving}
          status={status}
          statusTone={statusTone}
          permissionLevelFilter={permissionLevelFilter}
          trimmedProfileId={trimmedProfileId}
          profileExistsInPerfiles={profileExistsInPerfiles}
          profileIdLooksValid={profileIdLooksValid}
          profileIdInputClassName={profileIdInputClassName}
          onEmailLookupChange={(value) => uiDispatch({ type: 'SET_EMAIL_LOOKUP', payload: value })}
          onFormPatch={(payload) => uiDispatch({ type: 'PATCH_FORM', payload })}
          onPermissionLevelFilterChange={(value) => listDispatch({ type: 'PATCH', payload: { permissionLevelFilter: value } })}
          onResolveByEmail={() => { void handleResolveByEmail(); }}
          onTogglePermission={togglePermission}
          onSubmit={() => { void handleSubmit(); }}
          onDeactivate={() => { void handleDeactivate(); }}
          onHardDelete={() => { void handleHardDelete(); }}
        />
      </div>
      <ConfirmActionModal
        action={confirmAction}
        ui={SA_UI}
        onCancel={() => listDispatch({ type: 'PATCH', payload: { confirmAction: null } })}
        onConfirm={() => { void handleRowAction(); }}
      />
    </article>
  );
};

const SuperAdminPage = () => {
  const { usuario } = useAuth();
  const { tenantId, setTenantId } = useTenant();
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [foldersState, foldersDispatch] = useReducer(superAdminFoldersReducer, initialSuperAdminFoldersState);
  const { folders, foldersLoading, folderName, creatingFolder } = foldersState;
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
    deactivateProfile,
    deleteProfile,
  } = useSuperAdminData(usuario, tenantId, DB_ROLE_MAP);

  const pushToast = (tone: ToastMessage['tone'], message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  };

  useEffect(() => {
    if (!state.error) return;
    pushToast('error', state.error);
  }, [state.error]);

  useEffect(() => {
    const loadFolders = async () => {
      if (!supabase || !tenantId) {
        foldersDispatch({ type: 'PATCH', payload: { folders: [] } });
        return;
      }
      foldersDispatch({ type: 'PATCH', payload: { foldersLoading: true } });
      const { data, error } = await supabase
        .from('carpetas_documentales')
        .select('id, nombre, created_at')
        .eq('establecimiento_id', tenantId)
        .order('nombre', { ascending: true });

      if (error) {
        foldersDispatch({ type: 'PATCH', payload: { folders: [] } });
        pushToast('error', 'No se pudieron cargar las carpetas documentales.');
      } else {
        foldersDispatch({ type: 'PATCH', payload: { folders: (data as Array<{ id: string; nombre: string; created_at: string }>) ?? [] } });
      }
      foldersDispatch({ type: 'PATCH', payload: { foldersLoading: false } });
    };

    void loadFolders();
  }, [tenantId]);

  const handleCreateFolder = async () => {
    const normalizedName = folderName.trim();
    if (!tenantId) {
      pushToast('error', 'Selecciona un colegio antes de crear carpetas.');
      return;
    }
    if (normalizedName.length < 3) {
      pushToast('error', 'El nombre debe tener al menos 3 caracteres.');
      return;
    }
    if (!supabase) {
      pushToast('error', 'Supabase no está configurado en este entorno.');
      return;
    }

    foldersDispatch({ type: 'PATCH', payload: { creatingFolder: true } });
    const { data, error } = await supabase
      .from('carpetas_documentales')
      .insert({
        establecimiento_id: tenantId,
        nombre: normalizedName,
      })
      .select('id, nombre, created_at')
      .single();
    foldersDispatch({ type: 'PATCH', payload: { creatingFolder: false } });

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        pushToast('error', 'Ya existe una carpeta con ese nombre para este colegio.');
      } else {
        pushToast('error', 'No se pudo crear la carpeta.');
      }
      return;
    }

    foldersDispatch({ type: 'PATCH', payload: { folders: 
      [...folders, data as { id: string; nombre: string; created_at: string }].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es')
      )
    } });
    foldersDispatch({ type: 'RESET_FOLDER_NAME' });
    pushToast('success', 'Carpeta creada correctamente.');
  };

  const handleRetry = () => {
    void loadAdminData();
    pushToast('success', 'Recargando datos de administración...');
  };

  if (state.loading) {
    return (
      <SuperAdminLoadingSkeleton ui={{ page: SA_UI.page }} themeVars={SA_THEME_VARS} />
    );
  }

  return (
    <main data-testid="admin-config" className={SA_UI.page} style={SA_THEME_VARS}>
      <SuperAdminToastStack
        toasts={toasts}
        onDismiss={(id) => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }}
      />
      <SuperAdminHero />

      {state.error && (
        <SuperAdminErrorBanner
          error={state.error}
          onRetry={handleRetry}
        />
      )}

      <SuperAdminMetricsGrid tenantMetrics={tenantMetrics} totalFlags={state.flags.length} ui={{ card: SA_UI.card }} />
      <SuperAdminTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        ui={{ card: SA_UI.card, buttonAction: SA_UI.buttonAction, buttonSecondary: SA_UI.buttonSecondary }}
      />

      {activeTab === 'overview' && (
        <section className="w-full space-y-6">
          <TenantManagementPanel
            ui={SA_UI}
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
            ui={SA_UI}
            tenantId={tenantId}
            selectedTenantFlags={selectedTenantFlags}
            toggleFeature={toggleFeature}
            runMaintenance={runMaintenance}
            maintenanceLogs={state.maintenanceLogs}
            grantorLabel={usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() || usuario.email : 'Superadministrador actual'}
            folders={folders}
            foldersLoading={foldersLoading}
            folderName={folderName}
            creatingFolder={creatingFolder}
            onFolderNameChange={(value) => foldersDispatch({ type: 'PATCH', payload: { folderName: value } })}
            onCreateFolder={handleCreateFolder}
          />
        </section>
      )}

      {activeTab === 'profiles' && (
        <section className="w-full">
          <RolePermissionManagerPanel
            tenantId={tenantId}
            tenants={state.tenants}
            profiles={state.profiles}
            grantorLabel={usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() || usuario.email : 'Superadministrador actual'}
            onSave={saveProfileAccess}
            onResolveUserByEmail={resolveUserByEmail}
            onDeactivateProfile={deactivateProfile}
            onDeleteProfile={deleteProfile}
          />
        </section>
      )}

      {activeTab === 'backend' && (
        <section className="w-full">
          <BackendConfigStudio />
        </section>
      )}
    </main>
  );
};

export default SuperAdminPage;

