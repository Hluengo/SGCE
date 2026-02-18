import React from 'react';

interface BadgeProps {
  /**
   * Contenido de la etiqueta
   */
  children: React.ReactNode;

  /**
   * Variante visual del badge
   * @default 'default'
   */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';

  /**
   * Tamaño del badge
   * @default 'md'
   */
  size?: 'sm' | 'md';

  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * Componente Badge - Etiquetas y estados visuales
 *
 * @example
 * ```tsx
 * <Badge variant="success">Activo</Badge>
 * <Badge variant="warning">Pendiente</Badge>
 * <Badge variant="danger">Urgente</Badge>
 * <Badge variant="info">Nuevo</Badge>
 *
 * @example
 * ```tsx
 * <Badge size="sm" variant="default">9px</Badge>
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-3 py-1 text-[10px]',
  };

  return (
    <span className={`
      inline-flex items-center font-black uppercase tracking-wider rounded-full border
      ${variants[variant]} ${sizes[size]} ${className}
    `}>
      {children}
    </span>
  );
};

export default Badge;
