import React from 'react';

/**
 * Props del componente Input
 * @interface
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Etiqueta del campo
   * Se muestra encima del input
   */
  label?: string;

  /**
   * Mensaje de error
   * Se muestra en rojo debajo del input
   */
  error?: string;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Placeholder del campo
   */
  placeholder?: string;

  /**
   * Tipo de input HTML
   * @default 'text'
   */
  type?: string;

  /**
   * Valor del input
   */
  value?: string | number;

  /**
   * Nombre del campo
   */
  name?: string;

  /**
   * Manejador de cambio
   */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;

  /**
   * Deshabilita el input
   */
  disabled?: boolean;

  /**
   *.required - Indica si el campo es obligatorio
   */
  required?: boolean;
}

/**
 * Componente Input - Campo de formulario reutilizable
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="correo@ejemplo.com"
 *   error={errors.email}
 * />
 * ```
 */
const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          {label}
        </label>
      )}
      <input
        className={[
          'w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold',
          'focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all',
          error
            ? 'border-red-300 focus:border-red-500'
            : 'border-slate-200 focus:border-blue-500',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default Input;
