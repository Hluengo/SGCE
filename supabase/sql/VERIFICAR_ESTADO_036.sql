-- =============================================================================
-- VERIFICACIÓN DE ESTADO - Migración 036
-- Ejecutar en: Supabase SQL Editor
-- =============================================================================

-- 1. ✅ Verificar enum rol_usuario (YA COMPLETADO)
SELECT '1. ENUM ROL_USUARIO' as verificacion, enumlabel as valor
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rol_usuario')
ORDER BY enumlabel;

-- 2. Verificar tablas con RLS habilitado
SELECT 
  '2. TABLAS SIN RLS' as verificacion,
  tablename as tabla, 
  CASE WHEN rowsecurity THEN '✅ RLS habilitado' ELSE '❌ RLS deshabilitado' END as estado
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'estudiantes', 'expedientes', 'evidencias', 'incidentes',
    'bitacora_psicosocial', 'medidas_apoyo', 'reportes_patio', 
    'derivaciones_externas', 'logs_auditoria'
  )
ORDER BY tablename;

-- 3. Verificar función is_superadmin() existe
SELECT 
  '3. FUNCIÓN IS_SUPERADMIN' as verificacion,
  p.proname as nombre_funcion,
  '✅ Existe' as estado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'is_superadmin';

-- 4. Verificar función is_platform_superadmin() existe
SELECT 
  '4. FUNCIÓN IS_PLATFORM_SUPERADMIN' as verificacion,
  p.proname as nombre_funcion,
  '✅ Existe' as estado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'is_platform_superadmin';

-- 5. Verificar índices con nombres únicos
SELECT 
  '5. ÍNDICES POR TABLA' as verificacion,
  tablename as tabla,
  indexname as indice
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%establecimiento_id%'
ORDER BY tablename, indexname;

-- 6. Verificar políticas de Storage para branding-assets
SELECT 
  '6. POLÍTICAS STORAGE BRANDING' as verificacion,
  policyname as politica,
  cmd as operacion
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%branding%'
ORDER BY policyname;

-- 7. Verificar establecimiento SUPERADMIN GLOBAL existe
SELECT 
  '7. ESTABLECIMIENTO SUPERADMIN' as verificacion,
  id,
  nombre,
  rbd,
  CASE WHEN id = '00000000-0000-0000-0000-000000000001' THEN '✅ Existe' ELSE '⚠️ ID diferente' END as estado
FROM public.establecimientos
WHERE nombre ILIKE '%superadmin%' OR rbd = 'SUPERADMIN'
LIMIT 1;

-- 8. Verificar si existe algún perfil con rol superadmin
SELECT 
  '8. PERFILES SUPERADMIN' as verificacion,
  COUNT(*) as cantidad_superadmins,
  CASE WHEN COUNT(*) > 0 THEN '✅ Existen' ELSE '⚠️ No hay superadmins' END as estado
FROM public.perfiles
WHERE rol = 'superadmin';

-- 9. Verificar políticas con is_superadmin o is_platform_superadmin
SELECT 
  '9. POLÍTICAS CON SUPERADMIN CHECK' as verificacion,
  schemaname as schema,
  tablename as tabla,
  policyname as politica,
  '✅ Usa verificación superadmin' as estado
FROM pg_policies
WHERE (qual::text ILIKE '%is_superadmin%' 
   OR qual::text ILIKE '%is_platform_superadmin%'
   OR with_check::text ILIKE '%is_superadmin%'
   OR with_check::text ILIKE '%is_platform_superadmin%')
ORDER BY schemaname, tablename, policyname;

-- =============================================================================
-- RESUMEN RÁPIDO
-- =============================================================================

SELECT 
  '=== RESUMEN ===' as seccion,
  (SELECT COUNT(*) FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'rol_usuario')) as total_roles,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tablas_con_rls,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname IN ('is_superadmin', 'is_platform_superadmin')) as funciones_superadmin,
  (SELECT COUNT(*) FROM public.perfiles WHERE rol = 'superadmin') as usuarios_superadmin;
