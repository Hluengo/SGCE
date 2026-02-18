import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { ExpedienteFormValues } from './wizard.types';

/** Props para WizardStep2Gradualidad */
interface WizardStep2GradualidadProps {
  register: UseFormRegister<ExpedienteFormValues>;
  errors: FieldErrors<ExpedienteFormValues>;
  hasIncompleteGraduality: boolean;
}

/**
 * Paso 2 del wizard: Gradualidad.
 * Validación de acciones previas para procesos de expulsión.
 */
export const WizardStep2Gradualidad: React.FC<WizardStep2GradualidadProps> = ({
  register,
  hasIncompleteGraduality
}) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 flex items-start space-x-6 relative overflow-hidden">
        <AlertCircle className="w-10 h-10 text-amber-600 shrink-0" />
        <div>
          <h4 className="text-amber-900 font-black text-xs uppercase tracking-widest mb-2">
            Validación de Debido Proceso
          </h4>
          <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
            Para iniciar una medida de expulsión (Circular 782), la entidad educativa
            debe demostrar que la sanción es proporcional y precedida de medidas formativas.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center p-6 bg-white border-2 border-slate-100 rounded-2xl cursor-pointer hover:border-blue-200 transition-all group">
          <input
            type="checkbox"
            {...register('advertenciaEscrita')}
            className="w-6 h-6 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 mr-4"
          />
          <div>
            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
              ¿Existe Advertencia Escrita previa?
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
              Hito obligatorio de gradualidad
            </p>
          </div>
        </label>

        <label className="flex items-center p-6 bg-white border-2 border-slate-100 rounded-2xl cursor-pointer hover:border-blue-200 transition-all group">
          <input
            type="checkbox"
            {...register('planApoyoPrevio')}
            className="w-6 h-6 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 mr-4"
          />
          <div>
            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
              ¿Se implementó Plan de Apoyo Psicosocial?
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
              Requerido para sustentar la medida ante la SIE
            </p>
          </div>
        </label>
      </div>

      {hasIncompleteGraduality && (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center space-x-4 border-dashed animate-pulse">
          <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
          <div>
            <h5 className="font-black text-red-700 text-[10px] uppercase tracking-widest mb-1">
              ALERTA DE VULNERABILIDAD LEGAL
            </h5>
            <p className="text-[10px] text-red-600 font-bold leading-tight">
              Atenci&oacute;n: Iniciar expulsi&oacute;n sin acciones previas puede invalidar
              el proceso ante la SIE por falta de gradualidad.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WizardStep2Gradualidad;
