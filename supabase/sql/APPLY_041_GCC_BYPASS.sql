-- ============================================================================
-- APLICAR MIGRACIÓN 041 - GCC Superadmin Bypass
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard → SQL Editor
-- 2. Copiar y pegar este script completo
-- 3. Ejecutar
-- ============================================================================

-- Leer el archivo de migración 041
\i supabase/migrations/041_gcc_superadmin_bypass.sql

-- Verificar que las políticas se aplicaron correctamente
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN (
  'mediaciones_gcc_v2',
  'participantes_gcc_v2',
  'hitos_gcc_v2',
  'actas_gcc_v2',
  'compromisos_gcc_v2'
)
ORDER BY tablename, policyname;

-- Verificar que is_superadmin_from_jwt() existe
SELECT
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'is_superadmin_from_jwt';

-- ============================================================================
-- RESULTADO ESPERADO:
-- - Cada tabla GCC debe tener 3 políticas: _read, _insert/_write, _update
-- - La función is_superadmin_from_jwt() debe existir
-- ============================================================================
