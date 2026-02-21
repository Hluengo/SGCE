import { AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
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

export const SuperAdminHero: React.FC = () => (
  <header className="flex items-center gap-4 rounded-[0.75rem] border border-slate-200 bg-white p-4 md:p-5 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.18)]">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,0.65)]">
      <Shield className="h-8 w-8" />
    </div>
    <div className="min-w-0">
      <h1 className="truncate text-[2rem] leading-tight font-extrabold tracking-[-0.02em] text-slate-900">
        Panel Integral Multi-Tenant
      </h1>
      <p className="truncate text-lg font-semibold text-indigo-700">
        Gestión central de tenants, usuarios, permisos y operación
      </p>
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
}> = ({ tenantMetrics, totalFlags, ui }) => {
  const tenantInactiveRate = tenantMetrics.totalTenants > 0
    ? Math.round(((tenantMetrics.totalTenants - tenantMetrics.activeTenants) / tenantMetrics.totalTenants) * 100)
    : 0;
  const userInactiveRate = tenantMetrics.totalUsers > 0
    ? Math.round((tenantMetrics.inactiveUsers / tenantMetrics.totalUsers) * 100)
    : 0;
  const criticalIncidents = tenantMetrics.deletedProfiles + tenantMetrics.deactivatedProfiles;

  const status: 'SALUDABLE' | 'ATENCION' | 'CRITICO' =
    tenantInactiveRate >= 40 || userInactiveRate >= 35
      ? 'CRITICO'
      : tenantInactiveRate >= 20 || userInactiveRate >= 20 || criticalIncidents >= 10
        ? 'ATENCION'
        : 'SALUDABLE';

  const statusClass = status === 'SALUDABLE'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'ATENCION'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-rose-100 text-rose-700';

  return (
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
    <article className={`${ui.card} p-4 md:col-span-2 xl:col-span-2`}>
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Semáforo operativo</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-black uppercase ${statusClass}`}>{status}</span>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Tenants inactivos: {tenantInactiveRate}% | Usuarios inactivos: {userInactiveRate}%
      </p>
    </article>
  </section>
  );
};

export const SuperAdminTabs: React.FC<{
  activeTab: SuperAdminTab;
  onChange: (tab: SuperAdminTab) => void;
  ui: Pick<UiClasses, 'card' | 'buttonAction' | 'buttonSecondary'>;
}> = ({ activeTab, onChange, ui }) => (
  <nav className={`${ui.card} p-2 flex flex-wrap gap-2 sticky top-2 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/90`} aria-label="Secciones de administración">
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
  <div className="fixed top-6 right-6 z-50 flex w-[min(92vw,24rem)] flex-col gap-2">
    {toasts.map((toast) => (
      <button
        key={toast.id}
        onClick={() => onDismiss(toast.id)}
        className={`w-full rounded-[0.75rem] border px-4 py-3 text-left text-xs shadow-lg transition ${
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
