-- ============================================================================
-- 054_safe_profile_deactivate_and_delete.sql
-- Gestión segura de perfiles:
-- 1) Baja lógica (recomendada): desactiva perfil sin romper FK históricas.
-- 2) Borrado físico condicional: solo si no existen referencias.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.safe_deactivate_profile(
  p_profile_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  IF NOT public.is_jwt_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN_SUPERADMIN_REQUIRED');
  END IF;

  IF p_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_ID_REQUIRED');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.perfiles WHERE id = p_profile_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  UPDATE public.perfiles
  SET
    activo = false,
    permisos = '[]'::jsonb,
    rol = 'convivencia'::public.rol_usuario,
    updated_at = NOW()
  WHERE id = p_profile_id;

  INSERT INTO public.superadmin_audit_logs (
    action,
    entity_type,
    entity_id,
    actor_user_id,
    payload
  ) VALUES (
    'profile_deactivate',
    'perfiles',
    p_profile_id,
    auth.uid(),
    jsonb_build_object('reason', COALESCE(NULLIF(TRIM(p_reason), ''), 'manual'))
  );

  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id, 'mode', 'deactivate');
END;
$$;

REVOKE ALL ON FUNCTION public.safe_deactivate_profile(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_deactivate_profile(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.safe_delete_profile_if_unreferenced(
  p_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_count BIGINT := 0;
  v_deleted INT := 0;
BEGIN
  IF NOT public.is_jwt_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN_SUPERADMIN_REQUIRED');
  END IF;

  IF p_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_ID_REQUIRED');
  END IF;

  SELECT
    COALESCE((SELECT COUNT(*) FROM public.expedientes WHERE creado_por = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.evidencias WHERE subido_por = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.bitacora_psicosocial WHERE profesional_id = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.incidentes WHERE creado_por = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.logs_auditoria WHERE usuario_id = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.cursos_inspector WHERE inspector_id = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.documentos_institucionales WHERE creado_por = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.tenant_feature_flags WHERE updated_by = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.platform_settings WHERE updated_by = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.superadmin_audit_logs WHERE actor_user_id = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.admin_changesets WHERE created_by = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.mediaciones_gcc_v2 WHERE created_by = p_profile_id), 0) +
    COALESCE((SELECT COUNT(*) FROM public.hitos_gcc_v2 WHERE registrado_por = p_profile_id), 0)
  INTO v_ref_count;

  IF v_ref_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PROFILE_REFERENCED',
      'reference_count', v_ref_count
    );
  END IF;

  DELETE FROM public.perfiles WHERE id = p_profile_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  INSERT INTO public.superadmin_audit_logs (
    action,
    entity_type,
    entity_id,
    actor_user_id,
    payload
  ) VALUES (
    'profile_delete',
    'perfiles',
    p_profile_id,
    auth.uid(),
    jsonb_build_object('mode', 'hard_delete')
  );

  RETURN jsonb_build_object('success', true, 'profile_id', p_profile_id, 'mode', 'hard_delete');
END;
$$;

REVOKE ALL ON FUNCTION public.safe_delete_profile_if_unreferenced(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_delete_profile_if_unreferenced(UUID) TO authenticated;

COMMIT;

