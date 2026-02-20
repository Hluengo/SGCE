-- ============================================================================
-- 053_superadmin_upsert_sync_tenant_ids.sql
-- Garantiza consistencia entre perfiles.establecimiento_id y perfiles.tenant_ids
-- al usar RPC superadmin_upsert_profile_access.
-- ============================================================================

BEGIN;

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
  v_tenant_ids UUID[];
BEGIN
  IF NOT public.is_jwt_superadmin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN_SUPERADMIN_REQUIRED');
  END IF;

  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_ID_REQUIRED');
  END IF;

  IF p_establecimiento_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ESTABLECIMIENTO_REQUIRED');
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

  SELECT array_agg(DISTINCT x)
    INTO v_tenant_ids
  FROM unnest(array[p_establecimiento_id]) AS t(x);

  INSERT INTO public.perfiles (
    id,
    nombre,
    apellido,
    rol,
    permisos,
    establecimiento_id,
    tenant_ids,
    activo
  ) VALUES (
    p_user_id,
    COALESCE(NULLIF(TRIM(p_nombre), ''), 'Perfil'),
    COALESCE(NULLIF(TRIM(p_apellido), ''), ''),
    v_rol,
    COALESCE(p_permisos, '[]'::JSONB),
    p_establecimiento_id,
    v_tenant_ids,
    COALESCE(p_activo, true)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    rol = EXCLUDED.rol,
    permisos = EXCLUDED.permisos,
    establecimiento_id = EXCLUDED.establecimiento_id,
    tenant_ids = (
      SELECT array_agg(DISTINCT x)
      FROM unnest(
        array_append(
          COALESCE(public.perfiles.tenant_ids, '{}'::UUID[]),
          EXCLUDED.establecimiento_id
        )
      ) AS t(x)
    ),
    activo = EXCLUDED.activo,
    nombre = COALESCE(NULLIF(TRIM(EXCLUDED.nombre), ''), public.perfiles.nombre),
    apellido = COALESCE(EXCLUDED.apellido, public.perfiles.apellido),
    updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'profile_id', p_user_id, 'rol', v_rol::TEXT);
END;
$$;

GRANT EXECUTE ON FUNCTION public.superadmin_upsert_profile_access(UUID, TEXT, JSONB, UUID, BOOLEAN, TEXT, TEXT) TO authenticated;

COMMIT;

