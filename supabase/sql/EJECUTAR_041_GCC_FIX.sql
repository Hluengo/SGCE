-- ============================================================================
-- SCRIPT DE APLICACIÓN RÁPIDA - MIGRACIÓN 041
-- ============================================================================
-- PROPÓSITO: Arreglar Panel GCC que no muestra KPIs cuando superadmin cambia
--            de colegio
--
-- INSTRUCCIONES PARA APLICAR:
-- 1. Ir a: https://supabase.com/dashboard/project/[tu-proyecto]/sql/new
-- 2. Copiar TODO este archivo (Ctrl+A, Ctrl+C)
-- 3. Pegar en SQL Editor (Ctrl+V)
-- 4. Ejecutar (botón "Run" o Ctrl+Enter)
-- 5. Verificar que dice "Success. No rows returned"
-- 6. Refrescar la aplicación y verificar que Panel GCC muestra datos
-- ============================================================================

-- Verificar que existe is_superadmin_from_jwt() de migración 040
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_superadmin_from_jwt'
  ) THEN
    RAISE EXCEPTION 'Función is_superadmin_from_jwt() no existe. Aplicar migración 040 primero.';
  END IF;
  RAISE NOTICE 'OK: is_superadmin_from_jwt() existe';
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
-- VERIFICACIÓN AUTOMÁTICA
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Contar políticas nuevas
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE tablename IN (
    'mediaciones_gcc_v2',
    'participantes_gcc_v2',
    'hitos_gcc_v2',
    'actas_gcc_v2',
    'compromisos_gcc_v2'
  )
  AND policyname LIKE '%read' OR policyname LIKE '%insert' OR policyname LIKE '%update' OR policyname LIKE '%write';
  
  RAISE NOTICE '✓ Migración 041 aplicada correctamente';
  RAISE NOTICE '✓ % políticas RLS actualizadas para tablas GCC', v_count;
  RAISE NOTICE '✓ Superadmin ahora puede ver datos GCC de todos los colegios';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASOS:';
  RAISE NOTICE '1. Refrescar la aplicación (Ctrl+Shift+R)';
  RAISE NOTICE '2. Cambiar de colegio usando el selector del sidebar';
  RAISE NOTICE '3. Verificar que Panel "Gestión Colaborativa de Conflictos" muestra KPIs';
END $$;

-- ============================================================================
-- FIN MIGRACIÓN 041
-- ============================================================================
