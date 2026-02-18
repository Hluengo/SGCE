import { Navigate } from 'react-router-dom';
import useAuth, { type Permiso } from '@/shared/hooks/useAuth';
import type { ReactElement } from 'react';

interface RequirePermissionProps {
  children: ReactElement;
  anyOf?: Permiso[];
  allOf?: Permiso[];
  fallbackPath?: string;
}

const RequirePermission = ({ children, anyOf, allOf, fallbackPath = '/' }: RequirePermissionProps) => {
  const { tieneAlgunPermiso, tieneTodosLosPermisos } = useAuth();

  if (allOf?.length && !tieneTodosLosPermisos(allOf)) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (anyOf?.length && !tieneAlgunPermiso(anyOf)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RequirePermission;
