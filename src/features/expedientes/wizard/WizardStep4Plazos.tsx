import React from 'react';
import { Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

/** Valores del formulario */
interface ExpedienteFormValues {
  estudianteId: string;
  gravedad: 'LEVE' | 'RELEVANTE' | 'GRAVISIMA_EXPULSION';
  advertenciaEscrita: boolean;
  planApoyoPrevio: boolean;
  descripcionHechos: string;
  fechaIncidente: string;
  horaIncidente: string;
  lugarIncidente: string;
}

/** Props para WizardStep4Plazos */
interface WizardStep4PlazosProps {
  formData: ExpedienteFormValues;
  plazoCalculado: Date;
}

/**
 * Paso 4 del wizard: Cálculo de Plazos.
 * Muestra el cronograma legal basado en la gravedad de la falta.
 */
export const WizardStep4Plazos: React.FC<WizardStep4PlazosProps> = ({
  formData,
  plazoCalculado
}) => {
  const getPlazoLabel = (gravedad: string): string => {
    switch (gravedad) {
      case 'LEVE':
        return '24h';
      case 'RELEVANTE':
        return '2 meses';
      case 'GRAVISIMA_EXPULSION':
        return '10 días';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 text-center">
      <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner mb-6">
        <Clock className="w-10 h-10" />
      </div>

      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
        Cronograma Legal Estimado
      </h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
        Basado en Circular 782 para faltas: {formData.gravedad}
      </p>

      <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-8 space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Inicio Proceso
              </p>
              <p className="text-xs font-bold text-slate-800 uppercase">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                Vencimiento Fatal
              </p>
              <p className="text-sm font-black text-red-600 uppercase">
                {plazoCalculado.toLocaleDateString()} a las{' '}
                {plazoCalculado.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-red-100">
            Plazo: {getPlazoLabel(formData.gravedad)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WizardStep4Plazos;
