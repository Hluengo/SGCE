import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { SidebarNav } from './Sidebar/SidebarNav';
import { SidebarProfile } from './Sidebar/SidebarProfile';
import TenantSelector from './TenantSelector';
import { useTenantBranding } from '@/shared/hooks/useTenantBranding';

/**
 * Sidebar principal refactorizado.
 * Delega navegación a SidebarNav y perfil a SidebarProfile.
 */
const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('sidebar:collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const { branding } = useTenantBranding();

  // Guardar estado collapse en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sidebar:collapsed', String(isCollapsed));
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  // Toggle mobile
  const toggleMobile = () => setIsOpen(!isOpen);

  // Toggle collapse
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen bg-slate-900 border-r border-slate-700
          transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {branding?.logo_url ? (
              <img 
                src={branding.logo_url} 
                alt={branding.nombre_publico || 'Logo'} 
                className="h-12 w-auto object-contain flex-shrink-0 rounded"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-white truncate leading-tight">
                  {branding?.nombre_publico || 'Gestión'}
                </h1>
                <p className="text-xs text-slate-400 truncate">Convivencia Escolar</p>
              </div>
            )}
          </div>
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronsRight className="w-5 h-5" />
            ) : (
              <ChevronsLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <SidebarNav isCollapsed={isCollapsed} />

        {/* Tenant Selector */}
        <TenantSelector />

        {/* Profile */}
        <SidebarProfile isCollapsed={isCollapsed} />
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleMobile}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleMobile();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú lateral"
        />
      )}
    </>
  );
};

export default Sidebar;

