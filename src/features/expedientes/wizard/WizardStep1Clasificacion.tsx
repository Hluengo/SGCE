
import React from 'react';
import { UseFormRegister, Controller, FieldErrors, Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Estudiante } from '@/types';
import { ExpedienteFormValues } from './wizard.types';
import NormativeBadge from '@/shared/components/NormativeBadge';
import WizardStudentSelector from './WizardStudentSelector';

/** Props para WizardStep1Clasificacion */
interface WizardStep1ClasificacionProps {
  register: UseFormRegister<ExpedienteFormValues>;
  watch: UseFormWatch<ExpedienteFormValues>;
  control: Control<ExpedienteFormValues>;
  errors: FieldErrors<ExpedienteFormValues>;
  estudiantes: Estudiante[];
  setValue: UseFormSetValue<ExpedienteFormValues>;
}

/**
 * Paso 1 del wizard: Clasificación.
 * 1. Seleccionar curso -> 2. Expandir y buscar estudiante.
 */
export const WizardStep1Clasificacion: React.FC<WizardStep1ClasificacionProps> = ({
  register,
  watch,
  control,
  errors,
  estudiantes,
  setValue
}) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
        Curso del Estudiante
      </p>
      <WizardStudentSelector
        title="Sujeto del Proceso (Estudiante A)"
        emptyHint="Seleccione un curso para ver los estudiantes"
        estudiantes={estudiantes}
        fieldName="estudianteId"
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
      />

      {/* Selector de gravedad */}
      <div className="space-y-4">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest block">
          Tipo de Falta (Gravedad RICE)
        </p>
        <Controller
          control={control}
          name="gravedad"
          render={({ field }) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['LEVE', 'RELEVANTE', 'GRAVISIMA_EXPULSION'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => field.onChange(g)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-4 ${
                    field.value === g
                      ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-500/5 scale-[1.02]'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <NormativeBadge gravedad={g} />
                </button>
              ))}
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default WizardStep1Clasificacion;


