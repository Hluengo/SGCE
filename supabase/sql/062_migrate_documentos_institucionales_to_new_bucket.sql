-- ============================================================================
-- 062_migrate_documentos_institucionales_to_new_bucket.sql
-- Migra documentos institucionales desde:
--   evidencias-publicas/<establecimiento_id>/...
-- hacia:
--   documentos-institucionales/<establecimiento_id>/...
--
-- Requisitos:
-- 1) Ejecutar antes 061_documentos_institucionales_storage_bucket.sql
-- 2) El path debe incluir el establecimiento_id como primer segmento.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.documentos_storage_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL,
  establecimiento_id UUID NOT NULL,
  old_url_storage TEXT NOT NULL,
  new_url_storage TEXT NOT NULL,
  status TEXT NOT NULL, -- migrated | skipped_missing_source | skipped_conflict_destination | skipped_invalid_path
  detail TEXT NULL,
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Candidatos solo en formato canonical viejo
WITH candidates AS (
  SELECT
    d.id AS documento_id,
    d.establecimiento_id,
    d.url_storage AS old_url_storage,
    regexp_replace(d.url_storage, '^evidencias-publicas/', '') AS object_path,
    regexp_replace(d.url_storage, '^evidencias-publicas/', 'documentos-institucionales/') AS new_url_storage
  FROM public.documentos_institucionales d
  WHERE d.url_storage IS NOT NULL
    AND d.url_storage ~ '^evidencias-publicas/.+'
),
classified AS (
  SELECT
    c.*,
    CASE
      WHEN c.object_path !~ ('^' || c.establecimiento_id::text || '/.+')
        THEN 'skipped_invalid_path'
      WHEN NOT EXISTS (
        SELECT 1
        FROM storage.objects so
        WHERE so.bucket_id = 'evidencias-publicas'
          AND so.name = c.object_path
      )
        THEN 'skipped_missing_source'
      WHEN EXISTS (
        SELECT 1
        FROM storage.objects so
        WHERE so.bucket_id = 'documentos-institucionales'
          AND so.name = c.object_path
      )
        THEN 'skipped_conflict_destination'
      ELSE 'ready_to_move'
    END AS migration_state
  FROM candidates c
),
moved AS (
  UPDATE storage.objects so
  SET bucket_id = 'documentos-institucionales'
  FROM classified c
  WHERE c.migration_state = 'ready_to_move'
    AND so.bucket_id = 'evidencias-publicas'
    AND so.name = c.object_path
  RETURNING c.documento_id, c.object_path, c.new_url_storage, c.establecimiento_id, c.old_url_storage
),
updated_docs AS (
  UPDATE public.documentos_institucionales d
  SET url_storage = m.new_url_storage
  FROM moved m
  WHERE d.id = m.documento_id
  RETURNING d.id
)
INSERT INTO public.documentos_storage_migration_log (
  documento_id,
  establecimiento_id,
  old_url_storage,
  new_url_storage,
  status,
  detail
)
SELECT
  c.documento_id,
  c.establecimiento_id,
  c.old_url_storage,
  c.new_url_storage,
  CASE WHEN c.migration_state = 'ready_to_move' THEN 'migrated' ELSE c.migration_state END,
  CASE
    WHEN c.migration_state = 'skipped_invalid_path'
      THEN 'url_storage no contiene establecimiento_id como prefijo de path'
    WHEN c.migration_state = 'skipped_missing_source'
      THEN 'No existe objeto fuente en storage.objects (evidencias-publicas)'
    WHEN c.migration_state = 'skipped_conflict_destination'
      THEN 'Ya existe objeto en bucket destino con el mismo path'
    ELSE 'Objeto movido y metadata actualizada'
  END
FROM classified c;

COMMIT;

-- ============================================================================
-- Diagnóstico post-migración (ejecutar aparte si necesitas revisar):
--
-- 1) Resumen por estado
-- SELECT status, COUNT(*) FROM public.documentos_storage_migration_log
-- GROUP BY status ORDER BY status;
--
-- 2) Documentos que aún siguen en bucket viejo (si existen)
-- SELECT id, establecimiento_id, url_storage
-- FROM public.documentos_institucionales
-- WHERE url_storage LIKE 'evidencias-publicas/%'
-- ORDER BY created_at DESC;
-- ============================================================================

