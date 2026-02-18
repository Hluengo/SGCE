import React from 'react';

/**
 * Variantes de estilo disponibles para el botón
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Tamaños disponibles para el botón
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props del componente Button
 * @interface
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variante de estilo del botón
   * @default 'primary'
   * @example 'primary' | 'secondary' | 'danger' | 'ghost'
   */
  variant?: ButtonVariant;

  /**
   * Tamaño del botón
   * @default 'md'
   * @example 'sm' | 'md' | 'lg'
   */
  size?: ButtonSize;

  /**
   * Estado de carga del botón
   * Muestra un spinner y deshabilita interacción
   * @default false
   */
  isLoading?: boolean;

  /**
   * Contenido del botón
   */
  children: React.ReactNode;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Deshabilita el botón
   */
  disabled?: boolean;

  /**
   * Tipo de botón HTML
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Manejador de clic
   */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * Componente Button - Botón reutilizable con variantes de estilo
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Guardar
 * </Button>
 * ```
 *
 * @example
 * ```tsx
 * <Button variant="danger" isLoading>
 *   Eliminando...
 * </Button>
 * ```
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  /** Estilos base del botón */
  const baseStyles = 'font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center space-x-2';

  /** Estilos por variante */
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xl',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };

  /** Estilos por tamaño */
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-[10px] rounded-lg',
    md: 'px-4 py-3 text-xs rounded-xl',
    lg: 'px-6 py-4 text-sm rounded-2xl',
  };

  return (
    <button
      type={type}
      className={[
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].join(' ')}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Procesando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
