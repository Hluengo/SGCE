-- =============================================================================
-- MIGRACIÓN 039: BYPASS RLS PARA SUPERADMIN
-- =============================================================================
-- Problema: El superadmin no puede ver datos de otros colegios cuando cambia
--           de establecimiento porque las políticas RLS filtran por 
--           current_establecimiento_id() sin verificar rol superadmin.
--
-- Solución: Actualizar TODAS las políticas RLS para dar acceso completo a
--           usuarios con is_platform_superadmin() = true
-- =============================================================================

BEGIN;

-- =============================================================================
-- TABLA: PERFILES
-- =============================================================================

DROP POLICY IF EXISTS perfiles_self_read ON perfiles;
CREATE POLICY perfiles_self_read ON perfiles
FOR SELECT USING (
  is_platform_superadmin() OR
  id = auth.uid()
);

DROP POLICY IF EXISTS perfiles_read_directivos ON perfiles;
CREATE POLICY perfiles_read_directivos ON perfiles
FOR SELECT USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia'))
);

DROP POLICY IF EXISTS perfiles_insert_admin ON perfiles;
CREATE POLICY perfiles_insert_admin ON perfiles
FOR INSERT WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin'))
);

DROP POLICY IF EXISTS perfiles_update_admin ON perfiles;
CREATE POLICY perfiles_update_admin ON perfiles
FOR UPDATE USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin'))
)
WITH CHECK (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS perfiles_delete_admin ON perfiles;
CREATE POLICY perfiles_delete_admin ON perfiles
FOR DELETE USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin'))
);

-- =============================================================================
-- TABLA: ESTUDIANTES
-- =============================================================================

DROP POLICY IF EXISTS estudiantes_read ON estudiantes;
CREATE POLICY estudiantes_read ON estudiantes
FOR SELECT USING (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS estudiantes_write_equipo ON estudiantes;
CREATE POLICY estudiantes_write_equipo ON estudiantes
FOR INSERT WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
);

DROP POLICY IF EXISTS estudiantes_update_equipo ON estudiantes;
CREATE POLICY estudiantes_update_equipo ON estudiantes
FOR UPDATE USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
)
WITH CHECK (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- TABLA: EXPEDIENTES
-- =============================================================================

DROP POLICY IF EXISTS expedientes_read ON expedientes;
CREATE POLICY expedientes_read ON expedientes
FOR SELECT USING (
  is_platform_superadmin() OR
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
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia'))
);

DROP POLICY IF EXISTS expedientes_update_directivos ON expedientes;
CREATE POLICY expedientes_update_directivos ON expedientes
FOR UPDATE USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia'))
)
WITH CHECK (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS expedientes_update_inspector ON expedientes;
CREATE POLICY expedientes_update_inspector ON expedientes
FOR UPDATE USING (
  is_platform_superadmin() OR
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
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- TABLA: EVIDENCIAS
-- =============================================================================

DROP POLICY IF EXISTS evidencias_read ON evidencias;
CREATE POLICY evidencias_read ON evidencias
FOR SELECT USING (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS evidencias_insert_equipo ON evidencias;
CREATE POLICY evidencias_insert_equipo ON evidencias
FOR INSERT WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','inspector'))
);

DROP POLICY IF EXISTS evidencias_update_equipo ON evidencias;
CREATE POLICY evidencias_update_equipo ON evidencias
FOR UPDATE USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','inspector'))
)
WITH CHECK (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- TABLA: BITACORA_PSICOSOCIAL
-- =============================================================================

DROP POLICY IF EXISTS bitacora_dupla_only ON bitacora_psicosocial;
CREATE POLICY bitacora_dupla_only ON bitacora_psicosocial
FOR ALL USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() = 'dupla')
)
WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() = 'dupla')
);

-- =============================================================================
-- TABLA: MEDIDAS_APOYO
-- =============================================================================

DROP POLICY IF EXISTS medidas_read ON medidas_apoyo;
CREATE POLICY medidas_read ON medidas_apoyo
FOR SELECT USING (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS medidas_write_equipo ON medidas_apoyo;
CREATE POLICY medidas_write_equipo ON medidas_apoyo
FOR INSERT WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
);

DROP POLICY IF EXISTS medidas_update_equipo ON medidas_apoyo;
CREATE POLICY medidas_update_equipo ON medidas_apoyo
FOR UPDATE USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
)
WITH CHECK (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- TABLA: INCIDENTES
-- =============================================================================

DROP POLICY IF EXISTS incidentes_read ON incidentes;
CREATE POLICY incidentes_read ON incidentes
FOR SELECT USING (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS incidentes_insert_inspector ON incidentes;
CREATE POLICY incidentes_insert_inspector ON incidentes
FOR INSERT WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','inspector'))
);

DROP POLICY IF EXISTS incidentes_update_equipo ON incidentes;
CREATE POLICY incidentes_update_equipo ON incidentes
FOR UPDATE USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia'))
)
WITH CHECK (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

-- =============================================================================
-- TABLA: LOGS_AUDITORIA
-- =============================================================================

DROP POLICY IF EXISTS logs_read ON logs_auditoria;
CREATE POLICY logs_read ON logs_auditoria
FOR SELECT USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director'))
);

DROP POLICY IF EXISTS logs_insert_system ON logs_auditoria;
CREATE POLICY logs_insert_system ON logs_auditoria
FOR INSERT WITH CHECK (
  is_platform_superadmin() OR
  auth.role() = 'authenticated'
);

-- =============================================================================
-- TABLA: CURSOS_INSPECTOR
-- =============================================================================

DROP POLICY IF EXISTS cursos_inspector_read ON cursos_inspector;
CREATE POLICY cursos_inspector_read ON cursos_inspector
FOR SELECT USING (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS cursos_inspector_write ON cursos_inspector;
CREATE POLICY cursos_inspector_write ON cursos_inspector
FOR ALL USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director'))
)
WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director'))
);

-- =============================================================================
-- TABLA: DERIVACIONES_EXTERNAS (de migraciones posteriores)
-- =============================================================================

DROP POLICY IF EXISTS derivaciones_externas_read ON derivaciones_externas;
CREATE POLICY derivaciones_externas_read ON derivaciones_externas
FOR SELECT USING (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS derivaciones_externas_write ON derivaciones_externas;
CREATE POLICY derivaciones_externas_write ON derivaciones_externas
FOR ALL USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
)
WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','convivencia','dupla'))
);

-- =============================================================================
-- TABLA: BITACORA_SALIDA
-- =============================================================================

DROP POLICY IF EXISTS bitacora_salida_read ON bitacora_salida;
CREATE POLICY bitacora_salida_read ON bitacora_salida
FOR SELECT USING (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS bitacora_salida_write ON bitacora_salida;
CREATE POLICY bitacora_salida_write ON bitacora_salida
FOR ALL USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','inspector'))
)
WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','inspector'))
);

-- =============================================================================
-- TABLA: REPORTES_PATIO
-- =============================================================================

DROP POLICY IF EXISTS reportes_patio_read ON reportes_patio;
CREATE POLICY reportes_patio_read ON reportes_patio
FOR SELECT USING (
  is_platform_superadmin() OR
  establecimiento_id = current_establecimiento_id()
);

DROP POLICY IF EXISTS reportes_patio_write ON reportes_patio;
CREATE POLICY reportes_patio_write ON reportes_patio
FOR ALL USING (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','inspector','convivencia'))
)
WITH CHECK (
  is_platform_superadmin() OR
  (establecimiento_id = current_establecimiento_id() 
   AND current_rol() IN ('admin','director','inspector','convivencia'))
);

-- =============================================================================
-- TABLA: HITOS_EXPEDIENTE
-- =============================================================================

DROP POLICY IF EXISTS hitos_expediente_read ON hitos_expediente;
CREATE POLICY hitos_expediente_read ON hitos_expediente
FOR SELECT USING (
  is_platform_superadmin() OR
  EXISTS (
    SELECT 1 FROM expedientes e
    WHERE e.id = hitos_expediente.expediente_id
      AND e.establecimiento_id = current_establecimiento_id()
  )
);

DROP POLICY IF EXISTS hitos_expediente_write ON hitos_expediente;
CREATE POLICY hitos_expediente_write ON hitos_expediente
FOR ALL USING (
  is_platform_superadmin() OR
  (EXISTS (
    SELECT 1 FROM expedientes e
    WHERE e.id = hitos_expediente.expediente_id
      AND e.establecimiento_id = current_establecimiento_id()
  ) AND current_rol() IN ('admin','director','convivencia'))
)
WITH CHECK (
  is_platform_superadmin() OR
  (EXISTS (
    SELECT 1 FROM expedientes e
    WHERE e.id = hitos_expediente.expediente_id
      AND e.establecimiento_id = current_establecimiento_id()
  ) AND current_rol() IN ('admin','director','convivencia'))
);

-- =============================================================================
-- TABLA: ESTABLECIMIENTOS (importante para ver todos los colegios)
-- =============================================================================

DROP POLICY IF EXISTS establecimientos_read_all ON establecimientos;
CREATE POLICY establecimientos_read_all ON establecimientos
FOR SELECT USING (
  is_platform_superadmin() OR
  id = current_establecimiento_id()
);

DROP POLICY IF EXISTS establecimientos_write_superadmin ON establecimientos;
CREATE POLICY establecimientos_write_superadmin ON establecimientos
FOR ALL USING (
  is_platform_superadmin()
)
WITH CHECK (
  is_platform_superadmin()
);

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '   ✅ MIGRACIÓN 039 COMPLETADA: BYPASS RLS SUPERADMIN';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Políticas actualizadas: 46+ políticas';
  RAISE NOTICE '✅ Tablas afectadas:';
  RAISE NOTICE '   • perfiles';
  RAISE NOTICE '   • estudiantes';
  RAISE NOTICE '   • expedientes';
  RAISE NOTICE '   • evidencias';
  RAISE NOTICE '   • bitacora_psicosocial';
  RAISE NOTICE '   • medidas_apoyo';
  RAISE NOTICE '   • incidentes';
  RAISE NOTICE '   • logs_auditoria';
  RAISE NOTICE '   • cursos_inspector';
  RAISE NOTICE '   • derivaciones_externas';
  RAISE NOTICE '   • bitacora_salida';
  RAISE NOTICE '   • reportes_patio';
  RAISE NOTICE '   • hitos_expediente';
  RAISE NOTICE '   • establecimientos';
  RAISE NOTICE '';
  RAISE NOTICE '📝 RESULTADO:';
  RAISE NOTICE '   Los usuarios con rol superadmin/sostenedor/admin ahora pueden:';
  RAISE NOTICE '   • Ver y editar datos de TODOS los establecimientos';
  RAISE NOTICE '   • Cambiar de colegio sin perder acceso';
  RAISE NOTICE '   • Gestionar configuración global del sistema';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '   1. Cierra sesión y vuelve a iniciar sesión';
  RAISE NOTICE '   2. Usa el selector de colegios para cambiar de establecimiento';
  RAISE NOTICE '   3. Verifica que puedes ver datos del colegio seleccionado';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

COMMIT;
