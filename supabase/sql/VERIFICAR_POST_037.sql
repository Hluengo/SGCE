-- =============================================================================
-- VERIFICACIÓN POST-CORRECCIÓN 037
-- Ejecutar después de aplicar 037_final_corrections_complete.sql
-- =============================================================================

-- =============================================================================
-- 1. VERIFICAR TABLAS CON RLS
-- =============================================================================
SELECT 
  '1️⃣ ESTADO RLS' as seccion,
  tablename as tabla,
  CASE 
    WHEN rowsecurity THEN '✅ RLS habilitado' 
    ELSE '❌ SIN RLS' 
  END as estado
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('feriados_chile', 'evidencias_url_storage_migration_log')
ORDER BY tablename;

-- =============================================================================
-- 2. VERIFICAR ÍNDICES ÚNICOS
-- =============================================================================
SELECT 
  '2️⃣ ÍNDICES ÚNICOS' as seccion,
  tablename as tabla,
  COUNT(*) as cantidad_indices
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%establecimiento_id%'
GROUP BY tablename
ORDER BY tablename;

-- Verificar que NO existe el índice duplicado genérico
SELECT 
  '2️⃣ ÍNDICE DUPLICADO' as seccion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_establecimiento_id')
    THEN '❌ Aún existe el índice duplicado'
    ELSE '✅ Índice duplicado eliminado correctamente'
  END as estado;

-- =============================================================================
-- 3. VERIFICAR POLÍTICAS DE STORAGE
-- =============================================================================
SELECT 
  '3️⃣ POLÍTICAS STORAGE' as seccion,
  policyname as politica,
  cmd as operacion,
  CASE 
    WHEN with_check::text ILIKE '%is_platform_superadmin%' 
    THEN '✅ Usa is_platform_superadmin()'
    ELSE '⚠️ No usa verificación superadmin'
  END as verificacion
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%branding%'
ORDER BY policyname;

-- =============================================================================
-- 4. VERIFICAR ESTABLECIMIENTO SUPERADMIN GLOBAL
-- =============================================================================
SELECT 
  '4️⃣ ESTABLECIMIENTO' as seccion,
  id,
  nombre,
  rbd,
  CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001' 
    THEN '✅ ID correcto' 
    ELSE '⚠️ ID diferente' 
  END as estado
FROM public.establecimientos
WHERE id = '00000000-0000-0000-0000-000000000001'
   OR nombre ILIKE '%superadmin%' 
   OR rbd = 'SUPERADMIN';

-- =============================================================================
-- 5. VERIFICAR FUNCIONES
-- =============================================================================
SELECT 
  '5️⃣ FUNCIONES' as seccion,
  p.proname as funcion,
  '✅ Existe' as estado,
  pg_get_function_arguments(p.oid) as argumentos,
  pg_get_function_result(p.oid) as retorno
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('is_superadmin', 'is_platform_superadmin')
ORDER BY p.proname;

-- =============================================================================
-- 6. VERIFICAR POLÍTICAS DE TABLAS OPERATIVAS
-- =============================================================================
SELECT 
  '6️⃣ POLÍTICAS OPERATIVAS' as seccion,
  tablename as tabla,
  policyname as politica,
  cmd as operacion,
  CASE 
    WHEN qual::text ILIKE '%is_platform_superadmin%' 
      OR with_check::text ILIKE '%is_platform_superadmin%'
    THEN '✅ Incluye superadmin'
    ELSE '⚠️ Sin verificación superadmin'
  END as verificacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('reportes_patio', 'derivaciones_externas')
  AND policyname LIKE '%tenant_access%'
ORDER BY tablename, policyname;

-- =============================================================================
-- 7. VERIFICAR USUARIOS SUPERADMIN
-- =============================================================================
SELECT 
  '7️⃣ USUARIOS SUPERADMIN' as seccion,
  p.id,
  p.nombre,
  p.rol,
  e.nombre as establecimiento,
  p.activo,
  CASE 
    WHEN p.activo THEN '✅ Activo' 
    ELSE '⚠️ Inactivo' 
  END as estado
FROM public.perfiles p
JOIN public.establecimientos e ON p.establecimiento_id = e.id
WHERE p.rol = 'superadmin';

-- Si no hay usuarios superadmin
SELECT 
  '7️⃣ USUARIOS SUPERADMIN' as seccion,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ No hay usuarios superadmin configurados'
    ELSE '✅ ' || COUNT(*) || ' usuario(s) superadmin encontrado(s)'
  END as estado
FROM public.perfiles
WHERE rol = 'superadmin';

-- =============================================================================
-- 8. RESUMEN EJECUTIVO
-- =============================================================================
SELECT 
  '═══ RESUMEN EJECUTIVO ═══' as titulo,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tablas_con_rls,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%') as tablas_sin_rls,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%establecimiento_id%') as indices_tenant,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname IN ('is_superadmin', 'is_platform_superadmin')) as funciones_superadmin,
  (SELECT COUNT(*) FROM public.perfiles WHERE rol = 'superadmin') as usuarios_superadmin,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND policyname LIKE '%branding%') as politicas_storage_branding;

-- =============================================================================
-- 9. ESTADO GENERAL
-- =============================================================================
DO $$
DECLARE
  v_tablas_sin_rls INTEGER;
  v_tiene_superadmin BOOLEAN;
  v_tiene_establecimiento BOOLEAN;
  v_tiene_funciones BOOLEAN;
  v_estado_general TEXT;
BEGIN
  -- Contar tablas sin RLS
  SELECT COUNT(*) INTO v_tablas_sin_rls
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND rowsecurity = false
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%';
  
  -- Verificar superadmin
  SELECT EXISTS(SELECT 1 FROM public.perfiles WHERE rol = 'superadmin') INTO v_tiene_superadmin;
  
  -- Verificar establecimiento
  SELECT EXISTS(SELECT 1 FROM public.establecimientos WHERE id = '00000000-0000-0000-0000-000000000001') INTO v_tiene_establecimiento;
  
  -- Verificar funciones
  SELECT COUNT(*) >= 2 INTO v_tiene_funciones
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('is_superadmin', 'is_platform_superadmin');
  
  -- Determinar estado general
  IF v_tablas_sin_rls = 0 AND v_tiene_superadmin AND v_tiene_establecimiento AND v_tiene_funciones THEN
    v_estado_general := '🎉 ✅ EXCELENTE - Todas las correcciones aplicadas correctamente';
  ELSIF v_tablas_sin_rls = 0 AND v_tiene_funciones AND v_tiene_establecimiento THEN
    v_estado_general := '✅ BUENO - Correcciones aplicadas, falta crear usuario superadmin';
  ELSIF v_tablas_sin_rls > 0 THEN
    v_estado_general := '⚠️ PARCIAL - Aún hay ' || v_tablas_sin_rls || ' tabla(s) sin RLS';
  ELSE
    v_estado_general := '⚠️ REVISAR - Algunas correcciones no se aplicaron';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '              ESTADO GENERAL DEL SISTEMA';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '%', v_estado_general;
  RAISE NOTICE '';
  RAISE NOTICE 'Detalles:';
  RAISE NOTICE '  • Tablas sin RLS: %', v_tablas_sin_rls;
  RAISE NOTICE '  • Usuario superadmin: %', CASE WHEN v_tiene_superadmin THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  • Establecimiento Global: %', CASE WHEN v_tiene_establecimiento THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  • Funciones de seguridad: %', CASE WHEN v_tiene_funciones THEN '✅' ELSE '❌' END;
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
END $$;
