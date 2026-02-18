-- =============================================================================
-- CORRECCIÓN COMPLETA USUARIO SUPERADMIN
-- UUID: f25d35d0-d30c-463c-9321-74568a060349
-- Email: superadmin.20260216133309@gestionconvivencia.cl
-- =============================================================================

-- =============================================================================
-- PASO 1: CORREGIR TABLA PERFILES
-- =============================================================================

-- Asegurar que existe el establecimiento SUPERADMIN GLOBAL
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

-- Crear o actualizar perfil con datos correctos
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

-- Verificar corrección en tabla perfiles
SELECT 
  '✅ PASO 1: PERFIL CORREGIDO' as resultado,
  p.id,
  p.nombre || ' ' || p.apellido as nombre_completo,
  p.rol,
  e.nombre as establecimiento,
  e.id as establecimiento_id,
  p.activo
FROM public.perfiles p
JOIN public.establecimientos e ON p.establecimiento_id = e.id
WHERE p.id = 'f25d35d0-d30c-463c-9321-74568a060349';

-- =============================================================================
-- PASO 2: INTENTAR ACTUALIZAR AUTH.USERS (Requiere privilegios especiales)
-- =============================================================================

DO $$
BEGIN
  BEGIN
    -- Actualizar raw_app_meta_data
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      raw_app_meta_data,
      '{establecimiento_id}',
      '"00000000-0000-0000-0000-000000000001"'::jsonb
    ),
    -- Actualizar raw_user_meta_data
    raw_user_meta_data = jsonb_set(
      raw_user_meta_data,
      '{establecimiento_id}',
      '"00000000-0000-0000-0000-000000000001"'::jsonb
    ),
    updated_at = NOW()
    WHERE id = 'f25d35d0-d30c-463c-9321-74568a060349';
    
    RAISE NOTICE '✅ JWT actualizado en auth.users correctamente';
    
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '⚠️  No tienes permisos para modificar auth.users directamente';
      RAISE NOTICE 'ℹ️  Debes actualizar manualmente en Supabase Dashboard';
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️  Error al actualizar auth.users: %', SQLERRM;
      RAISE NOTICE 'ℹ️  Debes actualizar manualmente en Supabase Dashboard';
  END;
END $$;

-- =============================================================================
-- PASO 3: VERIFICACIÓN FINAL
-- =============================================================================

SELECT 
  '═══════════════════════════════════════════════════════════' as separador
UNION ALL
SELECT '              ✅ CORRECCIÓN COMPLETADA'
UNION ALL
SELECT '═══════════════════════════════════════════════════════════'
UNION ALL
SELECT ''
UNION ALL
SELECT '✅ Tabla perfiles: ACTUALIZADA'
UNION ALL
SELECT 'ℹ️  Auth metadata: Requiere actualización manual si falló el SQL'
UNION ALL
SELECT ''
UNION ALL
SELECT '═══════════════════════════════════════════════════════════';

-- =============================================================================
-- INSTRUCCIONES PARA ACTUALIZAR MANUALMENTE (Si el SQL falló)
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '     INSTRUCCIONES PARA ACTUALIZAR JWT MANUALMENTE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣  Ve a: Supabase Dashboard → Authentication → Users';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  Busca el usuario: superadmin.20260216133309@gestionconvivencia.cl';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  Click en los 3 puntos (•••) → Edit user';
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  En la sección "Raw User Meta Data", cambia:';
  RAISE NOTICE '    DE:  "establecimiento_id": "d645e547-054f-4ce4-bff7-7a18ca61db50"';
  RAISE NOTICE '    A:   "establecimiento_id": "00000000-0000-0000-0000-000000000001"';
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣  En la sección "Raw App Meta Data", cambia:';
  RAISE NOTICE '    DE:  "establecimiento_id": "d645e547-054f-4ce4-bff7-7a18ca61db50"';
  RAISE NOTICE '    A:   "establecimiento_id": "00000000-0000-0000-0000-000000000001"';
  RAISE NOTICE '';
  RAISE NOTICE '    OPCIONAL: También puedes cambiar el role a minúsculas:';
  RAISE NOTICE '    DE:  "role": "SUPERADMIN"';
  RAISE NOTICE '    A:   "role": "superadmin"';
  RAISE NOTICE '';
  RAISE NOTICE '6️⃣  Click en "Save"';
  RAISE NOTICE '';
  RAISE NOTICE '7️⃣  EN LA APLICACIÓN:';
  RAISE NOTICE '    • Cerrar sesión (logout)';
  RAISE NOTICE '    • Volver a iniciar sesión';
  RAISE NOTICE '    • Esto cargará el nuevo JWT con los datos correctos';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- =============================================================================
-- VERIFICAR ESTADO FINAL DEL PERFIL
-- =============================================================================

SELECT 
  '📊 ESTADO FINAL DEL PERFIL' as verificacion,
  p.id,
  p.nombre || ' ' || p.apellido as nombre_completo,
  p.rol as rol_en_db,
  e.nombre as establecimiento,
  e.id as establecimiento_id,
  p.activo,
  CASE 
    WHEN p.rol = 'superadmin' 
      AND p.establecimiento_id = '00000000-0000-0000-0000-000000000001'
      AND p.activo = true
    THEN '✅ PERFECTO - Todo configurado correctamente'
    WHEN p.rol = 'superadmin' 
      AND p.establecimiento_id = '00000000-0000-0000-0000-000000000001'
    THEN '✅ CORRECTO - Solo falta activar'
    WHEN p.rol = 'superadmin'
    THEN '⚠️ PARCIAL - Rol correcto pero establecimiento incorrecto'
    ELSE '❌ ERROR - Revisar configuración'
  END as estado
FROM public.perfiles p
LEFT JOIN public.establecimientos e ON p.establecimiento_id = e.id
WHERE p.id = 'f25d35d0-d30c-463c-9321-74568a060349';

-- =============================================================================
-- RESUMEN DE CAMBIOS NECESARIOS
-- =============================================================================

SELECT 
  '📝 RESUMEN DE CAMBIOS' as titulo,
  'ANTES' as momento,
  'd645e547-054f-4ce4-bff7-7a18ca61db50' as establecimiento_id,
  'Establecimiento regular' as tipo
UNION ALL
SELECT 
  '📝 RESUMEN DE CAMBIOS',
  'DESPUÉS',
  '00000000-0000-0000-0000-000000000001',
  'SUPERADMIN GLOBAL';
