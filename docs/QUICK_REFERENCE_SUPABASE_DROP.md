# ⚡ REFERENCIAS RÁPIDAS: DROP EN SUPABASE

---

## 🍀 COPY-PASTE: Script completo (listo para ejecutar)

```sql
-- ============================================================================
-- ELIMINACIÓN SEGURA: Funciones RPC no usadas en FASE 1
-- Ejecutar 1 sola vez
-- ============================================================================

DROP FUNCTION IF EXISTS public.gcc_registrar_resultado(uuid, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.gcc_registrar_notificacion(uuid, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.obtener_plazo_legal(date, integer) CASCADE;
DROP FUNCTION IF EXISTS public.verificar_permiso_establecimiento(uuid, uuid) CASCADE;
```

**Tiempo**: ~2 segundos  
**Resultado esperado**: "Query executed successfully"

---

## 🔍 COPY-PASTE: Validación (verificar que funcionó)

```sql
-- Mostrar todas las funciones RPC gcc_*
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE 'gcc_%'
ORDER BY routine_name;
```

**Debería mostrar exactamente 10 functions:**
- gcc_actualizar_consentimiento ✓
- gcc_agregar_compromiso ✓
- gcc_agregar_hito ✓
- gcc_agregar_participante ✓
- gcc_crear_proceso ✓
- gcc_generar_acta ✓
- gcc_obtener_dashboard ✓
- gcc_procesar_cierre_completo ✓
- gcc_validar_expediente ✓
- gcc_verificar_cumplimiento ✓

---

## 🔙 COPY-PASTE: Reversión de emergencia

```sql
-- SI ALGO SE ROMPIÓ, ejecuta en Supabase Backups
-- 1. Ir a: Dashboard > Backups
-- 2. Buscar backup anterior
-- 3. Click en "Restore"
-- 4. Esperar 5-10 minutos
```

---

## 📋 CHECKLIST RÁPIDO

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Backup ✓ | ☐ |
| 2 | SQL Editor abierto | ☐ |
| 3 | Script copiado | ☐ |
| 4 | Ejecutar: `Ctrl+Enter` | ☐ |
| 5 | Sin errores ✓ | ☐ |
| 6 | Validación: 10 functions | ☐ |
| 7 | ¡Listo! 🎉 | ☐ |

---

## 🎯 FUNCIONES QUE SE ELIMINAN

```
❌ gcc_registrar_resultado(uuid, text, text, uuid)
   Causa: Reemplazada por gcc_procesar_cierre_completo
   
❌ gcc_registrar_notificacion(uuid, text, text, uuid)
   Causa: No usada en FASE 1, para Fase 2
   
❌ obtener_plazo_legal(date, integer)
   Causa: Lógica movida a calcular_dias_habiles
   
❌ verificar_permiso_establecimiento(uuid, uuid)
   Causa: Validación en RLS policies
```

---

## ✅ FUNCIONES QUE PERMANECEN

```
✓ gcc_crear_proceso
  Usado en: useGccDerivacion hook
  
✓ gcc_agregar_hito
  Usado en: useGccDerivacion hook
  
✓ gcc_procesar_cierre_completo
  Usado en: useGccCierre hook
  
✓ gcc_validar_expediente
  Usado en: Validaciones iniciales
  
✓ gcc_verificar_cumplimiento
  Usado en: GccDashboard
  
✓ gcc_obtener_dashboard
  Usado en: GccDashboard
  
✓ gcc_generar_acta
  Usado en: gcc_procesar_cierre_completo
  
✓ gcc_agregar_participante
  Usado en: gcc_crear_proceso
  
✓ gcc_agregar_compromiso
  Usado en: useGccCierre
  
✓ gcc_actualizar_consentimiento
  Usado en: Gestión de consentimientos
```

---

## 🎮 ALTERNATIVAS DE EJECUCIÓN

### Opción 1: Botón UI (más seguro)
```
1. Supabase > SQL Editor
2. Pega el script
3. Click en botón verde "Execute"
```

### Opción 2: Teclado (más rápido)
```
1. Supabase > SQL Editor
2. Pega el script
3. Presiona: Ctrl + Enter
```

### Opción 3: CLI (para automatizar)
```bash
# Si tienes Supabase CLI instalado
supabase db push --dry-run
supabase db push
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Qué pasa si ejecuto por error dos veces?**  
R: Nada, el `IF EXISTS` lo previene. Es seguro ejecutar múltiples veces.

**P: ¿Se borra en el database pero no en el código?**  
R: El código ya no las usa (hooks están optimizados), así que no hay problema.

**P: ¿Cuánto tarda?**  
R: 1-5 segundos máximo.

**P: ¿Se ve en el Activity Log?**  
R: Sí, aparecerá como 4 `DROP FUNCTION` events.

**P: ¿Qué pasa con los datos?**  
R: Los datos en tablas NO se tocan, solo las funciones RPC.

---

## 🚨 ERRORES QUE PODRÍAS VER

```
ERROR: function public.gcc_registrar_resultado(...) is in use by view or other funcs
→ Significa que algo depende de ella
→ Restaurar backup y contactar dev
```

```
ERROR: permission denied
→ No tienes permisos suficientes
→ Pedir acceso a admin del proyecto
```

```
ERROR: syntax error at or near "DROP"
→ Copiaste mal el script
→ Intenta nuevamente
```

---

## 📞 SOPORTE

Si algo falla:
1. Restaurar from backup (5 minutos max)
2. Contactar a: [dev team]
3. Compartir screenshot del error
4. Anotar timestamp exacto

---

**Última actualización**: 18 febrero 2026  
**Tiempo de lectura**: 3 minutos  
**Complejidad**: ⚫⚪⚪ (Muy fácil)  
**Riesgo**: 🟡 (Bajo, si haces backup primero)
