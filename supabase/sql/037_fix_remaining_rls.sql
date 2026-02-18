-- =============================================================================
-- 037_fix_remaining_rls.sql
-- Habilitar RLS en tablas faltantes y crear políticas apropiadas
-- Fecha: 2026-02-18
-- =============================================================================

-- =============================================================================
-- 1. FERIADOS_CHILE - Catálogo de feriados legales de Chile
-- =============================================================================

-- Habilitar RLS
ALTER TABLE public.feriados_chile ENABLE ROW LEVEL SECURITY;

-- Política de lectura: todos los autenticados pueden leer
DROP POLICY IF EXISTS "feriados_read_authenticated" ON public.feriados_chile;
CREATE POLICY "feriados_read_authenticated" 
  ON public.feriados_chile
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Política de escritura: solo superadmin puede modificar
DROP POLICY IF EXISTS "feriados_write_superadmin" ON public.feriados_chile;
CREATE POLICY "feriados_write_superadmin"
  ON public.feriados_chile
  FOR ALL
  USING (public.is_platform_superadmin())
  WITH CHECK (public.is_platform_superadmin());

-- =============================================================================
-- 2. EVIDENCIAS_URL_STORAGE_MIGRATION_LOG - Tabla de migración temporal
-- =============================================================================

-- Habilitar RLS
ALTER TABLE public.evidencias_url_storage_migration_log ENABLE ROW LEVEL SECURITY;

-- Política: solo superadmin tiene acceso completo
DROP POLICY IF EXISTS "migration_log_superadmin_only" ON public.evidencias_url_storage_migration_log;
CREATE POLICY "migration_log_superadmin_only"
  ON public.evidencias_url_storage_migration_log
  FOR ALL
  USING (public.is_platform_superadmin())
  WITH CHECK (public.is_platform_superadmin());

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

-- Verificar que ambas tablas ahora tienen RLS habilitado
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS habilitado' 
    ELSE '❌ RLS deshabilitado' 
  END as estado
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('feriados_chile', 'evidencias_url_storage_migration_log');

-- Verificar políticas creadas
SELECT 
  tablename,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('feriados_chile', 'evidencias_url_storage_migration_log')
ORDER BY tablename, policyname;
