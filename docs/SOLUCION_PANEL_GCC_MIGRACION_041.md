# 🔧 SOLUCIÓN: Panel GCC no muestra KPIs - Migración 041

## 📋 RESUMEN EJECUTIVO

**Problema**: Panel "Gestión Colaborativa de Conflictos" no muestra datos (KPIs) cuando superadmin cambia de colegio.

**Causa raíz**: Las tablas GCC v2 (`mediaciones_gcc_v2`, `participantes_gcc_v2`, etc.) usan políticas RLS que no incluyen el bypass para superadmin que implementamos en la migración 040.

**Solución**: Migración 041 actualiza las políticas RLS de 5 tablas GCC para incluir el bypass de superadmin usando `is_superadmin_from_jwt()`.

---

## 🔍 ANÁLISIS TÉCNICO

### Hook Afectado
```typescript
// src/shared/hooks/useGccMetrics.ts
const { data, error } = await supabase
  .from('mediaciones_gcc_v2')
  .select('id, estado_proceso, fecha_limite_habil')
  .eq('establecimiento_id', tenantId)  // ← Filtra por establecimiento
```

### Problema de RLS
Las políticas actuales usan `can_user_access_row(establecimiento_id)`:

```sql
-- Política ACTUAL (migración 029)
CREATE POLICY mediaciones_gcc_v2_isolation ON public.mediaciones_gcc_v2
FOR ALL
USING (public.can_user_access_row(establecimiento_id))
WITH CHECK (public.can_user_access_row(establecimiento_id));
```

La función `can_user_access_row()` llama a `is_platform_superadmin()` que consulta la tabla `perfiles`, lo cual:
1. **No incluye el bypass directo desde JWT** (migración 040)
2. **Potencial recursión** si perfiles tiene RLS
3. **No permite acceso cross-tenant** para superadmin

### Solución Implementada
```sql
-- Política NUEVA (migración 041)
CREATE POLICY mediaciones_gcc_v2_read ON public.mediaciones_gcc_v2
FOR SELECT
USING (
  public.is_superadmin_from_jwt()  -- ← Bypass directo desde JWT
  OR (
    establecimiento_id = public.current_establecimiento_id()
    AND public.user_has_role(ARRAY['superadmin', 'sostenedor', ...])
  )
);
```

---

## 📦 TABLAS ACTUALIZADAS

La migración 041 actualiza **5 tablas GCC v2**:

| Tabla                     | Políticas Creadas              | Hook/Componente que la usa |
|---------------------------|--------------------------------|----------------------------|
| `mediaciones_gcc_v2`      | `_read`, `_insert`, `_update` | `useGccMetrics`, Dashboard |
| `participantes_gcc_v2`    | `_read`, `_write`, `_update`  | Formularios GCC            |
| `hitos_gcc_v2`            | `_read`, `_write`, `_update`  | Timeline GCC               |
| `actas_gcc_v2`            | `_read`, `_write`, `_update`  | Documentos GCC             |
| `compromisos_gcc_v2`      | `_read`, `_write`, `_update`  | Acuerdos GCC               |

Cada tabla ahora tiene:
- ✅ **Bypass superadmin** usando `is_superadmin_from_jwt()`
- ✅ **Filtrado por tenant** para usuarios normales
- ✅ **Permisos por rol** usando `user_has_role()`

---

## 🚀 INSTRUCCIONES DE APLICACIÓN

### Opción 1: SQL Editor de Supabase (Recomendado)

1. **Abrir SQL Editor**:
   ```
   https://supabase.com/dashboard/project/hqkqyjigpjdnvemygkhw/sql/new
   ```

2. **Copiar archivo completo**:
   - Abrir: `supabase/sql/EJECUTAR_041_GCC_FIX.sql`
   - Copiar todo (Ctrl+A, Ctrl+C)

3. **Pegar y ejecutar**:
   - Pegar en SQL Editor (Ctrl+V)
   - Clic en "Run" o presionar `Ctrl+Enter`

4. **Verificar resultado**:
   ```
   NOTICE:  ✓ Migración 041 aplicada correctamente
   NOTICE:  ✓ 15 políticas RLS actualizadas para tablas GCC
   NOTICE:  ✓ Superadmin ahora puede ver datos GCC de todos los colegios
   Success. No rows returned
   ```

### Opción 2: Desde Terminal (Alternativa)

Si prefieres aplicar desde la terminal local:

```bash
# Verificar que la migración existe
ls supabase/migrations/041_gcc_superadmin_bypass.sql

# Aplicar directamente a Supabase (requiere configurar conexión)
psql "postgresql://postgres.hqkqyjigpjdnvemygkhw:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/041_gcc_superadmin_bypass.sql
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

### 1. Verificar políticas aplicadas

Ejecutar en SQL Editor:

```sql
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN (
  'mediaciones_gcc_v2',
  'participantes_gcc_v2',
  'hitos_gcc_v2',
  'actas_gcc_v2',
  'compromisos_gcc_v2'
)
ORDER BY tablename, policyname;
```

**Resultado esperado**: 15 políticas (3 por tabla)

### 2. Probar en la aplicación

1. **Login como superadmin**:
   ```
   Email: heae25@gmail.com
   ```

2. **Cambiar de colegio**:
   - Clic en ícono Building 🏢 en sidebar
   - Seleccionar otro establecimiento (ej: Colegio Alicante)

3. **Verificar Panel GCC**:
   - Ir a Dashboard
   - Verificar sección "Gestión Colaborativa de Conflictos"
   - **Debe mostrar**:
     - Total Activos
     - Vencen en 2 días (T-2)
     - Vencen mañana (T-1)
     - Vencidos
     - % Acuerdo Total, Parcial, Sin Acuerdo

### 3. Verificar consola del navegador

**NO debe haber**:
- ❌ Errores de Supabase
- ❌ "stack depth limit exceeded"
- ❌ "row-level security violation"

**Es normal**:
- ⚠️ Advertencias de performance React
- ⚠️ Advertencias de console.log

---

## 🔄 DIFERENCIAS CON MIGRACIÓN 040

| Aspecto                | Migración 040                     | Migración 041                     |
|------------------------|-----------------------------------|-----------------------------------|
| **Tablas actualizadas** | 10 tablas core (estudiantes, etc) | 5 tablas GCC v2                   |
| **Función usada**      | `is_superadmin_from_jwt()`       | `is_superadmin_from_jwt()` (misma)|
| **Patrón de política** | `_read`, `_write_equipo`, `_update_equipo` | `_read`, `_insert`, `_update` |
| **Tablas legacy**      | No incluye tablas GCC            | Solo tablas GCC v2                |

---

## 📝 ROLLBACK (Si es necesario)

Si necesitas revertir los cambios:

```sql
-- Restaurar políticas originales de migración 029
DROP POLICY IF EXISTS mediaciones_gcc_v2_read ON public.mediaciones_gcc_v2;
DROP POLICY IF EXISTS mediaciones_gcc_v2_insert ON public.mediaciones_gcc_v2;
DROP POLICY IF EXISTS mediaciones_gcc_v2_update ON public.mediaciones_gcc_v2;

CREATE POLICY mediaciones_gcc_v2_isolation ON public.mediaciones_gcc_v2
FOR ALL
USING (public.can_user_access_row(establecimiento_id))
WITH CHECK (public.can_user_access_row(establecimiento_id));

-- Repetir para las otras 4 tablas GCC...
```

---

## 🎯 RESULTADO ESPERADO

Después de aplicar migración 041:

### ✅ Superadmin puede:
1. ✅ Cambiar entre colegios sin perder datos
2. ✅ Ver KPIs del Panel GCC de cualquier establecimiento
3. ✅ Acceder a mediaciones, participantes, hitos, actas y compromisos de todos los colegios
4. ✅ Crear y editar registros GCC en cualquier establecimiento

### ✅ Usuarios normales:
1. ✅ Solo ven datos de su establecimiento asignado
2. ✅ No pueden acceder a datos de otros colegios
3. ✅ Permisos por rol funcionan correctamente

### ✅ Sistema:
1. ✅ Sin errores de recursión
2. ✅ Performance normal
3. ✅ RLS activo y funcional en todas las tablas

---

## 🔗 CONTEXTO DE MIGRACIONES

### Secuencia de correcciones superadmin:

1. **Migración 038** (2026-02-18):
   - Corregir `establecimiento_id` del superadmin en JWT y perfiles
   - Cambiar a UUID global: `00000000-0000-0000-0000-000000000001`

2. **Migración 039** (2026-02-18) ❌ FALLIDA:
   - Intentar bypass usando `is_platform_superadmin()`
   - **Error**: "stack depth limit exceeded" (recursión)
   - **Rollback**: `supabase/sql/ROLLBACK_039.sql`

3. **Migración 040** (2026-02-18) ✅ EXITOSA:
   - Crear `is_superadmin_from_jwt()` que lee JWT directamente
   - Actualizar 10 tablas core con bypass
   - **Resultado**: Cross-tenant access funciona para estudiantes, expedientes, etc.

4. **Migración 041** (2026-02-18) ✅ ACTUAL:
   - Aplicar mismo patrón a tablas GCC v2
   - Actualizar 5 tablas GCC con bypass
   - **Resultado**: Panel GCC muestra KPIs de todos los colegios

---

## 📚 ARCHIVOS RELACIONADOS

### Migraciones:
- `supabase/migrations/041_gcc_superadmin_bypass.sql` - Migración principal
- `supabase/sql/EJECUTAR_041_GCC_FIX.sql` - Script ejecutable con verificación

### Código afectado:
- `src/shared/hooks/useGccMetrics.ts` - Hook que consulta mediaciones_gcc_v2
- `src/features/dashboard/Dashboard.tsx` - Usa useGccMetrics para Panel GCC
- `src/features/gestion-colaborativa/` - Componentes GCC que usan las tablas

### Documentación:
- `docs/GUIA_CORREGIR_SUPERADMIN.md` - Guía original de corrección
- `supabase/migrations/040_superadmin_bypass_fixed.sql` - Migración previa

---

## 🆘 TROUBLESHOOTING

### Problema: "Función is_superadmin_from_jwt() no existe"
**Solución**: Aplicar migración 040 primero:
```bash
# Verificar que existe
SELECT proname FROM pg_proc WHERE proname = 'is_superadmin_from_jwt';

# Si no existe, aplicar 040
\i supabase/migrations/040_superadmin_bypass_fixed.sql
```

### Problema: Panel GCC sigue sin mostrar datos
**Verificar**:
1. Consola del navegador: ¿hay errores de Supabase?
2. Network tab: ¿la petición devuelve datos vacíos?
3. JWT actual: ¿tiene `role: 'superadmin'` en app_metadata?

```javascript
// Verificar en consola del navegador
const session = await supabase.auth.getSession();
console.log(session.data.session?.user.app_metadata);
// Debe mostrar: { role: 'superadmin', establecimiento_id: '00000000-...' }
```

### Problema: "row-level security policy violation"
**Causa**: Usuario no tiene rol permitido o políticas no se aplicaron correctamente.

**Solución**: 
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'mediaciones_gcc_v2';

-- Verificar rol del usuario
SELECT 
  auth.uid(),
  (auth.jwt() -> 'app_metadata' ->> 'role') as role,
  is_superadmin_from_jwt() as es_superadmin;
```

---

## 📊 IMPACTO

### Antes de migración 041:
- ❌ Panel GCC no muestra KPIs al cambiar de colegio
- ❌ Superadmin no puede ver mediaciones de otros establecimientos
- ❌ Dashboard GCC muestra 0 en todos los indicadores

### Después de migración 041:
- ✅ Panel GCC muestra KPIs correctamente
- ✅ Superadmin ve todas las mediaciones cross-tenant
- ✅ Dashboard GCC muestra estadísticas reales del establecimiento seleccionado

---

**Autor**: GitHub Copilot  
**Fecha**: 2026-02-18  
**Versión**: 1.0  
**Status**: ✅ Listo para aplicar
