import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  /**
   * Contenido del alert
   * Puede ser texto o cualquier elemento React
   */
  children: React.ReactNode;

  /**
   * Variante visual del alert
   * @default 'info'
   */
  variant?: 'info' | 'success' | 'warning' | 'error';

  /**
   * Título del alert
   * Se muestra en negrita arriba del contenido
   */
  title?: string;

  /**
   * Callback opcional para cerrar el alert
   * Muestra un botón X cuando está definido
   */
  onClose?: () => void;

  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * Componente Alert para mensajes informativos, éxitos, advertencias y errores
 *
 * @example
 * ```tsx
 * <Alert variant="error" title="Error">
 *   Ha ocurrido un error al guardar los datos.
 * </Alert>
 *
 * @example
 * ```tsx
 * <Alert variant="success" title="Éxito">
 *   Los cambios se han guardado correctamente.
 * </Alert>
 *
 * @example
 * ```tsx
 * <Alert variant="warning" title="Advertencia">
 *   El plazo está por vencer.
 * </Alert>
 */
const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  onClose,
  className = '',
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-100',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-100',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      iconBg: 'bg-red-100',
    },
  };

  const style = variants[variant];

  return (
    <div className={`
      border rounded-2xl p-4 flex items-start gap-4
      ${style.container} ${className}
    `}>
      <div className={`shrink-0 p-2 rounded-lg ${style.iconBg}`}>
        {style.icon}
      </div>
      <div className="flex-1">
        {title && (
          <h4 className="font-black text-xs uppercase tracking-widest mb-1">
            {title}
          </h4>
        )}
        <div className="text-xs font-medium leading-relaxed">
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
