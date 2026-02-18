# 📋 Troubleshooting: Branding Storage

Este documento indexa todos los recursos de debugging para problemas con branding.

---

## 🔴 Error: 403 Forbidden "violates row-level security policy"

**Síntomas**:
```
POST ... 403
Error: violates row-level security policy
```

**Soluciones** (en orden):

1. ⚡ **Quick Fix** - 5 minutos  
   → [BRANDING_403_QUICK_FIX.md](BRANDING_403_QUICK_FIX.md)  
   Pasos rápidos para resolver 99% de los casos

2. 🔍 **Debugging Completo** - 15 minutos  
   → [FIX_403_FORBIDDEN_ERROR.md](FIX_403_FORBIDDEN_ERROR.md)  
   Guía exhaustiva con matrix de diagnóstico

3. 🛠️ **SQL Debugging** - 5 minutos  
   → [DEBUG_BRANDING_RLS.sql](../supabase/sql/DEBUG_BRANDING_RLS.sql)  
   Script para verificar estado en Supabase

---

## 🟡 Error: "Failed to load resource: 400 Bad Request" (Storage)

**Síntomas**:
```
Failed to load resource: the server responded with a status of 400
POST /storage/v1/object/branding-assets/... 400
```

**Soluciones** (en orden):

1. ⚡ **Storage RLS Simplification** - 10 minutos  
   → [BRANDING_STORAGE_FIX_v2.md](BRANDING_STORAGE_FIX_v2.md)  
   Las políticas de storage fueron simplificadas de v1 a v2

2. 📋 **Storage Testing Plan** - 20 minutos  
   → [BRANDING_TESTING_PLAN.md](BRANDING_TESTING_PLAN.md)  
   12 test cases para validar todo

3. 📚 **Migración 033** - Referencia  
   → [supabase/migrations/033_setup_branding_storage.sql](../supabase/migrations/033_setup_branding_storage.sql)

---

## 🟢 Error: None (Todo Funciona!)

**Si todo está bien**:

1. 📖 **Resumen Técnico**  
   → [BRANDING_V2_EXECUTIVE_SUMMARY.md](BRANDING_V2_EXECUTIVE_SUMMARY.md)  
   Qué cambió, por qué, diferencias v1 vs v2

2. 🚀 **Deployment Checklist**  
   → [BRANDING_STORAGE_FIX_v2.md](BRANDING_STORAGE_FIX_v2.md)  
   Pasos de despliegue y validación

3. 🏃 **Quick Start**  
   → [QUICKSTART_BRANDING_V2.md](QUICKSTART_BRANDING_V2.md)  
   Para nuevos desarrolladores

---

## 📊 Guía Rápida por Problema

### Problema: No sé dónde está el error

→ Abre F12 (Console) y busca:
```
400, 403, 401, 4XX = Error de autenticación/autorización
500, 5XX = Error del servidor
```

### Problema: Dice "violates row-level security policy" (403)

→ Ve a: [BRANDING_403_QUICK_FIX.md](BRANDING_403_QUICK_FIX.md) (5 min)

### Problema: Dice "Failed to load resource: 400" (Storage)

→ Ve a: [BRANDING_STORAGE_FIX_v2.md](BRANDING_STORAGE_FIX_v2.md) (10 min)

### Problema: Todo falla, no sé qué hacer

→ Ve a: [FIX_403_FORBIDDEN_ERROR.md](FIX_403_FORBIDDEN_ERROR.md)  
Matriz de diagnóstico paso a paso

---

## 🛠️ Herramientas de Debugging

### Browser Console

```javascript
// Ver autenticación
const s = await supabase.auth.getSession();
console.log('User:', s.data.session?.user?.email);
console.log('Role:', s.data.session?.user?.user_metadata?.role);

// Testar RPC access
const data = await supabase.rpc('get_tenant_branding', { 
  p_establecimiento_id: 'uuid-aqui' 
});
```

### Supabase SQL Editor

Ejecutar [DEBUG_BRANDING_RLS.sql](../supabase/sql/DEBUG_BRANDING_RLS.sql):

```sql
-- Ver todas las policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'configuracion_branding';

-- Ver si RLS habilitado
SELECT rowsecurity FROM pg_tables 
WHERE tablename = 'configuracion_branding';
```

### Supabase Logs

Settings > API Activity > Buscar por:
- `configuracion_branding`
- `403`
- `400`

---

## 📈 Documentación Relacionada

### Branding General
- [BRANDING_V2_EXECUTIVE_SUMMARY.md](BRANDING_V2_EXECUTIVE_SUMMARY.md) - Overview completo
- [BRANDING_STORAGE_FIX_v2.md](BRANDING_STORAGE_FIX_v2.md) - Cambios v1 vs v2

### Testing
- [BRANDING_TESTING_PLAN.md](BRANDING_TESTING_PLAN.md) - 12 test cases

### Deployment
- [QUICKSTART_BRANDING_V2.md](QUICKSTART_BRANDING_V2.md) - Setup rápido
- [deploy-branding-v2.sh](../scripts/deploy-branding-v2.sh) - Script deployment

---

## 🆘 Si nada funciona

1. **Crear issue con**:
   - Error exacto (copy-paste)
   - Console logs (F12)
   - Supabase SQL logs si disponible
   - Tu rol de usuario

2. **Chequear**:
   - ¿Eres realmente SUPERADMIN?
   - ¿La migración 032 fue aplicada?
   - ¿El JWT tiene rol='SUPERADMIN'?

3. **Ir a**:
   - [FIX_403_FORBIDDEN_ERROR.md](FIX_403_FORBIDDEN_ERROR.md) - Checklist exhaustivo
   - [DEBUG_BRANDING_RLS.sql](../supabase/sql/DEBUG_BRANDING_RLS.sql) - Debug SQL

---

**Última actualización**: 18 de febrero, 2026  
**Versión**: 2.0  
**Mantenedor**: Team Branding  

