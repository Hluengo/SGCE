-- ============================================================================
-- 060_actas_numero_acta_unique_index.sql
-- Asegura unicidad de numero_acta por tenant en actas_gcc_v2.
-- Fuente: contenido_json->>'numero_acta'
-- Formato esperado (recomendado): ACTA-YYYY-000X
-- ============================================================================

BEGIN;

-- Si existen duplicados previos, este índice fallará.
-- Ejecutar diagnóstico previo:
-- SELECT
--   establecimiento_id,
--   NULLIF(BTRIM(contenido_json->>'numero_acta'), '') AS numero_acta,
--   COUNT(*) AS total
-- FROM public.actas_gcc_v2
-- WHERE NULLIF(BTRIM(contenido_json->>'numero_acta'), '') IS NOT NULL
-- GROUP BY 1, 2
-- HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_actas_gcc_v2_tenant_numero_acta_unique
  ON public.actas_gcc_v2 (
    establecimiento_id,
    (NULLIF(BTRIM(contenido_json->>'numero_acta'), ''))
  )
  WHERE NULLIF(BTRIM(contenido_json->>'numero_acta'), '') IS NOT NULL;

COMMIT;

