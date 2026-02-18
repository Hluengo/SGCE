-- =============================================================================
-- 037_final_corrections_complete.sql
-- CORRECCIONES FINALES COMPLETAS - SGCE SUPABASE
-- Fecha: 2026-02-18
-- Ejecutar en: Supabase SQL Editor
-- =============================================================================
-- Este script aplica todas las correcciones pendientes identificadas en la auditoría.
-- Es seguro ejecutar múltiples veces (usa IF EXISTS y ON CONFLICT).
-- =============================================================================

-- =============================================================================
-- 1. HABILITAR RLS EN TABLAS FALTANTES
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔒 Paso 1: Habilitando RLS en tablas faltantes...';
  
  -- feriados_chile
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feriados_chile') THEN
    ALTER TABLE public.feriados_chile ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en feriados_chile';
    
    -- Política de lectura: todos los autenticados
    DROP POLICY IF EXISTS "feriados_read_authenticated" ON public.feriados_chile;
    CREATE POLICY "feriados_read_authenticated" 
      ON public.feriados_chile
      FOR SELECT 
      TO authenticated 
      USING (true);
    
    -- Política de escritura: solo superadmin
    DROP POLICY IF EXISTS "feriados_write_superadmin" ON public.feriados_chile;
    CREATE POLICY "feriados_write_superadmin"
      ON public.feriados_chile
      FOR ALL
      USING (public.is_platform_superadmin())
      WITH CHECK (public.is_platform_superadmin());
    
    RAISE NOTICE '  ✅ Políticas creadas para feriados_chile';
  END IF;
  
  -- evidencias_url_storage_migration_log
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evidencias_url_storage_migration_log') THEN
    ALTER TABLE public.evidencias_url_storage_migration_log ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '  ✅ RLS habilitado en evidencias_url_storage_migration_log';
    
    -- Política: solo superadmin
    DROP POLICY IF EXISTS "migration_log_superadmin_only" ON public.evidencias_url_storage_migration_log;
    CREATE POLICY "migration_log_superadmin_only"
      ON public.evidencias_url_storage_migration_log
      FOR ALL
      USING (public.is_platform_superadmin())
      WITH CHECK (public.is_platform_superadmin());
    
    RAISE NOTICE '  ✅ Política creada para evidencias_url_storage_migration_log';
  END IF;
  
  RAISE NOTICE '✅ Paso 1 completado';
END $$;

-- =============================================================================
-- 2. CORREGIR ÍNDICES DUPLICADOS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '📊 Paso 2: Corrigiendo índices duplicados...';
  
  -- Eliminar índice problemático si existe
  DROP INDEX IF EXISTS public.idx_establecimiento_id;
  RAISE NOTICE '  ✅ Índice duplicado eliminado (si existía)';
  
  -- Crear índices con nombres únicos por tabla
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estudiantes') THEN
    CREATE INDEX IF NOT EXISTS idx_estudiantes_establecimiento_id ON public.estudiantes(establecimiento_id);
    CREATE INDEX IF NOT EXISTS idx_estudiantes_curso ON public.estudiantes(curso);
    CREATE INDEX IF NOT EXISTS idx_estudiantes_rut ON public.estudiantes(rut);
    RAISE NOTICE '  ✅ Índices creados para estudiantes';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expedientes') THEN
    CREATE INDEX IF NOT EXISTS idx_expedientes_establecimiento_id ON public.expedientes(establecimiento_id);
    CREATE INDEX IF NOT EXISTS idx_expedientes_estudiante_id ON public.expedientes(estudiante_id);
    CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON public.expedientes(estado_legal);
    CREATE INDEX IF NOT EXISTS idx_expedientes_fecha ON public.expedientes(fecha_inicio);
    RAISE NOTICE '  ✅ Índices creados para expedientes';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evidencias') THEN
    CREATE INDEX IF NOT EXISTS idx_evidencias_establecimiento_id ON public.evidencias(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidentes') THEN
    CREATE INDEX IF NOT EXISTS idx_incidentes_establecimiento_id ON public.incidentes(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bitacora_psicosocial') THEN
    CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_establecimiento_id ON public.bitacora_psicosocial(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'medidas_apoyo') THEN
    CREATE INDEX IF NOT EXISTS idx_medidas_apoyo_establecimiento_id ON public.medidas_apoyo(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'derivaciones_externas') THEN
    CREATE INDEX IF NOT EXISTS idx_derivaciones_externas_establecimiento_id ON public.derivaciones_externas(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reportes_patio') THEN
    CREATE INDEX IF NOT EXISTS idx_reportes_patio_establecimiento_id ON public.reportes_patio(establecimiento_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logs_auditoria') THEN
    CREATE INDEX IF NOT EXISTS idx_logs_auditoria_fecha ON public.logs_auditoria(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario ON public.logs_auditoria(usuario_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hitos_expediente') THEN
    CREATE INDEX IF NOT EXISTS idx_hitos_expediente_expediente_id ON public.hitos_expediente(expediente_id);
    CREATE INDEX IF NOT EXISTS idx_hitos_expediente_fecha ON public.hitos_expediente(created_at DESC);
  END IF;
  
  -- Índices para tablas GCC v2
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mediaciones_gcc_v2') THEN
    CREATE INDEX IF NOT EXISTS idx_mediaciones_gcc_v2_establecimiento ON public.mediaciones_gcc_v2(establecimiento_id);
    CREATE INDEX IF NOT EXISTS idx_mediaciones_gcc_v2_expediente ON public.mediaciones_gcc_v2(expediente_id);
    CREATE INDEX IF NOT EXISTS idx_mediaciones_gcc_v2_estado ON public.mediaciones_gcc_v2(estado_proceso);
    RAISE NOTICE '  ✅ Índices creados para mediaciones_gcc_v2';
  END IF;
  
  RAISE NOTICE '✅ Paso 2 completado';
END $$;

-- =============================================================================
-- 3. CORREGIR POLÍTICAS DE STORAGE - BRANDING ASSETS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🗄️ Paso 3: Corrigiendo políticas de Storage...';
  
  -- Eliminar políticas existentes problemáticas
  DROP POLICY IF EXISTS "branding_assets_superadmin_upload" ON storage.objects;
  DROP POLICY IF EXISTS "branding_assets_superadmin_update" ON storage.objects;
  DROP POLICY IF EXISTS "branding_assets_superadmin_delete" ON storage.objects;
  DROP POLICY IF EXISTS "branding_assets_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "branding_assets_superadmin_insert" ON storage.objects;
  
  -- Política de lectura pública (cualquiera puede ver logos/favicons)
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
  
  RAISE NOTICE '  ✅ Políticas de Storage corregidas para branding-assets';
  RAISE NOTICE '✅ Paso 3 completado';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '  ⚠️  Error al modificar storage.objects (puede requerir permisos especiales)';
    RAISE NOTICE '  ℹ️  Ejecutar manualmente en la consola de Supabase si es necesario';
END $$;

-- =============================================================================
-- 4. ASEGURAR ESTABLECIMIENTO SUPERADMIN GLOBAL
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🏢 Paso 4: Verificando establecimiento SUPERADMIN GLOBAL...';
  
  -- Crear establecimiento para superadmin global si no existe
  INSERT INTO public.establecimientos (id, nombre, rbd, created_at)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'SUPERADMIN GLOBAL',
    'SUPERADMIN',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE 
    SET nombre = 'SUPERADMIN GLOBAL',
        rbd = 'SUPERADMIN';
  
  RAISE NOTICE '  ✅ Establecimiento SUPERADMIN GLOBAL verificado';
  RAISE NOTICE '✅ Paso 4 completado';
END $$;

-- =============================================================================
-- 5. ACTUALIZAR POLÍTICAS DE TABLAS OPERATIVAS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔐 Paso 5: Actualizando políticas de tablas operativas...';
  
  -- reportes_patio
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reportes_patio') THEN
    DROP POLICY IF EXISTS "reportes_patio_tenant_access" ON public.reportes_patio;
    DROP POLICY IF EXISTS "reportes_patio_isolation" ON public.reportes_patio;
    
    CREATE POLICY "reportes_patio_tenant_access"
    ON public.reportes_patio
    FOR ALL
    USING (
      public.is_platform_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    )
    WITH CHECK (
      public.is_platform_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    );
    
    RAISE NOTICE '  ✅ Política actualizada para reportes_patio';
  END IF;
  
  -- derivaciones_externas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'derivaciones_externas') THEN
    DROP POLICY IF EXISTS "derivaciones_externas_tenant_access" ON public.derivaciones_externas;
    DROP POLICY IF EXISTS "derivaciones_externas_isolation" ON public.derivaciones_externas;
    
    CREATE POLICY "derivaciones_externas_tenant_access"
    ON public.derivaciones_externas
    FOR ALL
    USING (
      public.is_platform_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    )
    WITH CHECK (
      public.is_platform_superadmin()
      OR public.can_access_tenant(establecimiento_id)
    );
    
    RAISE NOTICE '  ✅ Política actualizada para derivaciones_externas';
  END IF;
  
  RAISE NOTICE '✅ Paso 5 completado';
END $$;

-- =============================================================================
-- 6. CREAR/ACTUALIZAR FUNCIÓN IS_SUPERADMIN() SI NO EXISTE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '⚙️ Paso 6: Verificando función is_superadmin()...';
  
  -- Verificar si la función existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_superadmin'
  ) THEN
    -- Crear la función si no existe
    CREATE FUNCTION public.is_superadmin()
    RETURNS boolean
    LANGUAGE plpgsql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
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
    $func$;
    
    RAISE NOTICE '  ✅ Función is_superadmin() creada';
  ELSE
    RAISE NOTICE '  ✅ Función is_superadmin() ya existe';
  END IF;
  
  RAISE NOTICE '✅ Paso 6 completado';
END $$;

-- =============================================================================
-- 7. VERIFICACIÓN FINAL COMPLETA
-- =============================================================================

DO $$
DECLARE
  v_tablas_sin_rls INTEGER;
  v_roles_count INTEGER;
  v_funciones_count INTEGER;
  v_superadmins_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '            VERIFICACIÓN FINAL COMPLETA';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- 1. Verificar roles
  SELECT COUNT(*) INTO v_roles_count
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rol_usuario');
  
  RAISE NOTICE '✅ 1. Roles en enum rol_usuario: %', v_roles_count;
  
  -- 2. Verificar tablas sin RLS
  SELECT COUNT(*) INTO v_tablas_sin_rls
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND rowsecurity = false
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%';
  
  IF v_tablas_sin_rls = 0 THEN
    RAISE NOTICE '✅ 2. Todas las tablas públicas tienen RLS habilitado';
  ELSE
    RAISE NOTICE '⚠️  2. Tablas sin RLS: % (revisar si son tablas de sistema)', v_tablas_sin_rls;
  END IF;
  
  -- 3. Verificar funciones superadmin
  SELECT COUNT(*) INTO v_funciones_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('is_superadmin', 'is_platform_superadmin');
  
  RAISE NOTICE '✅ 3. Funciones de superadmin disponibles: %', v_funciones_count;
  
  -- 4. Verificar usuarios superadmin
  SELECT COUNT(*) INTO v_superadmins_count
  FROM public.perfiles
  WHERE rol = 'superadmin';
  
  IF v_superadmins_count > 0 THEN
    RAISE NOTICE '✅ 4. Usuarios superadmin configurados: %', v_superadmins_count;
  ELSE
    RAISE NOTICE '⚠️  4. No hay usuarios superadmin configurados';
    RAISE NOTICE '   ℹ️  Crea un usuario en Authentication > Users y luego ejecuta:';
    RAISE NOTICE '   INSERT INTO perfiles (id, nombre, rol, establecimiento_id, activo)';
    RAISE NOTICE '   VALUES (''UUID_DEL_USUARIO'', ''Admin'', ''superadmin'', ''00000000-0000-0000-0000-000000000001'', true);';
  END IF;
  
  -- 5. Verificar establecimiento SUPERADMIN
  IF EXISTS (
    SELECT 1 FROM public.establecimientos 
    WHERE id = '00000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE NOTICE '✅ 5. Establecimiento SUPERADMIN GLOBAL existe';
  ELSE
    RAISE NOTICE '❌ 5. Establecimiento SUPERADMIN GLOBAL NO existe';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '        ✅ CORRECCIONES APLICADAS EXITOSAMENTE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
END $$;

-- =============================================================================
-- FIN DEL SCRIPT DE CORRECCIONES FINALES
-- =============================================================================

-- NOTA: Si necesitas crear un usuario superadmin, ejecuta después de crear
-- el usuario en Supabase Authentication:
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
ON CONFLICT (id) DO UPDATE 
  SET rol = 'superadmin',
      establecimiento_id = '00000000-0000-0000-0000-000000000001',
      activo = true;
*/
