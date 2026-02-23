import React, { useMemo } from 'react';
import { useForm, SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useConvivencia, hitosBase } from '@/shared/context/ConvivenciaContext';
import { Expediente } from '@/types';
import { supabase } from '@/shared/lib/supabaseClient';
import { buildDescripcionHechos } from '@/shared/utils/buildDescripcionHechos';
import {
  UserPlus,
  Scale,
  Info,
  Clock,
  CheckCircle2
} from 'lucide-react';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

import { WizardHeader } from './wizard/WizardHeader';
import { WizardProgressBar } from './wizard/WizardProgressBar';
import { WizardFooter } from './wizard/WizardFooter';
import { WizardStep1Clasificacion } from './wizard/WizardStep1Clasificacion';
import { WizardStep2Gradualidad } from './wizard/WizardStep2Gradualidad';
import { WizardStep3Hechos } from './wizard/WizardStep3Hechos';
import { WizardStep4Plazos } from './wizard/WizardStep4Plazos';
import { WizardStep5Confirmar } from './wizard/WizardStep5Confirmar';
import { ExpedienteFormValues, StepConfig } from './wizard/wizard.types';

// Schema Definition
const expedienteSchema = z.object({
  estudianteId: z.string().min(1, 'Debe seleccionar un estudiante'),
  actorBCurso: z.string(),
  actorBId: z.string(),
  gravedad: z.enum(['LEVE', 'RELEVANTE', 'GRAVISIMA_EXPULSION']),
  advertenciaEscrita: z.boolean(),
  planApoyoPrevio: z.boolean(),
  descripcionHechos: z.string().min(10, 'La descripción debe ser detallada (mínimo 10 caracteres)'),
  fechaIncidente: z.string().min(1, 'Fecha requerida'),
  horaIncidente: z.string().min(1, 'Hora requerida'),
  lugarIncidente: z.string().min(3, 'Indique el lugar del incidente'),
}).refine((data) => !data.actorBId || data.estudianteId !== data.actorBId, {
  message: 'Estudiante A y Estudiante B deben ser distintos',
  path: ['actorBId'],
});

type FormValues = z.infer<typeof expedienteSchema>;

const fieldStepMap: Record<keyof FormValues, number> = {
  estudianteId: 1,
  actorBCurso: 3,
  actorBId: 3,
  gravedad: 1,
  advertenciaEscrita: 2,
  planApoyoPrevio: 2,
  descripcionHechos: 3,
  fechaIncidente: 3,
  horaIncidente: 3,
  lugarIncidente: 3,
};

const persistWizardExpediente = async ({
  data,
  estudiantes,
  plazoCalculado,
  isExpulsion,
  setExpedientes,
  setIsWizardOpen,
}: {
  data: FormValues;
  estudiantes: ReturnType<typeof useConvivencia>['estudiantes'];
  plazoCalculado: Date;
  isExpulsion: boolean;
  setExpedientes: ReturnType<typeof useConvivencia>['setExpedientes'];
  setIsWizardOpen: ReturnType<typeof useConvivencia>['setIsWizardOpen'];
}) => {
  const estudiante = estudiantes.find(e => e.id === data.estudianteId);
  const actorA = estudiantes.find(e => e.id === data.estudianteId);
  const actorB = estudiantes.find(e => e.id === data.actorBId);
  const nombreEstudiante = estudiante?.nombreCompleto ?? 'Sin nombre';
  const cursoEstudiante = estudiante?.curso ?? null;

  const descripcionHechos = buildDescripcionHechos(
    actorA?.nombreCompleto,
    actorA?.curso,
    actorB?.nombreCompleto,
    actorB?.curso,
    data.descripcionHechos
  );

  const actoresResumen = actorB?.nombreCompleto
    ? `Actores involucrados: A) ${actorA?.nombreCompleto ?? 'Sin nombre'} (${actorA?.curso ?? 'Sin curso'}) | B) ${actorB.nombreCompleto} (${actorB.curso ?? 'Sin curso'})`
    : null;

  const tipoFalta = data.gravedad === 'LEVE'
    ? 'leve'
    : data.gravedad === 'RELEVANTE'
      ? 'relevante'
      : 'expulsion';
  const folio = `EXP-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
  const nuevoExp: Expediente = {
    id: folio,
    nnaNombre: nombreEstudiante,
    nnaCurso: cursoEstudiante,
    nnaNombreB: actorB?.nombreCompleto ?? null,
    nnaCursoB: actorB?.curso ?? null,
    etapa: 'INICIO',
    gravedad: data.gravedad,
    fechaInicio: new Date().toISOString(),
    plazoFatal: plazoCalculado.toISOString(),
    encargadoId: 'u1',
    esProcesoExpulsion: isExpulsion,
    accionesPrevias: data.advertenciaEscrita && data.planApoyoPrevio,
    hitos: hitosBase(isExpulsion),
    interactionType: 'creacion',
    additionalData: {
      actoresResumen,
      gravedad: data.gravedad,
      lugarIncidente: data.lugarIncidente,
      fechaIncidente: data.fechaIncidente,
    }
  };

  if (!supabase) {
    throw new Error('Conexión a Supabase no disponible');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    throw new Error('No hay sesión activa. Inicia sesión para continuar.');
  }

  const { data: inserted, error } = await supabase
    .from('expedientes')
    .insert({
      estudiante_id: data.estudianteId,
      estudiante_b_id: data.actorBId || null,
      folio,
      tipo_falta: tipoFalta,
      estado_legal: 'apertura',
      etapa_proceso: 'INICIO',
      fecha_inicio: new Date().toISOString(),
      plazo_fatal: plazoCalculado.toISOString(),
      creado_por: userId,
      acciones_previas: data.advertenciaEscrita && data.planApoyoPrevio,
      es_proceso_expulsion: isExpulsion,
      descripcion_hechos: descripcionHechos,
      fecha_incidente: data.fechaIncidente,
      hora_incidente: data.horaIncidente,
      lugar_incidente: data.lugarIncidente,
      curso: cursoEstudiante,
      interaction_type: 'creacion',
      additional_data: {
        actoresResumen,
        gravedad: data.gravedad,
        lugarIncidente: data.lugarIncidente,
        fechaIncidente: data.fechaIncidente,
      }
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error creando expediente en Supabase: ${error.message}`);
  }
  if (!inserted?.id) {
    throw new Error('Error: expediente no fue guardado correctamente en Supabase');
  }

  nuevoExp.dbId = inserted.id;
  setExpedientes(prev => [nuevoExp, ...prev]);
  setIsWizardOpen(false);
};

const ExpedienteWizard: React.FC = () => {
  const { setIsWizardOpen, setExpedientes, calcularPlazoLegal, estudiantes } = useConvivencia();
  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(expedienteSchema),
    mode: 'onBlur',
    defaultValues: {
      estudianteId: '',
      actorBCurso: '',
      actorBId: '',
      gravedad: 'LEVE',
      advertenciaEscrita: false,
      planApoyoPrevio: false,
      descripcionHechos: '',
      fechaIncidente: new Date().toISOString().split('T')[0],
      horaIncidente: '10:00',
      lugarIncidente: '',
    }
  });

  const formData = watch();
  const selectedEstudiante = useMemo(
    () => estudiantes.find((e) => e.id === formData.estudianteId),
    [estudiantes, formData.estudianteId]
  );
  const actorAEstudiante = useMemo(
    () => estudiantes.find((e) => e.id === formData.estudianteId),
    [estudiantes, formData.estudianteId]
  );
  const actorBEstudiante = useMemo(
    () => estudiantes.find((e) => e.id === formData.actorBId),
    [estudiantes, formData.actorBId]
  );
  const isExpulsion = formData.gravedad === 'GRAVISIMA_EXPULSION';
  const hasIncompleteGraduality = isExpulsion && (!formData.advertenciaEscrita || !formData.planApoyoPrevio);

  const stepsConfig: StepConfig[] = [
    { id: 1, title: 'Clasificación', icon: UserPlus },
    { id: 2, title: 'Gradualidad', icon: Scale, hidden: !isExpulsion },
    { id: 3, title: 'Hechos', icon: Info },
    { id: 4, title: 'Plazos', icon: Clock },
    { id: 5, title: 'Confirmar', icon: CheckCircle2 },
  ].filter(s => !s.hidden);

  const activeStepConfig = stepsConfig.find(s => s.id === step) || stepsConfig[0];
  const activeIndex = stepsConfig.findIndex(s => s.id === step);

  const plazoCalculado = useMemo(() => {
    return calcularPlazoLegal(new Date(), formData.gravedad);
  }, [formData.gravedad, calcularPlazoLegal]);

  // Validar datos de paso antes de permitir navegación
  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        // Validar paso 1: Clasificación
        return !!(formData.estudianteId && formData.gravedad);
      case 2:
        // Validar paso 2: Gradualidad (solo si es expulsión)
        if (isExpulsion) {
          return formData.advertenciaEscrita && formData.planApoyoPrevio;
        }
        return true;
      case 3:
        // Validar paso 3: Hechos
        return !!(
          formData.descripcionHechos.length >= 10 &&
          formData.fechaIncidente &&
          formData.horaIncidente &&
          formData.lugarIncidente.length >= 3
        );
      case 4:
        // Paso 4: Solo lectura, no requiere validación adicional
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    const nextIdx = activeIndex + 1;
    
    if (nextIdx < stepsConfig.length) {
      const isValid = validateStep(step);
      if (!isValid) {
        setSubmitError('Por favor completa todos los campos requeridos del paso actual.');
        return;
      }
      setSubmitError(null);
      const nextStep = stepsConfig[nextIdx].id;
      setStep(nextStep);
      // FIX: Quitar foco del botón para evitar que Enter dispare doble click
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  const handleBack = () => {
    const prevIdx = activeIndex - 1;
    if (prevIdx >= 0) {
      setStep(stepsConfig[prevIdx].id);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await persistWizardExpediente({
        data,
        estudiantes,
        plazoCalculado,
        isExpulsion,
        setExpedientes,
        setIsWizardOpen,
      });
      setSubmitError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear expediente';
      setSubmitError(errorMessage);
      console.error('Error al crear expediente:', error);
      // Asegurar que NO se cierre el modal en caso de error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitError: SubmitErrorHandler<FormValues> = (formErrors) => {
    const orderedFields: (keyof FormValues)[] = [
      'estudianteId',
      'gravedad',
      'advertenciaEscrita',
      'planApoyoPrevio',
      'descripcionHechos',
      'fechaIncidente',
      'horaIncidente',
      'lugarIncidente',
      'actorBId',
      'actorBCurso'
    ];

    const firstInvalidField = orderedFields.find(field => formErrors[field]);
    if (firstInvalidField) {
      const targetStep = fieldStepMap[firstInvalidField];
      if (targetStep && targetStep !== step) {
        setStep(targetStep);
      }
      setSubmitError(formErrors[firstInvalidField]?.message ?? 'Completa los campos obligatorios.');
    } else {
      setSubmitError('Completa los campos obligatorios.');
    }
  };

  // FIX: Prevenir Enter en el formulario para evitar navigation/submission accidental
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
    }
  };

  const isNextDisabled = activeIndex === 0 && (!formData.estudianteId || !formData.gravedad);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.75rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.75rem)',
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh]">
        <ErrorBoundary>
        <WizardHeader
          stepConfig={activeStepConfig}
          activeIndex={activeIndex}
          onClose={() => setIsWizardOpen(false)}
        />

        <WizardProgressBar
          stepsConfig={stepsConfig}
          activeIndex={activeIndex}
        />

        <form id="wizard-form" onSubmit={handleSubmit(onSubmit, handleSubmitError)} onKeyDown={handleFormKeyDown} className="flex-1 overflow-y-auto p-4 md:p-10">
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold text-sm">❌ Error al crear expediente</p>
              <p className="text-red-600 text-xs mt-1">{submitError}</p>
            </div>
          )}
          {step === 1 && (
            <WizardStep1Clasificacion
              register={register}
              watch={watch}
              control={control}
              errors={errors}
              estudiantes={estudiantes}
              setValue={setValue}
            />
          )}

          {step === 2 && isExpulsion && (
            <WizardStep2Gradualidad
              register={register}
              errors={errors}
              hasIncompleteGraduality={hasIncompleteGraduality}
            />
          )}

          {step === 3 && (
            <WizardStep3Hechos
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              estudiantes={estudiantes}
            />
          )}

          {step === 4 && (
            <WizardStep4Plazos
              formData={formData as ExpedienteFormValues}
              plazoCalculado={plazoCalculado}
            />
          )}

          {step === 5 && (
            <WizardStep5Confirmar
              formData={formData as ExpedienteFormValues}
              selectedEstudiante={selectedEstudiante}
              actorAEstudiante={actorAEstudiante}
              actorBEstudiante={actorBEstudiante}
              isExpulsion={isExpulsion}
            />
          )}
        </form>

        <WizardFooter
          activeIndex={activeIndex}
          stepsConfig={stepsConfig}
          onNext={handleNext}
          onBack={handleBack}
          onClose={() => setIsWizardOpen(false)}
          isNextDisabled={isNextDisabled}
          isSubmitting={isSubmitting}
        />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default ExpedienteWizard;


