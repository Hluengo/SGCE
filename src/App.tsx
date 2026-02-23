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

const Dashboard = React.lazy(() => import('@/features/dashboard/Dashboard'));
const ExpedientesList = React.lazy(() => import('@/features/expedientes/ExpedientesList'));
const ExpedienteDetalle = React.lazy(() => import('@/features/expedientes/ExpedienteDetalle'));
const ExpedienteWizard = React.lazy(() => import('@/features/expedientes/ExpedienteWizard'));
const DashboardAuditoriaSIE = React.lazy(() => import('@/features/dashboard/DashboardAuditoriaSIE'));
const CentroMediacionGCC = React.lazy(() => import('@/features/mediacion/CentroMediacionGCC'));
const CalendarioPlazosLegales = React.lazy(() => import('@/features/legal/CalendarioPlazosLegales'));
const BitacoraPsicosocial = React.lazy(() => import('@/features/bitacora/BitacoraPsicosocial'));
const GestionEvidencias = React.lazy(() => import('@/features/evidencias/GestionEvidencias'));
const SeguimientoApoyo = React.lazy(() => import('@/features/apoyo/SeguimientoApoyo'));
const ArchivoDocumental = React.lazy(() => import('@/features/archivo/ArchivoDocumental'));
const ReportePatio = React.lazy(() => import('@/features/patio/ReportePatio'));
const ListaReportesPatio = React.lazy(() => import('@/features/patio/ListaReportesPatio'));
const LegalAssistant = React.lazy(() => import('@/features/legal/LegalAssistant'));
const PerfilUsuario = React.lazy(() => import('@/features/perfil/PerfilUsuario'));
const NuevaIntervencion = React.lazy(() => import('@/features/intervencion/NuevaIntervencion'));
const RegistrarDerivacion = React.lazy(() => import('@/features/derivacion/RegistrarDerivacion'));
const AuthPage = React.lazy(() => import('@/features/auth/AuthPage'));
const InicioPage = React.lazy(() => import('@/features/home/InicioPage'));
const SuperAdminPage = React.lazy(() => import('@/features/admin/SuperAdminPage'));
const AdminColegios = React.lazy(() => import('@/features/admin/AdminColegios'));

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
  const [loadLegalAssistant, setLoadLegalAssistant] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadLegalAssistant(false);
      return;
    }

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const enableAssistant = () => setLoadLegalAssistant(true);

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => {
        timeoutId = window.setTimeout(enableAssistant, 6000);
      }, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(enableAssistant, 7000);
    }

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
    };
  }, [isAuthenticated]);

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
        {isAuthenticated && loadLegalAssistant && <LegalAssistant />}
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
                  <div
                    role="alert"
                    className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-slate-900 text-xs font-black text-center py-2"
                    style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
                  >
                    Modo offline: algunas funciones pueden no estar disponibles.
                  </div>
                )}
                <div className={isOnline ? '' : 'pt-10'}>
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
