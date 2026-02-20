-- ============================================================================
-- 050_hotfix_stack_depth_superadmin_rls.sql
-- Hotfix inmediato para error 500 "stack depth limit exceeded" en /admin.
-- Estrategia:
-- 1) Crear función sin acceso a tablas para detectar superadmin vía JWT.
-- 2) Reescribir políticas críticas para no depender de is_platform_superadmin()
--    (evita recursión RLS con tabla perfiles).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_jwt_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT UPPER(
    COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )
  ) = 'SUPERADMIN';
$$;

GRANT EXECUTE ON FUNCTION public.is_jwt_superadmin() TO authenticated;

-- --------------------------------------------------------------------------
-- perfiles (evitar recursión directa en loadProfile y panel admin)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS perfiles_superadmin_select ON public.perfiles;
CREATE POLICY perfiles_superadmin_select
  ON public.perfiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.is_jwt_superadmin()
  );

DROP POLICY IF EXISTS perfiles_superadmin_insert ON public.perfiles;
CREATE POLICY perfiles_superadmin_insert
  ON public.perfiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_jwt_superadmin());

DROP POLICY IF EXISTS perfiles_superadmin_update ON public.perfiles;
CREATE POLICY perfiles_superadmin_update
  ON public.perfiles
  FOR UPDATE
  TO authenticated
  USING (public.is_jwt_superadmin())
  WITH CHECK (public.is_jwt_superadmin());

DROP POLICY IF EXISTS perfiles_superadmin_delete ON public.perfiles;
CREATE POLICY perfiles_superadmin_delete
  ON public.perfiles
  FOR DELETE
  TO authenticated
  USING (public.is_jwt_superadmin());

-- --------------------------------------------------------------------------
-- Tablas usadas por SuperAdminPage en carga inicial
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS superadmin_tenant_feature_flags_all ON public.tenant_feature_flags;
CREATE POLICY superadmin_tenant_feature_flags_all
  ON public.tenant_feature_flags
  FOR ALL
  TO authenticated
  USING (public.is_jwt_superadmin())
  WITH CHECK (public.is_jwt_superadmin());

DROP POLICY IF EXISTS superadmin_platform_settings_all ON public.platform_settings;
CREATE POLICY superadmin_platform_settings_all
  ON public.platform_settings
  FOR ALL
  TO authenticated
  USING (public.is_jwt_superadmin())
  WITH CHECK (public.is_jwt_superadmin());

DROP POLICY IF EXISTS superadmin_audit_logs_all ON public.superadmin_audit_logs;
CREATE POLICY superadmin_audit_logs_all
  ON public.superadmin_audit_logs
  FOR ALL
  TO authenticated
  USING (public.is_jwt_superadmin())
  WITH CHECK (public.is_jwt_superadmin());

COMMIT;

