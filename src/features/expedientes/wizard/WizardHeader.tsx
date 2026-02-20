import React from 'react';
import { X } from 'lucide-react';
import { StepConfig } from './wizard.types';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import AssistantHeaderButton from '@/shared/components/AssistantHeaderButton';

/** Props para WizardHeader */
interface WizardHeaderProps {
  stepConfig: StepConfig;
  activeIndex: number;
  onClose: () => void;
}

/**
 * Header del wizard con icono del paso actual.
 */
export const WizardHeader: React.FC<WizardHeaderProps> = ({
  stepConfig,
  activeIndex,
  onClose
}) => {
  const Icon = stepConfig.icon;
  const { setIsAssistantOpen } = useConvivencia();

  return (
    <div className="p-4 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
      <div className="flex items-center space-x-4">
        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
            Paso {activeIndex + 1}: {stepConfig.title}
          </h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            Apertura de Expediente Normativo
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <AssistantHeaderButton onClick={() => setIsAssistantOpen(true)} />
        <button
          onClick={onClose}
          className="p-4 hover:bg-slate-200 rounded-full transition-colors text-slate-400 active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default WizardHeader;


