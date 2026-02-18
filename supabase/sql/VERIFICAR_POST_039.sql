-- =============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN 039: BYPASS RLS SUPERADMIN
-- =============================================================================
-- Este script verifica que las políticas RLS incluyan correctamente
-- is_platform_superadmin() para dar acceso global a superadmins
-- =============================================================================

-- Listar todas las políticas que ahora incluyen is_platform_superadmin
SELECT 
  'POLÍTICAS CON BYPASS SUPERADMIN' as verificacion,
  schemaname,
  tablename,
  policyname,
  cmd as operacion,
  qual as condicion_using,
  with_check as condicion_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%is_platform_superadmin%' OR with_check LIKE '%is_platform_superadmin%')
ORDER BY tablename, policyname;

-- Contar políticas por tabla
SELECT 
  '📊 RESUMEN POR TABLA' as titulo,
  tablename,
  COUNT(*) as total_politicas,
  SUM(CASE WHEN qual LIKE '%is_platform_superadmin%' 
           OR with_check LIKE '%is_platform_superadmin%' THEN 1 ELSE 0 END) as con_bypass_superadmin
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'perfiles', 'estudiantes', 'expedientes', 'evidencias',
    'bitacora_psicosocial', 'medidas_apoyo', 'incidentes',
    'logs_auditoria', 'cursos_inspector', 'derivaciones_externas',
    'bitacora_salida', 'reportes_patio', 'hitos_expediente',
    'establecimientos'
  )
GROUP BY tablename
ORDER BY tablename;

-- Verificar que la función is_platform_superadmin existe
SELECT 
  '🔧 FUNCIÓN is_platform_superadmin()' as verificacion,
  n.nspname as schema,
  p.proname as funcion,
  pg_get_functiondef(p.oid) as definicion
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'is_platform_superadmin';

-- Test: Verificar que un superadmin tiene acceso
DO $$
DECLARE
  v_es_superadmin boolean;
  v_rol text;
  v_establecimiento_id uuid;
BEGIN
  -- Obtener información del usuario actual
  SELECT 
    p.rol::text,
    p.establecimiento_id,
    is_platform_superadmin()
  INTO v_rol, v_establecimiento_id, v_es_superadmin
  FROM perfiles p
  WHERE p.id = auth.uid();

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '           TEST DE ACCESO SUPERADMIN';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Usuario actual:';
  RAISE NOTICE '  • UUID: %', auth.uid();
  RAISE NOTICE '  • Rol: %', COALESCE(v_rol, 'NO ENCONTRADO');
  RAISE NOTICE '  • Establecimiento: %', COALESCE(v_establecimiento_id::text, 'NO ENCONTRADO');
  RAISE NOTICE '  • is_platform_superadmin(): %', COALESCE(v_es_superadmin::text, 'false');
  RAISE NOTICE '';
  
  IF v_es_superadmin THEN
    RAISE NOTICE '✅ ACCESO SUPERADMIN CONFIRMADO';
    RAISE NOTICE '   Este usuario puede ver datos de TODOS los establecimientos';
  ELSE
    RAISE NOTICE '⚠️  NO ES SUPERADMIN';
    RAISE NOTICE '   Solo puede ver datos de su establecimiento: %', v_establecimiento_id;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Contar establecimientos totales disponibles
SELECT 
  '🏫 ESTABLECIMIENTOS EN EL SISTEMA' as info,
  COUNT(*) as total_establecimientos,
  COUNT(*) FILTER (WHERE activo = true) as activos,
  COUNT(*) FILTER (WHERE activo = false) as inactivos
FROM establecimientos;

-- Listar los primeros 5 establecimientos (para test de acceso)
SELECT 
  '📋 PRIMEROS 5 ESTABLECIMIENTOS (Test de acceso)' as titulo,
  id,
  nombre,
  rbd,
  activo,
  CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001' THEN '⭐ SUPERADMIN GLOBAL'
    ELSE 'Establecimiento regular'
  END as tipo
FROM establecimientos
ORDER BY 
  CASE WHEN id = '00000000-0000-0000-0000-000000000001' THEN 0 ELSE 1 END,
  nombre
LIMIT 5;

-- Estado final
SELECT 
  '═══════════════════════════════════════════════════════════' as separador
UNION ALL
SELECT '              ✅ VERIFICACIÓN COMPLETADA'
UNION ALL
SELECT '═══════════════════════════════════════════════════════════'
UNION ALL
SELECT ''
UNION ALL
SELECT 'PRÓXIMOS PASOS:'
UNION ALL
SELECT '1. Revisar los resultados arriba'
UNION ALL
SELECT '2. Confirmar que las políticas incluyen is_platform_superadmin()'
UNION ALL
SELECT '3. Cerrar sesión y volver a iniciar sesión en la aplicación'
UNION ALL
SELECT '4. Usar el selector de colegios para cambiar entre establecimientos'
UNION ALL
SELECT '5. Verificar que puedes ver datos del colegio seleccionado'
UNION ALL
SELECT ''
UNION ALL
SELECT '═══════════════════════════════════════════════════════════';
