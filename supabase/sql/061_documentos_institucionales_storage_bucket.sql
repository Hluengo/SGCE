-- ============================================================================
-- 061_documentos_institucionales_storage_bucket.sql
-- Bucket y guardas para documentos institucionales ligados al ID de colegio.
-- Regla clave:
--   url_storage debe ser: documentos-institucionales/<establecimiento_id>/<path>
-- ============================================================================

BEGIN;

-- 1) Bucket dedicado para repositorio institucional
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos-institucionales',
  'documentos-institucionales',
  false,
  26214400, -- 25MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2) Políticas Storage ligadas a tenant por prefijo de path
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS storage_docs_inst_read ON storage.objects';
    EXECUTE $p$
      CREATE POLICY storage_docs_inst_read
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'documentos-institucionales'
        AND auth.role() = 'authenticated'
        AND (
          name LIKE current_establecimiento_id()::text || '/%'
          OR public.is_platform_superadmin()
        )
      )
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS storage_docs_inst_insert ON storage.objects';
    EXECUTE $p$
      CREATE POLICY storage_docs_inst_insert
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'documentos-institucionales'
        AND auth.role() = 'authenticated'
        AND (
          current_rol() IN ('admin', 'director', 'convivencia', 'inspector', 'dupla', 'sostenedor', 'superadmin')
          OR public.is_platform_superadmin()
        )
        AND (
          name LIKE current_establecimiento_id()::text || '/%'
          OR public.is_platform_superadmin()
        )
      )
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS storage_docs_inst_update ON storage.objects';
    EXECUTE $p$
      CREATE POLICY storage_docs_inst_update
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'documentos-institucionales'
        AND auth.role() = 'authenticated'
        AND (
          current_rol() IN ('admin', 'director', 'convivencia', 'sostenedor', 'superadmin')
          OR public.is_platform_superadmin()
        )
        AND (
          name LIKE current_establecimiento_id()::text || '/%'
          OR public.is_platform_superadmin()
        )
      )
      WITH CHECK (
        name LIKE current_establecimiento_id()::text || '/%'
        OR public.is_platform_superadmin()
      )
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS storage_docs_inst_delete ON storage.objects';
    EXECUTE $p$
      CREATE POLICY storage_docs_inst_delete
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'documentos-institucionales'
        AND auth.role() = 'authenticated'
        AND (
          current_rol() IN ('admin', 'director', 'convivencia', 'sostenedor', 'superadmin')
          OR public.is_platform_superadmin()
        )
        AND (
          name LIKE current_establecimiento_id()::text || '/%'
          OR public.is_platform_superadmin()
        )
      )
    $p$;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping storage policies for documentos-institucionales: insufficient privileges';
  END;
END $$;

-- 3) Guarda de consistencia en metadata de tabla documentos_institucionales
CREATE OR REPLACE FUNCTION public.enforce_documentos_institucionales_url_storage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.url_storage IS NULL OR BTRIM(NEW.url_storage) = '' THEN
    RETURN NEW;
  END IF;

  NEW.url_storage := BTRIM(NEW.url_storage);

  IF NEW.establecimiento_id IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = 'establecimiento_id es obligatorio para documentos institucionales';
  END IF;

  IF NEW.url_storage !~ '^documentos-institucionales/.+' THEN
    RAISE EXCEPTION USING
      MESSAGE = 'url_storage invalido: debe usar bucket documentos-institucionales';
  END IF;

  IF NEW.url_storage !~ ('^documentos-institucionales/' || NEW.establecimiento_id::text || '/.+') THEN
    RAISE EXCEPTION USING
      MESSAGE = 'url_storage fuera del tenant: debe incluir establecimiento_id como prefijo';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documentos_institucionales_url_storage_strict ON public.documentos_institucionales;
CREATE TRIGGER trg_documentos_institucionales_url_storage_strict
BEFORE INSERT OR UPDATE OF url_storage, establecimiento_id
ON public.documentos_institucionales
FOR EACH ROW
EXECUTE FUNCTION public.enforce_documentos_institucionales_url_storage();

COMMIT;

