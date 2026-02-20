-- ============================================================================
-- 051_emergency_break_rls_recursion_superadmin.sql
-- Hotfix definitivo para "stack depth limit exceeded" (54001) en /admin.
-- Objetivo: eliminar recursión RLS en funciones/policies de superadmin.
-- ============================================================================

BEGIN;

-- 1) Fuente de verdad para autorización superadmin basada en JWT (sin tablas)
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

-- 2) Alias de compatibilidad: is_platform_superadmin ya no consulta perfiles
CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_jwt_superadmin();
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_superadmin() TO authenticated;

-- 3) can_access_tenant sin recursión
CREATE OR REPLACE FUNCTION public.can_access_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT
    public.is_jwt_superadmin()
    OR EXISTS (
      SELECT 1
      FROM public.perfiles p
      WHERE p.id = auth.uid()
        AND p.establecimiento_id = p_tenant_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_access_tenant(UUID) TO authenticated;

-- 4) RPC de gestión de roles/permisos también basada en JWT
CREATE OR REPLACE FUNCTION public.superadmin_upsert_profile_access(
  p_user_id UUID,
  p_rol TEXT,
  p_permisos JSONB DEFAULT '[]'::JSONB,
  p_establecimiento_id UUID DEFAULT NULL,
  p_activo BOOLEAN DEFAULT true,
  p_nombre TEXT DEFAULT NULL,
  p_apellido TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol public.rol_usuario;
BEGIN
  IF NOT public.is_jwt_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN_SUPERADMIN_REQUIRED');
  END IF;

  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_ID_REQUIRED');
  END IF;

  IF jsonb_typeof(COALESCE(p_permisos, '[]'::JSONB)) <> 'array' THEN
    RETURN jsonb_build_object('success', false, 'error', 'PERMISOS_INVALID_FORMAT');
  END IF;

  BEGIN
    v_rol := LOWER(COALESCE(p_rol, 'convivencia'))::public.rol_usuario;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', 'ROL_INVALIDO');
  END;

  INSERT INTO public.perfiles (
    id,
    nombre,
    apellido,
    rol,
    permisos,
    establecimiento_id,
    activo
  ) VALUES (
    p_user_id,
    COALESCE(NULLIF(TRIM(p_nombre), ''), 'Perfil'),
    COALESCE(NULLIF(TRIM(p_apellido), ''), ''),
    v_rol,
    COALESCE(p_permisos, '[]'::JSONB),
    p_establecimiento_id,
    COALESCE(p_activo, true)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    rol = EXCLUDED.rol,
    permisos = EXCLUDED.permisos,
    establecimiento_id = EXCLUDED.establecimiento_id,
    activo = EXCLUDED.activo,
    nombre = COALESCE(NULLIF(TRIM(EXCLUDED.nombre), ''), public.perfiles.nombre),
    apellido = COALESCE(EXCLUDED.apellido, public.perfiles.apellido);

  RETURN jsonb_build_object('success', true, 'profile_id', p_user_id, 'rol', v_rol::TEXT);
END;
$$;

GRANT EXECUTE ON FUNCTION public.superadmin_upsert_profile_access(UUID, TEXT, JSONB, UUID, BOOLEAN, TEXT, TEXT) TO authenticated;

-- 5) Políticas críticas del panel /admin sin depender de consultas recursivas
DROP POLICY IF EXISTS perfiles_superadmin_select ON public.perfiles;
CREATE POLICY perfiles_superadmin_select
  ON public.perfiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_jwt_superadmin());

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

