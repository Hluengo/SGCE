-- =============================================================================
-- DEBUG_BRANDING_RLS.sql
-- Script para diagnosticar problemas con RLS de branding
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- ✅ 1. Verificar que la tabla existe
SELECT 'Tabla configuracion_branding' as test, COUNT(*) as registros 
FROM public.configuracion_branding;

-- ✅ 2. Verificar que el bucket existe
SELECT id, name, public FROM storage.buckets WHERE id = 'branding-assets';

-- ✅ 3. Verificar policies de tabla
SELECT policyname, permissive, qual, with_check
FROM pg_policies 
WHERE tablename = 'configuracion_branding'
ORDER BY policyname;

-- ✅ 4. Verificar policies de storage
SELECT policyname, permissive, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE 'branding%'
ORDER BY policyname;

-- ✅ 5. Verificar la tabla de usuarios (opcional)
-- Esto muestra qué usuarios existen y sus roles
-- SELECT id, email, raw_app_meta_data->>'role' as role 
-- FROM auth.users WHERE raw_app_meta_data->>'role' = 'SUPERADMIN';

-- ✅ 6. Test: Intentar leer como datos públicos (sin RLS)
-- Si esto funciona, la tabla y datos existen
SELECT COUNT(*) as config_count FROM public.configuracion_branding;

-- ✅ 7. Verificar que RLS está habilitado en tabla
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'configuracion_branding';

-- ✅ 8. Ver estructura de la tabla (equivalente a \d configuracion_branding)
SELECT 
  a.attname as column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
  case when a.attnotnull then 'NOT NULL' else 'NULL' end as null_constraint,
  (SELECT substring(pg_catalog.pg_get_expr(d.adbin, d.adrelid) for 128)
   FROM pg_catalog.pg_attrdef d
   WHERE d.adrelid = t.oid AND d.adnum = a.attnum AND a.atthasdef) as default_value
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class t ON a.attrelid = t.oid
WHERE t.relname = 'configuracion_branding'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- =============================================================================
-- NOTAS PARA DEBUGGING:
-- =============================================================================
-- Si el INSERT/UPDATE falla con 403:
-- 1. Verificar que auth.jwt() tiene 'role' claim
-- 2. Verificar que el usuario está realmente autenticado (auth.uid() NOT NULL)
-- 3. Revisar Supabase logs en Settings > API Logs
-- 4. Ejecutar debug en browser console:
--    const s = await supabase.auth.getSession();
--    console.log('Role:', s.data.session?.user?.user_metadata?.role);
--
-- Si los tests arriba muestran 0 para algunos:
-- 1. Ejecutar migración 032 completa nuevamente
-- 2. Ejecutar migración 033 completa nuevamente
--
-- Para consultar logs de Supabase (en Settings > API Activity):
-- - Buscar por "configuracion_branding"
-- - Buscar por "403"
-- - Ver detalles del error exacto
-- =============================================================================
