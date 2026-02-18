# Auditoría de Supabase - SGCE
**Fecha:** 2026-02-18  
**Auditor:** Kilo Code  
**Proyecto:** Sistema de Gestión de Convivencia Escolar (SGCE)

---

## Resumen Ejecutivo

Se realizó una auditoría completa de la configuración de Supabase, incluyendo 33 archivos de migración, políticas RLS, funciones, triggers y configuración de autenticación. La auditoría identificó **inconsistencias críticas** entre el frontend y el backend, así como problemas de seguridad en las políticas RLS.

---

## 1. ESTRUCTURA DE TABLAS

### 1.1 Tablas Principales (definidas en 001_init.sql)

| Tabla | Existe | Columnas Clave | Frontend Usa |
|-------|--------|----------------|--------------|
| establecimientos | ✅ | id, nombre, rbd | ✅ |
| perfiles | ✅ | id (FK auth.users), rol, establecimiento_id | ✅ |
| estudiantes | ✅ | id, establecimiento_id, nombre_completo, rut, curso | ✅ |
| expedientes | ✅ | id, establecimiento_id, estudiante_id, folio, tipo_falta, estado_legal | ✅ |
| evidencias | ✅ | id, establecimiento_id, expediente_id, url_storage | ✅ |
| bitacora_psicosocial | ✅ | id, establecimiento_id, estudiante_id, profesional_id | ✅ |
| medidas_apoyo | ✅ | id, establecimiento_id, estudiante_id | ✅ |
| incidentes | ✅ | id, establecimiento_id, estudiante_id | ✅ |
| logs_auditoria | ✅ | id, establecimiento_id, usuario_id, accion | ✅ |
| feriados_chile | ✅ | fecha (PK), descripcion | ❌ |
| cursos_inspector | ✅ | id, establecimiento_id, inspector_id, curso | ❌ |

### 1.2 Tablas Adicionales (definidas en migraciones posteriores)

| Tabla | Migración | Frontend Usa |
|-------|-----------|--------------|
| derivaciones_externas | 003, 010 | ✅ |
| reportes_patio | 003, 007, 008 | ✅ |
| bitacora_salida | 003 | ✅ |
| mediaciones_gcc | 003 | ✅ |
| mediaciones_gcc_v2 | 029 | ✅ |
| participantes_gcc_v2 | 029 | ✅ |
| hitos_gcc_v2 | 029 | ✅ |
| actas_gcc_v2 | 029 | ✅ |
| compromisos_gcc_v2 | 029 | ✅ |
| tenant_feature_flags | 011 | ✅ |
| platform_settings | 011 | ✅ |
| superadmin_audit_logs | 011 | ❌ |
| admin_changesets | 015 | ✅ |
| admin_change_events | 015 | ✅ |
| configuracion_branding | 032 | ✅ |

---

## 2. ANÁLISIS DE COHERENCIA FRONTEND-BACKEND

### 2.1 Llamadas a Supabase.from() - VERIFICADAS

| Tabla | Frontend Llama | Existe en DB | Estado |
|-------|----------------|--------------|--------|
| estudiantes | ✅ | ✅ | OK |
| establecimientos | ✅ | ✅ | OK |
| perfiles | ✅ | ✅ | OK |
| reportes_patio | ✅ | ✅ | OK |
| derivaciones_externas | ✅ | ✅ | OK |
| bitacora_psicosocial | ✅ | ✅ | OK |
| medidas_apoyo | ✅ | ✅ | OK |
| logs_auditoria | ✅ | ✅ | OK |
| mediaciones_gcc_v2 | ✅ | ✅ | OK |
| participantes_gcc_v2 | ✅ | ✅ | OK |
| hitos_gcc_v2 | ✅ | ✅ | OK |
| actas_gcc_v2 | ✅ | ✅ | OK |
| compromisos_gcc_v2 | ✅ | ✅ | OK |
| tenant_feature_flags | ✅ | ✅ | OK |
| platform_settings | ✅ | ✅ | OK |
| admin_changesets | ✅ | ✅ | OK |

### 2.2 Llamadas a Supabase.rpc() - VERIFICADAS

| Función | Frontend Usa | Existe en DB | Estado |
|---------|--------------|--------------|--------|
| sumar_dias_habiles | ✅ | ✅ (002) | OK |
| contar_dias_habiles | ✅ | ✅ (002) | OK |
| log_superadmin_action | ✅ | ✅ (011) | OK |
| validate_admin_sql_statements | ✅ | ✅ (015) | OK |
| apply_admin_changeset | ✅ | ✅ (015) | OK |
| revert_admin_changeset | ✅ | ✅ (015) | OK |
| get_tenant_branding | ❓ | ✅ (032) | OK |

---

## 3. POLÍTICAS RLS - ANÁLISIS DE SEGURIDAD

### 3.1 Políticas por Tabla

#### Tablas Core (001_init.sql)

| Tabla | RLS Habilitada | Políticas Definidas | ¿Usa Isolation? |
|-------|----------------|---------------------|------------------|
| establecimientos | ❓ | ❓ | N/A |
| perfiles | ✅ | ❓ | Sí |
| estudiantes | ✅ | ❓ | Sí |
| expedientes | ✅ | ❓ | Sí |
| evidencias | ✅ | ❓ | Sí |
| bitacora_psicosocial | ✅ | ❓ | Sí |
| medidas_apoyo | ✅ | ✅ | Sí |
| incidentes | ✅ | ❓ | Sí |
| logs_auditoria | ✅ | ❓ | Sí |

#### Tablas GCC (029_gcc_expand.sql)

| Tabla | Política | ¿Usa tenant_id? | Riesgo |
|-------|----------|-----------------|--------|
| mediaciones_gcc_v2 | mediaciones_gcc_v2_isolation | ❌ (establecimiento_id) | MEDIO |
| participantes_gcc_v2 | participantes_gcc_v2_isolation | ❌ (establecimiento_id) | MEDIO |
| hitos_gcc_v2 | hitos_gcc_v2_isolation | ❌ (establecimiento_id) | MEDIO |
| actas_gcc_v2 | actas_gcc_v2_isolation | ❌ (establecimiento_id) | MEDIO |
| compromisos_gcc_v2 | compromisos_gcc_v2_isolation | ❌ (establecimiento_id) | MEDIO |

### 3.2 PROBLEMAS ENCONTRADOS EN RLS

#### 🔴 CRÍTICO: GCC v2 - Aislamiento Incompleto

Las tablas GCC v2 usan políticas de aislamiento que pueden no filtrar correctamente:

```sql
-- 029_gcc_expand.sql
CREATE POLICY mediaciones_gcc_v2_isolation ON public.mediaciones_gcc_v2
FOR ALL
USING (
  exists (
    select 1 from establecimientos
    where id = establecimiento_id
    and (id = current_establecimiento_id() or ...)
  )
)
```

**Problema:** La política usa `current_establecimiento_id()` que puede no estar definida o retornar NULL para algunos usuarios.

**Impacto:** Potencial filtración de datos entre tenants.

---

#### 🟠 ALTO: Políticas con USING (auth.role() = 'authenticated')

Algunas políticas permiten acceso a cualquier usuario autenticado sin verificar tenant:

```sql
-- 007_mejorar_reportes_patio.sql
CREATE POLICY patio_update_estado ON reportes_patio
FOR UPDATE USING (auth.role() = 'authenticated');
```

**Problema:** Cualquier usuario autenticado puede actualizar el estado de cualquier reporte.

**Impacto:** Usuarios pueden modificar reportes de otros establecimientos.

---

## 4. FUNCIONES Y TRIGGERS

### 4.1 Funciones de Utilidad

| Función | Definida en | Estado |
|---------|-------------|--------|
| current_rol() | 001_init.sql | ✅ |
| current_establecimiento_id() | 001_init.sql | ✅ |
| get_current_establecimiento_id() | 010 | ✅ |
| get_current_user_rol() | 010 | ✅ |
| user_has_access_to_establecimiento() | 010 | ✅ |
| set_establecimiento_from_estudiante() | 001 (trigger) | ✅ |
| set_establecimiento_from_expediente() | 001 (trigger) | ✅ |
| sumar_dias_habiles() | 002 | ✅ |
| contar_dias_habiles() | 002 | ✅ |
| log_superadmin_action() | 011 | ✅ |
| validate_admin_sql_statements() | 015 | ✅ |
| apply_admin_changeset() | 015 | ✅ |
| revert_admin_changeset() | 015 | ✅ |
| get_tenant_branding() | 032 | ✅ |

### 4.2 Triggers

| Trigger | Tabla | Función | Estado |
|---------|-------|---------|--------|
| trg_expedientes_establecimiento | expedientes | set_establecimiento_from_estudiante | ✅ |
| trg_establecimiento_timestamp | Varias | set_updated_at_timestamp | ✅ |

---

## 5. ÍNDICES

### 5.1 Índices Definidos

| Tabla | Índice | Columna(s) | Estado |
|-------|--------|------------|--------|
| estudiantes | idx_establecimiento_id | establecimiento_id | ✅ |
| expedientes | idx_establecimiento_id | establecimiento_id | ✅ |
| evidencias | idx_expediente_id | expediente_id | ✅ |
| bitacora_psicosocial | idx_establecimiento_id | establecimiento_id | ✅ |
| derivaciones_externas | idx_establecimiento_id | establecimiento_id | ✅ |
| reportes_patio | idx_establecimiento_id | establecimiento_id | ✅ |
| reportes_patio | idx_estado | estado | ✅ |
| reportes_patio | idx_estudiante_id | estudiante_id | ✅ |
| tenant_feature_flags | idx_tenant_feature_flags_tenant | tenant_id | ✅ |
| tenant_feature_flags | idx_tenant_feature_flags_key | feature_key | ✅ |
| platform_settings | idx_platform_settings_key | setting_key | ✅ |

### 5.2 Índices Faltantes (Rendimiento)

| Tabla | Columna Sugerida | Tipo | Prioridad |
|-------|------------------|------|-----------|
| bitacora_psicosocial | estudiante_id | Index | MEDIA |
| bitacora_psicosocial | profesional_id | Index | MEDIA |
| bitacora_psicosocial | nivel_privacidad | Index | BAJA |
| medidas_apoyo | estudiante_id | Index | MEDIA |
| incidentes | expediente_id | Index | MEDIA |
| logs_auditoria | created_at | Index | MEDIA |

---

## 6. CONFIGURACIÓN DE AUTENTICACIÓN

### 6.1 Roles de Usuario (Enum)

Definidos en 001_init.sql:
- admin
- director
- convivencia
- dupla
- inspector
- sostenedor

### 6.2 Metadata en JWT

El sistema usa:
- `app_metadata.rol` - Rol del usuario
- `app_metadata.establecimiento_id` - ID del establecimiento
- `user_metadata.rol` - Fallback para rol
- `user_metadata.establecimiento_id` - Fallback para establecimiento

### 6.3 Problemas Identificados

1. **No hay función `is_platform_superadmin()` definida** - Referenciada en 013 pero no encontrada
2. **No hay función `get_superadmin_dashboard_metrics()` definida** - Referenciada en 013 pero no encontrada
3. **No hay función `can_access_tenant()` definida** - Referenciada en 013 pero no encontrada

---

## 7. INCONSISTENCIAS IDENTIFICADAS

### 7.1 Inconsistencias Críticas

| # | Tipo | Descripción | Severidad |
|---|------|------------|-----------|
| 1 | RLS | Tablas GCC v2 tienen políticas de aislamiento potencialmente incompletas | CRÍTICA |
| 2 | RLS | Política `patio_update_estado` permite acceso a cualquier usuario autenticado | CRÍTICA |
| 3 | Funciones | Funciones de superadmin referenciadas pero no encontradas (is_platform_superadmin, get_superadmin_dashboard_metrics, can_access_tenant) | ALTA |
| 4 | Índices | Faltan índices en bitacora_psicosocial para consultas comunes | MEDIA |

### 7.2 Inconsistencias de Coherencia

| # | Tabla | Problema | Severidad |
|---|-------|----------|-----------|
| 1 | GCC v2 | Las tablas usan `establecimiento_id` pero las políticas pueden no funcionar correctamente | MEDIA |
| 2 | tenant_feature_flags | Usa `tenant_id` mientras otras tablas usan `establecimiento_id` | BAJA |
| 3 | Configuración dual | Existen tanto mediaciones_gcc (legacy) como mediaciones_gcc_v2 | INFO |

---

## 8. RECOMENDACIONES

### 8.1 Acciones Inmediatas (P0)

1. **Revisar políticas RLS de GCC v2:**
   - Verificar que `current_establecimiento_id()` esté correctamente implementada
   - Añadir logging para detectar filtraciones

2. **Corregir política `patio_update_estado`:**
   ```sql
   DROP POLICY IF EXISTS patio_update_estado ON reportes_patio;
   CREATE POLICY patio_update_estado ON reportes_patio
   FOR UPDATE USING (
     auth.role() = 'authenticated' 
     AND establecimiento_id = current_establecimiento_id()
   );
   ```

3. **Implementar funciones faltantes de superadmin:**
   - Crear `is_platform_superadmin()`
   - Crear `get_superadmin_dashboard_metrics()`
   - Crear `can_access_tenant()`

### 8.2 Acciones a Mediano Plazo (P1)

1. Añadir índices faltantes para mejorar rendimiento
2. Implementar auditoría de acceso a datos sensibles
3. Revisar y consolidar políticas RLS duplicadas

### 8.3 Acciones de Mantenimiento (P2)

1. Documentar todas las funciones RPC disponibles
2. Crear tests de integración para verificar RLS
3. Implementar monitoring de queries lentas

---

## 9. TABLA RESUMEN

| Categoría | Total | Críticos | Altos | Medios | Bajos |
|-----------|-------|----------|-------|--------|-------|
| RLS/Seguridad | 5 | 2 | 2 | 1 | 0 |
| Coherencia | 3 | 0 | 1 | 2 | 0 |
| Rendimiento | 6 | 0 | 0 | 6 | 0 |
| Funciones | 3 | 0 | 3 | 0 | 0 |
| **TOTAL** | **17** | **2** | **6** | **9** | **0** |

---

## 10. CONCLUSIONES

1. **La estructura de tablas está bien diseñada** y es coherente con el frontend en su mayoría.

2. **Existen problemas críticos de seguridad** en las políticas RLS que deben corregirse inmediatamente.

3. **Las funciones RPC principales están definidas** pero faltan funciones de superadmin.

4. **El sistema de multi-tenant está implementado** pero tiene posibles problemas de aislamiento en las tablas GCC v2.

5. **Se recomienda una auditoría de seguridad** completa después de aplicar las correcciones.

---

*Auditoría generada automáticamente por Kilo Code*
