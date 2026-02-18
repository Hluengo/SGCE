# AUDITORÍA COMPLETA Y EXHAUSTIVA - SGCE
**Fecha:** 2026-02-18 (18:00)  
**Auditor:** GitHub Copilot  
**Proyecto:** Sistema de Gestión de Convivencia Escolar (SGCE)  
**Severidad General:** 🔴 CRÍTICA

---

## 📋 RESUMEN EJECUTIVO

Se ha identificado un **desajuste crítico entre el frontend y el backend de Supabase** que explica los errores frontales que experimentas. El esquema de base de datos ha sido completamente redefinido, pero:

1. ✅ Las migraciones antiguas (001-035) intentan alterar tablas que **NO EXISTEN**
2. ❌ El frontend sigue referenciando tablas antiguas (expedientes, estudiantes, establecimientos)
3. 🔲 Las nuevas tablas (cases, students, tenants, tenant_profiles) existen pero **NO ESTÁN SIENDO USADAS POR EL FRONTEND**

**Recomendación Inmediata:** Antes de cualquier otra acción, necesito saber: ¿Es intencional migrar a este nuevo schema, o fue un error en la actualización?

---

## 1. 🔴 PROBLEMA CRÍTICO: DESAJUSTE SCHEMA FRONTEND vs BACKEND

### 1.1 Schema Actual en Supabase (24 tablas)

```
✅ TABLAS ACTIVAS (CON RLS):
- cases (reemplaza expedientes?)
- case_followups
- case_messages
- case_message_attachments
- students (reemplaza estudiantes?)
- tenants (reemplaza establecimientos?)
- tenant_profiles (reemplaza perfiles?)
- tenant_settings
- tenant_catalogs
- tenant_versions
- process_stages
- action_types
- involucrados
- platform_versions
- audit_logs
- followup_evidence

⚠️ TABLAS SIN RLS (CRÍTICO):
- catalog_staging_batches
- conduct_catalog
- conduct_types
- stage_sla
- stg_action_types
- stg_conduct_catalog
- stg_conduct_types
- stg_stage_sla
```

### 1.2 Tablas que el Frontend Intenta Usar (según auditoría anterior)

```
❌ NO EXISTEN en la DB actual:
- expedientes (Referenced in migrations 034, 035)
- estudiantes (Assumed in old schema)
- establecimientos (Assumed in old schema)
- perfiles (Assumed in old schema)
- reportes_patio
- derivaciones_externas
- bitacora_psicosocial
- medidas_apoyo
- incidentes
- logs_auditoria
- mediaciones_gcc_v2
- actas_gcc_v2
- etc.
```

---

## 2. 🔴 PROBLEMAS ENCONTRADOS

### 2.1 CRÍTICO: Migraciones Fallidas (034, 035)

**Archivo:** [supabase/migrations/034_add_interaction_type_to_expedientes.sql](supabase/migrations/034_add_interaction_type_to_expedientes.sql)  
**Error:** `relation "public.expedientes" does not exist`  
**Estado:** ❌ FALLIDA

```sql
-- Intenta alterar tabla que no existe
ALTER TABLE public.expedientes
  ADD COLUMN interaction_type text default 'creacion';
```

**Impacto:** Cualquier trigger o función que escriba a `expedientes` fallará.

---

**Archivo:** [supabase/migrations/035_add_additional_data_to_expedientes.sql](supabase/migrations/035_add_additional_data_to_expedientes.sql)  
**Error:** `relation "public.expedientes" does not exist`  
**Estado:** ❌ FALLIDA

```sql
-- Intenta alterar tabla que no existe
ALTER TABLE public.expedientes
  ADD COLUMN additional_data jsonb default '{}'::jsonb;
```

---

### 2.2 CRÍTICO: Storage Desconfigurado

**Archivo:** [supabase/migrations/033_setup_branding_storage.sql](supabase/migrations/033_setup_branding_storage.sql)  
**Problema:** Política RLS demasiado permisiva para Storage

```sql
-- ❌ PROBLEMA: Solo verifica auth.uid() NOT NULL, sin restricción de roles
CREATE POLICY "branding_assets_superadmin_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND auth.uid() IS NOT NULL  -- Cualquier usuario autenticado!
  );
```

**Riesgo:** Cualquier usuario autenticado puede subir archivos de branding, no solo superadmins.

---

### 2.3 ALTO: Inconsistencias en RLS

#### Tablas Sin RLS Habilitada (CRÍTICO)

| Tabla | Estado RLS | Riesgo | Acción |
|-------|-----------|--------|--------|
| `catalog_staging_batches` | ❌ SIN RLS | CRÍTICO | Habilitar inmediatamente |
| `conduct_catalog` | ❌ SIN RLS | CRÍTICO | Habilitar inmediatamente |
| `conduct_types` | ❌ SIN RLS | CRÍTICO | Habilitar inmediatamente |
| `stage_sla` | ❌ SIN RLS | CRÍTICO | Habilitar inmediatamente |
| Tablas STG (*) | ❌ SIN RLS | ALTO | Necesita evaluación |

---

### 2.4 ALTO: Funciones Trigger Potencialmente Rotas

Las siguientes funciones existen pero pueden estar fallando silenciosamente:

```
- set_case_message_tenant_id (Trigger Function)
- set_case_message_attachment_tenant_id (Trigger Function)
- update_updated_at_column (Trigger Function)
```

**Verificación Necesaria:**
- ¿Están cargando correctamente `tenant_id` en case_messages?
- ¿Falta el campo `tenant_id`?

---

## 3. 🔒 AUDITORÍA DE SEGURIDAD - POLÍTICAS RLS

### 3.1 Estado de RLS por Tabla

#### Tablas Core (CON RLS ✅)

| Tabla | Políticas | Filtro Principal | Riesgo |
|-------|-----------|------------------|--------|
| `tenants` | 4 | `auth.uid()` | MEDIO |
| `tenant_profiles` | 6 | `auth.uid() + tenant_id` | BAJO |
| `tenant_settings` | 2 | `tenant_id` | BAJO |
| `cases` | 5 | `tenant_id` | BAJO |
| `students` | 2 | `tenant_id` | BAJO |
| `tenant_catalogs` | 2 | `tenant_id` | BAJO |
| `case_messages` | 4 | `tenant_id` | BAJO |
| `case_followups` | 1 | ? | ALTO |
| `case_message_attachments` | 4 | ? | ALTO |

#### Tablas Sin RLS (🔴 CRÍTICO)

```
- catalog_staging_batches
- conduct_catalog
- conduct_types
- stage_sla
- stg_action_types
- stg_conduct_catalog
- stg_conduct_types
- stg_stage_sla
```

**Acción Recomendada:**
```sql
-- Habilitar RLS en todas estas tablas:
ALTER TABLE public.catalog_staging_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_sla ENABLE ROW LEVEL SECURITY;
-- ... y así
```

---

### 3.2 Evaluación de Políticas por Tabla

#### ✅ BIEN CONFIGURADAS

- `tenant_profiles`: Verifica `auth.uid()` + `tenant_id`
- `tenant_settings`: Valida acceso por `tenant_id`
- `cases`: Aislamiento de tenant correcto

#### ⚠️ REQUIERE REVISIÓN

- `case_followups`: Solo tiene 1 política
- `case_message_attachments`: 4 políticas pero necesita auditoría

#### ❌ CRÍTICO

- Todas las tablas STG/STAGING: Sin RLS
- `conduct_*`: Sin RLS (son catálogos pero deben tener RLS)

---

## 4. 🔍 INTEGRIDAD DE DATOS

### 4.1 Verificación de Foreign Keys

**Resultado:** No se pudo verificar (sintaxis SQL limitada en Supabase)

**Queries Recomendadas para Ejecutar Manualmente:**

```sql
-- Ver constraints de foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

### 4.2 Datos Huérfanos: NO SE PUEDE VERIFICAR

Las tablas antiguas (`expedientes`, `estudiantes`) no existen, por lo que no hay datos huérfanos en ellas.

Sin embargo, **si hay datos en las nuevas tablas (cases, students, tenants), necesitamos verificar:**

- ¿Hay registros en `cases` cuyo `tenant_id` no existe en `tenants`?
- ¿Hay registros en `case_messages` sin `tenant_id`?

---

## 5. 📊 FUNCIONES STORED Y TRIGGERS

### 5.1 Funciones Disponibles

```
✅ EXISTEN (Verificadas):
- admin_create_audit_log
- admin_delete_audit_log
- admin_purge_audit_logs
- admin_update_audit_log_note
- admin_update_tenant_profile
- apply_college_catalogs
- business_days_between
- current_tenant_id()
- get_demo_colegio
- is_platform_admin()
- is_tenant_admin()
- onboard_college
- platform_switch_tenant
- stats_casos_por_curso
- stats_casos_por_mes
- stats_casos_por_tipificacion
- stats_cumplimiento_plazos
- stats_kpis
- stats_mayor_carga
- stats_reincidencia
- validate_college_catalogs
- update_updated_at_column (TRIGGER)
```

### 5.2 Triggers

| Trigger | Tabla | Evento | Estado |
|---------|-------|--------|--------|
| `set_case_message_tenant_id` | case_messages | INSERT/UPDATE | ✅ Existe |
| `set_case_message_attachment_tenant_id` | case_message_attachments | INSERT/UPDATE | ✅ Existe |
| `update_updated_at_column` | Múltiples | UPDATEs | ✅ Existe |

**Validación Necesaria:**
```sql
-- Verificar que los triggers se ejecutan:
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Revisar la definición de cada trigger
SELECT routine_definition FROM information_schema.routines 
WHERE routine_name = 'set_case_message_tenant_id';
```

---

### 5.3 Funciones RLS - CRÍTICO

Las funciones `current_tenant_id()` e `is_tenant_admin()` son **CRÍTICAS** para el aislamiento:

```sql
-- Estas deben usarse en las políticas RLS
SELECT current_tenant_id();  -- Debe retornar el tenant del usuario actual
SELECT is_tenant_admin();     -- Debe retornar true/false
```

**Riesgo:** Si estas funciones retornan NULL o valores incorrectos, RLS fallará.

---

## 6. 🚨 PROBLEMAS PRINCIPALES QUE CAUSAN ERRORES FRONTALES

### 🔴 A) Migraciones Fallidas (034, 035)

**Causa:** Intentan alterar tablas que no existen (`expedientes`, `additional_data`, `interaction_type`)

**Síntomas en Frontend:**
- Errores al crear expedientes
- Campos esperados no aparecen
- Triggers fallan silenciosamente

**Solución:** Necesitas decidir:
1. **Opción A:** Mantener el nuevo schema (cases, students, tenants) → Elimina/comenta las migraciones 034-035
2. **Opción B:** Volver al schema antiguo → Importa las migraciones antiguas correctamente

---

### 🔴 B) Tablas Sin RLS

**Causa:** 8 tablas no tienen Row Level Security habilitada

**Síntomas:** Filtraciones de datos entre tenants

**Solución:** Ejecutar esta migración:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.catalog_staging_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_stage_sla ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas para tablas de catálogo
CREATE POLICY "catalog_read_authenticated" ON public.conduct_catalog
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "types_read_authenticated" ON public.conduct_types
  FOR SELECT TO authenticated USING (true);

-- (Continuar para cada tabla...)
```

---

### 🔴 C) Storage RLS Incompleta

**Causa:** Política de branding-assets solo verifica `auth.uid() NOT NULL`

**Síntomas:** Cualquier usuario puede subir logos de branding

**Solución:** Reemplazar política Storage:

```sql
-- Mejor: Solo superadmin
DROP POLICY IF EXISTS "branding_assets_superadmin_upload" ON storage.objects;
CREATE POLICY "branding_assets_superadmin_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND is_platform_admin()  -- Solo superadmin
  );
```

---

### 🟠 D) Incoherencia Frontend-Backend

**Causa:** Frontend usa tablas antiguas, DB usa nuevas

**Síntomas:** `relation "expedientes" does not exist`

**Solución:** Alinear código frontend con el nuevo schema

---

## 7. 📋 CHECKLIST DE VERIFICACIÓN

### Paso 1: Decidir qué Schema Usar

- [ ] ¿Es intencional migrar a `cases`, `students`, `tenants`?
- [ ] ¿O fue un error y debo restaurar el schema anterior?

### Paso 2: Habilitar RLS en Tablas Sin Security

```sql
-- Ejecutar en Supabase SQL Editor
ALTER TABLE public.catalog_staging_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_conduct_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_conduct_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_stage_sla ENABLE ROW LEVEL SECURITY;
```

### Paso 3: Revertir Migraciones Problemáticas

Si estás usando el schema nuevo (cases, students, tenants):

```sql
-- Eliminar cambios de las migraciones 034-035 si executadas
ALTER TABLE public.expedientes DROP COLUMN IF EXISTS interaction_type;
ALTER TABLE public.expedientes DROP COLUMN IF EXISTS additional_data;
```

O simplemente **no ejecutarlas** en futuras migraciones.

### Paso 4: Verificar Triggers

```sql
-- En SQL Editor de Supabase:
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Probar funciones críticas:
SELECT current_tenant_id();
SELECT is_platform_admin();
SELECT is_tenant_admin();
```

### Paso 5: Revisar Storage RLS

```sql
-- Ver políticas actuales
SELECT * FROM storage.policies WHERE bucket_id = 'branding-assets';

-- Reemplazar si es necesario (ver sección 6.C)
```

---

## 8. 🔐 SEGURIDAD: CREDENIALES SUPERADMIN

### ⚠️ IMPORTANTE: NO SE ALMACENAN CREDENCIALES EN TEXTO PLANO

Las credenciales de superadmin **NO se pueden mostrar en texto plano** por razones de seguridad fundamental. 

### Opciones Seguras para Acceder como Superadmin:

#### **Opción 1: Usar Supabase Dashboard (RECOMENDADO)**

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto
3. Navega a: **Authentication > Users**
4. Busca el usuario con email `superadmin@sgce.local` o similar
5. Si no existe, crea uno nuevo:
   - Email: `superadmin@[tu-dominio].com`
   - Password: Auto-genera (secura)
   - Click "Invite user"
6. El usuario recibirá email con link de confirmación (temporal)

#### **Opción 2: Crear SuperAdmin vía SQL (En Supabase SQL Editor)**

```sql
-- Crear usuario en auth.users (si no existe)
-- NOTA: Supabase recomienda usar el dashboard, este método es solo para caso especial

-- Primero, obtén la función service_role (si existe)
-- O usa el dashboard como en Opción 1
```

#### **Opción 3: Verificar Usuarios Existentes**

```sql
-- Ver todos los usuarios registrados (como database owner)
SELECT id, email, role FROM auth.users;

-- Ver perfiles (para encontrar superadmins)
SELECT id, email, is_platform_admin FROM public.tenant_profiles LIMIT 10;
```

### **Cómo Usar Credenciales de forma Segura:**

1. **Nunca compartas contraseñas en email o chat**
2. **Usa Supabase Dashboard para reset de contraseña:**
   - Dashboard → Authentication → Users → Busca usuario → "Reset password"
3. **Para scripts, usa JWT tokens o API keys con límites:**
   - Supabase → Project Settings → API Keys → Copiar `anon` (publica) o `service_role` (privada)

---

## 9. 📝 REPORTE FINAL Y RECOMENDACIONES

### Problemas Identificados

| # | Severidad | Problema | Impacto | Solución |
|---|-----------|----------|---------|----------|
| 1 | 🔴 CRÍTICO | Migraciones 034-035 fallan | Frontend no puede crear expedientes | Revertir o comentar migraciones |
| 2 | 🔴 CRÍTICO | 8 tablas sin RLS | Filtraciones de datos entre tenants | Habilitar RLS y crear políticas |
| 3 | 🟠 ALTO | Storage RLS incompleta | Cualquiera puede subir branding | Refinar política Storage |
| 4 | 🟠 ALTO | Desajuste schema frontend-backend | Errores de "relation does not exist" | Alinear código o elegir schema |
| 5 | 🟠 ALTO | Trigger functions no auditadas | Posibles fallos silenciosos | Verificar y testear triggers |

### Próximos Pasos (En Orden de Prioridad)

1. **INMEDIATO:** ¿Mantener schema nuevo (cases) o volver al antiguo (expedientes)?
   - Responde esto para decidir los pasos 2-4

2. **Si usas schema NUEVO (cases, students, tenants):**
   - ✅ Deshabilitar migraciones 034-035
   - ✅ Habilitar RLS en 8 tablas sin security
   - ✅ Crear políticas RLS para tablas de catálogo
   - ✅ Refinar Storage RLS

3. **Si necesitas schema ANTIGUO (expedientes, estudiantes):**
   - ❌ Limpiar tablas nuevas (cases, students, tenants)
   - ✅ Restaurar migraciones 001-032
   - ✅ Verificar consistencia de datos

4. **Independiente de (2) o (3):**
   - ✅ Auditar y testear todos los triggers
   - ✅ Crear usuario superadmin vía Supabase Dashboard
   - ✅ Implementar auditoría de acceso (audit_logs)

---

## 10. 📞 CONTACTO Y SOPORTE

**Este reporte fue generado por:** GitHub Copilot  
**Fecha:** 2026-02-18 18:00  
**Versión:** 1.0

**Próxima auditoría recomendada:** Después de implementar soluciones críticas

---

**FIN DEL REPORTE DE AUDITORÍA**
