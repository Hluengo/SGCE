import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { StepConfig } from './wizard.types';

/** Props para WizardProgressBar */
interface WizardProgressBarProps {
  stepsConfig: StepConfig[];
  activeIndex: number;
}

/**
 * Barra de progreso visual del wizard.
 * Muestra indicadores de cada paso con estado de completado.
 */
export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  stepsConfig,
  activeIndex
}) => {
  return (
    <div className="px-4 md:px-12 py-4 bg-slate-50 border-b border-slate-100">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
        {stepsConfig.map((s, idx) => (
          <div
            key={s.id}
            className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
              activeIndex === idx
                ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg'
                : idx < activeIndex
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-slate-400 border-2 border-slate-200'
            }`}
          >
            {idx < activeIndex ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              idx + 1
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WizardProgressBar;
