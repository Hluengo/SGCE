-- ============================================================================
-- 057_fix_current_context_from_perfiles.sql
-- Corrige contexto de RLS para usuarios no superadmin:
-- - current_rol() y current_establecimiento_id() deben leer primero desde
--   public.perfiles (fuente de verdad actual del panel SuperAdmin).
-- - JWT queda solo como fallback para compatibilidad.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.current_rol()
RETURNS public.rol_usuario
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_profile_rol public.rol_usuario;
  v_claim_rol TEXT;
BEGIN
  -- Fuente principal: tabla perfiles (actualizada por SuperAdmin).
  SELECT p.rol
    INTO v_profile_rol
  FROM public.perfiles p
  WHERE p.id = auth.uid()
  LIMIT 1;

  IF v_profile_rol IS NOT NULL THEN
    RETURN v_profile_rol;
  END IF;

  -- Fallback JWT con normalización defensiva.
  v_claim_rol := LOWER(
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'rol',
      auth.jwt() -> 'user_metadata' ->> 'rol',
      ''
    )
  );

  BEGIN
    RETURN CASE v_claim_rol
      WHEN 'inspector_general' THEN 'inspector'::public.rol_usuario
      WHEN 'convivencia_escolar' THEN 'convivencia'::public.rol_usuario
      WHEN 'administrador' THEN 'admin'::public.rol_usuario
      WHEN 'psicologo' THEN 'dupla'::public.rol_usuario
      WHEN 'psicopedagogo' THEN 'dupla'::public.rol_usuario
      ELSE NULLIF(v_claim_rol, '')::public.rol_usuario
    END;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_establecimiento_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_profile_establecimiento_id UUID;
  v_claim_establecimiento_id TEXT;
BEGIN
  -- Fuente principal: tabla perfiles.
  SELECT p.establecimiento_id
    INTO v_profile_establecimiento_id
  FROM public.perfiles p
  WHERE p.id = auth.uid()
  LIMIT 1;

  IF v_profile_establecimiento_id IS NOT NULL THEN
    RETURN v_profile_establecimiento_id;
  END IF;

  -- Fallback JWT (solo si parece UUID válido).
  v_claim_establecimiento_id := COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'establecimiento_id',
    auth.jwt() -> 'user_metadata' ->> 'establecimiento_id',
    ''
  );

  IF v_claim_establecimiento_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN v_claim_establecimiento_id::UUID;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.current_rol() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_rol() TO authenticated;

REVOKE ALL ON FUNCTION public.current_establecimiento_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_establecimiento_id() TO authenticated;

COMMIT;

