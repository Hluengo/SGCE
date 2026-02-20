-- ============================================================================
-- 048_superadmin_roles_permisos_management.sql
-- Permite a SUPERADMIN gestionar roles y permisos desde /admin:
-- - RLS explícito para lectura/escritura de perfiles por superadmin
-- - RPC seguro para crear/actualizar rol/permisos por usuario
-- ============================================================================

BEGIN;

ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS permisos JSONB NOT NULL DEFAULT '[]'::JSONB;

DROP POLICY IF EXISTS perfiles_superadmin_select ON public.perfiles;
CREATE POLICY perfiles_superadmin_select
  ON public.perfiles
  FOR SELECT
  TO authenticated
  USING (public.is_platform_superadmin());

DROP POLICY IF EXISTS perfiles_superadmin_insert ON public.perfiles;
CREATE POLICY perfiles_superadmin_insert
  ON public.perfiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_superadmin());

DROP POLICY IF EXISTS perfiles_superadmin_update ON public.perfiles;
CREATE POLICY perfiles_superadmin_update
  ON public.perfiles
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_superadmin())
  WITH CHECK (public.is_platform_superadmin());

DROP POLICY IF EXISTS perfiles_superadmin_delete ON public.perfiles;
CREATE POLICY perfiles_superadmin_delete
  ON public.perfiles
  FOR DELETE
  TO authenticated
  USING (public.is_platform_superadmin());

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
  IF NOT public.is_platform_superadmin() THEN
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

COMMIT;

