import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Calendar,
  Heart,
  Image as ImageIcon,
  HeartHandshake,
  Library,
  ClipboardList,
  FileStack,
  ChevronDown,
  Hand,
  Settings,
  Building2,
} from 'lucide-react';
import useAuth from '@/shared/hooks/useAuth';

type NavCategory = 'PRINCIPAL' | 'REGISTRO' | 'GESTION' | 'ADMIN';

interface ExpandableItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: NavCategory;
  defaultOpen?: boolean;
  submenu: {
    name: string;
    path: string;
    action?: 'modal';
  }[];
}

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  category: NavCategory;
  description?: string;
  requiredAnyPermissions?: Array<Parameters<ReturnType<typeof useAuth>['tienePermiso']>[0]>;
  requiredAllPermissions?: Array<Parameters<ReturnType<typeof useAuth>['tienePermiso']>[0]>;
}

const expandableItems: ExpandableItem[] = [];

const baseMenuItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', category: 'PRINCIPAL', requiredAnyPermissions: ['expedientes:leer', 'dashboard:analitica:ver'] },
  { name: 'Reportes Patio', icon: ClipboardList, path: '/patio/lista', category: 'REGISTRO', requiredAnyPermissions: ['reportes:generar', 'reportes:exportar'] },
  { name: 'Bitácora Psicosocial', icon: Heart, path: '/bitacora', category: 'REGISTRO', requiredAllPermissions: ['bitacora:ver'] },
  { name: 'Expedientes', icon: FileStack, path: '/expedientes', category: 'GESTION', requiredAllPermissions: ['expedientes:leer'] },
  { name: 'Evidencias', icon: ImageIcon, path: '/evidencias', category: 'GESTION', requiredAnyPermissions: ['documentos:subir', 'expedientes:leer'] },
  { name: 'Gestión Colaborativa (GCC)', icon: Users, path: '/mediacion', category: 'GESTION', requiredAllPermissions: ['expedientes:leer'] },
  { name: 'Calendario', icon: Calendar, path: '/calendario', category: 'ADMIN', requiredAllPermissions: ['expedientes:leer'] },
  { name: 'Acompañamiento', icon: HeartHandshake, path: '/apoyo', category: 'ADMIN', requiredAllPermissions: ['expedientes:leer'] },
  { name: 'Archivo Sostenedor', icon: Library, path: '/archivo', category: 'ADMIN', requiredAllPermissions: ['archivo:sostenedor:ver'] },
  { name: 'Auditoría SIE', icon: ShieldAlert, path: '/auditoria', category: 'ADMIN', requiredAllPermissions: ['sie:ver'] },
];

const getCategoryLabel = (category: NavCategory): string => {
  const labels: Record<NavCategory, string> = {
    PRINCIPAL: 'Principal',
    REGISTRO: 'Registro e Incidentes',
    GESTION: 'Gestión de Convivencia',
    ADMIN: 'Administración',
  };
  return labels[category];
};

interface SidebarNavProps {
  isCollapsed: boolean;
  onNavigate?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ isCollapsed, onNavigate }) => {
  const location = useLocation();
  const { tieneAlgunPermiso, tieneTodosLosPermisos } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const menuItems = [...baseMenuItems];
  if (tieneAlgunPermiso(['system:manage', 'tenants:gestionar'])) {
    menuItems.push({
      name: 'Superadmin',
      icon: Settings,
      path: '/admin',
      category: 'ADMIN',
      description: 'Gestión central',
    });
    menuItems.push({
      name: 'Colegios',
      icon: Building2,
      path: '/admin/colegios',
      category: 'ADMIN',
      description: 'Gestionar establecimientos',
    });
  }

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.requiredAllPermissions?.length) {
      return tieneTodosLosPermisos(item.requiredAllPermissions);
    }
    if (item.requiredAnyPermissions?.length) {
      return tieneAlgunPermiso(item.requiredAnyPermissions);
    }
    return true;
  });

  const groupedItems = visibleMenuItems.reduce<Record<NavCategory, NavItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<NavCategory, NavItem[]>);

  const categoryOrder: NavCategory[] = ['PRINCIPAL', 'REGISTRO', 'GESTION', 'ADMIN'];

  const groupedExpandable = expandableItems.reduce<Record<NavCategory, ExpandableItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<NavCategory, ExpandableItem[]>);

  // Evita doble marcado (ej: /admin y /admin/colegios al mismo tiempo)
  const activePath = visibleMenuItems
    .filter((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  return (
    <nav className="flex-1 overflow-y-auto py-4" aria-label="Navegación principal">
      <ul className="space-y-1 px-3">
        {categoryOrder.map((category) => {
          const expandableInCategory = groupedExpandable[category] || [];
          const itemsInCategory = groupedItems[category] || [];

          return (
            <React.Fragment key={category}>
              {!isCollapsed && (expandableInCategory.length > 0 || itemsInCategory.length > 0) && (
                <li className="pt-4 pb-2 first:pt-0">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest px-3">
                    {getCategoryLabel(category)}
                  </span>
                </li>
              )}

              {expandableInCategory.map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedItems[item.name];
                const pathname = location.pathname;
                const isItemActive = item.submenu.some(sub => pathname === sub.path);
                const submenuId = `submenu-${item.name.replace(/\s+/g, '-')}`;

                return (
                  <li key={item.name}>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      aria-expanded={isExpanded}
                      aria-controls={submenuId}
                      className={`w-full min-h-11 group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isItemActive || isExpanded
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${isItemActive || isExpanded ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      {!isCollapsed && (
                        <>
                          <div className="flex flex-col flex-1 text-left">
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </>
                      )}
                    </button>

                    {!isCollapsed && isExpanded && (
                      <ul id={submenuId} className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-3" role="list">
                        {item.submenu.map((sub) => {
                          const pathname = location.pathname;
                          const isSubActive = pathname === sub.path;

                          return (
                            <li key={sub.path}>
                              <NavLink
                                to={sub.path}
                                onClick={onNavigate}
                                aria-label={sub.name}
                                className={`min-h-11 flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${isSubActive
                                  ? 'bg-blue-500/20 text-blue-400 font-medium'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                  }`}
                              >
                                {sub.action === 'modal' && <Hand className="w-4 h-4" aria-hidden="true" />}
                                <span>{sub.name}</span>
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}

              {itemsInCategory.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.path;

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onNavigate}
                      aria-label={item.name}
                      className={`group min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      {!isCollapsed && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-slate-400 group-hover:text-slate-300">
                              {item.description}
                            </span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </React.Fragment>
          );
        })}
      </ul>
    </nav>
  );
};

export default SidebarNav;

