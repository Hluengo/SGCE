import { useMemo, useState } from 'react';
import { Activity, Building2, FolderPlus, LineChart, RefreshCw, Save, ShieldCheck, Users } from 'lucide-react';
import { AsyncState } from '@/shared/components/ui';
import type {
  FeatureFlag,
  GlobalConfigState,
  MaintenanceLog,
  SuperAdminAction,
  TenantRow,
} from '../types';

interface UiClasses {
  card: string;
  cardPadding: string;
  cardTitle: string;
  cardSubtitle: string;
  input: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonAction: string;
  tableHead: string;
  muted: string;
}

export const TenantManagementPanel: React.FC<{
  ui: UiClasses;
  tenants: TenantRow[];
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
  loadAdminData: () => Promise<void>;
  roleBreakdown: Record<string, number>;
  globalConfig: GlobalConfigState;
  dispatch: React.Dispatch<SuperAdminAction>;
  saveGlobalSettings: () => Promise<void>;
  savingSettings: boolean;
}> = ({
  ui,
  tenants,
  tenantId,
  setTenantId,
  loadAdminData,
  roleBreakdown,
  globalConfig,
  dispatch,
  saveGlobalSettings,
  savingSettings,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [compactRows, setCompactRows] = useState(false);
  const activeCount = tenants.filter((tenant) => tenant.activo !== false).length;
  const inactiveCount = tenants.length - activeCount;

  const filteredTenants = useMemo(() => {
    if (statusFilter === 'ACTIVE') return tenants.filter((tenant) => tenant.activo !== false);
    if (statusFilter === 'INACTIVE') return tenants.filter((tenant) => tenant.activo === false);
    return tenants;
  }, [statusFilter, tenants]);

  const rowClass = compactRows ? 'p-2.5' : 'p-4';
  const headerClass = compactRows ? 'text-left p-2.5' : 'text-left p-4';

  return (
    <article className={`${ui.card} ${ui.cardPadding} space-y-4`}>
    <div className="flex items-center justify-between">
      <div>
        <h2 className={ui.cardTitle}><Building2 className="w-4 h-4 text-indigo-600" />Gestion de Tenants</h2>
        <p className={ui.cardSubtitle}>Selecciona un colegio para administrar configuracion, permisos y funcionalidades.</p>
      </div>
      <button onClick={() => void loadAdminData()} className={ui.buttonSecondary}>
        <RefreshCw className="w-3 h-3" />
        Refrescar
      </button>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => setStatusFilter('ALL')}
        className={`${statusFilter === 'ALL' ? ui.buttonAction : ui.buttonSecondary}`}
      >
        Todos ({tenants.length})
      </button>
      <button
        onClick={() => setStatusFilter('ACTIVE')}
        className={`${statusFilter === 'ACTIVE' ? ui.buttonAction : ui.buttonSecondary}`}
      >
        Activos ({activeCount})
      </button>
      <button
        onClick={() => setStatusFilter('INACTIVE')}
        className={`${statusFilter === 'INACTIVE' ? ui.buttonAction : ui.buttonSecondary}`}
      >
        Inactivos ({inactiveCount})
      </button>
      <label className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
        Densidad compacta
        <input type="checkbox" checked={compactRows} onChange={(e) => setCompactRows(e.target.checked)} />
      </label>
    </div>

    <div className="w-full max-w-full overflow-hidden border border-slate-100 rounded-[0.75rem]">
      {filteredTenants.length === 0 ? (
        <div className="p-4">
          <AsyncState
            state="empty"
            title="Sin tenants disponibles"
            message="No hay establecimientos para el filtro seleccionado."
            compact
          />
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-2 p-2">
            {filteredTenants.map((tenant) => (
              <article key={tenant.id} className="rounded-[0.75rem] border border-slate-200 bg-white p-3 space-y-2">
                <div>
                  <p className="font-bold text-slate-800 break-words">{tenant.nombre}</p>
                  <p className="text-[11px] text-slate-500 break-all">{tenant.id}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">RBD: {tenant.rbd ?? '-'}</span>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${tenant.activo === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {tenant.activo === false ? 'inactivo' : 'activo'}
                  </span>
                </div>
                <button onClick={() => setTenantId(tenant.id)} className={`${tenant.id === tenantId ? ui.buttonAction : ui.buttonSecondary} w-full`}>
                  {tenant.id === tenantId ? 'Seleccionado' : 'Administrar'}
                </button>
              </article>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-[0.75rem] table-fixed">
              <thead className={ui.tableHead}>
                <tr>
                  <th className={`${headerClass} xl:sticky xl:left-0 z-10 bg-slate-50 w-[46%]`}>Tenant</th>
                  <th className={`${headerClass} w-[18%]`}>RBD</th>
                  <th className={`${headerClass} w-[16%]`}>Estado</th>
                  <th className={`${headerClass} xl:sticky xl:right-0 z-10 bg-slate-50 w-[20%]`}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-t border-slate-100">
                    <td className={`${rowClass} xl:sticky xl:left-0 z-[1] bg-white`}>
                      <p className="font-bold text-slate-800 truncate" title={tenant.nombre}>{tenant.nombre}</p>
                      <p className="text-slate-500 break-all" title={tenant.id}>{tenant.id}</p>
                    </td>
                    <td className={`${rowClass} text-slate-600`}>{tenant.rbd ?? '-'}</td>
                    <td className={rowClass}>
                      <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${tenant.activo === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {tenant.activo === false ? 'inactivo' : 'activo'}
                      </span>
                    </td>
                    <td className={`${rowClass} xl:sticky xl:right-0 z-[1] bg-white`}>
                      <button onClick={() => setTenantId(tenant.id)} className={`${tenant.id === tenantId ? ui.buttonAction : ui.buttonSecondary} w-full`}>
                        {tenant.id === tenantId ? 'Seleccionado' : 'Administrar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <article className={`${ui.card} p-4`}>
        <h3 className={ui.cardTitle}><Users className="w-4 h-4 text-indigo-600" />Roles y permisos</h3>
        <ul className="mt-3 space-y-2 text-[0.75rem] text-slate-600">
          {Object.entries(roleBreakdown).map(([role, total]) => (
            <li key={role} className="flex items-center justify-between">
              <span>{role}</span>
              <span className="font-black text-slate-800">{total}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className={`${ui.card} p-4`}>
        <h3 className={ui.cardTitle}><ShieldCheck className="w-4 h-4 text-indigo-600" />Config global</h3>
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
            <input type="number" min={30} value={globalConfig.auditRetentionDays} onChange={(e) => dispatch({ type: 'SET_GLOBAL_CONFIG', payload: { auditRetentionDays: Number(e.target.value) || 30 } })} className={`${ui.input} w-24`} />
          </label>
          <button onClick={() => void saveGlobalSettings()} disabled={savingSettings} className={`${ui.buttonPrimary} w-full`}>
            <Save className="w-3 h-3" />
            {savingSettings ? 'Guardando...' : 'Guardar config'}
          </button>
        </div>
      </article>
    </div>
    </article>
  );
};

export const SelectedTenantPanel: React.FC<{
  ui: UiClasses;
  tenantId: string | null;
  selectedTenantFlags: FeatureFlag[];
  toggleFeature: (featureId: string) => Promise<void>;
  runMaintenance: (action: string) => Promise<void>;
  maintenanceLogs: MaintenanceLog[];
  grantorLabel: string;
  folders: Array<{ id: string; nombre: string; created_at: string }>;
  foldersLoading: boolean;
  folderName: string;
  creatingFolder: boolean;
  onFolderNameChange: (value: string) => void;
  onCreateFolder: () => Promise<void>;
}> = ({
  ui,
  tenantId,
  selectedTenantFlags,
  toggleFeature,
  runMaintenance,
  maintenanceLogs,
  grantorLabel,
  folders,
  foldersLoading,
  folderName,
  creatingFolder,
  onFolderNameChange,
  onCreateFolder,
}) => (
  <article className={`${ui.card} ${ui.cardPadding} space-y-4`}>
    <h2 className={ui.cardTitle}><LineChart className="w-4 h-4 text-indigo-600" />Operacion del colegio seleccionado</h2>
    <p className={ui.muted}>
      {tenantId ? `Colegio objetivo: ${tenantId}` : 'Selecciona un colegio para administrar autorizaciones y repositorio.'}
    </p>

    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-indigo-700">Resumen simple</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quién otorga</p>
          <p className="text-xs font-semibold text-slate-800">{grantorLabel}</p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">A quién se otorga</p>
          <p className="text-xs font-semibold text-slate-800">Todos los usuarios del colegio seleccionado</p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qué se otorga</p>
          <p className="text-xs font-semibold text-slate-800">Módulos y funciones habilitadas por tenant</p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estado actual</p>
          <p className="text-xs font-semibold text-slate-800">
            {selectedTenantFlags.filter((flag) => flag.enabled).length} habilitadas de {selectedTenantFlags.length}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-indigo-800">
        Si una función está desactivada aquí, el usuario no la verá aunque su rol tenga permisos.
      </p>
    </div>

    <div className={`${ui.card} p-4 space-y-4`}>
      <h3 className={ui.cardTitle}><Activity className="w-4 h-4 text-indigo-600" />Operación y mantenimiento</h3>
      <p className="text-xs text-slate-600">
        Estas acciones son operativas. Afectan al colegio seleccionado y quedan registradas en auditoría.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => void runMaintenance('Reindexar reportes')} className={ui.buttonPrimary}>Reindexar datos</button>
        <button onClick={() => void runMaintenance('Invalidar sesiones')} className={ui.buttonPrimary}>Cerrar sesiones</button>
        <button onClick={() => void runMaintenance('Backup incremental')} className={ui.buttonPrimary}>Generar backup</button>
        <button onClick={() => void runMaintenance('Reiniciar workers')} className={ui.buttonPrimary}>Reiniciar procesos</button>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Estado de autorizaciones ejecutadas</p>
        {maintenanceLogs.map((log) => (
          <div key={log.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">{getMaintenanceActionLabel(log.action)}</span>
              <span className={`px-2 py-0.5 rounded-full uppercase font-black ${log.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {log.status === 'ok' ? 'completado' : 'en curso'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Ejecutado por {log.actor_name ?? grantorLabel} sobre el colegio seleccionado.
            </p>
            <p className="text-[11px] text-slate-500">
              {formatMaintenanceTimestamp(log.created_at)}
            </p>
          </div>
        ))}
        {maintenanceLogs.length === 0 && <p className="text-xs text-slate-500">Sin acciones operativas recientes.</p>}
      </div>
    </div>

    <div className={`${ui.card} p-4 space-y-4`}>
      <h3 className={ui.cardTitle}><FolderPlus className="w-4 h-4 text-indigo-600" />Carpetas documentales del colegio</h3>
      <p className="text-xs text-slate-600">
        Crea carpetas para organizar el repositorio institucional del colegio seleccionado.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="sa-folder-name-input"
          value={folderName}
          onChange={(e) => onFolderNameChange(e.target.value)}
          placeholder="Ej: Protocolos 2026"
          className={ui.input}
          disabled={!tenantId || creatingFolder}
        />
        <button
          onClick={() => void onCreateFolder()}
          disabled={!tenantId || creatingFolder || folderName.trim().length < 3}
          className={ui.buttonPrimary}
        >
          {creatingFolder ? 'Creando...' : 'Crear carpeta'}
        </button>
      </div>

      {foldersLoading ? (
        <p className="text-xs text-slate-500">Cargando carpetas...</p>
      ) : folders.length === 0 ? (
        <p className="text-xs text-slate-500">Este colegio aún no tiene carpetas documentales.</p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-auto pr-1">
          {folders.map((folder) => (
            <div key={folder.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-800">{folder.nombre}</p>
              <p className="text-[11px] text-slate-500">{folder.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className={`${ui.card} p-4 space-y-3`}>
      <h3 className={ui.cardTitle}><ShieldCheck className="w-4 h-4 text-indigo-600" />Autorizaciones funcionales por colegio</h3>
      <div className="space-y-2">
        {selectedTenantFlags.map((flag) => {
          const descriptor = getFeatureDescriptor(flag.feature_key);
          return (
            <div key={`${flag.tenant_id}-${flag.id}`} className="rounded-[0.75rem] border border-slate-200 p-3 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-800">{descriptor.label ?? flag.feature_label}</p>
                  <p className="text-slate-500">{descriptor.help}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Ejemplo: {descriptor.example}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${descriptor.levelClass}`}>
                    {descriptor.level}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${flag.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {flag.enabled ? 'Autorizado' : 'Bloqueado'}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
                <label htmlFor={`tenant-flag-${flag.id}`} className="text-[11px] font-semibold text-slate-700">
                  Permitir en este colegio
                </label>
                <input id={`tenant-flag-${flag.id}`} type="checkbox" checked={flag.enabled} onChange={() => void toggleFeature(flag.id)} />
              </div>
            </div>
          );
        })}
        {tenantId && selectedTenantFlags.length === 0 && (
          <p className="text-xs text-slate-500">No hay funciones configuradas para este colegio.</p>
        )}
      </div>
    </div>
  </article>
);

const getMaintenanceActionLabel = (action: string): string => {
  const key = action.trim().toLowerCase();
  if (key.includes('reindex')) return 'Reindexación de datos';
  if (key.includes('sesion')) return 'Cierre de sesiones activas';
  if (key.includes('backup')) return 'Respaldo incremental';
  if (key.includes('worker') || key.includes('reiniciar')) return 'Reinicio de procesos';
  return action;
};

const formatMaintenanceTimestamp = (createdAt: string): string => {
  const parsed = new Date(createdAt);
  if (!Number.isFinite(parsed.getTime())) return 'Fecha no disponible';

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const absolute = parsed.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (diffMinutes < 1) return `Hace menos de 1 minuto (${absolute})`;
  if (diffMinutes < 60) return `Hace ${diffMinutes} min (${absolute})`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h (${absolute})`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} día(s) (${absolute})`;
};

const getFeatureDescriptor = (featureKey: string): {
  label: string;
  help: string;
  example: string;
  level: 'Basico' | 'Operativo' | 'Critico';
  levelClass: string;
} => {
  const key = featureKey.trim().toLowerCase();
  if (key.includes('dashboard')) {
    return {
      label: 'Dashboard analítico avanzado',
      help: 'Permite ver métricas y paneles de gestión del colegio.',
      example: 'Ver indicadores de casos activos y vencimientos.',
      level: 'Basico',
      levelClass: 'border-slate-200 bg-slate-100 text-slate-700',
    };
  }
  if (key.includes('asistente.legal') || key.includes('legal')) {
    return {
      label: 'Asistente legal',
      help: 'Permite acceder a apoyo legal y recomendaciones normativas.',
      example: 'Consultar guía sugerida para una medida disciplinaria.',
      level: 'Operativo',
      levelClass: 'border-blue-200 bg-blue-100 text-blue-700',
    };
  }
  if (key.includes('auditoria')) {
    return {
      label: 'Auditoría extendida',
      help: 'Activa trazabilidad más profunda de acciones y cambios.',
      example: 'Revisar quién cambió permisos y cuándo.',
      level: 'Critico',
      levelClass: 'border-rose-200 bg-rose-100 text-rose-700',
    };
  }
  if (key.includes('portal')) {
    return {
      label: 'Portal de apoderados',
      help: 'Habilita el acceso del portal para familias o apoderados.',
      example: 'Permitir consulta de estado general de seguimiento.',
      level: 'Operativo',
      levelClass: 'border-blue-200 bg-blue-100 text-blue-700',
    };
  }

  return {
    label: 'Función de plataforma',
    help: 'Controla la disponibilidad de esta capacidad en el colegio.',
    example: 'Habilitar o bloquear una función según necesidad operativa.',
    level: 'Operativo',
    levelClass: 'border-blue-200 bg-blue-100 text-blue-700',
  };
};
