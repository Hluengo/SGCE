import { Activity, Building2, Database, LineChart, RefreshCw, Save, Settings2, ShieldCheck, Users, Wrench } from 'lucide-react';
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
}) => (
  <article className={`xl:col-span-2 ${ui.card} ${ui.cardPadding} space-y-4`}>
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
          <thead className={ui.tableHead}>
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
                  <button onClick={() => setTenantId(tenant.id)} className={tenant.id === tenantId ? ui.buttonAction : ui.buttonSecondary}>
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

export const SelectedTenantPanel: React.FC<{
  ui: UiClasses;
  tenantId: string | null;
  selectedTenantFlags: FeatureFlag[];
  toggleFeature: (featureId: string) => Promise<void>;
  runMaintenance: (action: string) => Promise<void>;
  maintenanceLogs: MaintenanceLog[];
}> = ({
  ui,
  tenantId,
  selectedTenantFlags,
  toggleFeature,
  runMaintenance,
  maintenanceLogs,
}) => (
  <article className={`${ui.card} ${ui.cardPadding} space-y-4`}>
    <h2 className={ui.cardTitle}><LineChart className="w-4 h-4 text-indigo-600" />Tenant seleccionado</h2>
    <p className={ui.muted}>{tenantId ? `ID: ${tenantId}` : 'Selecciona un tenant para editar funcionalidades.'}</p>

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

    <div className={`${ui.card} p-4 space-y-4`}>
      <h3 className={ui.cardTitle}><Activity className="w-4 h-4 text-indigo-600" />Monitorizacion y mantenimiento</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => void runMaintenance('Reindexar reportes')} className={ui.buttonPrimary}>Reindexar</button>
        <button onClick={() => void runMaintenance('Invalidar sesiones')} className={ui.buttonPrimary}>Sesiones</button>
        <button onClick={() => void runMaintenance('Backup incremental')} className={ui.buttonPrimary}>Backup</button>
        <button onClick={() => void runMaintenance('Reiniciar workers')} className={ui.buttonPrimary}>Workers</button>
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

    <div className={`${ui.card} p-4 text-xs text-slate-600 space-y-1`}>
      <p className="font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Settings2 className="w-4 h-4 text-indigo-600" />Arquitectura</p>
      <p>Aislamiento por tenant con `establecimiento_id` + filtros automáticos del cliente.</p>
      <p>Permisos granulares por perfil con override por tenant.</p>
      <p>Observabilidad y auditoria para cada accion de superadmin.</p>
    </div>

    <div className={`${ui.card} p-4 text-xs text-slate-600 space-y-1`}>
      <p className="font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Wrench className="w-4 h-4 text-indigo-600" />Backend</p>
      <p className="flex items-center gap-2"><Database className="w-3 h-3" />Listo para rotacion de claves, politicas de retencion y tareas operativas.</p>
    </div>
  </article>
);
