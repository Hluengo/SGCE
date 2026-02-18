-- =============================================================================
-- SGCE SUPABASE - CORRECCIONES COMPLETAS DE AUDITORÍA
-- Fecha: 2026-02-18
-- Actualizado: 2026-02-18 (versión resiliente)
-- Ejecutar en: Supabase SQL Editor
-- =============================================================================
-- NOTA: Este script verifica la existencia de tablas antes de aplicar cambios
-- para evitar errores en casos donde ciertas tablas no existen en tu schema.
-- =============================================================================

-- =============================================================================
-- 1. AGREGAR ROL 'SUPERADMIN' AL ENUM rol_usuario
-- =============================================================================
-- IMPORTANTE: Esta es la corrección más crítica - sin esto, el superadmin
-- nunca será reconocido por las funciones de verificación

ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'superadmin';

-- Verificar
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rol_usuario');

-- =============================================================================
-- 2. HABILITAR RLS EN TABLAS CRÍTICAS (SOLO SI EXISTEN)
-- =============================================================================

-- Tablas que estaban sin RLS - con manejo de errores
DO $$
BEGIN
  RAISE NOTICE '🔒 Habilitando RLS en tablas críticas...';
  
  -- catalog_staging_batches
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'catalog_staging_batches') THEN
    ALTER TABLE public.catalog_staging_batches ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en catalog_staging_batches';
  ELSE
    RAISE NOTICE '  ⏭️  Tabla catalog_staging_batches no existe, omitiendo...';
  END IF;
  
  -- conduct_catalog
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conduct_catalog') THEN
    ALTER TABLE public.conduct_catalog ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en conduct_catalog';
  ELSE
    RAISE NOTICE '  ⏭️  Tabla conduct_catalog no existe, omitiendo...';
  END IF;
  
  -- conduct_types
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conduct_types') THEN
    ALTER TABLE public.conduct_types ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en conduct_types';
  ELSE
    RAISE NOTICE '  ⏭️  Tabla conduct_types no existe, omitiendo...';
  END IF;
  
  -- stage_sla
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stage_sla') THEN
    ALTER TABLE public.stage_sla ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en stage_sla';
  ELSE
    RAISE NOTICE '  ⏭️  Tabla stage_sla no existe, omitiendo...';
  END IF;
  
  -- stg_action_types
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stg_action_types') THEN
    ALTER TABLE public.stg_action_types ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en stg_action_types';
  ELSE
    RAISE NOTICE '  ⏭️  Tabla stg_action_types no existe, omitiendo...';
  END IF;
  
  -- stg_conduct_catalog
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stg_conduct_catalog') THEN
    ALTER TABLE public.stg_conduct_catalog ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en stg_conduct_catalog';
  ELSE
    RAISE NOTICE '  ⏭️  Tabla stg_conduct_catalog no existe, omitiendo...';
  END IF;
  
  -- stg_conduct_types
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stg_conduct_types') THEN
    ALTER TABLE public.stg_conduct_types ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en stg_conduct_types';
  ELSE
    RAISE NOTICE '  ⏭️  Tabla stg_conduct_types no existe, omitiendo...';
  END IF;
  
  -- stg_stage_sla
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stg_stage_sla') THEN
    ALTER TABLE public.stg_stage_sla ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en stg_stage_sla';
  ELSE
    RAISE NOTICE '  ⏭️  Tabla stg_stage_sla no existe, omitiendo...';
  END IF;
  
  RAISE NOTICE '✅ Sección 2 completada';
END $$;

-- =============================================================================
-- 3. CREAR POLÍTICAS RLS PARA TABLAS DE CATÁLOGO (SOLO SI EXISTEN)
-- =============================================================================

DO $$
BEGIN
  -- conduct_catalog - lectura para todos los autenticados
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conduct_catalog') THEN
    DROP POLICY IF EXISTS "catalog_read_authenticated" ON public.conduct_catalog;
    CREATE POLICY "catalog_read_authenticated" ON public.conduct_catalog
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- conduct_types - lectura para todos los autenticados
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conduct_types') THEN
    DROP POLICY IF EXISTS "types_read_authenticated" ON public.conduct_types;
    CREATE POLICY "types_read_authenticated" ON public.conduct_types
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- stage_sla - lectura para todos los autenticados
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stage_sla') THEN
    DROP POLICY IF EXISTS "stage_sla_read_authenticated" ON public.stage_sla;
    CREATE POLICY "stage_sla_read_authenticated" ON public.stage_sla
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- catalog_staging_batches - solo superadmin
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'catalog_staging_batches') THEN
    DROP POLICY IF EXISTS "staging_superadmin_all" ON public.catalog_staging_batches;
    CREATE POLICY "staging_superadmin_all" ON public.catalog_staging_batches
      FOR ALL USING (public.is_platform_superadmin())
      WITH CHECK (public.is_platform_superadmin());
  END IF;

  -- stg_action_types - solo superadmin
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stg_action_types') THEN
    DROP POLICY IF EXISTS "stg_superadmin_all" ON public.stg_action_types;
    CREATE POLICY "stg_superadmin_all" ON public.stg_action_types
      FOR ALL USING (public.is_platform_superadmin())
      WITH CHECK (public.is_platform_superadmin());
  END IF;

  -- stg_conduct_catalog - solo superadmin
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stg_conduct_catalog') THEN
    DROP POLICY IF EXISTS "stg_conduct_superadmin_all" ON public.stg_conduct_catalog;
    CREATE POLICY "stg_conduct_superadmin_all" ON public.stg_conduct_catalog
      FOR ALL USING (public.is_platform_superadmin())
      WITH CHECK (public.is_platform_superadmin());
  END IF;

  -- stg_conduct_types - solo superadmin
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stg_conduct_types') THEN
    DROP POLICY IF EXISTS "stg_types_superadmin_all" ON public.stg_conduct_types;
    CREATE POLICY "stg_types_superadmin_all" ON public.stg_conduct_types
      FOR ALL USING (public.is_platform_superadmin())
      WITH CHECK (public.is_platform_superadmin());
  END IF;

  -- stg_stage_sla - solo superadmin
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stg_stage_sla') THEN
    DROP POLICY IF EXISTS "stg_sla_superadmin_all" ON public.stg_stage_sla;
    CREATE POLICY "stg_sla_superadmin_all" ON public.stg_stage_sla
      FOR ALL USING (public.is_platform_superadmin())
      WITH CHECK (public.is_platform_superadmin());
  END IF;
END $$;

-- =============================================================================
-- 4. CORREGIR POLÍTICAS DE STORAGE - BRANDING ASSETS
-- =============================================================================

-- Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "branding_assets_superadmin_upload" ON storage.objects;
DROP POLICY IF EXISTS "branding_assets_superadmin_update" ON storage.objects;
DROP POLICY IF EXISTS "branding_assets_superadmin_delete" ON storage.objects;
DROP POLICY IF EXISTS "branding_assets_public_read" ON storage.objects;

-- Política de lectura pública (cualquiera puede ver)
CREATE POLICY "branding_assets_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'branding-assets');

-- Política de inserción - SOLO SUPERADMIN
CREATE POLICY "branding_assets_superadmin_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND public.is_platform_superadmin()
  );

-- Política de actualización - SOLO SUPERADMIN
CREATE POLICY "branding_assets_superadmin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'branding-assets'
    AND public.is_platform_superadmin()
  )
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND public.is_platform_superadmin()
  );

-- Política de eliminación - SOLO SUPERADMIN
CREATE POLICY "branding_assets_superadmin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'branding-assets'
    AND public.is_platform_superadmin()
  );

-- =============================================================================
-- 5. CORREGIR POLÍTICAS DE EVIDENCIAS STORAGE
-- =============================================================================

-- bucket: evidencias-publicas
DROP POLICY IF EXISTS "evidencias_publicas_insert" ON storage.objects;
CREATE POLICY "evidencias_publicas_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'evidencias-publicas'
    AND (
      auth.role() = 'authenticated'
      AND (
        public.is_platform_superadmin()
        OR (
          -- Verificar que el path contenga el tenant_id del usuario
          name LIKE (
            SELECT p.establecimiento_id::text || '/%'
            FROM public.perfiles p
            WHERE p.id = auth.uid()
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "evidencias_publicas_select" ON storage.objects;
CREATE POLICY "evidencias_publicas_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'evidencias-publicas'
    AND (
      public.is_platform_superadmin()
      OR auth.role() = 'authenticated'
    )
  );

-- bucket: evidencias-sensibles
DROP POLICY IF EXISTS "evidencias_sensibles_insert" ON storage.objects;
CREATE POLICY "evidencias_sensibles_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'evidencias-sensibles'
    AND (
      auth.role() = 'authenticated'
      AND (
        public.is_platform_superadmin()
        OR (
          name LIKE (
            SELECT p.establecimiento_id::text || '/%'
            FROM public.perfiles p
            WHERE p.id = auth.uid()
          )
        )
      )
    )
  );

-- bucket: documentos-psicosociales
DROP POLICY IF EXISTS "psicosocial_insert" ON storage.objects;
CREATE POLICY "psicosocial_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos-psicosociales'
    AND (
      auth.role() = 'authenticated'
      AND (
        public.is_platform_superadmin()
        OR (
          name LIKE (
            SELECT p.establecimiento_id::text || '/%'
            FROM public.perfiles p
            WHERE p.id = auth.uid()
          )
        )
      )
    )
  );

-- =============================================================================
-- 6. CORREGIR ÍNDICES DUPLICADOS
-- =============================================================================

DO $$
BEGIN
  -- Eliminar índice problemático (mismo nombre para múltiples tablas)
  DROP INDEX IF EXISTS idx_establecimiento_id;

  -- Crear índices con nombres únicos por tabla (solo si la tabla existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estudiantes') THEN
    CREATE INDEX IF NOT EXISTS idx_estudiantes_establecimiento_id ON estudiantes(establecimiento_id);
    CREATE INDEX IF NOT EXISTS idx_estudiantes_curso ON estudiantes(curso);
    CREATE INDEX IF NOT EXISTS idx_estudiantes_rut ON estudiantes(rut);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expedientes') THEN
    CREATE INDEX IF NOT EXISTS idx_expedientes_establecimiento_id ON expedientes(establecimiento_id);
    CREATE INDEX IF NOT EXISTS idx_expedientes_estudiante_id ON expedientes(estudiante_id);
    CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado_legal);
    CREATE INDEX IF NOT EXISTS idx_expedientes_fecha ON expedientes(fecha_inicio);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evidencias') THEN
    CREATE INDEX IF NOT EXISTS idx_evidencias_establecimiento_id ON evidencias(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidentes') THEN
    CREATE INDEX IF NOT EXISTS idx_incidentes_establecimiento_id ON incidentes(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bitacora_psicosocial') THEN
    CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_establecimiento_id ON bitacora_psicosocial(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'medidas_apoyo') THEN
    CREATE INDEX IF NOT EXISTS idx_medidas_apoyo_establecimiento_id ON medidas_apoyo(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'derivaciones_externas') THEN
    CREATE INDEX IF NOT EXISTS idx_derivaciones_externas_establecimiento_id ON derivaciones_externas(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bitacora_salida') THEN
    CREATE INDEX IF NOT EXISTS idx_bitacora_salida_establecimiento_id ON bitacora_salida(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reportes_patio') THEN
    CREATE INDEX IF NOT EXISTS idx_reportes_patio_establecimiento_id ON reportes_patio(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mediaciones_gcc') THEN
    CREATE INDEX IF NOT EXISTS idx_mediaciones_gcc_establecimiento_id ON mediaciones_gcc(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'carpetas_documentales') THEN
    CREATE INDEX IF NOT EXISTS idx_carpetas_doc_establecimiento_id ON carpetas_documentales(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documentos_institucionales') THEN
    CREATE INDEX IF NOT EXISTS idx_documentos_inst_establecimiento_id ON documentos_institucionales(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logs_auditoria') THEN
    CREATE INDEX IF NOT EXISTS idx_logs_auditoria_fecha ON logs_auditoria(created_at DESC);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hitos_expediente') THEN
    CREATE INDEX IF NOT EXISTS idx_hitos_expediente_fecha ON hitos_expediente(created_at DESC);
  END IF;
END $$;

-- =============================================================================
-- 7. CREAR FUNCIÓN IS_SUPERADMIN() CON BYPASS TOTAL
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol text;
  v_perfil_exists boolean;
BEGIN
  -- Verificar que el usuario tiene perfil
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid()
  ) INTO v_perfil_exists;
  
  IF NOT v_perfil_exists THEN
    RETURN false;
  END IF;
  
  -- Obtener el rol
  SELECT LOWER(p.rol::text) INTO v_rol
  FROM public.perfiles p
  WHERE p.id = auth.uid();
  
  -- Retornar true para superadmin, sostenedor, o admin
  RETURN v_rol IN ('superadmin', 'sostenedor', 'admin');
END;
$$;

-- Verificar que funciona
-- SELECT public.is_superadmin();

-- =============================================================================
-- 8. ACTUALIZAR POLÍTICAS EXISTENTES PARA USAR is_platform_superadmin()
-- =============================================================================

DO $$
BEGIN
  -- Tablas operativas - asegurar que superadmin tiene acceso
  
  -- reportes_patio
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reportes_patio') THEN
    DROP POLICY IF EXISTS reportes_patio_tenant_access ON public.reportes_patio;
    CREATE POLICY reportes_patio_tenant_access
    ON public.reportes_patio
    FOR ALL
    USING (
      public.is_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    )
    WITH CHECK (
      public.is_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    );
  END IF;

  -- derivaciones_externas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'derivaciones_externas') THEN
    DROP POLICY IF EXISTS derivaciones_externas_tenant_access ON public.derivaciones_externas;
    CREATE POLICY derivaciones_externas_tenant_access
    ON public.derivaciones_externas
    FOR ALL
    USING (
      public.is_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    )
    WITH CHECK (
      public.is_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    );
  END IF;

  -- bitacora_psicosocial
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bitacora_psicosocial') THEN
    DROP POLICY IF EXISTS bitacora_psicosocial_tenant_access ON public.bitacora_psicosocial;
    CREATE POLICY bitacora_psicosocial_tenant_access
    ON public.bitacora_psicosocial
    FOR ALL
    USING (
      public.is_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    )
    WITH CHECK (
      public.is_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    );
  END IF;

  -- medidas_apoyo
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'medidas_apoyo') THEN
    DROP POLICY IF EXISTS medidas_apoyo_tenant_access ON public.medidas_apoyo;
    CREATE POLICY medidas_apoyo_tenant_access
    ON public.medidas_apoyo
    FOR ALL
    USING (
      public.is_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    )
    WITH CHECK (
      public.is_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    );
  END IF;
END $$;

-- =============================================================================
-- 9. CREAR SUPERADMIN SI NO EXISTE
-- =============================================================================

-- Crear establecimiento para superadmin global si no existe
INSERT INTO public.establecimientos (id, nombre, rbd, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SUPERADMIN GLOBAL',
  'SUPERADMIN',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- NOTA: El usuario debe crearse manualmente en Supabase Console
-- Ir a: Authentication > Users > Add user
-- Luego ejecutar:
/*
INSERT INTO public.perfiles (id, nombre, rol, establecimiento_id, activo, created_at)
VALUES (
  'REEMPLAZAR_CON_UUID_DEL_USUARIO',
  'Administrador Global',
  'superadmin',
  '00000000-0000-0000-0000-000000000001',
  true,
  NOW()
)
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================================================
-- 10. VERIFICACIÓN FINAL
-- =============================================================================

-- Verificar enum
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rol_usuario');

-- Verificar tablas con RLS
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;

-- Verificar índices
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%establecimiento_id%';

-- Verificar función superadmin
-- SELECT public.is_superadmin();

-- Verificar políticas de storage
-- SELECT policyname, cmd, qual FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- =============================================================================
-- FIN DEL SCRIPT DE CORRECCIONES
-- =============================================================================
