-- ============================================================================
-- FIX RÁPIDO: Agregar bypass superadmin a mediaciones_gcc (legacy)
-- ============================================================================
-- PROBLEMA: Al derivar a GCC aparece error "row-level security policy violation"
--           en tabla mediaciones_gcc (sin _v2)
--
-- CAUSA: La tabla legacy mediaciones_gcc usa can_user_access_row() sin bypass
--
-- SOLUCIÓN: Actualizar política con is_superadmin_from_jwt() como en migración 041
-- ============================================================================

-- Verificar que is_superadmin_from_jwt() existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_superadmin_from_jwt'
  ) THEN
    RAISE EXCEPTION 'Función is_superadmin_from_jwt() no existe. Aplicar migración 040 primero.';
  END IF;
  RAISE NOTICE 'OK: is_superadmin_from_jwt() existe';
END $$;

-- Actualizar política de mediaciones_gcc (legacy)
DROP POLICY IF EXISTS mediaciones_gcc_isolation ON public.mediaciones_gcc;
DROP POLICY IF EXISTS mediaciones_gcc_read ON public.mediaciones_gcc;
DROP POLICY IF EXISTS mediaciones_gcc_insert ON public.mediaciones_gcc;
DROP POLICY IF EXISTS mediaciones_gcc_update ON public.mediaciones_gcc;

CREATE POLICY mediaciones_gcc_read ON public.mediaciones_gcc
FOR SELECT
USING (
  public.is_superadmin_from_jwt()
  OR establecimiento_id = public.current_establecimiento_id()
);

CREATE POLICY mediaciones_gcc_insert ON public.mediaciones_gcc
FOR INSERT
WITH CHECK (
  public.is_superadmin_from_jwt()
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND current_rol() IN ('admin','director','convivencia','dupla')
  )
);

CREATE POLICY mediaciones_gcc_update ON public.mediaciones_gcc
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

-- Verificación
COMMENT ON POLICY mediaciones_gcc_read ON public.mediaciones_gcc IS 
  'Bypass superadmin para tabla legacy mediaciones_gcc';

-- ============================================================================
-- RESULTADO
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Políticas de mediaciones_gcc (legacy) actualizadas';
  RAISE NOTICE '✓ Superadmin puede ahora derivar a GCC';
  RAISE NOTICE '';
  RAISE NOTICE 'PRUEBA:';
  RAISE NOTICE '1. Refrescar aplicación';
  RAISE NOTICE '2. Intentar derivar expediente a GCC';
  RAISE NOTICE '3. No debe aparecer error de RLS';
END $$;

-- ============================================================================
-- FIN
-- ============================================================================
