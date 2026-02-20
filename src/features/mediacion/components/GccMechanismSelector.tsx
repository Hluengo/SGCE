/**
 * GccMechanismSelector - Selector de mecanismo de mediación reutilizable
 *
 * Función: Permitir selección entre 3 mecanismos GCC de forma compacta
 * Props: valor seleccionado, callback onChange
 * Uso: Sidebar de control principal
 */

import React from 'react';
import { MessageSquare, Scale, Gavel } from 'lucide-react';
import type { MecanismoGCC } from './index';

interface GccMechanismSelectorProps {
  value: MecanismoGCC | null;
  onChange: (mecanismo: MecanismoGCC) => void;
  disabled?: boolean;
}

interface MechanismOption {
  value: MecanismoGCC;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const MECHANISMS: MechanismOption[] = [
  {
    value: 'MEDIACION',
    label: 'Mediación',
    description: 'Tercero neutral facilitador',
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    value: 'CONCILIACION',
    label: 'Conciliación',
    description: 'Propuestas de solución',
    icon: <Scale className="w-5 h-5" />
  },
  {
    value: 'ARBITRAJE_PEDAGOGICO',
    label: 'Arbitraje',
    description: 'Resolución institucional',
    icon: <Gavel className="w-5 h-5" />
  }
];

export const GccMechanismSelector: React.FC<GccMechanismSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 space-y-3 transition-all duration-200 hover:shadow-xl"
      role="radiogroup"
      aria-label="Selección de mecanismo de resolución"
    >
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight" id="mechanism-selector-label">
        Mecanismo
      </h3>

      <div className="space-y-2" role="group" aria-labelledby="mechanism-selector-label">
        {MECHANISMS.map((mechanism) => (
          <button
            key={mechanism.value}
            disabled={disabled}
            onClick={() => onChange(mechanism.value)}
            role="radio"
            aria-checked={value === mechanism.value}
            aria-label={`${mechanism.label}: ${mechanism.description}`}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!disabled) onChange(mechanism.value);
              }
            }}
            className={`w-full p-3.5 rounded-lg border-2 transition-all duration-200 text-left flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              value === mechanism.value
                ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 hover:scale-[1.01]'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              value === mechanism.value
                ? 'bg-blue-600 text-white scale-110'
                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
            }`} aria-hidden="true">
              {mechanism.icon}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 uppercase leading-tight">
                {mechanism.label}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {mechanism.description}
              </p>
            </div>

            {value === mechanism.value && (
              <div 
                className="text-blue-600 text-sm font-bold flex-shrink-0"
                aria-hidden="true"
              >
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
