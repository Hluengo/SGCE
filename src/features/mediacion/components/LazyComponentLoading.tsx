/**
 * LazyComponentLoading - Loading Placeholder para componentes lazy-loaded
 * 
 * Muestra skeleton/spinner mientras el componente se carga
 */

import React from 'react';
import { Loader } from 'lucide-react';

interface LazyLoadingProps {
  label?: string;
}

export const LazyComponentLoading: React.FC<LazyLoadingProps> = ({ label = 'Cargando...' }) => {
  return (
    <div className="flex items-center justify-center p-8 md:p-12">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
        <p className="text-sm font-black text-slate-600 uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
};

export default LazyComponentLoading;
