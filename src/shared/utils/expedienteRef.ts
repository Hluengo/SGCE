/**
 * Helpers para resolver referencias de expediente en UI:
 * - UUID real de BD
 * - Folio visible (ej: EXP-2026-430)
 */

export function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

