# Análisis de Multi-Tenancy: Tablas y Políticas RLS

## Resumen Ejecutivo

Este documento analiza el esquema actual de la base de datos y categoriza las tablas según su función en el modelo de multi-tenancy.

---

## A) TABLAS CON ESTABLECIMIENTO_ID (Requieren Aislamiento)

### A1. TABLAS MAESTRAS DE ESTABLECIMIENTO

| Tabla | establecimiento_id | Descripción | Política RLS Sugerida |
|-------|-------------------|-------------|----------------------|
| **establecimientos** | N/A (ES EL TENANT) | Colegios/establecimientos educativos | `SELECT: pública` / `WRITE: solo admin` |

### A2. TABLAS DE ENTIDADES RELACIONADAS CON ESTUDIANTES

| Tabla | establecimiento_id | Foreign Keys | Descripción | Política RLS |
|-------|-------------------|--------------|-------------|--------------|
| **estudiantes** | ✅ SÍ | establecimiento_id → establecimientos | Registro de estudiantes | Filtrar por establecimiento_id |
| **expedientes** | ✅ SÍ | estudiante_id, establecimiento_id | Expedientes de convivencia | Filtrar por establecimiento_id |
| **evidencias** | ✅ SÍ | expediente_id, establecimiento_id | Evidencias documentales | Filtrar por establecimiento_id |
| **hitos_expediente** | ❌ NO* | expediente_id | Hitos/tareas del expediente | *Hereda del expediente |
| **bitacora_psicosocial** | ✅ SÍ | estudiante_id, establecimiento_id | Bitácora confidencial | Filtrar por establecimiento_id |
| **medidas_apoyo** | ✅ SÍ | estudiante_id, establecimiento_id | Medidas de apoyo | Filtrar por establecimiento_id |

### A3. TABLAS DE REGISTRO Y SEGUIMIENTO

| Tabla | establecimiento_id | Foreign Keys | Descripción | Política RLS |
|-------|-------------------|--------------|-------------|--------------|
| **incidentes** | ✅ SÍ | estudiante_id, expediente_id, establecimiento_id | Registro de incidentes | Filtrar por establecimiento_id |
| **derivaciones_externas** | ✅ SÍ | estudiante_id, establecimiento_id | Derivaciones a instituciones | Filtrar por establecimiento_id |
| **bitacora_salida** | ✅ SÍ | estudiante_id, establecimiento_id | Registro de salidas | Filtrar por establecimiento_id |
| **reportes_patio** | ✅ SÍ | establecimiento_id | Reportes del patio | Filtrar por establecimiento_id |
| **mediaciones_gcc** | ✅ SÍ | expediente_id, establecimiento_id | Mediaciones GCC | Filtrar por establecimiento_id |
| **compromisos_mediacion** | ❌ NO* | mediacion_id | Compromisos de mediación | *Hereda de mediaciones_gcc |
| **cursos_inspector** | ✅ SÍ | inspector_id, establecimiento_id | Cursos por inspector | Filtrar por establecimiento_id |

### A4. TABLAS DE ARCHIVO DOCUMENTAL

| Tabla | establecimiento_id | Foreign Keys | Descripción | Política RLS |
|-------|-------------------|--------------|-------------|--------------|
| **carpetas_documentales** | ✅ SÍ | establecimiento_id | Carpetas de archivos | Filtrar por establecimiento_id |
| **documentos_institucionales** | ✅ SÍ | carpeta_id, establecimiento_id | Documentos subidos | Filtrar por establecimiento_id |

### A5. TABLAS DE AUDITORÍA Y LOGS

| Tabla | establecimiento_id | Foreign Keys | Descripción | Política RLS |
|-------|-------------------|--------------|-------------|--------------|
| **logs_auditoria** | ✅ SÍ | usuario_id, establecimiento_id | Logs de auditoría | Filtrar por establecimiento_id |

---

## B) TABLAS DE AUTENTICACIÓN Y AUTORIZACIÓN

### B1. TABLAS DE USUARIOS Y PERFILES

| Tabla | establecimiento_id | Descripción | Política RLS |
|-------|-------------------|-------------|--------------|
| **perfiles** | ✅ SÍ | Usuarios del sistema vinculados a establecimientos | Filtrar por establecimiento_id |

> **Nota**: La tabla `auth.users` es gestionada por Supabase y no tiene establecimiento_id directamente. El enlace se hace a través de `perfiles`.

### B2. TABLAS DE ROLES Y PERMISOS (ENUM)

| Tipo | Nombre | Definición | ¿Aislamiento? |
|------|--------|------------|---------------|
| **enum** | `rol_usuario` | admin, director, convivencia, dupla, inspector, sostenedor | No (gestionado en lógica) |
| **enum** | `tipo_falta` | leve, relevante, expulsion | No (dato del expediente) |
| **enum** | `estado_legal` | apertura, investigacion, resolucion, cerrado | No |
| **enum** | `nivel_privacidad` | baja, media, alta | No |

---

## C) TABLAS GLOBALES (Sin Aislamiento)

| Tabla | Descripción | ¿Por qué es global? |
|-------|-------------|---------------------|
| **feriados_chile** | Feriados legales Chile | Datos de referencia nacional |
| **auth.users** | Usuarios de autenticación | Gestionado por Supabase |
| **platform_settings** | Configuración global | Aplica a toda la plataforma |
| **superadmin_audit_logs** | Auditoría de superadmin | Logs globales del admin |

---

## D) TABLAS ESPECIALES (SUPERADMIN/TENANT)

| Tabla | Identificador de Tenant | Descripción |
|-------|------------------------|-------------|
| **tenant_feature_flags** | tenant_id (→establecimientos) | Features por establecimiento |
| **platform_settings** | N/A | Configuración global |

---

## E) POLÍTICAS RLS RECOMENDADAS

### E1. Políticas para Tablas con establecimiento_id Directo

```sql
-- Estructura base para tablas con establecimiento_id
CREATE POLICY nombre_tabla_isolation ON nombre_tabla
FOR ALL 
USING (public.can_user_access_row(establecimiento_id));
```

**Tablas que necesitan esta política:**
- perfiles
- estudiantes
- expedientes
- evidencias
- bitacora_psicosocial
- medidas_apoyo
- incidentes
- logs_auditoria
- cursos_inspector
- derivaciones_externas
- bitacora_salida
- reportes_patio
- mediaciones_gcc
- carpetas_documentales
- documentos_institucionales

### E2. Políticas para Tablas con FK a Expediente

```sql
-- Para hitos_expediente (hereda via expediente)
CREATE POLICY hitos_expediente_isolation ON hitos_expediente
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM expedientes e
    WHERE e.id = hitos_expediente.expediente_id
    AND public.can_user_access_row(e.establecimiento_id)
  )
);
```

### E3. Políticas para Tablas con FK a Mediación

```sql
-- Para compromisos_mediacion (hereda via mediacion)
CREATE POLICY compromisos_mediacion_isolation ON compromisos_mediacion
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM mediaciones_gcc m
    WHERE m.id = compromisos_mediacion.mediacion_id
    AND public.can_user_access_row(m.establecimiento_id)
  )
);
```

### E4. Políticas Especiales

```sql
-- Establecimientos: solo lectura para todos, escritura para admin
CREATE POLICY public_read_establecimientos ON establecimientos
FOR SELECT USING (true);

CREATE POLICY admin_write_establecimientos ON establecimientos
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM perfiles WHERE rol IN ('admin', 'sostenedor')
  )
);

-- Perfiles: ver usuarios del mismo establecimiento
CREATE POLICY perfiles_own_establecimiento ON perfiles
FOR ALL USING (
  public.get_current_establecimiento_id() = establecimiento_id
  OR auth.uid() IN (
    SELECT id FROM perfiles WHERE rol IN ('admin', 'sostenedor')
  )
);
```

---

## F) RESUMEN: POLÍTICAS RLS POR TABLA

| # | Tabla | Tipo de Aislamiento | Política Actual | Política Sugerida |
|---|-------|---------------------|-----------------|-------------------|
| 1 | establecimientos | MAESTRO TENANT | SELECT pública | admin_write_establecimientos |
| 2 | perfiles | AUTENTICACIÓN | perfiles_own_establecimiento | perfiles_own_establecimiento |
| 3 | estudiantes | ENTIDAD | estudiantes_isolation | estudiantes_isolation |
| 4 | expedientes | ENTIDAD | expedientes_isolation | expedientes_isolation |
| 5 | evidencias | ENTIDAD | evidencias_isolation | evidencias_isolation |
| 6 | hitos_expediente | HEREDADO | hitos_expediente_isolation | hitos_expediente_isolation |
| 7 | bitacora_psicosocial | ENTIDAD | bitacora_psicosocial_isolation | bitacora_psicosocial_isolation |
| 8 | medidas_apoyo | ENTIDAD | medidas_apoyo_isolation | medidas_apoyo_isolation |
| 9 | incidentes | ENTIDAD | incidentes_isolation | incidentes_isolation |
| 10 | derivaciones_externas | ENTIDAD | derivaciones_externas_isolation | derivaciones_externas_isolation |
| 11 | bitacora_salida | ENTIDAD | bitacora_salida_isolation | bitacora_salida_isolation |
| 12 | reportes_patio | ENTIDAD | reportes_patio_isolation | reportes_patio_isolation |
| 13 | mediaciones_gcc | ENTIDAD | mediaciones_gcc_isolation | mediaciones_gcc_isolation |
| 14 | compromisos_mediacion | HEREDADO | ❌ NO TIENE | compromisos_mediacion_isolation |
| 15 | carpetas_documentales | ENTIDAD | carpetas_documentales_isolation | carpetas_documentales_isolation |
| 16 | documentos_inst. | ENTIDAD | documentos_inst_isolation | documentos_inst_isolation |
| 17 | cursos_inspector | ENTIDAD | cursos_inspector_isolation | cursos_inspector_isolation |
| 18 | logs_auditoria | AUDITORÍA | logs_auditoria_isolation | logs_auditoria_isolation |
| 19 | tenant_feature_flags | TENANT SPECIFIC | ❌ NO TIENE | tenant_feature_flags_isolation |
| 20 | superadmin_audit_logs | GLOBAL | ❌ NO RLS | Sin RLS (solo superadmin) |

---

## G) ACCIONES RECOMENDADAS

### G1. Tablas que Necesitan establishment_id

Las siguientes tablas **NO tienen** `establecimiento_id` y requieren análisis:

| Tabla | Recomendación |
|-------|---------------|
| **hitos_expediente** | Crear политику que hereda del expediente |
| **compromisos_mediacion** | Crear политику que hereda de la mediación |
| **tenant_feature_flags** | Ya tiene tenant_id, crear política |
| **superadmin_audit_logs** | Tabla global, no necesita RLS |

### G2. Migración Adicional Necesaria

Crear una migración adicional para cubrir las políticas faltantes:

```sql
-- Agregar políticas faltantes

-- tenant_feature_flags
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'tenant_feature_flags' and column_name = 'tenant_id'
  ) then
    drop policy if exists tenant_feature_flags_isolation on tenant_feature_flags;
    create policy tenant_feature_flags_isolation on tenant_feature_flags
    for all using (
      public.can_user_access_row(tenant_id)
    );
  end if;
end $$;
```

---

## H) FLUJO DE DATOS POR ENTIDAD

```
ESTABLECIMIENTO (Tenant)
    │
    ├──▶ PERFILES (usuarios del colegio)
    │       └──▶ estudiantes
    │               │
    │               ├──▶ EXPEDIENTES
    │               │       ├──▶ EVIDENCIAS
    │               │       └──▶ HITOS_EXPEDIENTE (hereda)
    │               │
    │               ├──▶ BITACORA_PSICOSOCIAL
    │               ├──▶ MEDIDAS_APOYO
    │               ├──▶ INCIDENTES
    │               ├──▶ DERIVACIONES_EXTERNAS
    │               ├──▶ BITACORA_SALIDA
    │               └──▶ REPORTES_PATIO
    │
    ├──▶ MEDIACIONES_GCC
    │       └──▶ COMPROMISOS_MEDIACION (hereda)
    │
    ├──▶ CARPETAS_DOCUMENTALES
    │       └──▶ DOCUMENTOS_INSTITUCIONALES
    │
    └──▶ CURSOS_INSPECTOR
            └──▶ LOGS_AUDITORIA
```
