import { InfractionSeverity, ProcedureType, ValidationResult } from './types';

const VAGUE_PHRASES = [
  'comportamiento inapropiado',
  'conducta inapropiada',
  'mal comportamiento',
  'inadecuado',
  'conducta inadecuada'
];

export function validateTipicidad(description: string): ValidationResult {
  const reasons: string[] = [];
  if (!description || description.trim().length === 0) {
    reasons.push('Descripción vacía');
  }

  if (description.trim().length < 20) {
    reasons.push('Descripción demasiado breve; debe ser específica y descriptiva');
  }

  const lowered = description.toLowerCase();
  for (const p of VAGUE_PHRASES) {
    if (lowered.includes(p)) {
      reasons.push(`Descripción usa frase vaga: "${p}"`);
      break;
    }
  }

  return { valid: reasons.length === 0, reasons: reasons.length ? reasons : undefined };
}

const SEVERITY_ORDER: Record<InfractionSeverity, number> = {
  leve: 1,
  relevante: 2,
  grave: 3,
  gravisima: 4,
  expulsion: 5
};

const MEASURE_MAPPING: Record<string, InfractionSeverity> = {
  amonestacion: 'leve',
  anotacion: 'leve',
  'actividad formativa': 'leve',
  suspension: 'relevante',
  condicionalidad: 'relevante',
  'cambio de curso': 'grave',
  expulsión: 'expulsion',
  expulsion: 'expulsion'
};

export function validateProporcionalidad(infractionSeverity: InfractionSeverity, proposedMeasure: string): ValidationResult {
  const reasons: string[] = [];
  if (!proposedMeasure || proposedMeasure.trim().length === 0) {
    reasons.push('Medida propuesta vacía');
    return { valid: false, reasons };
  }

  const key = proposedMeasure.trim().toLowerCase();
  const measureSeverity = MEASURE_MAPPING[key];
  if (!measureSeverity) {
    reasons.push('Medida propuesta no reconocida por el mapeo interno');
    return { valid: false, reasons };
  }

  const infLevel = SEVERITY_ORDER[infractionSeverity];
  const measureLevel = SEVERITY_ORDER[measureSeverity];

  if (measureLevel > infLevel + 1) {
    reasons.push('Medida desproporcionada respecto a la gravedad de la falta');
  }

  return { valid: reasons.length === 0, reasons: reasons.length ? reasons : undefined };
}

export function validatePlazo(procedureType: ProcedureType, totalDays: number): ValidationResult {
  const reasons: string[] = [];
  if (typeof totalDays !== 'number' || Number.isNaN(totalDays)) {
    reasons.push('Plazo no es un número válido');
    return { valid: false, reasons };
  }

  // Límites basados en la especificación del repositorio / documento
  switch (procedureType) {
    case 'leve':
      if (totalDays > 1) reasons.push('Procedimiento leve debe resolverse en <= 1 día (24h)');
      break;
    case 'relevante':
      if (totalDays > 60) reasons.push('Procedimiento relevante debe resolverse en <= 60 días (incluye reconsideración)');
      break;
    case 'expulsion':
      // Investigación 20-30 días + reconsideración 15 días (máx aproximado 45)
      if (totalDays > 45) reasons.push('Procedimiento de expulsión debe resolverse típicamente en <= 45 días');
      if (totalDays < 20) reasons.push('Procedimiento de expulsión usualmente requiere al menos ~20 días para investigación');
      break;
    default:
      reasons.push('Tipo de procedimiento no reconocido');
  }

  return { valid: reasons.length === 0, reasons: reasons.length ? reasons : undefined };
}
