import type { ResultadoMediacion } from '@/types';

export interface DerivacionCompletaPayload {
  motivo: string;
  objetivos: string[];
  mediadorAsignado: string;
  fechaMediacion: string;
}

export interface ResultadoCompletoPayload {
  resultado: ResultadoMediacion;
  acuerdos: string[];
  compromisos: string[];
  observaciones: string;
}

