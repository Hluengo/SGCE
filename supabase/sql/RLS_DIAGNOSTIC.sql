-- =============================================================================
-- DIAGNÓSTICO: Verificar estado de RLS y roles para branding
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================================================

-- 1. Verificar si RLS está habilitado en configuracion_branding
SELECT 
  'Tabla configuracion_branding' AS check_item,
  relrowsecurity AS rls_enabled,
  relname AS table_name
FROM pg_class 
WHERE relname = 'configuracion_branding';

-- 2. Ver políticas activas en configuracion_branding
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'configuracion_branding';

-- 3. Verificar el rol del usuario actual en diferentes ubicaciones
-- (Esto mostrará los datos del usuario autenticado actualmente)
SELECT 
  'JWT Claims' AS location,
  auth.jwt() AS jwt_data
WHERE auth.uid() IS NOT NULL
UNION ALL
SELECT 
  'auth.users table' AS location,
  json_build_object(
    'id', id,
    'email', email,
    'role', raw_app_meta_data->>'role',
    'user_metadata', raw_user_meta_data
  ) AS data
FROM auth.users
WHERE id = auth.uid()
UNION ALL
SELECT 
  'perfiles table' AS location,
  json_build_object(
    'id', id,
    'rol', rol,
    'establecimiento_id', establecimiento_id
  ) AS data
FROM public.perfiles
WHERE id = auth.uid();

-- 4. Verificar si el email del superadmin está configurado correctamente
-- Este es el email que las políticas buscan: 'superadmin@gestionconvivencia.cl'
SELECT 
  email,
  raw_app_meta_data->>'role' AS app_role,
  raw_user_meta_data->>'role' AS user_metadata_role
FROM auth.users
WHERE email IN ('superadmin@gestionconvivencia.cl', 'admin@admin.cl');

-- 5. Ver todos los usuarios con rol SUPERADMIN en cualquier lugar
SELECT 
  'auth.users' AS source,
  email,
  raw_app_meta_data->>'role' AS role
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'SUPERADMIN'

UNION ALL

SELECT 
  'perfiles' AS source,
  p.email,
  p.rol AS role
FROM public.perfiles p
WHERE p.rol ILIKE '%superadmin%';
