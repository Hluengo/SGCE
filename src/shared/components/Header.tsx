import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { useAuth } from '@/shared/hooks';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard Principal',
  '/expedientes': 'Gestion de Expedientes',
  '/auditoria': 'Auditoria SIE',
  '/mediacion': 'Mediacion GCC',
  '/calendario': 'Calendario Normativo',
  '/bitacora': 'Bitacora Psicosocial',
  '/evidencias': 'Gestion de Evidencias',
  '/apoyo': 'Acompanamiento Estudiantil',
  '/archivo': 'Archivo Sostenedor',
  '/patio': 'Reporte Inicial Patio',
  '/admin': 'Superadministracion',
};

const Header: React.FC = () => {
  const { expedienteSeleccionado } = useConvivencia();
  const location = useLocation();
  const { establecimiento } = useTenant();
  const { usuario, signOut, tieneAlgunPermiso } = useAuth();

  const getBreadcrumb = (): string => {
    if (expedienteSeleccionado) {
      return `Expedientes > Detalle ${expedienteSeleccionado.id}`;
    }
    return routeLabels[location.pathname] || 'Inicio';
  };

  return (
    <header className="min-h-16 md:h-16 bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm z-10 shrink-0">
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Modulo:</span>
        <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 uppercase">
          {getBreadcrumb()}
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        <div className="flex items-center text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 font-bold uppercase tracking-tighter">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
          {establecimiento?.nombre ?? 'Tenant no resuelto'}
        </div>

        {tieneAlgunPermiso(['system:manage', 'tenants:gestionar']) && (
          <Link to="/admin" className="text-xs font-black uppercase tracking-widest bg-cyan-600 text-white px-3 py-2 rounded-lg hover:bg-cyan-700 transition-colors">
            Panel Admin
          </Link>
        )}

        <span className="text-xs font-black text-slate-600 uppercase tracking-tight">
          {usuario?.nombre} {usuario?.apellido}
        </span>

        <button
          onClick={() => void signOut()}
          className="text-xs font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-2 rounded-lg"
        >
          Cerrar sesion
        </button>
      </div>
    </header>
  );
};

export default Header;

