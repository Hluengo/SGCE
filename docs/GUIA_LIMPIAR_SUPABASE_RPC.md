# 📋 GUÍA PASO A PASO: LIMPIAR SUPABASE

## 🎯 Objetivo
Eliminar funciones RPC no usadas en la Fase 1 de refactorización del Centro de Mediación GCC.

---

## ⚠️ PRECAUCIONES IMPORTANTES

### ANTES de hacer cualquier cosa:

1. **Hace un backup**
   - [ ] Ir a: Supabase Dashboard → Project → Backups
   - [ ] Click en "Create backup"
   - [ ] Esperar a que se complete
   - [ ] Anotar la fecha y hora

2. **Verifica que nadie está usando la BD**
   - [ ] Asegúrate que no hay queries activas
   - [ ] Para desarrollo: está bien
   - [ ] Para producción: notificar al equipo primero

3. **Lee el script completo**
   - [ ] Entiende qué se va a eliminar
   - [ ] Confirma que son funciones no necesarias

---

## 📄 PROCEDIMIENTO

### Paso 1: Acceder a Supabase SQL Editor

1. Abre [supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto SGCE
4. En el menú lateral, busca **SQL Editor**
5. Click en **SQL Editor** (o atajo: `Ctrl+K` y busca "SQL")

**Tienes que ver algo como:**
```
┌─────────────────────────────────┐
│ SQL Editor                       │
├─────────────────────────────────┤
│ New query │ My queries │ Saved   │
├─────────────────────────────────┤
│ (area blanco para escribir SQL)  │
└─────────────────────────────────┘
```

---

### Paso 2: Copiar el Script de DROP

Copia exactamente este código:

```sql
-- ============================================================================
-- ELIMINACIÓN SEGURA: Funciones RPC no usadas
-- Fecha: 18 febrero 2026
-- Proyecto: SGCE - Centro Mediación Escolar
-- ============================================================================

-- 1. gcc_registrar_resultado
DROP FUNCTION IF EXISTS public.gcc_registrar_resultado(uuid, text, text, uuid) CASCADE;

-- 2. gcc_registrar_notificacion
DROP FUNCTION IF EXISTS public.gcc_registrar_notificacion(uuid, text, text, uuid) CASCADE;

-- 3. obtener_plazo_legal
DROP FUNCTION IF EXISTS public.obtener_plazo_legal(date, integer) CASCADE;

-- 4. verificar_permiso_establecimiento
DROP FUNCTION IF EXISTS public.verificar_permiso_establecimiento(uuid, uuid) CASCADE;
```

---

### Paso 3: Pegar en SQL Editor

1. En Supabase SQL Editor, click en el área blanca
2. `Ctrl+A` para limpiar cualquier contenido anterior
3. `Ctrl+V` para pegar el script
4. Debería verse así:

```
|-- 1. gcc_registrar_resultado
|DROP FUNCTION IF EXISTS public.gcc_registrar_resultado(uuid, text, text, uuid) CASCADE;
|
|-- 2. gcc_registrar_notificacion
|DROP FUNCTION IF EXISTS public.gcc_registrar_notificacion(uuid, text, text, uuid) CASCADE;
|
|-- 3. obtener_plazo_legal
|DROP FUNCTION IF EXISTS public.obtener_plazo_legal(date, integer) CASCADE;
|
|-- 4. verificar_permiso_establecimiento
|DROP FUNCTION IF EXISTS public.verificar_permiso_establecimiento(uuid, uuid) CASCADE;
```

---

### Paso 4: Ejecutar el Script

**Opción A: Botón en UI**
1. Busca el botón verde "Execute" o "Run" (esquina superior derecha)
2. Click en él
3. Aguarda 2-5 segundos

**Opción B: Teclado**
1. `Ctrl+Enter` ejecuta la query

**Opción C: Menú**
1. Click en "▶ Run" en la barra superior

---

### Paso 5: Verificar Resultados

Después de ejecutar, deberías ver:

✅ **Si todo está bien:**
```
Query executed successfully
Rows affected: 0
Execution time: 0.123 ms
```

(El "Rows affected: 0" es normal - no estamos eliminando datos, solo funciones)

❌ **Si hay error:**
```
ERROR: function public.gcc_XXX(...) is in use
```

**Si ves un error:**
1. Anota el nombre de la función
2. Eso significa que algo la está usando
3. **NO sigas adelante**
4. Restaura desde el backup
5. Contacta al equipo de desarrollo

---

### Paso 6: Validar que se Eliminaron

Copia y ejecuta este script de validación:

```sql
-- Listar functions RPC restantes
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'gcc_%'
ORDER BY routine_name;
```

**Resultado esperado** (si todo salió bien):

```
RoutineName
────────────────────────────────
gcc_actualizar_consentimiento
gcc_agregar_compromiso
gcc_agregar_hito
gcc_agregar_participante
gcc_crear_proceso
gcc_generar_acta
gcc_obtener_dashboard
gcc_procesar_cierre_completo
gcc_validar_expediente
gcc_verificar_cumplimiento
```

⚠️ **Si ves esto** (significa que algo salió mal):
```
gcc_registrar_resultado        ← ❌ Debería estar eliminado
gcc_registrar_notificacion     ← ❌ Debería estar eliminado
```

Si pasa esto:
1. Restaura desde backup
2. Intenta nuevamente
3. O contacta soporte

---

## ✅ CHECKLIST DE COMPLETACIÓN

- [ ] Hice backup
- [ ] Copié el script DROP
- [ ] Lo pegué en SQL Editor
- [ ] Ejecuté sin errores
- [ ] Verificación mostró 10 functions (no 14)
- [ ] `gcc_registrar_resultado` NO aparece
- [ ] `gcc_registrar_notificacion` NO aparece
- [ ] `obtener_plazo_legal` NO aparece
- [ ] `verificar_permiso_establecimiento` NO aparece

---

## 🆘 PROBLEMAS COMUNES

### "ERROR: function is in use"
**Causa**: Algo depende de esa función  
**Solución**: Restaurar backup y contactar dev

### "No aparece SQL Editor"
**Causa**: Permisos insuficientes  
**Solución**: Pedir acceso a Supabase a admin del proyecto

### "Ejecuté pero no veo resultados"
**Causa**: Query lenta  
**Solución**: Espera 10 segundos más

### "Quiero deshacer"
**Causa**: Cambió de opinión  
**Solución**: Restaurar desde backup (opción en Dashboard)

---

## 📊 COMPARATIVA: ANTES vs DESPUÉS

| Métrica | Antes | Después | Cambio |
|---------|-------|---------|--------|
| Functions RPC | 14 | 10 | -4 |
| Funciones críticas | 10 | 10 | Sin cambios ✓ |
| Funciones deprecated | 4 | 0 | -100% ✓ |

---

## 📞 SI ALGO FALLA

**Pasos de recuperación:**

1. **Función restaurada**
   - Ir a: Backups
   - Click en el backup reciente
   - "Restore"
   - Esperar 5-10 minutos

2. **Verificar estado**
   - Pasar por el checklist nuevamente
   - O contactar a alguien con permisos `Superadmin`

---

## 🎯 DESPUÉS DE COMPLETAR

Una vez eliminadas las funciones:

1. ✅ Proyecto SGCE está más limpio
2. ✅ Mayor claridad en RPC disponibles
3. ✅ React hooks están optimizados
4. ✅ Código más mantenible

**¡Listo para pasar a Fase 2!** 🚀

---

**Última actualización**: 18 de febrero de 2026  
**Documento**: GUIA_LIMPIAR_SUPABASE_RPC.md  
**Proyecto**: SGCE - Centro de Mediación Escolar
