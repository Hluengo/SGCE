/** Valores del formulario del wizard de expedientes */
export interface ExpedienteFormValues {
  estudianteId: string;
  actorBCurso: string;
  actorBId: string;
  gravedad: 'LEVE' | 'RELEVANTE' | 'GRAVISIMA_EXPULSION';
  advertenciaEscrita: boolean;
  planApoyoPrevio: boolean;
  descripcionHechos: string;
  fechaIncidente: string;
  horaIncidente: string;
  lugarIncidente: string;
}

/** Configuración de un paso del wizard */
export interface StepConfig {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hidden?: boolean;
}
