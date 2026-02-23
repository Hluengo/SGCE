/**
 * WizardModal - Asistente Modalizado para Cierre de Mediación
 * 
 * Responsabilidad: Guiar al usuario a través de los pasos de cierre
 *                  con validación progresiva
 * 
 * Pasos:
 * 1. Validación de compromisos
 * 2. Confirmación de datos
 * 3. Generación de acta
 * 4. Confirmación final y cierre
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Shield
} from 'lucide-react';

// ==================== TIPOS ====================

type WizardStep = 'validacion' | 'confirmacion' | 'acta' | 'final';

export interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (resultado: WizardResult) => void;
  
  // Data
  mediacionId: string;
  caseName: string;
  stageName: WizardStep;
  totalCompromisosRegistrados: number;
  totalCompromisosCompletados: number;
}

interface WizardResult {
  mediacionId: string;
  timestamp: string;
  pasoFinal: WizardStep;
  confirmado: boolean;
}

// ==================== COMPONENTE ====================

export const WizardModal: React.FC<WizardModalProps> = ({
  isOpen,
  onClose,
      onComplete,
      mediacionId,
      caseName,
  stageName,
  totalCompromisosRegistrados,
  totalCompromisosCompletados
}) => {
  const [currentStep, setCurrentStep] = useState<'validacion' | 'confirmacion' | 'acta' | 'final'>(stageName);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps: Array<{ id: WizardStep; title: string; icon: React.ReactNode }> = [
    { id: 'validacion', title: 'Validación', icon: <AlertCircle className="w-5 h-5" /> },
    { id: 'confirmacion', title: 'Confirmación', icon: <CheckCircle className="w-5 h-5" /> },
    { id: 'acta', title: 'Acta', icon: <FileText className="w-5 h-5" /> },
    { id: 'final', title: 'Cierre', icon: <Shield className="w-5 h-5" /> }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular procesamiento
      onComplete({
        mediacionId,
        timestamp: new Date().toISOString(),
        pasoFinal: currentStep,
        confirmado: true
      });
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.75rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.75rem)',
      }}
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92dvh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-blue-50">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
              Asistente de Cierre GCC
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">
              {caseName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Cerrar asistente"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 md:px-8 pt-6 pb-4">
          <div className="flex justify-between items-center gap-2">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex-1 min-h-11 py-3 px-4 rounded-xl text-center transition-all ${
                    currentStepIndex >= idx
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-black uppercase tracking-widest">
                    {step.title}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                    currentStepIndex > idx ? 'text-emerald-600' : 'text-slate-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          {currentStep === 'validacion' && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Validación de Requisitos
              </h3>
              
              <div className="space-y-4">
                {/* Validación 1: Compromisos */}
                <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-sm">Compromisos Registrados</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {totalCompromisosRegistrados} compromisos definidos
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black uppercase text-white">
                      ✓ Cumple
                    </span>
                  </div>
                </div>

                {/* Validación 2: Completitud */}
                <div className={`rounded-3xl border-2 p-4 ${
                  totalCompromisosCompletados > 0
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-amber-200 bg-amber-50'
                }`}>
                  <div className="flex items-start gap-4">
                    {totalCompromisosCompletados > 0 ? (
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-sm">Compromisos Completados</h4>
                      <p className={`text-xs mt-1 ${
                        totalCompromisosCompletados > 0
                          ? 'text-blue-600'
                          : 'text-amber-600'
                      }`}>
                        {totalCompromisosCompletados} de {totalCompromisosRegistrados} completados
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold uppercase tracking-widest text-slate-600">
                  ⓘ Se recomienda que al menos el 50% de los compromisos estén completados
                </div>
              </div>
            </div>
          )}

          {currentStep === 'confirmacion' && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Confirmación de Datos
              </h3>
              
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Caso</p>
                  <p className="text-sm font-black text-slate-900">{caseName}</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">ID Mediación</p>
                  <p className="text-sm font-mono text-slate-600">{mediacionId}</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Resumen</p>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li>• Total compromisos: <span className="font-bold">{totalCompromisosRegistrados}</span></li>
                    <li>• Completados: <span className="font-bold">{totalCompromisosCompletados}</span></li>
                    <li>• Pendientes: <span className="font-bold">{totalCompromisosRegistrados - totalCompromisosCompletados}</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'acta' && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Generación de Acta
              </h3>
              
              <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center space-y-4">
                <FileText className="w-12 h-12 text-emerald-600 mx-auto" />
                <div>
                  <p className="text-sm font-black text-slate-900">Acta en Proceso</p>
                  <p className="mt-2 text-xs text-slate-600">
                    El acta de mediación será generada con todos los compromisos registrados
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold uppercase tracking-widest text-blue-700">
                ✓ El sistema generará automáticamente el documento PDF al finalizar
              </div>
            </div>
          )}

          {currentStep === 'final' && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Confirmación Final
              </h3>
              
              <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-emerald-600" />
                  <p className="text-sm font-black text-slate-900">Listo para Cerrar</p>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">
                  Todos los requisitos han sido validados. El proceso de mediación será cerrado formalmente y el expediente disciplinario continuará su curso normal.
                </p>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-600">
                <p>✓ Compromisos validados</p>
                <p>✓ Acta generada</p>
                <p>✓ Datos confirmados</p>
                <p>✓ Listo para finalizar</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Botones de Navegación */}
        <div className="flex gap-4 p-6 md:p-8 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handlePrev}
            disabled={isFirstStep || isProcessing}
            className="flex items-center gap-2 px-6 py-3 min-h-11 rounded-xl font-black text-xs uppercase tracking-widest bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {!isLastStep ? (
            <button
              onClick={handleNext}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 min-h-11 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 min-h-11 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
            >
              {isProcessing ? 'Procesando...' : 'Finalizar Cierre'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(WizardModal);

