# Guía Completa para Restablecer Supabase Desde Cero

## Sistema de Gestión de Convivencia Escolar (SGCE)

**Fecha:** 2026-02-18  
**Advertencia:** ⚠️ **ESTA OPERACIÓN ES IRREVERSIBLE** - Todos los datos se perderán permanentemente

---

## 1. Resumen del Proceso

El proceso de restablecimiento completo implica:

1. **Eliminar todos los datos** de las tablas
2. **Restablecer el esquema** eliminando tablas, tipos, funciones, políticas RLS
3. **Limpiar el estado de migraciones** en Supabase
4. **Aplicar migraciones en orden** desde cero

---

## 2. Métodos Disponibles

### Método A: Restablecimiento desde el Dashboard de Supabase

Este método es el más sencillo pero tiene limitaciones.

#### Pasos:

1. **Acceder al Dashboard**
   - Ir a https://supabase.com/dashboard
   - Seleccionar el proyecto SGCE

2. **Ir a la sección de Base de Datos**
   - Clic en "SQL Editor" en el menú lateral
   - Clic en "Reset database"

3. **Confirmar el restablecimiento**
   - Aparecerá una advertencia indicando que TODOS los datos se eliminarán
   - Escribir el nombre del proyecto para confirmar
   - Clic en "Reset database"

4. **Esperar el proceso**
   - El proceso puede tomar varios minutos
   - El dashboard mostrará el progreso

**Limitaciones del Método A:**
- No siempre está disponible en todos los planes
- Puede fallar si hay objetos dependientes complejos
- No elimina el historial de migraciones

---

### Método B: Restablecimiento Manual Completo (Recomendado)

Este método proporciona control total sobre el proceso.

#### Paso 1: Respaldar Datos (Opcional pero Recomendado)

Si necesitas conservar algún dato antes del reset:

```sql
-- En el SQL Editor de Supabase, exportar datos importantes
-- Crear tablas de respaldo
CREATE TABLE backup_establecimientos AS SELECT * FROM establecimientos;
CREATE TABLE backup_perfiles AS SELECT * FROM perfiles;
-- ... repetir para cada tabla importante
```

#### Paso 2: Eliminar Todos los Objetos de la Base de Datos

Ejecutar el siguiente script en el SQL Editor:

```sql
-- ============================================================================
-- SCRIPT DE LIMPIEZA COMPLETA - EJECUTAR EN ORDEN
-- ============================================================================

-- 2.1 Eliminar funciones y triggers primero (por dependencias)

-- Eliminar triggers que dependan de funciones
DROP TRIGGER IF EXISTS trg_mediaciones_gcc_v2_updated_at ON public.mediaciones_gcc_v2;
DROP TRIGGER IF EXISTS trg_participantes_gcc_v2_updated_at ON public.participantes_gcc_v2;
DROP TRIGGER IF EXISTS trg_hitos_gcc_v2_updated_at ON public.hitos_gcc_v2;
DROP TRIGGER IF EXISTS trg_actas_gcc_v2_updated_at ON public.actas_gcc_v2;
DROP TRIGGER IF EXISTS trg_compromisos_gcc_v2_updated_at ON public.compromisos_gcc_v2;
DROP TRIGGER IF EXISTS trg_expedientes_establecimiento ON public.expedientes;

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.set_updated_at_timestamp();
DROP FUNCTION IF EXISTS public.set_establecimiento_from_estudiante();
DROP FUNCTION IF EXISTS public.set_establecimiento_from_expediente();
DROP FUNCTION IF EXISTS public.get_current_establecimiento_id();
DROP FUNCTION IF EXISTS public.get_current_user_rol_text();
DROP FUNCTION IF EXISTS public.get_current_user_rol();
DROP FUNCTION IF EXISTS public.is_platform_superadmin();
DROP FUNCTION IF EXISTS public.can_access_tenant(uuid);
DROP FUNCTION IF EXISTS public.user_has_access_to_establecimiento(uuid);
DROP FUNCTION IF EXISTS public.can_user_access_row(uuid);
DROP FUNCTION IF EXISTS public.current_rol();
DROP FUNCTION IF EXISTS public.current_establecimiento_id();
DROP FUNCTION IF EXISTS public.user_has_access_to_establecimiento(uuid);
DROP FUNCTION IF EXISTS public.can_user_access_row(uuid);
DROP FUNCTION IF EXISTS public.get_current_establecimiento_id();
DROP FUNCTION IF EXISTS public.get_current_user_rol_text();

-- 2.2 Eliminar políticas RLS

-- Políticas de tablas
DROP POLICY IF EXISTS public_read_establecimientos ON public.establecimientos;
DROP POLICY IF EXISTS admin_write_establecimientos ON public.establecimientos;
DROP POLICY IF EXISTS perfiles_self_read ON public.perfiles;
DROP POLICY IF EXISTS perfiles_read_directivos ON public.perfiles;
DROP POLICY IF EXISTS perfiles_insert_admin ON public.perfiles;
DROP POLICY IF EXISTS perfiles_update_admin ON public.perfiles;
DROP POLICY IF EXISTS perfiles_delete_admin ON public.perfiles;
DROP POLICY IF EXISTS perfiles_own_establecimiento ON public.perfiles;
DROP POLICY IF EXISTS estudiantes_isolation ON public.estudiantes;
DROP POLICY IF EXISTS estudiantes_read ON public.estudiantes;
DROP POLICY IF EXISTS estudiantes_write_equipo ON public.estudiantes;
DROP POLICY IF EXISTS estudiantes_update_equipo ON public.estudiantes;
DROP POLICY IF EXISTS expedientes_isolation ON public.expedientes;
DROP POLICY IF EXISTS expedientes_read ON public.expedientes;
DROP POLICY IF EXISTS expedientes_insert_equipo ON public.expedientes;
DROP POLICY IF EXISTS expedientes_update_directivos ON public.expedientes;
DROP POLICY IF EXISTS expedientes_update_inspector ON public.expedientes;
DROP POLICY IF EXISTS evidencias_isolation ON public.evidencias;
DROP POLICY IF EXISTS hitos_expediente_isolation ON public.hitos_expediente;
DROP POLICY IF EXISTS bitacora_psicosocial_isolation ON public.bitacora_psicosocial;
DROP POLICY IF EXISTS medidas_apoyo_isolation ON public.medidas_apoyo;
DROP POLICY IF EXISTS incidentes_isolation ON public.incidentes;
DROP POLICY IF EXISTS logs_auditoria_isolation ON public.logs_auditoria;
DROP POLICY IF EXISTS derivaciones_externas_isolation ON public.derivaciones_externas;
DROP POLICY IF EXISTS bitacora_salida_isolation ON public.bitacora_salida;
DROP POLICY IF EXISTS reportes_patio_isolation ON public.reportes_patio;

-- Políticas GCC v2
DROP POLICY IF EXISTS mediaciones_gcc_v2_isolation ON public.mediaciones_gcc_v2;
DROP POLICY IF EXISTS participantes_gcc_v2_isolation ON public.participantes_gcc_v2;
DROP POLICY IF EXISTS hitos_gcc_v2_isolation ON public.hitos_gcc_v2;
DROP POLICY IF EXISTS actas_gcc_v2_isolation ON public.actas_gcc_v2;
DROP POLICY IF EXISTS compromisos_gcc_v2_isolation ON public.compromisos_gcc_v2;

-- Políticas admin
DROP POLICY IF EXISTS admin_changesets_select ON public.admin_changesets;
DROP POLICY IF EXISTS admin_changesets_insert ON public.admin_changesets;
DROP POLICY IF EXISTS admin_changesets_update ON public.admin_changesets;
DROP POLICY IF EXISTS admin_changesets_delete ON public.admin_changesets;
DROP POLICY IF EXISTS admin_change_events_select ON public.admin_change_events;
DROP POLICY IF EXISTS storage_bucket_registry_select ON public.storage_bucket_registry;
DROP POLICY IF EXISTS edge_function_registry_select ON public.edge_function_registry;
DROP POLICY IF EXISTS tenant_feature_flags_select ON public.tenant_feature_flags;
DROP POLICY IF EXISTS platform_settings_select ON public.platform_settings;
DROP POLICY IF EXISTS superadmin_audit_logs_select ON public.superadmin_audit_logs;

-- 2.3 Eliminar tablas (orden por dependencias)

DROP TABLE IF EXISTS public.compromisos_gcc_v2 CASCADE;
DROP TABLE IF EXISTS public.actas_gcc_v2 CASCADE;
DROP TABLE IF EXISTS public.hitos_gcc_v2 CASCADE;
DROP TABLE IF EXISTS public.participantes_gcc_v2 CASCADE;
DROP TABLE IF EXISTS public.mediaciones_gcc_v2 CASCADE;

DROP TABLE IF EXISTS public.evidencias CASCADE;
DROP TABLE IF EXISTS public.hitos_expediente CASCADE;
DROP TABLE IF EXISTS public.incidentes CASCADE;
DROP TABLE IF EXISTS public.expedientes CASCADE;
DROP TABLE IF EXISTS public.medidas_apoyo CASCADE;
DROP TABLE IF EXISTS public.bitacora_psicosocial CASCADE;
DROP TABLE IF EXISTS public.derivaciones_externas CASCADE;
DROP TABLE IF EXISTS public.bitacora_salida CASCADE;
DROP TABLE IF EXISTS public.reportes_patio CASCADE;

DROP TABLE IF EXISTS public.estudiantes CASCADE;
DROP TABLE IF EXISTS public.perfiles CASCADE;

DROP TABLE IF EXISTS public.logs_auditoria CASCADE;
DROP TABLE IF EXISTS public.cursos_inspector CASCADE;
DROP TABLE IF EXISTS public.carpetas_documentales CASCADE;
DROP TABLE IF EXISTS public.documentos_institucionales CASCADE;

DROP TABLE IF EXISTS public.admin_change_events CASCADE;
DROP TABLE IF EXISTS public.admin_changesets CASCADE;
DROP TABLE IF EXISTS public.superadmin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.storage_bucket_registry CASCADE;
DROP TABLE IF EXISTS public.edge_function_registry CASCADE;
DROP TABLE IF EXISTS public.tenant_feature_flags CASCADE;
DROP TABLE IF EXISTS public.platform_settings CASCADE;

DROP TABLE IF EXISTS public.feriados_chile CASCADE;
DROP TABLE IF EXISTS public.establecimientos CASCADE;

-- 2.4 Eliminar tipos enumerados (enum types)

DROP TYPE IF EXISTS public.rol_usuario;
DROP TYPE IF EXISTS public.tipo_falta;
DROP TYPE IF EXISTS public.estado_legal;
DROP TYPE IF EXISTS public.etapa_proceso;
DROP TYPE IF EXISTS public.nivel_privacidad;
DROP TYPE IF EXISTS public.evidencia_tipo;
DROP TYPE IF EXISTS public.evidencia_fuente;
DROP TYPE IF EXISTS public.apoyo_tipo;
DROP TYPE IF EXISTS public.apoyo_estado;
DROP TYPE IF EXISTS public.intervencion_tipo;
DROP TYPE IF EXISTS public.derivacion_institucion;
DROP TYPE IF EXISTS public.derivacion_estado;
DROP TYPE IF EXISTS public.mediacion_estado;
DROP TYPE IF EXISTS public.patio_gravedad;
DROP TYPE IF EXISTS public.admin_changeset_status;
DROP TYPE IF EXISTS public.admin_scope;

-- 2.5 Deshabilitar RLS en todas las tablas (si queda alguna)

ALTER TABLE IF EXISTS public.establecimientos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.perfiles DISABLE ROW LEVEL SECURITY;

-- Confirmar limpieza
SELECT 
  'Tablas restantes: ' || COUNT(*) as message
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

SELECT 
  'Funciones restantes: ' || COUNT(*) as message
FROM information_schema.routines 
WHERE routine_schema = 'public';

SELECT 
  'Tipos restantes: ' || COUNT(*) as message
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public';
```

#### Paso 3: Restablecer el Estado de Migraciones

Supabase mantiene un registro de migraciones aplicadas. Para restablecer:

**Opción 3A: Usando Supabase CLI**

```bash
# Instalar Supabase CLI si no está instalada
# Windows (usando scoop)
scoop install supabase

# O usando npm
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular al proyecto
supabase link --project-ref TU_PROJECT_REF

# Restablecer migraciones (elimina el estado de migraciones)
supabase db reset

# Esto eliminará todas las tablas y aplicará las migraciones desde cero
```

**Opción 3B: Eliminación manual del estado de migraciones**

```sql
-- Eliminar la tabla de estado de migraciones (si existe)
DROP TABLE IF EXISTS supabase_migrations.schema_migrations CASCADE;

-- Crear la tabla de estado de migraciones limpia
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version bigint NOT NULL,
    name text,
    executed_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Insertar registro vacío inicial
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES (0, 'initial');
```

---

## 3. Aplicar Migraciones en Orden Secuencial

### 3.1 Verificar el Orden de Migraciones

Las migraciones deben aplicarse en orden numérico:

| Orden | Archivo | Descripción |
|-------|---------|-------------|
| 1 | 001_init.sql | Esquema base, tablas core, enums |
| 2 | 002_plazos_habiles.sql | Tabla feriados_chile |
| 3 | 003_frontend_alignment.sql | Nuevos enums, tablas operativas |
| 4 | 004_rls_public_read_auth_write.sql | Políticas RLS iniciales |
| 5 | 005_cleanup_legacy_policies.sql | Limpieza de políticas legacy |
| ... | ... | ... |
|Último| 041_gcc_superadmin_bypass.sql | Bypass GCC superadmin |

### 3.2 Aplicar Migraciones Automáticamente

**Usando Supabase CLI:**

```bash
# Aplicar todas las migraciones automáticamente
supabase db push

# O aplicar migraciones específicas
supabase db push --db-url "postgres://[user]:[password]@host:5432/db"
```

**Usando SQL Editor:**

1. Abrir cada archivo de migración en orden
2. Copiar el contenido
3. Ejecutar en el SQL Editor
4. Verificar que no haya errores

### 3.3 Script de Aplicación Masiva

Para aplicar todas las migraciones de una vez:

```sql
-- Ejecutar en el SQL Editor de Supabase
-- Leer y ejecutar cada archivo de migración

\i supabase/migrations/001_init.sql
\i supabase/migrations/002_plazos_habiles.sql
\i supabase/migrations/003_frontend_alignment.sql
-- Continuar con cada archivo...
```

**Nota:** El comando `\i` puede no funcionar en el SQL Editor de Supabase. Se recomienda usar la CLI.

---

## 4. Verificación Post-Restablecimiento

### 4.1 Verificar Tablas Creadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 4.2 Verificar Enums

```sql
SELECT typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname = 'public'
GROUP BY typname;
```

### 4.3 Verificar Funciones

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### 4.4 Verificar Políticas RLS

```sql
SELECT 
  schemaname,
  tablename, 
  policyname, 
  permissive, 
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 4.5 Verificar Índices

```sql
SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 5. Problemas Comunes y Soluciones

### Problema 1: "Database reset is not available"

**Causa:** El proyecto está en un plan que no permite resets automáticos.

**Solución:** Usar el Método B (restablecimiento manual).

### Problema 2: Error al eliminar tipo "dependent objects exist"

**Causa:** Hay objetos que dependen del tipo (como columnas de tablas).

**Solución:** Eliminar primero las tablas que usan el tipo, luego el tipo.

### Problema 3: Error de sintaxis en migraciones

**Causa:** Algunas migraciones pueden tener errores de sintaxis o dependencias faltantes.

**Solución:** 
1. Revisar el orden de las migraciones
2. Aplicar migraciones una por una identificando cuál falla
3. Corregir la migración problemática antes de continuar

### Problema 4: Políticas RLS conflictivas

**Causa:** Políticas duplicadas o mal configuradas.

**Solución:** Después de aplicar migraciones, verificar y eliminar políticas duplicadas:

```sql
SELECT policyname, tablename, COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY policyname, tablename
HAVING COUNT(*) > 1;
```

---

## 6. Comandos Útiles de Supabase CLI

### Instalar Supabase CLI

```bash
# Windows (usando PowerShell)
iwr https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip -o supabase.zip
Expand-Archive -Force supabase.zip -DestinationPath $env:LOCALAPPDATA\supabase
$env:PATH += ";$env:LOCALAPPDATA\supabase"
# Agregar al PATH permanentemente
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";$env:LOCALAPPDATA\supabase", "User")

# Verificar instalación
supabase --version
```

### Comandos principales

```bash
# Iniciar sesión
supabase login

# Vincular a un proyecto
supabase link --project-ref TU_PROJECT_REF

# Ver estado del proyecto
supabase status

# Aplicar migraciones pendientes
supabase db push

# Restablecer base de datos (elimina y recrea)
supabase db reset

# Generar diff de base de datos
supabase db diff

# Ver remote changes
supabase db remote commit

# Abrir SQL Editor
supabase sql editor
```

---

## 7. Recomendaciones Post-Restablecimiento

### 7.1 Crear Usuario Superadmin

Después de aplicar las migraciones, crear el usuario superadmin:

```sql
-- En el SQL Editor, después de aplicar todas las migraciones
-- El usuario admin@admin.cl debería ser creado por la migración 016

-- Verificar que el perfil existe
SELECT * FROM perfiles WHERE rol = 'admin' LIMIT 1;

-- Si no existe, crear manualmente
-- (Esto dependerá de la configuración de auth.users)
```

### 7.2 Verificar Feriados de Chile

```sql
-- Verificar que existen feriados
SELECT * FROM feriados_chile ORDER BY fecha LIMIT 10;

-- Si están vacíos, insertar feriados del año
INSERT INTO feriados_chile (fecha, descripcion, es_irrenunciable) VALUES
('2026-01-01', 'Año Nuevo', true),
('2026-04-18', 'Sábado Santo', false),
('2026-05-01', 'Día del Trabajo', true),
('2026-05-21', 'Glorias Navales', true),
('2026-06-21', 'Día Nacional de los Pueblos Originarios', true),
('2026-07-16', 'Virgen del Carmen', true),
('2026-08-15', 'Asunción de la Virgen', true),
('2026-09-18', 'Fiestas Patrias', true),
('2026-09-19', 'Glorias del Ejército', true),
('2026-10-12', 'Descubrimiento de América', false),
('2026-10-31', 'Día de las Iglesias Evangélicas', false),
('2026-11-01', 'Todos los Santos', false),
('2026-12-08', 'Inmaculada Concepción', true),
('2026-12-25', 'Navidad', true);
```

### 7.3 Probar Acceso

```sql
-- Verificar que las funciones de RLS funcionan
SELECT 
  public.is_platform_superadmin() as is_superadmin,
  public.get_current_establecimiento_id() as establecimiento_id,
  public.get_current_user_rol_text() as rol;
```

---

## 8. Notas Importantes

### 8.1 Sobre el Schema `supabase_migrations`

No eliminar la tabla `supabase_migrations.schema_migrations` ya que es necesaria para el funcionamiento de Supabase.

### 8.2 Sobre Auth Users

Los usuarios en `auth.users` no se eliminan con el reset de base de datos. Si necesitas eliminar usuarios:

```sql
-- Eliminar todos los usuarios (cuidado: esto es irreversible)
DELETE FROM auth.users;
```

### 8.3 Sobre Storage

Los archivos en Storage no se eliminan con el reset de base de datos. Debes eliminar los buckets manualmente desde el dashboard.

---

## 9. Resumen de Pasos

| Paso | Acción | Herramienta |
|------|--------|-------------|
| 1 | Respaldar datos (opcional) | SQL Editor |
| 2 | Eliminar objetos de BD | SQL Editor / Script de limpieza |
| 3 | Restablecer estado de migraciones | SQL Editor |
| 4 | Aplicar migraciones | Supabase CLI / SQL Editor |
| 5 | Verificar esquema | SQL Editor |
| 6 | Crear datos iniciales | SQL Editor |
| 7 | Probar funcionalidad | Aplicación Frontend |

---

*Documento generado el 2026-02-18*
