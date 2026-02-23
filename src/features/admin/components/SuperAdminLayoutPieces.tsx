import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import { AsyncState } from '@/shared/components/ui';

interface UiClasses {
  page: string;
  card: string;
  buttonAction: string;
  buttonSecondary: string;
}

export interface TenantMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  newUsers7d: number;
  inactiveUsers: number;
  adminUsers: number;
  deletedProfiles: number;
  deactivatedProfiles: number;
  enabledFeatures: number;
}

export type SuperAdminTab = 'overview' | 'profiles' | 'backend';

export interface ToastMessage {
  id: string;
  tone: 'success' | 'error';
  message: string;
}

export const SuperAdminHero: React.FC<{
  usuario: {
    nombre?: string | null;
    apellido?: string | null;
    rol?: string | null;
  } | null;
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

export const SuperAdminLoadingSkeleton: React.FC<{
  ui: Pick<UiClasses, 'page'>;
  themeVars: CSSProperties;
}> = ({ ui, themeVars }) => (
  <div className={ui.page} style={themeVars}>
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

export const SuperAdminErrorBanner: React.FC<{
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

export const SuperAdminMetricsGrid: React.FC<{
  tenantMetrics: TenantMetrics;
  totalFlags: number;
  ui: Pick<UiClasses, 'card'>;
}> = ({ tenantMetrics, totalFlags, ui }) => (
  <section className="grid md:grid-cols-2 xl:grid-cols-6 gap-4">
    <article className={`${ui.card} p-4`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Tenants</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.totalTenants}</p>
      <p className="text-xs text-emerald-600 font-bold mt-1">Activos: {tenantMetrics.activeTenants}</p>
    </article>
    <article className={`${ui.card} p-4`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Usuarios</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.totalUsers}</p>
      <p className="text-xs text-emerald-600 font-bold mt-1">Activos: {tenantMetrics.activeUsers}</p>
    </article>
    <article className={`${ui.card} p-4`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Nuevos (7 dias)</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.newUsers7d}</p>
      <p className="text-xs text-slate-500 mt-1">Basado en `perfiles.created_at`</p>
    </article>
    <article className={`${ui.card} p-4`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Inactivos</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.inactiveUsers}</p>
      <p className="text-xs text-amber-600 font-bold mt-1">Perfiles deshabilitados</p>
    </article>
    <article className={`${ui.card} p-4`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Roles Admin</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.adminUsers}</p>
      <p className="text-xs text-slate-500 mt-1">Superadmin, sostenedor, admin, director</p>
    </article>
    <article className={`${ui.card} p-4`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Bajas / Borrados</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.deactivatedProfiles} / {tenantMetrics.deletedProfiles}</p>
      <p className="text-xs text-slate-500 mt-1">Histórico desde auditoría</p>
    </article>
    <article className={`${ui.card} p-4 md:col-span-2 xl:col-span-2`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Features activas</p>
      <p className="text-2xl font-black text-slate-900 mt-2">{tenantMetrics.enabledFeatures}</p>
      <p className="text-xs text-slate-500 mt-1">Sobre {totalFlags} configuradas por tenant</p>
    </article>
  </section>
);

export const SuperAdminTabs: React.FC<{
  activeTab: SuperAdminTab;
  onChange: (tab: SuperAdminTab) => void;
  ui: Pick<UiClasses, 'card' | 'buttonAction' | 'buttonSecondary'>;
}> = ({ activeTab, onChange, ui }) => (
  <nav className={`${ui.card} p-2 flex flex-wrap gap-2`} aria-label="Secciones de administración">
    {[
      { id: 'overview', label: 'Vista general' },
      { id: 'profiles', label: 'Gestion de perfiles' },
      { id: 'backend', label: 'Configuracion backend' },
    ].map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id as SuperAdminTab)}
          className={isActive ? ui.buttonAction : ui.buttonSecondary}
          aria-current={isActive ? 'page' : undefined}
        >
          {tab.label}
        </button>
      );
    })}
  </nav>
);

export const SuperAdminToastStack: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => (
  <div
    className="fixed z-50 flex w-[min(92vw,24rem)] flex-col gap-2"
    style={{
      top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
      right: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
    }}
  >
    {toasts.map((toast) => (
      <button
        key={toast.id}
        onClick={() => onDismiss(toast.id)}
        className={`w-full min-h-11 rounded-[0.75rem] border px-4 py-3 text-left text-xs shadow-lg transition ${
          toast.tone === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}
      >
        <span className="inline-flex items-center gap-2 font-bold">
          {toast.tone === 'error' ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {toast.message}
        </span>
      </button>
    ))}
  </div>
);
