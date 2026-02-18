import React from 'react';

interface CardProps {
  /**
   * Contenido de la tarjeta
   */
  children: React.ReactNode;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Tamaño del padding interno
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Habilita efecto hover
   * @default false
   */
  hover?: boolean;

  /**
   * Callback al hacer click en la tarjeta
   */
  onClick?: () => void;
}

/**
 * Componente Card - Contenedor reutilizable para contenido
 *
 * @example
 * ```tsx
 * <Card padding="md" hover onClick={() => console.log('click')}>
 *   <h3>Título de la tarjeta</h3>
 *   <p>Contenido de la tarjeta</p>
 * </Card>
 *
 * @example
 * ```tsx
 * <Card padding="none" className="border-0 shadow-none">
 *   Contenido sin padding
 * </Card>
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-3xl border border-slate-200 shadow-sm
        ${paddings[padding]}
        ${hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
