import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { ExpedienteFormValues } from './wizard.types';
import { Estudiante } from '@/types';
import WizardStudentSelector from './WizardStudentSelector';

/** Props para WizardStep3Hechos */
interface WizardStep3HechosProps {
  register: UseFormRegister<ExpedienteFormValues>;
  watch: UseFormWatch<ExpedienteFormValues>;
  setValue: UseFormSetValue<ExpedienteFormValues>;
  errors: FieldErrors<ExpedienteFormValues>;
  estudiantes: Estudiante[];
}

/**
 * Paso 3 del wizard: Descripción de Hechos.
 * Datos del incidente y narrativa objetiva.
 */
export const WizardStep3Hechos: React.FC<WizardStep3HechosProps> = ({
  register,
  watch,
  setValue,
  errors,
  estudiantes,
}) => {
  const estudiantePrincipal = estudiantes.find((est) => est.id === watch('estudianteId'));

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Actores involucrados
        </p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Estudiante A (principal)
          </p>
          <p className="text-sm font-bold text-slate-700">
            {estudiantePrincipal?.nombreCompleto ?? 'No seleccionado en paso 1'}
          </p>
          <p className="text-xs text-slate-500">
            {estudiantePrincipal?.curso ?? 'Sin curso'}
          </p>
        </div>
        <WizardStudentSelector
          title="Estudiante B (compañero o contraparte)"
          emptyHint="Seleccione un curso para buscar al estudiante B"
          estudiantes={estudiantes}
          fieldName="actorBId"
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          cursoFieldName="actorBCurso"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Fecha
          </label>
          <input
            type="date"
            {...register('fechaIncidente')}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
          />
          {errors.fechaIncidente && (
            <span className="text-red-500 text-xs">{errors.fechaIncidente.message}</span>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Hora
          </label>
          <input
            type="time"
            {...register('horaIncidente')}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
          />
          {errors.horaIncidente && (
            <span className="text-red-500 text-xs">{errors.horaIncidente.message}</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Lugar del Incidente
        </label>
        <input
          type="text"
          {...register('lugarIncidente')}
          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
          placeholder="Ej: Patio central, Sala 4° Medio..."
        />
        {errors.lugarIncidente && (
          <span className="text-red-500 text-xs">{errors.lugarIncidente.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Narrativa de los Hechos (Objetiva)
        </label>
        <textarea
          {...register('descripcionHechos')}
          className="w-full h-40 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:outline-none resize-none"
          placeholder="Describa el incidente de forma neutral, evitando juicios de valor prematuros..."
        />
        {errors.descripcionHechos && (
          <span className="text-red-500 text-xs">{errors.descripcionHechos.message}</span>
        )}
      </div>
    </div>
  );
};

export default WizardStep3Hechos;
