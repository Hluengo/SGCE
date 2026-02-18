import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/** Configuración de breadcrumbs por ruta */
interface BreadcrumbItem {
  label: string;
  path?: string;
}

const breadcrumbConfig: Record<string, BreadcrumbItem[]> = {
  '/': [{ label: 'Dashboard', path: '/' }],
  '/expedientes': [{ label: 'Dashboard', path: '/' }, { label: 'Expedientes' }],
  '/expedientes/nuevo': [{ label: 'Dashboard', path: '/' }, { label: 'Expedientes', path: '/expedientes' }, { label: 'Nuevo Expediente' }],
  '/evidencias': [{ label: 'Dashboard', path: '/' }, { label: 'Evidencias' }],
  '/mediacion': [{ label: 'Dashboard', path: '/' }, { label: 'Mediación GCC' }],
  '/calendario': [{ label: 'Dashboard', path: '/' }, { label: 'Calendario' }],
  '/apoyo': [{ label: 'Dashboard', path: '/' }, { label: 'Acompañamiento' }],
  '/archivo': [{ label: 'Dashboard', path: '/' }, { label: 'Archivo' }],
  '/auditoria': [{ label: 'Dashboard', path: '/' }, { label: 'Auditoría SIE' }],
  '/patio': [{ label: 'Dashboard', path: '/' }, { label: 'Reportes Patio' }],
  '/patio/lista': [{ label: 'Dashboard', path: '/' }, { label: 'Reportes Patio', path: '/patio' }, { label: 'Lista' }],
  '/bitacora': [{ label: 'Dashboard', path: '/' }, { label: 'Bitácora Psicosocial' }],
  '/bitacora/intervencion': [{ label: 'Dashboard', path: '/' }, { label: 'Bitácora Psicosocial', path: '/bitacora' }, { label: 'Nueva Intervención' }],
  '/bitacora/derivacion': [{ label: 'Dashboard', path: '/' }, { label: 'Bitácora Psicosocial', path: '/bitacora' }, { label: 'Registrar Derivación' }],
};

/** Generar breadcrumbs dinámicamente para rutas con parámetros */
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Verificar si hay una coincidencia exacta
  if (breadcrumbConfig[pathname]) {
    return breadcrumbConfig[pathname];
  }

  // Manejar rutas con IDs (ej: /expedientes/EXP-2025-001)
  const dynamicRoutes = ['/expedientes/', '/patio/lista/', '/bitacora/'];
  
  for (const route of dynamicRoutes) {
    if (pathname.startsWith(route)) {
      const baseRoute = pathname.substring(0, pathname.lastIndexOf('/'));
      const id = pathname.substring(pathname.lastIndexOf('/') + 1);
      
      if (breadcrumbConfig[baseRoute]) {
        return [
          ...breadcrumbConfig[baseRoute],
          { label: id }
        ];
      }
    }
  }

  // Por defecto, solo dashboard
  return [{ label: 'Dashboard', path: '/' }];
};

/** Componente Breadcrumb */
export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  if (breadcrumbs.length <= 1) {
    return null; // No mostrar si solo hay Dashboard
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <ol className="flex items-center gap-1 list-none m-0 p-0">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={item.path || index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
              )}
              
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-slate-600 font-medium truncate max-w-[200px]"
                >
                  {item.label}
                </span>
              ) : item.path ? (
                <NavLink
                  to={item.path}
                  className="text-slate-500 hover:text-blue-600 transition-colors truncate max-w-[200px]"
                >
                  {item.label}
                </NavLink>
              ) : (
                <span className="text-slate-500 truncate max-w-[200px]">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/** Versión simplificada con icono home */
export const BreadcrumbWithHome: React.FC = () => {
  const breadcrumbs = generateBreadcrumbs(window.location.pathname);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <ol className="flex items-center gap-1 list-none m-0 p-0">
        <li>
          <NavLink
            to="/"
            aria-label="Ir al Dashboard"
            className="text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
          </NavLink>
        </li>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={item.path || index} className="flex items-center gap-1">
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
              
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-slate-800 font-semibold truncate max-w-[200px]"
                >
                  {item.label}
                </span>
              ) : item.path ? (
                <NavLink
                  to={item.path}
                  className="text-slate-500 hover:text-blue-600 transition-colors truncate"
                >
                  {item.label}
                </NavLink>
              ) : (
                <span className="text-slate-500 truncate">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
