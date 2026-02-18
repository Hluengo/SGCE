import React from 'react';
import { ExpedienteFormValues } from './wizard.types';
import NormativeBadge from '@/shared/components/NormativeBadge';
import { EstudianteBadge } from '@/shared/components/EstudianteBadge';
import { Estudiante, GravedadFalta } from '@/types';

/** Props para WizardStep5Confirmar */
interface WizardStep5ConfirmarProps {
  formData: ExpedienteFormValues;
  selectedEstudiante: Estudiante | undefined;
  actorAEstudiante: Estudiante | undefined;
  actorBEstudiante: Estudiante | undefined;
  isExpulsion: boolean;
}

/**
 * Paso 5 del wizard: Resumen y Confirmación.
 * Muestra un resumen de los datos ingresados para confirmación final.
 */
export const WizardStep5Confirmar: React.FC<WizardStep5ConfirmarProps> = ({
  formData,
  selectedEstudiante,
  actorAEstudiante,
  actorBEstudiante,
  isExpulsion
}) => {
  const isGradualityValid =
    !isExpulsion || (formData.advertenciaEscrita && formData.planApoyoPrevio);

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
          Confirmar Registro
        </h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Verifique la integridad de los datos normativos
        </p>
      </div>

      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="space-y-4">
          <div className="flex justify-between items-start border-b border-white/10 pb-3">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Estudiante
            </span>
            <EstudianteBadge
              nombre={selectedEstudiante?.nombreCompleto || 'Sin nombre'}
              curso={selectedEstudiante?.curso}
              size="sm"
              showIcon={false}
            />
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Gravedad
            </span>
            <NormativeBadge gravedad={formData.gravedad as GravedadFalta} />
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Lugar
            </span>
            <span className="text-xs font-bold uppercase">{formData.lugarIncidente}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Estudiante A
            </span>
            <span className="text-xs font-bold uppercase">
              {actorAEstudiante?.nombreCompleto || 'Sin seleccionar'}
            </span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Estudiante B
            </span>
            <span className="text-xs font-bold uppercase">
              {actorBEstudiante?.nombreCompleto || 'Sin seleccionar'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Cumplimiento Gradualidad
            </span>
            <span
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                isGradualityValid
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isGradualityValid ? 'Validado' : 'Riesgo SIE'}
            </span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center italic font-medium leading-relaxed">
        "Al confirmar, el sistema generar&aacute; el folio oficial y activar&aacute; las alertas
        de plazo fatal para los encargados de convivencia."
      </p>
    </div>
  );
};

export default WizardStep5Confirmar;
