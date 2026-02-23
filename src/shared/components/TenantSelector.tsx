import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { useTenant } from '@/shared/context/TenantContext';
import useAuth from '@/shared/hooks/useAuth';

/**
 * TenantSelector - Componente de selector de colegio en el sidebar
 * 
 * Permite cambiar entre colegios disponibles para admins/sostenedores
 * Muestra el nombre del colegio actual y permite切换
 */
export const TenantSelector: React.FC = () => {
  const { 
    establecimiento, 
    tenantId, 
    setTenantId, 
    establecimientosDisponibles,
    isLoading 
  } = useTenant();
  const { tieneAlgunPermiso } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Solo mostrar para admins/sostenedores
  const canSwitch = tieneAlgunPermiso(['system:manage', 'tenants:gestionar']);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cambiar de tenant
  const handleTenantChange = async (newTenantId: string) => {
    if (newTenantId === tenantId) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);
    try {
      setTenantId(newTenantId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error cambiando de tenant:', error);
    } finally {
      setIsChanging(false);
    }
  };

  // Si está cargando o no hay establecimiento
  if (isLoading) {
    return (
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-2 text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-xs">Cargando...</span>
        </div>
      </div>
    );
  }

  // Si no hay establecimiento o no hay múltiples opciones
  if (!establecimiento || !canSwitch || establecimientosDisponibles.length <= 1) {
    return (
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-2 text-slate-300">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium truncate">
            {establecimiento?.nombre || 'Sin establecimiento'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-slate-700" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`
          w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2 rounded-lg
          transition-all duration-200
          ${isOpen 
            ? 'bg-blue-600/20 text-white ring-1 ring-blue-500' 
            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white'
          }
          ${isChanging ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium truncate text-left">
            {establecimiento.nombre}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="mt-2 py-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden"
          role="listbox"
        >
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700">
            Cambiar Colegio
          </div>
          <div className="max-h-60 overflow-y-auto">
            {establecimientosDisponibles.map((est) => (
              <button
                key={est.id}
                onClick={() => handleTenantChange(est.id)}
                disabled={isChanging}
                className={`
                  w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2.5 text-sm
                  transition-colors duration-150
                  ${est.id === tenantId 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
                role="option"
                aria-selected={est.id === tenantId}
              >
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="font-medium truncate">{est.nombre}</span>
                  {est.rbd && (
                    <span className="text-xs text-slate-500">RBD: {est.rbd}</span>
                  )}
                </div>
                {est.id === tenantId && (
                  <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSelector;
