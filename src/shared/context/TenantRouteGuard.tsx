import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenant } from './TenantContext';

interface TenantRouteGuardProps {
  requiredTenant: string;
  children: ReactNode;
}

export const TenantRouteGuard = ({ requiredTenant, children }: TenantRouteGuardProps) => {
  const { tenantId } = useTenant();
  const location = useLocation();

  if (!tenantId || tenantId !== requiredTenant) {
    // Redirige si el tenant no coincide
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  return children;
};
