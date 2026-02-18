-- =====================================================================
-- SCRIPT DE CORRECCIONES INMEDIATAS - SGCE
-- Fecha: 2026-02-18
-- Execute in: Supabase SQL Editor (with postgres role)
-- =====================================================================

-- SECCIÓN A: Habilitar RLS en Tablas Sin Seguridad (CRÍTICO)
-- =====================================================================

-- Habilitar RLS
ALTER TABLE public.catalog_staging_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_stage_sla ENABLE ROW LEVEL SECURITY;

-- SECCIÓN B: Crear Políticas RLS para Tablas de Catálogo
-- =====================================================================

-- Política para conduct_catalog: Lectura autenticada
DROP POLICY IF EXISTS "conduct_catalog_read_authenticated" ON public.conduct_catalog;
CREATE POLICY "conduct_catalog_read_authenticated"
  ON public.conduct_catalog
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "conduct_catalog_write_platform_admin" ON public.conduct_catalog;
CREATE POLICY "conduct_catalog_write_platform_admin"
  ON public.conduct_catalog
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Política para conduct_types: Lectura autenticada
DROP POLICY IF EXISTS "conduct_types_read_authenticated" ON public.conduct_types;
CREATE POLICY "conduct_types_read_authenticated"
  ON public.conduct_types
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "conduct_types_write_platform_admin" ON public.conduct_types;
CREATE POLICY "conduct_types_write_platform_admin"
  ON public.conduct_types
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Política para action_types (si no tiene RLS)
DROP POLICY IF EXISTS "action_types_read_authenticated" ON public.action_types;
CREATE POLICY "action_types_read_authenticated"
  ON public.action_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para process_stages (si no tiene RLS)
DROP POLICY IF EXISTS "process_stages_read_authenticated" ON public.process_stages;
CREATE POLICY "process_stages_read_authenticated"
  ON public.process_stages
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para stage_sla: Solo lectura, sin escritura
DROP POLICY IF EXISTS "stage_sla_read_authenticated" ON public.stage_sla;
CREATE POLICY "stage_sla_read_authenticated"
  ON public.stage_sla
  FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para tablas STG (staging) - Solo lectura a platform_admin
DROP POLICY IF EXISTS "stg_action_types_read_admin" ON public.stg_action_types;
CREATE POLICY "stg_action_types_read_admin"
  ON public.stg_action_types
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

DROP POLICY IF EXISTS "stg_conduct_catalog_read_admin" ON public.stg_conduct_catalog;
CREATE POLICY "stg_conduct_catalog_read_admin"
  ON public.stg_conduct_catalog
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

DROP POLICY IF EXISTS "stg_conduct_types_read_admin" ON public.stg_conduct_types;
CREATE POLICY "stg_conduct_types_read_admin"
  ON public.stg_conduct_types
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

DROP POLICY IF EXISTS "stg_stage_sla_read_admin" ON public.stg_stage_sla;
CREATE POLICY "stg_stage_sla_read_admin"
  ON public.stg_stage_sla
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- SECCIÓN C: Refinar Políticas de Storage para Branding (CRÍTICO)
-- =====================================================================

-- Reemplazar políticas inseguras para bucket 'branding-assets'
DROP POLICY IF EXISTS "branding_assets_superadmin_upload" ON storage.objects;
CREATE POLICY "branding_assets_superadmin_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND is_platform_admin()  -- Solo superadmin puede subir
  );

DROP POLICY IF EXISTS "branding_assets_superadmin_update" ON storage.objects;
CREATE POLICY "branding_assets_superadmin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'branding-assets'
    AND is_platform_admin()  -- Solo superadmin puede actualizar
  );

DROP POLICY IF EXISTS "branding_assets_superadmin_delete" ON storage.objects;
CREATE POLICY "branding_assets_superadmin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'branding-assets'
    AND is_platform_admin()  -- Solo superadmin puede eliminar
  );

-- Lectura pública (esto está OK)
-- DROP POLICY IF EXISTS "branding_assets_public_read" ON storage.objects;
-- CREATE POLICY "branding_assets_public_read"
--   ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'branding-assets');

-- SECCIÓN D: Verificación de Integridad
-- =====================================================================

-- Verificar que todas las tablas principales tienen RLS habilitada
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'stg_%'
  AND tablename NOT LIKE 'catalog_staging%'
ORDER BY tablename;

-- SECCIÓN E: OPCIONAL - Auditoría de Datos
-- =====================================================================

-- Verificar usuarios sin tenant asignado (riesgo de acceso no restringido)
SELECT COUNT(*) as users_without_tenant
FROM public.tenant_profiles
WHERE tenant_id IS NULL;

-- Verificar que no hay datos huérfanos en cases
SELECT COUNT(*) as "cases_sin_tenant"
FROM public.cases c
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants t WHERE t.id = c.tenant_id
);

-- Verificar que no hay datos huérfanos en students
SELECT COUNT(*) as "students_sin_tenant"
FROM public.students s
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenants t WHERE t.id = s.tenant_id
);

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================
/*
NOTAS IMPORTANTES:

1. EJECUTAR EN ORDEN: Las secciones deben ejecutarse en orden (A → E)

2. BACKUP: Hacer backup ANTES de ejecutar (Dashboard → Backups)

3. VERIFICAR AFTER: Ejecutar queries de SECCIÓN E para confirmar cambios

4. TRIGGERS: Las funciones is_platform_admin() debe existir.
   Si no existe, crear:
   
   CREATE OR REPLACE FUNCTION is_platform_admin()
   RETURNS boolean AS $$
   BEGIN
     RETURN (
       SELECT COALESCE(is_platform_admin, false)
       FROM public.tenant_profiles
       WHERE id = auth.uid()
       LIMIT 1
     );
   END;
   $$ LANGUAGE plpgsql STABLE;

5. TIMING: Este script toma ~2-3 minutos en ejecutar

6. TESTING: Después de ejecutar, testear:
   - Crear nuevo expediente
   - Subir archivo de branding
   - Verificar RLS con role diferente
*/
