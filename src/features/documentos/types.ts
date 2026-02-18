export type InfractionSeverity = 'leve' | 'relevante' | 'grave' | 'gravisima' | 'expulsion';

export type ProcedureType = 'leve' | 'relevante' | 'expulsion';

export interface ProcedureRecord {
  id?: string;
  type: ProcedureType;
  description: string;
  reportedAt?: string; // ISO date
  startedAt?: string; // ISO date
  closedAt?: string; // ISO date
  proposedMeasure?: string;
}

export interface ValidationResult {
  valid: boolean;
  reasons?: string[];
}
