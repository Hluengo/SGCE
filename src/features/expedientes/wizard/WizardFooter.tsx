import React from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { StepConfig } from './wizard.types';

/** Props para WizardFooter */
interface WizardFooterProps {
  activeIndex: number;
  stepsConfig: StepConfig[];
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
}

/**
 * Footer del wizard con botones de navegación.
 */
export const WizardFooter: React.FC<WizardFooterProps> = ({
  activeIndex,
  stepsConfig,
  onNext,
  onBack,
  onClose,
  isNextDisabled = false,
  isSubmitting = false
}) => {
  const isFirstStep = activeIndex === 0;
  const isLastStep = activeIndex === stepsConfig.length - 1;

  return (
    <div className="p-4 md:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-6">
      <button
        type="button"
        onClick={isFirstStep ? onClose : onBack}
        className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95 flex items-center justify-center space-x-2"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{isFirstStep ? 'Anular' : 'Volver'}</span>
      </button>

      {isLastStep ? (
        <button
          type="submit"
          form="wizard-form"
          disabled={isSubmitting}
          className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isSubmitting ? 'Guardando...' : 'Finalizar Apertura'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className={`flex-1 py-4 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center space-x-2 active:scale-95 ${
            isNextDisabled
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
          }`}
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default WizardFooter;
