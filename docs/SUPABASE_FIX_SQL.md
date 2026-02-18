# Scripts SQL para Corregir Problemas de Supabase

Estos scripts deben ejecutarse en el **Supabase SQL Editor** para corregir los problemas identificados en la auditoría.

---

## 1. CORRECCIÓN: Política RLS de reportes_patio (CRÍTICO)

**Problema:** Cualquier usuario autenticado puede actualizar el estado de cualquier reporte.

```sql
-- =============================================================================
-- 1. CORREGIR POLÍTICA patio_update_estado - reportes_patio
-- =============================================================================

-- Eliminar política insegura existente
DROP POLICY IF EXISTS patio_update_estado ON reportes_patio;

-- Crear política segura que verifica tenant
CREATE POLICY patio_update_estado ON reportes_patio
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND (
    -- Usuario puede actualizar reportes de su establecimiento
    establecimiento_id = (
      SELECT establecimiento_id 
      FROM perfiles 
      WHERE id = auth.uid()
    )
    OR
    -- O es superadmin/admin/sostenedor
    EXISTS (
      SELECT 1 FROM perfiles 
      WHERE id = auth.uid() 
      AND rol IN ('admin', 'sostenedor')
    )
  )
);

-- Verificar que la política fue creada correctamente
SELECT polname, polpermissive, polroles::text, polcmd
FROM pg_policy
WHERE polrelid = 'reportes_patio'::regclass;
```

---

## 2. CORRECCIÓN: Políticas RLS de GCC v2 (CRÍTICO)

**Problema:** Las tablas GCC v2 pueden tener aislamiento incompleto.

```sql
-- =============================================================================
-- 2. CORREGIR POLÍTICAS RLS DE GCC v2
-- =============================================================================

-- Función helper para obtener establecimiento_id del usuario actual
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

-- Función para verificar si es superadmin
CREATE OR REPLACE FUNCTION public.is_user_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_rol rol_usuario;
BEGIN
  SELECT p.rol
  INTO v_rol
  FROM perfiles p
  WHERE p.id = auth.uid();
  
  RETURN v_rol = 'admin' AND EXISTS (
    SELECT 1 FROM establecimientos 
    WHERE id = public.get_user_establecimiento_id()
    AND nombre LIKE '%Plataforma%'
  );
END;
$$;

-- Corregir política de mediaciones_gcc_v2
DROP POLICY IF EXISTS mediaciones_gcc_v2_isolation ON mediaciones_gcc_v2;

CREATE POLICY mediaciones_gcc_v2_isolation ON mediaciones_gcc_v2
FOR ALL
USING (
  -- Acceso solo a establecimientos del usuario
  establecimiento_id = public.get_user_establecimiento_id()
  OR
  -- O es superadmin
  public.is_user_superadmin()
)
WITH CHECK (
  establecimiento_id = public.get_user_establecimiento_id()
  OR
  public.is_user_superadmin()
);

-- Corregir política de participantes_gcc_v2
DROP POLICY IF EXISTS participantes_gcc_v2_isolation ON participantes_gcc_v2;

CREATE POLICY participantes_gcc_v2_isolation ON participantes_gcc_v2
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mediaciones_gcc_v2 m
    WHERE m.id = mediaciones_gcc_v2.mediacion_id
    AND (
      m.establecimiento_id = public.get_user_establecimiento_id()
      OR public.is_user_superadmin()
    )
  )
);

-- Corregir política de hitos_gcc_v2
DROP POLICY IF EXISTS hitos_gcc_v2_isolation ON hitos_gcc_v2;

CREATE POLICY hitos_gcc_v2_isolation ON hitos_gcc_v2
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mediaciones_gcc_v2 m
    WHERE m.id = hitos_gcc_v2.mediacion_id
    AND (
      m.establecimiento_id = public.get_user_establecimiento_id()
      OR public.is_user_superadmin()
    )
  )
);

-- Corregir política de actas_gcc_v2
DROP POLICY IF EXISTS actas_gcc_v2_isolation ON actas_gcc_v2;

CREATE POLICY actas_gcc_v2_isolation ON actas_gcc_v2
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mediaciones_gcc_v2 m
    WHERE m.id = actas_gcc_v2.mediacion_id
    AND (
      m.establecimiento_id = public.get_user_establecimiento_id()
      OR public.is_user_superadmin()
    )
  )
);

-- Corregir política de compromisos_gcc_v2
DROP POLICY IF EXISTS compromisos_gcc_v2_isolation ON compromisos_gcc_v2;

CREATE POLICY compromisos_gcc_v2_isolation ON compromisos_gcc_v2
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM mediaciones_gcc_v2 m
    WHERE m.id = compromisos_gcc_v2.mediacion_id
    AND (
      m.establecimiento_id = public.get_user_establecimiento_id()
      OR public.is_user_superadmin()
    )
  )
);

-- Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd
FROM pg_policies
WHERE tablename IN ('mediaciones_gcc_v2', 'participantes_gcc_v2', 'hitos_gcc_v2', 'actas_gcc_v2', 'compromisos_gcc_v2')
ORDER BY tablename, policyname;
```

---

## 3. CREAR FUNCIONES FALTANTES DE SUPERADMIN

**Problema:** Funciones referenciadas pero no definidas.

```sql
-- =============================================================================
-- 3. CREAR FUNCIONES FALTANTES DE SUPERADMIN
-- =============================================================================

-- Función: is_platform_superadmin
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

  -- Verificar si es admin y el establecimiento es el de plataforma
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

-- Función: can_access_tenant
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

  -- Superadmin puede acceder a todos
  IF public.is_platform_superadmin() THEN
    RETURN true;
  END IF;

  -- Otros usuarios solo pueden acceder a su tenant
  RETURN v_establecimiento_id = p_tenant_id;
END;
$$;

-- Función: get_superadmin_dashboard_metrics
CREATE OR REPLACE FUNCTION public.get_superadmin_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verificar que el usuario es superadmin
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

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.is_platform_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_superadmin_dashboard_metrics() TO authenticated;

-- Verificar funciones creadas
SELECT proname, pronargs, pronargdefaults
FROM pg_proc
WHERE proname IN ('is_platform_superadmin', 'can_access_tenant', 'get_superadmin_dashboard_metrics');
```

---

## 4. AÑADIR ÍNDICES DE RENDIMIENTO

**Problema:** Faltan índices para mejorar rendimiento.

```sql
-- =============================================================================
-- 4. AÑADIR ÍNDICES DE RENDIMIENTO
-- =============================================================================

-- Índices para bitacora_psicosocial
CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_estudiante_id 
ON bitacora_psicosocial(estudiante_id);

CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_profesional_id 
ON bitacora_psicosocial(profesional_id);

CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_nivel_privacidad 
ON bitacora_psicosocial(nivel_privacidad);

CREATE INDEX IF NOT EXISTS idx_bitacora_psicosocial_fecha 
ON bitacora_psicosocial(created_at DESC);

-- Índices para medidas_apoyo
CREATE INDEX IF NOT EXISTS idx_medidas_apoyo_estudiante_id 
ON medidas_apoyo(estudiante_id);

-- Índices para incidentes
CREATE INDEX IF NOT EXISTS idx_incidentes_expediente_id 
ON incidentes(expediente_id);

CREATE INDEX IF NOT EXISTS idx_incidentes_estudiante_id 
ON incidentes(estudiante_id);

-- Índices para logs_auditoria
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_fecha 
ON logs_auditoria(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario 
ON logs_auditoria(usuario_id);

-- Verificar índices creados
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

---

## 5. VERIFICACIÓN FINAL

```sql
-- =============================================================================
-- 5. VERIFICACIÓN FINAL DE CONFIGURACIÓN
-- =============================================================================

-- Ver todas las políticas RLS activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual::text,
  with_check::text
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar que RLS está habilitado en todas las tablas importantes
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'establecimientos', 'perfiles', 'estudiantes', 'expedientes',
  'evidencias', 'bitacora_psicosocial', 'medidas_apoyo', 'incidentes',
  'derivaciones_externas', 'reportes_patio', 'mediaciones_gcc_v2',
  'participantes_gcc_v2', 'hitos_gcc_v2', 'actas_gcc_v2', 'compromisos_gcc_v2'
)
ORDER BY tablename;

-- Verificar funciones existentes
SELECT proname, pronargs
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'current_rol', 'current_establecimiento_id', 'get_current_establecimiento_id',
  'get_current_user_rol', 'user_has_access_to_establecimiento',
  'sumar_dias_habiles', 'contar_dias_habiles', 'log_superadmin_action',
  'validate_admin_sql_statements', 'apply_admin_changeset', 'revert_admin_changeset',
  'get_tenant_branding', 'get_user_establecimiento_id', 'is_user_superadmin',
  'is_platform_superadmin', 'can_access_tenant', 'get_superadmin_dashboard_metrics'
)
ORDER BY proname;
```

---

## INSTRUCCIONES DE USO

1. **Ejecutar en orden:** Los scripts deben ejecutarse en el orden numerado (1-5)

2. **Verificar después de cada bloque:** Ejecutar las queries de verificación al final de cada bloque

3. **Hacer backup:** Antes de ejecutar, asegurar tener un backup de la base de datos

4. **Probar en desarrollo:** Si es posible, probar estos cambios en un entorno de desarrollo primero

---

*Scripts generados automáticamente por Kilo Code*
