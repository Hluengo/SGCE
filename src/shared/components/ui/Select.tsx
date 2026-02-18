import React from 'react';

/**
 * Opción del componente Select
 */
interface SelectOption {
  /**
   * Valor de la opción
   */
  value: string;

  /**
   * Etiqueta visible de la opción
   */
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Etiqueta del campo
   */
  label?: string;

  /**
   * Mensaje de error
   */
  error?: string;

  /**
   * Opciones disponibles
   * @required
   */
  options: SelectOption[];

  /**
   * Placeholder cuando no hay selección
   * @default 'Seleccionar...'
   */
  placeholder?: string;
}

/**
 * Componente Select - Campo de selección desplegable
 *
 * @example
 * ```tsx
 * <Select
 *   label="Estado"
 *   options={[
 *     { value: 'pendiente', label: 'Pendiente' },
 *     { value: 'proceso', label: 'En proceso' },
 *     { value: 'completado', label: 'Completado' },
 *   ]}
 *   error={errors.estado}
 * />
 */
const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder = 'Seleccionar...',
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
      <select
        className={`
          w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold
          focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all appearance-none
          ${error 
            ? 'border-red-300 focus:border-red-500' 
            : 'border-slate-200 focus:border-blue-500'
          }
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default Select;
