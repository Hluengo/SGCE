import React from 'react';
import { User } from 'lucide-react';

/** Props para EstudianteBadge */
interface EstudianteBadgeProps {
  nombre: string;
  curso?: string | null;
  rut?: string | null;
  programaPie?: boolean | null;
  alertaNee?: boolean | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * Componente para mostrar información de estudiante con formato consistente.
 * Siempre incluye el curso para desambiguación y trazabilidad.
 */
export const EstudianteBadge: React.FC<EstudianteBadgeProps> = ({
  nombre,
  curso,
  rut,
  programaPie,
  alertaNee,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  // Construir el texto a mostrar
  const displayText = curso 
    ? `${nombre} (${curso})` 
    : nombre;

  // Clases según tamaño
  const sizeClasses = {
    sm: {
      container: 'text-xs',
      icon: 'w-4 h-4',
      badge: 'px-1.5 py-0.5 text-[10px]'
    },
    md: {
      container: 'text-sm',
      icon: 'w-5 h-5',
      badge: 'px-2 py-0.5 text-xs'
    },
    lg: {
      container: 'text-base',
      icon: 'w-6 h-6',
      badge: 'px-2.5 py-1 text-sm'
    }
  };

  // Color del icono según flags
  const getIconColor = () => {
    if (alertaNee) return 'bg-red-100 text-red-600';
    if (programaPie) return 'bg-blue-100 text-blue-600';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div className={`rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor()}`}>
          <User className={sizeClasses[size].icon} />
        </div>
      )}
      
      <div className="flex flex-col min-w-0">
        <span className={`font-bold text-slate-900 truncate ${sizeClasses[size].container}`}>
          {displayText}
        </span>
        {rut && (
          <span className="text-xs text-slate-500">
            RUT: {rut}
          </span>
        )}
      </div>

      {/* Badges de estado */}
      <div className="flex gap-1 flex-shrink-0">
        {programaPie && (
          <span className={`bg-blue-100 text-blue-700 font-bold rounded-full flex items-center gap-0.5 ${sizeClasses[size].badge}`}>
            PIE
          </span>
        )}
        {alertaNee && (
          <span className={`bg-red-100 text-red-700 font-bold rounded-full flex items-center gap-0.5 ${sizeClasses[size].badge}`}>
            NEE
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Helper para formatear nombre desde objeto estudiante de Supabase
 */
export const formatEstudianteDisplay = (
  estudiante: { nombre_completo?: string | null; curso?: string | null }
): string => {
  const nombre = estudiante.nombre_completo || 'Sin nombre';
  const curso = estudiante.curso;
  
  if (curso) {
    return `${nombre} (${curso})`;
  }
  return nombre;
};

export default EstudianteBadge;
