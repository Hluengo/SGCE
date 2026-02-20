-- ============================================================================
-- 052_superadmin_find_auth_user_by_email.sql
-- Permite a SUPERADMIN resolver UUID de auth.users por email desde /admin.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.superadmin_find_auth_user_by_email(
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  IF NOT public.is_jwt_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN_SUPERADMIN_REQUIRED');
  END IF;

  IF v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'EMAIL_REQUIRED');
  END IF;

  SELECT u.id, LOWER(u.email)
    INTO v_user_id, v_user_email
  FROM auth.users u
  WHERE LOWER(u.email) = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_user_id,
    'email', v_user_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.superadmin_find_auth_user_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.superadmin_find_auth_user_by_email(TEXT) TO authenticated;

COMMIT;

