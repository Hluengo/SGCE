-- =============================================================================
-- ROLLBACK URGENTE: REVERTIR MIGRACIÓN 039
-- =============================================================================
-- La migración 039 causó recursión infinita en las políticas RLS
-- Necesitamos revertir a las políticas originales INMEDIATAMENTE
-- =============================================================================

BEGIN;

-- =============================================================================
-- RESTAURAR POLÍTICAS ORIGINALES - TABLA: PERFILES
-- =============================================================================

DROP POLICY IF EXISTS perfiles_self_read ON perfiles;
CREATE POLICY perfiles_self_read ON perfiles
FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS perfiles_read_directivos ON perfiles;
CREATE POLICY perfiles_read_directivos ON perfiles
FOR SELECT USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia')
);

DROP POLICY IF EXISTS perfiles_insert_admin ON perfiles;
CREATE POLICY perfiles_insert_admin ON perfiles
FOR INSERT WITH CHECK (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin')
);

DROP POLICY IF EXISTS perfiles_update_admin ON perfiles;
CREATE POLICY perfiles_update_admin ON perfiles
FOR UPDATE USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin')
)
WITH CHECK (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS perfiles_delete_admin ON perfiles;
CREATE POLICY perfiles_delete_admin ON perfiles
FOR DELETE USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin')
);

-- =============================================================================
-- RESTAURAR POLÍTICAS ORIGINALES - TABLA: ESTUDIANTES
-- =============================================================================

DROP POLICY IF EXISTS estudiantes_read ON estudiantes;
CREATE POLICY estudiantes_read ON estudiantes
FOR SELECT USING (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS estudiantes_write_equipo ON estudiantes;
CREATE POLICY estudiantes_write_equipo ON estudiantes
FOR INSERT WITH CHECK (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia','dupla')
);

DROP POLICY IF EXISTS estudiantes_update_equipo ON estudiantes;
CREATE POLICY estudiantes_update_equipo ON estudiantes
FOR UPDATE USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia','dupla')
)
WITH CHECK (establecimiento_id = current_establecimiento_id());

-- =============================================================================
-- RESTAURAR POLÍTICAS ORIGINALES - TABLA: EXPEDIENTES
-- =============================================================================

DROP POLICY IF EXISTS expedientes_read ON expedientes;
CREATE POLICY expedientes_read ON expedientes
FOR SELECT USING (
  establecimiento_id = current_establecimiento_id()
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
  )
);

DROP POLICY IF EXISTS expedientes_insert_equipo ON expedientes;
CREATE POLICY expedientes_insert_equipo ON expedientes
FOR INSERT WITH CHECK (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia')
);

DROP POLICY IF EXISTS expedientes_update_directivos ON expedientes;
CREATE POLICY expedientes_update_directivos ON expedientes
FOR UPDATE USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia')
)
WITH CHECK (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS expedientes_update_inspector ON expedientes;
CREATE POLICY expedientes_update_inspector ON expedientes
FOR UPDATE USING (
  establecimiento_id = current_establecimiento_id()
  AND current_rol() = 'inspector'
  AND (creado_por = auth.uid()
       OR EXISTS (
         SELECT 1
         FROM estudiantes s
         JOIN cursos_inspector ci ON ci.curso = s.curso
         WHERE s.id = expedientes.estudiante_id
           AND ci.inspector_id = auth.uid()
           AND ci.establecimiento_id = expedientes.establecimiento_id
       ))
)
WITH CHECK (establecimiento_id = current_establecimiento_id());

-- =============================================================================
-- RESTAURAR POLÍTICAS ORIGINALES - OTRAS TABLAS
-- =============================================================================

DROP POLICY IF EXISTS evidencias_read ON evidencias;
CREATE POLICY evidencias_read ON evidencias
FOR SELECT USING (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS evidencias_insert_equipo ON evidencias;
CREATE POLICY evidencias_insert_equipo ON evidencias
FOR INSERT WITH CHECK (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia','inspector')
);

DROP POLICY IF EXISTS evidencias_update_equipo ON evidencias;
CREATE POLICY evidencias_update_equipo ON evidencias
FOR UPDATE USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia','inspector')
)
WITH CHECK (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS bitacora_dupla_only ON bitacora_psicosocial;
CREATE POLICY bitacora_dupla_only ON bitacora_psicosocial
FOR ALL USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() = 'dupla'
)
WITH CHECK (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() = 'dupla'
);

DROP POLICY IF EXISTS medidas_read ON medidas_apoyo;
CREATE POLICY medidas_read ON medidas_apoyo
FOR SELECT USING (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS medidas_write_equipo ON medidas_apoyo;
CREATE POLICY medidas_write_equipo ON medidas_apoyo
FOR INSERT WITH CHECK (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia','dupla')
);

DROP POLICY IF EXISTS medidas_update_equipo ON medidas_apoyo;
CREATE POLICY medidas_update_equipo ON medidas_apoyo
FOR UPDATE USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia','dupla')
)
WITH CHECK (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS incidentes_read ON incidentes;
CREATE POLICY incidentes_read ON incidentes
FOR SELECT USING (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS incidentes_insert_inspector ON incidentes;
CREATE POLICY incidentes_insert_inspector ON incidentes
FOR INSERT WITH CHECK (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia','inspector')
);

DROP POLICY IF EXISTS incidentes_update_equipo ON incidentes;
CREATE POLICY incidentes_update_equipo ON incidentes
FOR UPDATE USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director','convivencia')
)
WITH CHECK (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS logs_read ON logs_auditoria;
CREATE POLICY logs_read ON logs_auditoria
FOR SELECT USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director')
);

DROP POLICY IF EXISTS logs_insert_system ON logs_auditoria;
CREATE POLICY logs_insert_system ON logs_auditoria
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS cursos_inspector_read ON cursos_inspector;
CREATE POLICY cursos_inspector_read ON cursos_inspector
FOR SELECT USING (establecimiento_id = current_establecimiento_id());

DROP POLICY IF EXISTS cursos_inspector_write ON cursos_inspector;
CREATE POLICY cursos_inspector_write ON cursos_inspector
FOR ALL USING (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director')
)
WITH CHECK (
  establecimiento_id = current_establecimiento_id() 
  AND current_rol() IN ('admin','director')
);

-- Eliminar las políticas que agregamos para establecimientos
DROP POLICY IF EXISTS establecimientos_read_all ON establecimientos;
DROP POLICY IF EXISTS establecimientos_write_superadmin ON establecimientos;

COMMIT;

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '   ✅ ROLLBACK COMPLETADO';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Políticas restauradas al estado original';
  RAISE NOTICE '⚠️  El sistema ahora funciona SIN bypass de superadmin';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASOS:';
  RAISE NOTICE '1. Reinicia la aplicación (Ctrl+Shift+R)';
  RAISE NOTICE '2. El sistema debería funcionar normalmente';
  RAISE NOTICE '3. Aplicaremos una solución corregida';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
