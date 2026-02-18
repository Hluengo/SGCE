-- =============================================================================
-- 030_gcc_backfill_validation.sql
-- Validaciones post backfill GCC legacy -> v2
-- =============================================================================

-- A) Conteos globales
WITH legacy_m AS (
  SELECT count(*)::int AS n FROM public.mediaciones_gcc WHERE expediente_id IS NOT NULL
), v2_m AS (
  SELECT count(*)::int AS n FROM public.mediaciones_gcc_v2
), legacy_c AS (
  SELECT count(*)::int AS n FROM public.compromisos_mediacion
), v2_c AS (
  SELECT count(*)::int AS n FROM public.compromisos_gcc_v2
)
SELECT 'count_legacy_mediaciones' AS check_name, (SELECT n FROM legacy_m) AS value
UNION ALL
SELECT 'count_v2_mediaciones', (SELECT n FROM v2_m)
UNION ALL
SELECT 'count_legacy_compromisos', (SELECT n FROM legacy_c)
UNION ALL
SELECT 'count_v2_compromisos', (SELECT n FROM v2_c);

-- B) Mediaciones legacy sin correspondencia en v2
SELECT
  'legacy_mediaciones_missing_in_v2' AS check_name,
  count(*)::int AS missing_rows
FROM public.mediaciones_gcc l
LEFT JOIN public.mediaciones_gcc_v2 v ON v.id = l.id
WHERE l.expediente_id IS NOT NULL
  AND v.id IS NULL;

-- C) Compromisos legacy sin correspondencia en v2
SELECT
  'legacy_compromisos_missing_in_v2' AS check_name,
  count(*)::int AS missing_rows
FROM public.compromisos_mediacion l
LEFT JOIN public.compromisos_gcc_v2 v ON v.id = l.id
WHERE v.id IS NULL;

-- D) Registros v2 con tenant nulo (no permitido)
SELECT
  'v2_rows_with_null_tenant' AS check_name,
  (
    (SELECT count(*) FROM public.mediaciones_gcc_v2 WHERE establecimiento_id IS NULL)
    + (SELECT count(*) FROM public.participantes_gcc_v2 WHERE establecimiento_id IS NULL)
    + (SELECT count(*) FROM public.hitos_gcc_v2 WHERE establecimiento_id IS NULL)
    + (SELECT count(*) FROM public.actas_gcc_v2 WHERE establecimiento_id IS NULL)
    + (SELECT count(*) FROM public.compromisos_gcc_v2 WHERE establecimiento_id IS NULL)
  )::int AS missing_rows;

-- E) Expedientes en pausa legal con GCC activa
SELECT
  'expedientes_pausa_legal_with_active_gcc' AS check_name,
  count(*)::int AS rows_ok
FROM public.expedientes e
WHERE e.estado_legal = 'pausa_legal'
  AND EXISTS (
    SELECT 1
    FROM public.mediaciones_gcc_v2 m
    WHERE m.expediente_id = e.id
      AND m.estado_proceso IN ('abierta', 'en_proceso')
      AND coalesce(m.efecto_suspensivo_activo, false) = true
  );

-- F) Muestra de inconsistencias de estado expediente
SELECT
  e.id AS expediente_id,
  e.folio,
  e.estado_legal,
  m.id AS mediacion_id,
  m.estado_proceso,
  m.efecto_suspensivo_activo
FROM public.expedientes e
JOIN public.mediaciones_gcc_v2 m ON m.expediente_id = e.id
WHERE m.estado_proceso IN ('abierta', 'en_proceso')
  AND coalesce(m.efecto_suspensivo_activo, false) = true
  AND e.estado_legal <> 'pausa_legal'
ORDER BY m.created_at DESC
LIMIT 100;
