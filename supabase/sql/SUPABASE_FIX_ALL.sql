-- =============================================================================
-- SGCE SUPABASE FIX - Copiar y pegar todo este bloque en SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. CORREGIR POLÍTICA patio_update_estado - reportes_patio (CRÍTICO)
-- =============================================================================

DROP POLICY IF EXISTS patio_update_estado ON reportes_patio;

CREATE POLICY patio_update_estado ON reportes_patio
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND (
    establecimiento_id = (
      SELECT establecimiento_id 
      FROM perfiles 
      WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM perfiles 
      WHERE id = auth.uid() 
      AND rol IN ('admin', 'sostenedor')
    )
  )
);

-- =============================================================================
-- 2. FUNCIÓN HELPER get_user_establecimiento_id
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_establecimiento_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_establecimiento_id uuid;
BEGIN
  SELECT p.establecimiento_id
  INTO v_establecimiento_id
  FROM perfiles p
  WHERE p.id = auth.uid();
  RETURN v_establecimiento_id;
END;
$$;

-- =============================================================================
-- 3. FUNCIÓN is_user_superadmin
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_user_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_rol rol_usuario;
  v_establecimiento_id uuid;
BEGIN
  SELECT p.rol, p.establecimiento_id
  INTO v_rol, v_establecimiento_id
  FROM perfiles p
  WHERE p.id = auth.uid();
  
  RETURN v_rol = 'admin' AND EXISTS (
    SELECT 1 FROM establecimientos 
    WHERE id = v_establecimiento_id
    AND nombre LIKE '%Plataforma%'
  );
END;
$$;

-- =============================================================================
-- 4. CORREGIR POLÍTICAS GCC v2
-- =============================================================================

DROP POLICY IF EXISTS mediaciones_gcc_v2_isolation ON mediaciones_gcc_v2;
CREATE POLICY mediaciones_gcc_v2_isolation ON mediaciones_gcc_v2
FOR ALL
USING (
  establecimiento_id = public.get_user_establecimiento_id()
  OR public.is_user_superadmin()
)
WITH CHECK (
  establecimiento_id = public.get_user_establecimiento_id()
  OR public.is_user_superadmin()
);

DROP POLICY IF EXISTS participantes_gcc_v2_isolation ON participantes_gcc_v2;
CREATE POLICY participantes_gcc_v2_isolation ON participantes_gcc_v2
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mediaciones_gcc_v2 m
    WHERE m.id = participantes_gcc_v2.mediacion_id
    AND (m.establecimiento_id = public.get_user_establecimiento_id() OR public.is_user_superadmin())
  )
);

DROP POLICY IF EXISTS hitos_gcc_v2_isolation ON hitos_gcc_v2;
CREATE POLICY hitos_gcc_v2_isolation ON hitos_gcc_v2
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mediaciones_gcc_v2 m
    WHERE m.id = hitos_gcc_v2.mediacion_id
    AND (m.establecimiento_id = public.get_user_establecimiento_id() OR public.is_user_superadmin())
  )
);

DROP POLICY IF EXISTS actas_gcc_v2_isolation ON actas_gcc_v2;
CREATE POLICY actas_gcc_v2_isolation ON actas_gcc_v2
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mediaciones_gcc_v2 m
    WHERE m.id = actas_gcc_v2.mediacion_id
    AND (m.establecimiento_id = public.get_user_establecimiento_id() OR public.is_user_superadmin())
  )
);

DROP POLICY IF EXISTS compromisos_gcc_v2_isolation ON compromisos_gcc_v2;
CREATE POLICY compromisos_gcc_v2_isolation ON compromisos_gcc_v2
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mediaciones_gcc_v2 m
    WHERE m.id = compromisos_gcc_v2.mediacion_id
    AND (m.establecimiento_id = public.get_user_establecimiento_id() OR public.is_user_superadmin())
  )
);

-- =============================================================================
-- 5. CREAR FUNCIONES FALTANTES DE SUPERADMIN
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_user_id uuid;
  v_rol rol_usuario;
  v_establecimiento_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  SELECT p.rol, p.establecimiento_id
  INTO v_rol, v_establecimiento_id
  FROM perfiles p
  WHERE p.id = v_user_id;
  IF v_rol = 'admin' AND v_establecimiento_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM establecimientos 
      WHERE id = v_establecimiento_id 
      AND (nombre ILIKE '%plataforma%' OR nombre ILIKE '%sgce%' OR nombre ILIKE '%central%')
    );
  END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_user_id uuid;
  v_rol rol_usuario;
  v_establecimiento_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  SELECT p.rol, p.establecimiento_id
  INTO v_rol, v_establecimiento_id
  FROM perfiles p
  WHERE p.id = v_user_id;
  IF public.is_platform_superadmin() THEN
    RETURN true;
  END IF;
  RETURN v_establecimiento_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_superadmin_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_platform_superadmin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo superadmin puede ver métricas';
  END IF;
  SELECT jsonb_build_object(
    'total_establecimientos', (SELECT count(*) FROM establecimientos),
    'total_usuarios', (SELECT count(*) FROM perfiles),
    'total_expedientes', (SELECT count(*) FROM expedientes),
    'expedientes_activos', (SELECT count(*) FROM expedientes WHERE estado_legal != 'cerrado'),
    'total_estudiantes', (SELECT count(*) FROM estudiantes),
    'mediaciones_activas', (SELECT count(*) FROM mediaciones_gcc_v2 WHERE estado != 'cerrada')
  ) INTO v_result;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_superadmin_dashboard_metrics() TO authenticated;

-- =============================================================================
-- 6. AÑADIR ÍNDICES DE RENDIMIENTO
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_estudiante_id ON bitacora_psicosocial(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_profesional_id ON bitacora_psicosocial(profesional_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_nivel_privacidad ON bitacora_psicosocial(nivel_privacidad);
CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_fecha ON bitacora_psicosocial(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medidas_apoyo_estudiante_id ON medidas_apoyo(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_expediente_id ON incidentes(expediente_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_estudiante_id ON incidentes(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_fecha ON logs_auditoria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario ON logs_auditoria(usuario_id);

-- =============================================================================
-- 7. CORREGIR POLÍTICAS DE MEDIDAS_APOYO (ERROR 400)
-- =============================================================================

-- Crear política de aislamiento para medidas_apoyo
CREATE POLICY medidas_apoyo_isolation ON medidas_apoyo
FOR ALL
USING (
  establecimiento_id = (
    SELECT establecimiento_id 
    FROM perfiles 
    WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM perfiles 
    WHERE id = auth.uid() 
    AND rol IN ('admin', 'sostenedor')
  )
)
WITH CHECK (
  establecimiento_id = (
    SELECT establecimiento_id 
    FROM perfiles 
    WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM perfiles 
    WHERE id = auth.uid() 
    AND rol IN ('admin', 'sostenedor')
  )
);

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

-- Ver políticas creadas
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('reportes_patio', 'mediaciones_gcc_v2', 'participantes_gcc_v2', 'hitos_gcc_v2', 'actas_gcc_v2', 'compromisos_gcc_v2');

-- Ver funciones creadas
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('get_user_establecimiento_id', 'is_user_superadmin', 'is_platform_superadmin', 'can_access_tenant', 'get_superadmin_dashboard_metrics');

-- Ver índices creados
SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY indexname;

-- FIN
