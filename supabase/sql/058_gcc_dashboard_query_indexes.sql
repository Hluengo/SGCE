-- ============================================================================
-- 058_gcc_dashboard_query_indexes.sql
-- Optimiza lecturas del panel GCC:
-- - consultas por tenant + ventana temporal (created_at)
-- - conteos/segmentación por estado de proceso
-- ============================================================================

BEGIN;

CREATE INDEX IF NOT EXISTS idx_mediaciones_gcc_v2_tenant_created_at
  ON public.mediaciones_gcc_v2 (establecimiento_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mediaciones_gcc_v2_tenant_estado
  ON public.mediaciones_gcc_v2 (establecimiento_id, estado_proceso);

COMMIT;

