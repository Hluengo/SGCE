-- ============================================================================
-- Migración 041: Bypass superadmin para tablas GCC v2
-- ============================================================================
-- Fecha: 2026-02-18
-- Descripción: Actualiza las políticas RLS de las tablas GCC v2 para incluir
--              bypass de superadmin usando is_superadmin_from_jwt() en lugar de
--              can_user_access_row() que causa problemas de recursión.
-- 
-- Problema: Panel "Gestión Colaborativa de Conflictos" no entrega datos
--           cuando superadmin cambia de colegio.
-- 
-- Causa: Las políticas RLS de mediaciones_gcc_v2 y otras tablas GCC usan
--        can_user_access_row() que llama a is_platform_superadmin() que
--        consulta la tabla perfiles (potencial recursión).
-- 
-- Solución: Usar is_superadmin_from_jwt() que lee directamente del JWT
--           sin consultar tablas, siguiendo el patrón de migración 040.
-- 
-- Tablas afectadas:
-- - mediaciones_gcc_v2 (principal: usada por useGccMetrics hook)
-- - participantes_gcc_v2
-- - hitos_gcc_v2
-- - actas_gcc_v2
-- - compromisos_gcc_v2
-- ============================================================================

-- Verificar que existe is_superadmin_from_jwt() de migración 040
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_superadmin_from_jwt'
  ) THEN
    RAISE EXCEPTION 'Función is_superadmin_from_jwt() no existe. Aplicar migración 040 primero.';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1) mediaciones_gcc_v2 (CRÍTICO: usada por Dashboard GCC)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS mediaciones_gcc_v2_isolation ON public.mediaciones_gcc_v2;
DROP POLICY IF EXISTS mediaciones_gcc_v2_read ON public.mediaciones_gcc_v2;
DROP POLICY IF EXISTS mediaciones_gcc_v2_insert ON public.mediaciones_gcc_v2;
DROP POLICY IF EXISTS mediaciones_gcc_v2_update ON public.mediaciones_gcc_v2;

CREATE POLICY mediaciones_gcc_v2_read ON public.mediaciones_gcc_v2
FOR SELECT
USING (
  public.is_superadmin_from_jwt()
  OR establecimiento_id = public.current_establecimiento_id()
);

CREATE POLICY mediaciones_gcc_v2_insert ON public.mediaciones_gcc_v2
FOR INSERT
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

CREATE POLICY mediaciones_gcc_v2_update ON public.mediaciones_gcc_v2
FOR UPDATE
USING (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
)
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

-- ----------------------------------------------------------------------------
-- 2) participantes_gcc_v2
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS participantes_gcc_v2_isolation ON public.participantes_gcc_v2;
DROP POLICY IF EXISTS participantes_gcc_v2_read ON public.participantes_gcc_v2;
DROP POLICY IF EXISTS participantes_gcc_v2_write ON public.participantes_gcc_v2;
DROP POLICY IF EXISTS participantes_gcc_v2_update ON public.participantes_gcc_v2;

CREATE POLICY participantes_gcc_v2_read ON public.participantes_gcc_v2
FOR SELECT
USING (
  public.is_superadmin_from_jwt()
  OR establecimiento_id = public.current_establecimiento_id()
);

CREATE POLICY participantes_gcc_v2_write ON public.participantes_gcc_v2
FOR INSERT
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

CREATE POLICY participantes_gcc_v2_update ON public.participantes_gcc_v2
FOR UPDATE
USING (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
)
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

-- ----------------------------------------------------------------------------
-- 3) hitos_gcc_v2
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS hitos_gcc_v2_isolation ON public.hitos_gcc_v2;
DROP POLICY IF EXISTS hitos_gcc_v2_read ON public.hitos_gcc_v2;
DROP POLICY IF EXISTS hitos_gcc_v2_write ON public.hitos_gcc_v2;
DROP POLICY IF EXISTS hitos_gcc_v2_update ON public.hitos_gcc_v2;

CREATE POLICY hitos_gcc_v2_read ON public.hitos_gcc_v2
FOR SELECT
USING (
  public.is_superadmin_from_jwt()
  OR establecimiento_id = public.current_establecimiento_id()
);

CREATE POLICY hitos_gcc_v2_write ON public.hitos_gcc_v2
FOR INSERT
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

CREATE POLICY hitos_gcc_v2_update ON public.hitos_gcc_v2
FOR UPDATE
USING (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
)
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

-- ----------------------------------------------------------------------------
-- 4) actas_gcc_v2
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS actas_gcc_v2_isolation ON public.actas_gcc_v2;
DROP POLICY IF EXISTS actas_gcc_v2_read ON public.actas_gcc_v2;
DROP POLICY IF EXISTS actas_gcc_v2_write ON public.actas_gcc_v2;
DROP POLICY IF EXISTS actas_gcc_v2_update ON public.actas_gcc_v2;

CREATE POLICY actas_gcc_v2_read ON public.actas_gcc_v2
FOR SELECT
USING (
  public.is_superadmin_from_jwt()
  OR establecimiento_id = public.current_establecimiento_id()
);

CREATE POLICY actas_gcc_v2_write ON public.actas_gcc_v2
FOR INSERT
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

CREATE POLICY actas_gcc_v2_update ON public.actas_gcc_v2
FOR UPDATE
USING (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
)
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

-- ----------------------------------------------------------------------------
-- 5) compromisos_gcc_v2
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS compromisos_gcc_v2_isolation ON public.compromisos_gcc_v2;
DROP POLICY IF EXISTS compromisos_gcc_v2_read ON public.compromisos_gcc_v2;
DROP POLICY IF EXISTS compromisos_gcc_v2_write ON public.compromisos_gcc_v2;
DROP POLICY IF EXISTS compromisos_gcc_v2_update ON public.compromisos_gcc_v2;

CREATE POLICY compromisos_gcc_v2_read ON public.compromisos_gcc_v2
FOR SELECT
USING (
  public.is_superadmin_from_jwt()
  OR establecimiento_id = public.current_establecimiento_id()
);

CREATE POLICY compromisos_gcc_v2_write ON public.compromisos_gcc_v2
FOR INSERT
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

CREATE POLICY compromisos_gcc_v2_update ON public.compromisos_gcc_v2
FOR UPDATE
USING (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
)
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

-- ----------------------------------------------------------------------------
-- Verificación
-- ----------------------------------------------------------------------------
COMMENT ON POLICY mediaciones_gcc_v2_read ON public.mediaciones_gcc_v2 IS 
  'Bypass superadmin usando JWT directo (migración 041)';

COMMENT ON POLICY participantes_gcc_v2_read ON public.participantes_gcc_v2 IS 
  'Bypass superadmin usando JWT directo (migración 041)';

COMMENT ON POLICY hitos_gcc_v2_read ON public.hitos_gcc_v2 IS 
  'Bypass superadmin usando JWT directo (migración 041)';

COMMENT ON POLICY actas_gcc_v2_read ON public.actas_gcc_v2 IS 
  'Bypass superadmin usando JWT directo (migración 041)';

COMMENT ON POLICY compromisos_gcc_v2_read ON public.compromisos_gcc_v2 IS 
  'Bypass superadmin usando JWT directo (migración 041)';

-- ============================================================================
-- FIN MIGRACIÓN 041
-- ============================================================================
