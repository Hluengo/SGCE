-- =============================================================================
-- MIGRACIÓN 040: BYPASS RLS PARA SUPERADMIN (VERSIÓN CORREGIDA)
-- =============================================================================
-- Solución correcta que evita recursión infinita:
-- - Lee el rol directamente del JWT (auth.jwt()) sin consultar tablas
-- - No causa bucles infinitos en las políticas RLS
-- =============================================================================

BEGIN;

-- =============================================================================
-- PASO 1: CREAR FUNCIÓN QUE LEE DEL JWT (Sin consultar tablas)
-- =============================================================================

-- Esta función lee el rol directamente del JWT sin consultar la tabla perfiles
-- Evita recursión infinita
CREATE OR REPLACE FUNCTION public.is_superadmin_from_jwt()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    LOWER((auth.jwt() -> 'app_metadata' ->> 'role')::text) IN ('superadmin', 'sostenedor', 'admin'),
    false
  );
$$;

COMMENT ON FUNCTION public.is_superadmin_from_jwt() IS 
'Verifica si el usuario actual tiene rol superadmin/sostenedor/admin leyendo directamente del JWT. No consulta tablas, evitando recursión infinita en políticas RLS.';

-- =============================================================================
-- PASO 2: ACTUALIZAR POLÍTICAS - TABLA: ESTUDIANTES
-- =============================================================================

DROP POLICY IF EXISTS estudiantes_read ON estudiantes;
CREATE POLICY estudiantes_read ON estudiantes
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS estudiantes_write_equipo ON estudiantes;
CREATE POLICY estudiantes_write_equipo ON estudiantes
FOR INSERT WITH CHECK (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
);

DROP POLICY IF EXISTS estudiantes_update_equipo ON estudiantes;
CREATE POLICY estudiantes_update_equipo ON estudiantes
FOR UPDATE USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- PASO 3: ACTUALIZAR POLÍTICAS - TABLA: EXPEDIENTES
-- =============================================================================

DROP POLICY IF EXISTS expedientes_read ON expedientes;
CREATE POLICY expedientes_read ON expedientes
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id()
   AND (
     current_rol() <> 'inspector'
     OR creado_por = auth.uid()
     OR EXISTS (
       SELECT 1
       FROM estudiantes s
       JOIN cursos_inspector ci ON ci.curso = s.curso
       WHERE s.id = expedientes.estudiante_id
         AND ci.inspector_id = auth.uid()
         AND ci.establecimiento_id = expedientes.establecimiento_id
     )
   ))
);

DROP POLICY IF EXISTS expedientes_insert_equipo ON expedientes;
CREATE POLICY expedientes_insert_equipo ON expedientes
FOR INSERT WITH CHECK (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia'))
);

DROP POLICY IF EXISTS expedientes_update_directivos ON expedientes;
CREATE POLICY expedientes_update_directivos ON expedientes
FOR UPDATE USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia'))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS expedientes_update_inspector ON expedientes;
CREATE POLICY expedientes_update_inspector ON expedientes
FOR UPDATE USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id()
   AND current_rol() = 'inspector'
   AND (creado_por = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM estudiantes s
          JOIN cursos_inspector ci ON ci.curso = s.curso
          WHERE s.id = expedientes.estudiante_id
            AND ci.inspector_id = auth.uid()
            AND ci.establecimiento_id = expedientes.establecimiento_id
        )))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- PASO 4: ACTUALIZAR POLÍTICAS - TABLA: EVIDENCIAS
-- =============================================================================

DROP POLICY IF EXISTS evidencias_read ON evidencias;
CREATE POLICY evidencias_read ON evidencias
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS evidencias_insert_equipo ON evidencias;
CREATE POLICY evidencias_insert_equipo ON evidencias
FOR INSERT WITH CHECK (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','inspector'))
);

DROP POLICY IF EXISTS evidencias_update_equipo ON evidencias;
CREATE POLICY evidencias_update_equipo ON evidencias
FOR UPDATE USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','inspector'))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- PASO 5: ACTUALIZAR POLÍTICAS - TABLA: MEDIDAS_APOYO
-- =============================================================================

DROP POLICY IF EXISTS medidas_read ON medidas_apoyo;
CREATE POLICY medidas_read ON medidas_apoyo
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS medidas_write_equipo ON medidas_apoyo;
CREATE POLICY medidas_write_equipo ON medidas_apoyo
FOR INSERT WITH CHECK (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
);

DROP POLICY IF EXISTS medidas_update_equipo ON medidas_apoyo;
CREATE POLICY medidas_update_equipo ON medidas_apoyo
FOR UPDATE USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- PASO 6: ACTUALIZAR POLÍTICAS - TABLA: INCIDENTES
-- =============================================================================

DROP POLICY IF EXISTS incidentes_read ON incidentes;
CREATE POLICY incidentes_read ON incidentes
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS incidentes_insert_inspector ON incidentes;
CREATE POLICY incidentes_insert_inspector ON incidentes
FOR INSERT WITH CHECK (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','inspector'))
);

DROP POLICY IF EXISTS incidentes_update_equipo ON incidentes;
CREATE POLICY incidentes_update_equipo ON incidentes
FOR UPDATE USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia'))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- PASO 7: ACTUALIZAR POLÍTICAS - TABLA: DERIVACIONES_EXTERNAS
-- =============================================================================

DROP POLICY IF EXISTS derivaciones_externas_read ON derivaciones_externas;
CREATE POLICY derivaciones_externas_read ON derivaciones_externas
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS derivaciones_externas_write ON derivaciones_externas;
CREATE POLICY derivaciones_externas_write ON derivaciones_externas
FOR ALL USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
);

-- =============================================================================
-- PASO 8: ACTUALIZAR POLÍTICAS - TABLA: BITACORA_SALIDA
-- =============================================================================

DROP POLICY IF EXISTS bitacora_salida_read ON bitacora_salida;
CREATE POLICY bitacora_salida_read ON bitacora_salida
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS bitacora_salida_write ON bitacora_salida;
CREATE POLICY bitacora_salida_write ON bitacora_salida
FOR ALL USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','inspector'))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','inspector'))
);

-- =============================================================================
-- PASO 9: ACTUALIZAR POLÍTICAS - TABLA: REPORTES_PATIO
-- =============================================================================

DROP POLICY IF EXISTS reportes_patio_read ON reportes_patio;
CREATE POLICY reportes_patio_read ON reportes_patio
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS reportes_patio_write ON reportes_patio;
CREATE POLICY reportes_patio_write ON reportes_patio
FOR ALL USING (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','inspector','convivencia'))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','inspector','convivencia'))
);

-- =============================================================================
-- PASO 10: ACTUALIZAR POLÍTICAS - TABLA: HITOS_EXPEDIENTE
-- =============================================================================

DROP POLICY IF EXISTS hitos_expediente_read ON hitos_expediente;
CREATE POLICY hitos_expediente_read ON hitos_expediente
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  EXISTS (
    SELECT 1 FROM expedientes e
    WHERE e.id = hitos_expediente.expediente_id
      AND e.establecimiento_id = current_establecimiento_id()
  )
);

DROP POLICY IF EXISTS hitos_expediente_write ON hitos_expediente;
CREATE POLICY hitos_expediente_write ON hitos_expediente
FOR ALL USING (
  is_superadmin_from_jwt() OR
  (EXISTS (
    SELECT 1 FROM expedientes e
    WHERE e.id = hitos_expediente.expediente_id
      AND e.establecimiento_id = current_establecimiento_id()
  ) AND current_rol() IN ('admin','director','convivencia'))
)
WITH CHECK (
  is_superadmin_from_jwt() OR
  (EXISTS (
    SELECT 1 FROM expedientes e
    WHERE e.id = hitos_expediente.expediente_id
      AND e.establecimiento_id = current_establecimiento_id()
  ) AND current_rol() IN ('admin','director','convivencia'))
);

-- =============================================================================
-- PASO 11: POLÍTICAS PARA TABLA ESTABLECIMIENTOS (Ver todos los colegios)
-- =============================================================================

DROP POLICY IF EXISTS establecimientos_read_all ON establecimientos;
CREATE POLICY establecimientos_read_all ON establecimientos
FOR SELECT USING (
  is_superadmin_from_jwt() OR
  id = current_establecimiento_id()
);

DROP POLICY IF EXISTS establecimientos_write_superadmin ON establecimientos;
CREATE POLICY establecimientos_write_superadmin ON establecimientos
FOR ALL USING (is_superadmin_from_jwt())
WITH CHECK (is_superadmin_from_jwt());

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '   ✅ MIGRACIÓN 040 COMPLETADA: BYPASS RLS SUPERADMIN';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Función creada: is_superadmin_from_jwt()';
  RAISE NOTICE '   → Lee directamente del JWT (sin consultar tablas)';
  RAISE NOTICE '   → Evita recursión infinita';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Políticas actualizadas en 10 tablas:';
  RAISE NOTICE '   • estudiantes';
  RAISE NOTICE '   • expedientes';
  RAISE NOTICE '   • evidencias';
  RAISE NOTICE '   • medidas_apoyo';
  RAISE NOTICE '   • incidentes';
  RAISE NOTICE '   • derivaciones_externas';
  RAISE NOTICE '   • bitacora_salida';
  RAISE NOTICE '   • reportes_patio';
  RAISE NOTICE '   • hitos_expediente';
  RAISE NOTICE '   • establecimientos';
  RAISE NOTICE '';
  RAISE NOTICE '📝 RESULTADO:';
  RAISE NOTICE '   Los superadmins ahora pueden:';
  RAISE NOTICE '   • Ver y editar datos de TODOS los establecimientos';
  RAISE NOTICE '   • Cambiar de colegio sin perder acceso';
  RAISE NOTICE '   • Gestionar configuración global';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  PRÓXIMOS PASOS:';
  RAISE NOTICE '   1. Refresca la aplicación (Ctrl+Shift+R)';
  RAISE NOTICE '   2. Usa el selector de colegios';
  RAISE NOTICE '   3. Verifica que puedes ver datos del colegio seleccionado';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

COMMIT;
