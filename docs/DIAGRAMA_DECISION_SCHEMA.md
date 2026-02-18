# DIAGRAMA DE DECISIÓN: ¿Qué Schema Debo Usar?
**Decisión Crítica para Resolver los Errores Frontales**

---

## 🎯 El Problema en 3 Frases

1. **Tu DB tiene:** `cases`, `students`, `tenants` (schema nuevo)
2. **Tu Frontend usa:** `expedientes`, `estudiantes`, `establecimientos` (schema antiguo)
3. **Conflicto:** El código frontend no encaja con el DB backend

---

## 🔍 ¿Cuál Schema Estoy Usando? Instrucciones de Diagnóstico

### Paso 1: Revisar Frontend

Abre el archivo [src/features/admin/configStudio/BackendConfigStudio.tsx](../src/features/admin/configStudio/BackendConfigStudio.tsx) o similar y busca:

```typescript
// Si ves ESTO:
supabase.from('expedientes').select()      ← Schema ANTIGUO
supabase.from('estudiantes').select()       ← Schema ANTIGUO
supabase.from('establecimientos').select()  ← Schema ANTIGUO

// En lugar de ESTO:
supabase.from('cases').select()             ← Schema NUEVO
supabase.from('students').select()          ← Schema NUEVO
supabase.from('tenants').select()           ← Schema NUEVO
```

### Paso 2: Revisar Base de Datos

Ejecuta en **Supabase SQL Editor:**

```sql
-- ¿Hay data en schema antiguo?
SELECT COUNT(*) FROM public.expedientes;
-- Error → No existe tabla (schema antiguo está roto)
-- 0 → Tabla vacía (posible migración)
-- >0 → Hay datos (schema antiguo aún en uso)

-- ¿Hay data en schema nuevo?
SELECT COUNT(*) FROM public.cases;
-- 0 → Tabla vacía
-- >0 → Hay datos (schema nuevo está en uso)
```

### Paso 3: Revisar Migraciones

```bash
# Ver cuál fue la ÚLTIMA migración ejecutada
ls -la supabase/migrations/ | tail -5
```

Si ves **035_add_additional_data_to_expedientes.sql** = Intenta usar schema antiguo  
Si no aparece en Git = Schema nuevo fue un change reciente

---

## 🛣️ ÁRBOL DE DECISIÓN

```
┌─────────────────────────────────────────────────────────┐
│         ¿Qué Schema Debo Usar?                          │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴────────────┐
        │                          │
    ¿HAY DATA?               ¿CUÁLNDÓ CAMBIÓ?
        │                          │
   SÍ/NO               ┌──────┴────────┐
        │              │               │
        │          "Ayer"      "Días atrás"
        │          (Error)     (Intencional)
        │              │               │
   ┌────┴────┐         │               │
   │          │         │               │
En exped.   En cases   │               │
(antiguo)  (nuevo)     │               │
   │          │         │               │
   v          v         v               v
 ANTIGUO    NUEVO      FUE ERROR    INTENCIONAL
            (OK)      (REVERTE)      (NUEVO OK)
```

---

## 📋 GUÍA DE DECISIÓN DETALLADA

### CASO A: "Tengo data en `expedientes` solamente"

**Diagnóstico:**
```sql
SELECT COUNT(*) FROM public.expedientes;  -- >0
SELECT COUNT(*) FROM public.cases;        -- 0
```

**Recomendación:** ✅ **MANTENER SCHEMA ANTIGUO**

**Por qué:**
- Todos tus casos/expedientes están en tabla antigua
- Perder data sería catastrófico
- El frontend ya conoce esta estructura

**Acción:**

```sql
-- 1. Verificar que migraciones anteriores funcionan
SELECT * FROM public.expedientes LIMIT 1;

-- 2. Ver si hay trigger activos
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'expedientes';

-- 3. Restaurar cualquier trigger/función rota
-- (Revisión manual desde migrations/001 a 032)

-- 4. NO ejecutar migraciones 033-035
```

**Pasos:**
1. Comentar migraciones 033-035 en `supabase/migrations/`
2. Ejecutar script de correcciones RLS (para tablas antiguas)
3. Testear frontend
4. ❌ Eliminar/limpiar tablas nuevas (cases, students, tenants)

---

### CASO B: "Tengo data en `cases` solamente"

**Diagnóstico:**
```sql
SELECT COUNT(*) FROM public.expedientes;  -- 0 o ERROR
SELECT COUNT(*) FROM public.cases;        -- >0
```

**Recomendación:** ✅ **MIGRAR A SCHEMA NUEVO (Ya está hecho)**

**Por qué:**
- El schema nuevo ya está desplegado y con data
- Las migraciones 034-035 son errores (intentan usar tabla vieja)
- Es lo más seguro en este punto

**Acción:**

```sql
-- 1. Habilitar RLS en tablas nuevas (ya hecho en script)
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
-- etc...

-- 2. NO ejecutar migraciones 033-035
-- (Causarían errores)

-- 3. Actualizar frontend para usar nuevo schema
-- expedientes → cases
-- estudiantes → students
-- establecimientos → tenants
-- etc
```

**Pasos:**
1. Ejecutar script SQL de correcciones (para RLS)
2. **Refactorizar frontend** para usar:
   - `cases` en lugar de `expedientes`
   - `students` en lugar de `estudiantes`
   - `tenants` en lugar de `establecimientos`
3. Testear thoroughly
4. ✅ Mantener el nuevo schema

---

### CASO C: "Tengo data en AMBOS schemas"

**Diagnóstico:**
```sql
SELECT COUNT(*) FROM public.expedientes;  -- >0
SELECT COUNT(*) FROM public.cases;        -- >0
```

**Recomendación:** ⚠️ **AUDITORÍA INMEDIATA (Posible corrupción)**

**Por qué:**
- Esto NO debería suceder
- Indica que los dos schemas coexisten
- Posible data inconsistencia

**Investigación:**

```sql
-- ¿Son los MISMOS casos en ambas tablas?
SELECT COUNT(DISTINCT folio) FROM public.expedientes;  -- antiguo
SELECT COUNT(DISTINCT id) FROM public.cases;           -- nuevo

-- ¿Fechas de creación?
SELECT MAX(created_at) FROM public.expedientes;
SELECT MAX(created_at) FROM public.cases;

-- ¿Hay diferencia de tiempo?
```

**Acción:**
- **Si cases es MÁS NUEVO:** Los datos de expedientes son históricos → ANTIGUO
- **Si expedientes es MÁS NUEVO:** Data reciente está en schema antiguo → ANTIGUO
- **Si tienen mismos datos:** Una es copia de otra → Investigar más

**Paso recomendado:** Contactar a desarrollador que hizo los cambios ayer

---

### CASO D: "No tengo data en ninguno"

**Diagnóstico:**
```sql
SELECT COUNT(*) FROM public.expedientes;  -- 0
SELECT COUNT(*) FROM public.cases;        -- 0
```

**Recomendación:** ✅ **USAR SCHEMA NUEVO (cases, students, tenants)**

**Por qué:**
- No hay data histórica que perder
- El schema nuevo está en la DB
- Es la dirección correcta del proyecto

**Acción:**
1. Ejecutar script SQL de correcciones (RLS)
2. Refactorizar frontend para schema nuevo
3. Testear
4. Considerar: ¿Por qué no hay data? (¿Producción vs Dev?)

---

## 🚀 RESUMEN: Tabla de Decisión Rápida

| Situación | Acción |
|-----------|--------|
| Data en expedientes (antiguo) | ← **MANTENER ANTIGUO** |
| Data en cases (nuevo) | ← **MIGRAR A NUEVO** |
| Data en ambos | ← **AUDITAR PRIMERO** |
| Sin data | ← **USAR NUEVO** |

---

## ⚙️ Pasos Después de la Decisión

### Si Elegiste: MANTENER SCHEMA ANTIGUO (expedientes)

```bash
# 1. Revertir migraciones nuevas
cd supabase/migrations
rm 033_setup_branding_storage.sql
rm 034_add_interaction_type_to_expedientes.sql
rm 035_add_additional_data_to_expedientes.sql

# 2. Ejecutar script RLS (para tablas antiguas)
# (Consultar con equipo técnico)

# 3. Testear frontend
npm run dev

# 4. Commit a Git
git add -A
git commit -m "Revertir migraciones 033-035, mantener schema antiguo"
```

### Si Elegiste: MIGRAR A SCHEMA NUEVO (cases)

```bash
# 1. NO cambiar migraciones (están en BD ya)

# 2. Ejecutar script RLS
# (Ver archivo SQL_CORRECCIONES_INMEDIATAS_2026-02-18.sql)

# 3. Refactorizar frontend
# Find & Replace en VSCode:
#   expedientes → cases
#   estudiantes → students
#   establecimientos → tenants
#   perfiles → tenant_profiles
#   etc

# 4. Testear frontend
npm run dev

# 5. Commit a Git
git add -A
git commit -m "Migrar frontend a schema nuevo (cases, students, tenants)"
```

---

## 📊 Validación: ¿Cómo Sé Que Es la Decisión Correcta?

Después de elegir y ejecutar los pasos:

✅ **Test 1: Crear un caso**
```typescript
const { data, error } = await supabase
  .from('[schema elegido]')
  .insert([{ /* datos */ }]);
  
// No debe haber error de tabla no encontrada
```

✅ **Test 2: RLS funciona**
```typescript
// Logearse como Usuario A y Usuario B
// Usuario A NO debe ver datos de Usuario B
```

✅ **Test 3: Migraciones no tienen conflictos**
```sql
-- En Supabase SQL Editor
-- No debe haber errores de "relation does not exist"
```

✅ **Test 4: No hay data inconsistente**
```sql
-- Ejecutar validaciones desde AUDITORIA_COMPLETA
```

---

## 🆘 Si No Estás Seguro

**ContactA:** Al desarrollador que hizo los cambios ayer

**Pregunta clave:**
> "¿Fue intencional cambiar el schema de `expedientes` a `cases` ayer? ¿O fue un error al aplicar migraciones?"

**Si responden:**
- "Sí, intencional" → Sigue CASO B (SCHEMA NUEVO)
- "No, fue error" → Sigue CASO A (SCHEMA ANTIGUO)
- "No sé" → Sigue CASO D (Auditar primero)

---

**Este documento te ayudará a tomar la decisión correcta en ~5 minutos.**

*Después de decidir, el resto de la solución es mecánica.*
