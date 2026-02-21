import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConvivenciaProvider, useConvivencia } from '@/shared/context/ConvivenciaContext';
import { TenantProvider } from '@/shared/context/TenantContext';
import { UIProvider } from '@/shared/context/providers/UIContext';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import Layout from '@/shared/components/Layout';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import { ToastProvider } from '@/shared/components/Toast/ToastProvider';
import { AuthStateCleanup } from '@/shared/components/auth/AuthStateCleanup';
import { SkeletonStats } from '@/shared/components/Skeleton/Skeleton';
import RequireAuth from '@/shared/components/auth/RequireAuth';
import RequirePermission from '@/shared/components/auth/RequirePermission';
import useAuth from '@/shared/hooks/useAuth';
import UnauthorizedPage from '@/features/UnauthorizedPage';

/**
 * React.lazy wrapper that retries a failed dynamic import once after a short
 * delay. Covers the common "stale chunk hash" scenario where the browser
 * still references an old chunk filename after a new deployment.
 */
function lazyWithRetry<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().catch((err) => {
      console.warn('[lazyWithRetry] first attempt failed, retrying…', err);
      return new Promise<{ default: T }>((resolve) => setTimeout(resolve, 1500)).then(() =>
        factory(),
      );
    }),
  );
}

const Dashboard = lazyWithRetry(() => import('@/features/dashboard/Dashboard'));
const ExpedientesList = lazyWithRetry(() => import('@/features/expedientes/ExpedientesList'));
const ExpedienteDetalle = lazyWithRetry(() => import('@/features/expedientes/ExpedienteDetalle'));
const ExpedienteWizard = lazyWithRetry(() => import('@/features/expedientes/ExpedienteWizard'));
const DashboardAuditoriaSIE = lazyWithRetry(() => import('@/features/dashboard/DashboardAuditoriaSIE'));
const CentroMediacionGCC = lazyWithRetry(() => import('@/features/mediacion/CentroMediacionGCC'));
const CalendarioPlazosLegales = lazyWithRetry(() => import('@/features/legal/CalendarioPlazosLegales'));
const BitacoraPsicosocial = lazyWithRetry(() => import('@/features/bitacora/BitacoraPsicosocial'));
const GestionEvidencias = lazyWithRetry(() => import('@/features/evidencias/GestionEvidencias'));
const SeguimientoApoyo = lazyWithRetry(() => import('@/features/apoyo/SeguimientoApoyo'));
const ArchivoDocumental = lazyWithRetry(() => import('@/features/archivo/ArchivoDocumental'));
const ReportePatio = lazyWithRetry(() => import('@/features/patio/ReportePatio'));
const ListaReportesPatio = lazyWithRetry(() => import('@/features/patio/ListaReportesPatio'));
const LegalAssistant = lazyWithRetry(() => import('@/features/legal/LegalAssistant'));
const PerfilUsuario = lazyWithRetry(() => import('@/features/perfil/PerfilUsuario'));
const NuevaIntervencion = lazyWithRetry(() => import('@/features/intervencion/NuevaIntervencion'));
const RegistrarDerivacion = lazyWithRetry(() => import('@/features/derivacion/RegistrarDerivacion'));
const AuthPage = lazyWithRetry(() => import('@/features/auth/AuthPage'));
const InicioPage = lazyWithRetry(() => import('@/features/home/InicioPage'));
const SuperAdminPage = lazyWithRetry(() => import('@/features/admin/SuperAdminPage'));
const AdminColegios = lazyWithRetry(() => import('@/features/admin/AdminColegios'));

const LoadingView: React.FC = () => (
  <div className="flex items-center justify-center h-full" role="status" aria-label="Cargando contenido">
    <div className="text-center space-y-4">
      <SkeletonStats items={4} />
      <p className="text-slate-400 text-sm font-medium animate-pulse">Cargando...</p>
    </div>
  </div>
);

const SuspendedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingView />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const AppRoutes: React.FC = () => {
  const { isWizardOpen } = useConvivencia();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/inicio" element={<SuspendedRoute><InicioPage /></SuspendedRoute>} />
        <Route path="/auth" element={<SuspendedRoute><AuthPage /></SuspendedRoute>} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<SuspendedRoute><Dashboard /></SuspendedRoute>} />
          <Route path="expedientes" element={<SuspendedRoute><ExpedientesList /></SuspendedRoute>} />
          <Route path="expedientes/:id" element={<SuspendedRoute><ExpedienteDetalle /></SuspendedRoute>} />
          <Route path="expedientes/:id/editar" element={<SuspendedRoute><ExpedienteDetalle /></SuspendedRoute>} />
          <Route
            path="auditoria"
            element={
              <RequirePermission allOf={['sie:ver']}>
                <SuspendedRoute><DashboardAuditoriaSIE /></SuspendedRoute>
              </RequirePermission>
            }
          />
          <Route path="mediacion" element={<SuspendedRoute><CentroMediacionGCC /></SuspendedRoute>} />
          <Route path="mediacion/gcc" element={<SuspendedRoute><CentroMediacionGCC /></SuspendedRoute>} />

          <Route path="calendario" element={<SuspendedRoute><CalendarioPlazosLegales /></SuspendedRoute>} />
          <Route
            path="bitacora/*"
            element={
              <RequirePermission allOf={['bitacora:ver']}>
                <SuspendedRoute><BitacoraPsicosocial /></SuspendedRoute>
              </RequirePermission>
            }
          />
          <Route path="evidencias" element={<SuspendedRoute><GestionEvidencias /></SuspendedRoute>} />
          <Route path="apoyo" element={<SuspendedRoute><SeguimientoApoyo /></SuspendedRoute>} />
          <Route
            path="archivo"
            element={
              <RequirePermission allOf={['archivo:sostenedor:ver']}>
                <SuspendedRoute><ArchivoDocumental /></SuspendedRoute>
              </RequirePermission>
            }
          />
          <Route path="patio" element={<SuspendedRoute><ReportePatio /></SuspendedRoute>} />
          <Route path="patio/lista" element={<SuspendedRoute><ListaReportesPatio /></SuspendedRoute>} />
          <Route path="intervencion/nueva" element={<SuspendedRoute><NuevaIntervencion /></SuspendedRoute>} />
          <Route path="derivacion/registrar" element={<SuspendedRoute><RegistrarDerivacion /></SuspendedRoute>} />
          <Route path="perfil" element={<SuspendedRoute><PerfilUsuario /></SuspendedRoute>} />
          <Route
            path="admin"
            element={
              <RequirePermission anyOf={['system:manage', 'tenants:gestionar']}>
                <SuspendedRoute>
                  <SuperAdminPage />
                </SuspendedRoute>
              </RequirePermission>
            }
          />
          <Route
            path="admin/config"
            element={
              <RequirePermission anyOf={['system:manage', 'tenants:gestionar']}>
                <SuspendedRoute>
                  <SuperAdminPage />
                </SuspendedRoute>
              </RequirePermission>
            }
          />
          <Route
            path="admin/colegios"
            element={
              <RequirePermission anyOf={['system:manage', 'tenants:gestionar']}>
                <SuspendedRoute>
                  <AdminColegios />
                </SuspendedRoute>
              </RequirePermission>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <Suspense fallback={null}>
        {isAuthenticated && isWizardOpen && <ExpedienteWizard />}
        {isAuthenticated && <LegalAssistant />}
      </Suspense>
    </>
  );
};

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <TenantProvider>
        <ThemeProvider>
          <UIProvider>
            <ConvivenciaProvider>
              <ToastProvider>
                <AuthStateCleanup />
                {!isOnline && (
                  <div role="alert" className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-slate-900 text-xs font-black text-center py-2">
                    Modo offline: algunas funciones pueden no estar disponibles.
                  </div>
                )}
                <div className={isOnline ? '' : 'pt-8'}>
                  <AppRoutes />
                </div>
              </ToastProvider>
            </ConvivenciaProvider>
          </UIProvider>
        </ThemeProvider>
      </TenantProvider>
    </BrowserRouter>
  );
};

export default App;
