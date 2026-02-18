import { describe, expect, it } from 'vitest';
import { isUuid } from './expedienteRef';

describe('expedienteRef', () => {
  it('detecta UUID válido', () => {
    expect(isUuid('d645e547-054f-4ce4-bff7-7a18ca61db50')).toBe(true);
  });

  it('rechaza folio visible', () => {
    expect(isUuid('EXP-2026-430')).toBe(false);
  });

  it('rechaza string vacío', () => {
    expect(isUuid('')).toBe(false);
  });

  it('rechaza null', () => {
    expect(isUuid(null as unknown as string)).toBe(false);
  });
});

export {};

