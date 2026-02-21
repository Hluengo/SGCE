import type { Permiso, RolUsuario } from '@/shared/hooks/useAuth';

export interface TenantRow {
  id: string;
  nombre: string;
  rbd?: string | null;
  activo?: boolean | null;
  created_at?: string | null;
}

export interface ProfileRow {
  id: string;
  nombre?: string | null;
  apellido?: string | null;
  rol?: string | null;
  permisos?: unknown;
  establecimiento_id?: string | null;
  activo?: boolean | null;
  created_at?: string | null;
}

export interface FeatureFlag {
  id: string;
  tenant_id: string;
  feature_key: string;
  feature_label: string;
  enabled: boolean;
}

export interface MaintenanceLog {
  id: string;
  action: string;
  created_at: string;
  entity_type?: string | null;
  actor_user_id?: string | null;
  actor_name?: string | null;
  status: 'ok' | 'in_progress';
}

export interface GlobalConfigState {
  enforceStrongPassword: boolean;
  requireMfaForAdmins: boolean;
  auditRetentionDays: number;
  backendReadOnlyWindow: boolean;
}

export interface SuperAdminState {
  loading: boolean;
  savingSettings: boolean;
  tenants: TenantRow[];
  profiles: ProfileRow[];
  flags: FeatureFlag[];
  maintenanceLogs: MaintenanceLog[];
  deletedProfilesCount: number;
  deactivatedProfilesCount: number;
  globalConfig: GlobalConfigState;
  error: string | null;
}

export type SuperAdminAction =
  | { type: 'PATCH'; payload: Partial<SuperAdminState> }
  | { type: 'SET_GLOBAL_CONFIG'; payload: Partial<GlobalConfigState> }
  | { type: 'TOGGLE_FLAG_OPTIMISTIC'; payload: { featureId: string; enabled: boolean } }
  | { type: 'REVERT_FLAG'; payload: { featureId: string; enabled: boolean } }
  | { type: 'MAINT_PREPEND'; payload: MaintenanceLog }
  | { type: 'MAINT_MARK_OK'; payload: string }
  | { type: 'MAINT_REMOVE'; payload: string };

export interface RolePermissionFormState {
  profileId: string;
  nombre: string;
  apellido: string;
  establecimientoId: string | null;
  rol: RolUsuario;
  permisos: Permiso[];
  activo: boolean;
}
