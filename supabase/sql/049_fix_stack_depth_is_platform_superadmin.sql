-- ============================================================================
-- 049_fix_stack_depth_is_platform_superadmin.sql
-- Corrige recursión RLS/stack depth en is_platform_superadmin():
-- - Evita bucle cuando políticas de perfiles llaman is_platform_superadmin()
-- - Usa SECURITY DEFINER + row_security=off para lectura interna segura
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_rol public.rol_usuario;
  v_establecimiento_id UUID;
  v_claim_role TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Fast-path por claims JWT para evitar consultar tablas cuando ya viene role.
  v_claim_role := UPPER(
    COALESCE(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    )
  );
  IF v_claim_role = 'SUPERADMIN' THEN
    RETURN true;
  END IF;

  -- Lectura interna sin aplicar RLS para evitar recursión de políticas.
  SELECT p.rol, p.establecimiento_id
    INTO v_rol, v_establecimiento_id
  FROM public.perfiles p
  WHERE p.id = v_user_id
  LIMIT 1;

  IF v_rol = 'superadmin' THEN
    RETURN true;
  END IF;

  IF v_rol = 'admin' AND v_establecimiento_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.establecimientos e
      WHERE e.id = v_establecimiento_id
        AND (
          e.nombre ILIKE '%plataforma%'
          OR e.nombre ILIKE '%sgce%'
          OR e.nombre ILIKE '%central%'
        )
    );
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_platform_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_superadmin() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_access_tenant(p_tenant_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_establecimiento_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_platform_superadmin() THEN
    RETURN true;
  END IF;

  SELECT p.establecimiento_id
    INTO v_establecimiento_id
  FROM public.perfiles p
  WHERE p.id = v_user_id
  LIMIT 1;

  RETURN v_establecimiento_id = p_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_tenant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_tenant(UUID) TO authenticated;

COMMIT;

