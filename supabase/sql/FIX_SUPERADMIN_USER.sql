-- =============================================================================
-- VERIFICAR Y CORREGIR USUARIO SUPERADMIN
-- UUID: f25d35d0-d30c-463c-9321-74568a060349
-- =============================================================================

-- =============================================================================
-- 1. VERIFICAR SI EXISTE PERFIL PARA ESTE USUARIO
-- =============================================================================
SELECT 
  '1️⃣ PERFIL ACTUAL' as verificacion,
  p.id,
  p.nombre,
  p.rol,
  p.establecimiento_id,
  e.nombre as nombre_establecimiento,
  p.activo,
  CASE 
    WHEN p.rol = 'superadmin' THEN '✅ Rol correcto'
    ELSE '⚠️ Rol incorrecto: ' || p.rol::text
  END as estado_rol,
  CASE 
    WHEN p.establecimiento_id = '00000000-0000-0000-0000-000000000001' THEN '✅ Establecimiento correcto'
    ELSE '⚠️ Establecimiento incorrecto'
  END as estado_establecimiento
FROM public.perfiles p
LEFT JOIN public.establecimientos e ON p.establecimiento_id = e.id
WHERE p.id = 'f25d35d0-d30c-463c-9321-74568a060349';

-- Si no existe perfil
SELECT 
  '1️⃣ PERFIL ACTUAL' as verificacion,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.perfiles WHERE id = 'f25d35d0-d30c-463c-9321-74568a060349')
    THEN '❌ NO EXISTE PERFIL en tabla perfiles'
    ELSE '✅ Perfil existe'
  END as estado;

-- =============================================================================
-- 2. VERIFICAR ESTABLECIMIENTO ACTUAL DEL USUARIO
-- =============================================================================
SELECT 
  '2️⃣ ESTABLECIMIENTO ACTUAL' as verificacion,
  id,
  nombre,
  rbd,
  CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001' THEN '✅ Es el establecimiento SUPERADMIN GLOBAL'
    WHEN id = 'd645e547-054f-4ce4-bff7-7a18ca61db50' THEN '⚠️ Es un establecimiento regular'
    ELSE '❓ Otro establecimiento'
  END as tipo
FROM public.establecimientos
WHERE id IN ('d645e547-054f-4ce4-bff7-7a18ca61db50', '00000000-0000-0000-0000-000000000001')
ORDER BY 
  CASE WHEN id = '00000000-0000-0000-0000-000000000001' THEN 0 ELSE 1 END;

-- =============================================================================
-- 3. PROBLEMA DETECTADO
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '              PROBLEMAS DETECTADOS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '❌ PROBLEMA 1: Establecimiento Incorrecto';
  RAISE NOTICE '   • Actual: d645e547-054f-4ce4-bff7-7a18ca61db50 (establecimiento regular)';
  RAISE NOTICE '   • Debería ser: 00000000-0000-0000-0000-000000000001 (SUPERADMIN GLOBAL)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  PROBLEMA 2: JWT con datos incorrectos';
  RAISE NOTICE '   • El JWT tiene establecimiento_id del establecimiento regular';
  RAISE NOTICE '   • Necesita logout/login después de corregir el perfil';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- 4. CORRECCIÓN AUTOMÁTICA
-- =============================================================================

-- PASO 4A: Asegurar que existe el establecimiento SUPERADMIN GLOBAL
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

-- PASO 4B: Crear o actualizar perfil con datos correctos
INSERT INTO public.perfiles (
  id, 
  nombre, 
  apellido,
  rol, 
  establecimiento_id, 
  activo, 
  created_at,
  updated_at
)
VALUES (
  'f25d35d0-d30c-463c-9321-74568a060349',
  'Super',
  'Admin',
  'superadmin',
  '00000000-0000-0000-0000-000000000001',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE 
  SET rol = 'superadmin',
      establecimiento_id = '00000000-0000-0000-0000-000000000001',
      activo = true,
      updated_at = NOW();

-- =============================================================================
-- 5. VERIFICAR CORRECCIÓN
-- =============================================================================
SELECT 
  '5️⃣ PERFIL CORREGIDO' as verificacion,
  p.id,
  p.nombre,
  p.apellido,
  p.rol,
  e.nombre as establecimiento,
  p.activo,
  CASE 
    WHEN p.rol = 'superadmin' AND p.establecimiento_id = '00000000-0000-0000-0000-000000000001' 
    THEN '✅ CORRECTO - Perfil configurado correctamente'
    ELSE '⚠️ AÚN HAY PROBLEMAS'
  END as estado
FROM public.perfiles p
JOIN public.establecimientos e ON p.establecimiento_id = e.id
WHERE p.id = 'f25d35d0-d30c-463c-9321-74568a060349';

-- =============================================================================
-- 6. PROBAR FUNCIÓN is_platform_superadmin()
-- =============================================================================
-- NOTA: Esta consulta solo funcionará si estás autenticado como este usuario en la sesión
-- SELECT 
--   '6️⃣ PRUEBA FUNCIÓN SUPERADMIN' as verificacion,
--   public.is_platform_superadmin() as es_superadmin,
--   auth.uid() as usuario_actual;

-- =============================================================================
-- 7. INSTRUCCIONES FINALES
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '              ✅ CORRECCIÓN APLICADA';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Perfil actualizado en la base de datos';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE - PASOS SIGUIENTES:';
  RAISE NOTICE '';
  RAISE NOTICE '1. ACTUALIZAR JWT (app_metadata) en Supabase Authentication:';
  RAISE NOTICE '   • Ve a: Authentication > Users > superadmin.20260216133309@gestionconvivencia.cl';
  RAISE NOTICE '   • Edita el usuario';
  RAISE NOTICE '   • En "Raw User Meta Data" o CLI, actualiza:';
  RAISE NOTICE '     {';
  RAISE NOTICE '       "role": "superadmin",';
  RAISE NOTICE '       "establecimiento_id": "00000000-0000-0000-0000-000000000001"';
  RAISE NOTICE '     }';
  RAISE NOTICE '';
  RAISE NOTICE '2. FORZAR LOGOUT/LOGIN:';
  RAISE NOTICE '   • Cierra sesión en la aplicación';
  RAISE NOTICE '   • Vuelve a iniciar sesión';
  RAISE NOTICE '   • Esto actualizará el JWT con los nuevos datos';
  RAISE NOTICE '';
  RAISE NOTICE '3. ALTERNATIVA - Actualizar via SQL (requiere extension):';
  RAISE NOTICE '   -- Si tienes acceso a auth.users:';
  RAISE NOTICE '   -- UPDATE auth.users';
  RAISE NOTICE '   -- SET raw_app_meta_data = raw_app_meta_data || ';
  RAISE NOTICE '   --   ''{"establecimiento_id": "00000000-0000-0000-0000-000000000001"}''::jsonb';
  RAISE NOTICE '   -- WHERE id = ''f25d35d0-d30c-463c-9321-74568a060349'';';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- 8. VERIFICAR TODOS LOS PERFILES SUPERADMIN
-- =============================================================================
SELECT 
  '8️⃣ TODOS LOS SUPERADMINS' as verificacion,
  p.id,
  p.nombre || ' ' || COALESCE(p.apellido, '') as nombre_completo,
  p.rol,
  e.nombre as establecimiento,
  e.id as establecimiento_id,
  p.activo,
  CASE 
    WHEN p.establecimiento_id = '00000000-0000-0000-0000-000000000001' THEN '✅ Configuración correcta'
    ELSE '⚠️ Establecimiento incorrecto'
  END as estado
FROM public.perfiles p
JOIN public.establecimientos e ON p.establecimiento_id = e.id
WHERE p.rol = 'superadmin'
ORDER BY p.created_at DESC;
