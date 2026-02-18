import { describe, it, expect } from 'vitest';
import { validateTipicidad, validateProporcionalidad, validatePlazo } from '../validators';
import type { InfractionSeverity, ProcedureType } from '../types';

describe('documentos/validators', () => {
  it('validateTipicidad should reject vague descriptions', () => {
    const r = validateTipicidad('Comportamiento inapropiado en el patio');
    expect(r.valid).toBe(false);
    expect(r.reasons && r.reasons.length).toBeGreaterThan(0);
  });

  it('validateTipicidad should accept specific description', () => {
    const r = validateTipicidad('Agresión física: empujón que causó caída y contusión en rodilla');
    expect(r.valid).toBe(true);
  });

  it('validateProporcionalidad should flag disproportionate measures', () => {
    const r = validateProporcionalidad('leve' as InfractionSeverity, 'expulsión');
    expect(r.valid).toBe(false);
    expect(r.reasons).toContain('Medida desproporcionada respecto a la gravedad de la falta');
  });

  it('validateProporcionalidad should accept proportional measures', () => {
    const r = validateProporcionalidad('relevante' as InfractionSeverity, 'suspension');
    expect(r.valid).toBe(true);
  });

  it('validatePlazo en leves pase', () => {
    const r = validatePlazo('leve' as ProcedureType, 1);
    expect(r.valid).toBe(true);
  });

  it('validatePlazo en relevantes falla si excesivo', () => {
    const r = validatePlazo('relevante' as ProcedureType, 90);
    expect(r.valid).toBe(false);
  });
});
