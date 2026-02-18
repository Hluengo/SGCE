import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/shared/hooks/useAuth';
import type { ReactElement } from 'react';

interface RequireAuthProps {
  children: ReactElement;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        <p className="text-xs font-black uppercase tracking-wider">Validando sesion...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />;
  }

  return children;
};

export default RequireAuth;
