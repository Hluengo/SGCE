# 🔧 QUICK FIX: Error 403 en Branding

**⏱️ Tiempo**: 5 minutos  
**📋 Pasos**: 3  

---

## El Problema

```
❌ Error: 403 Forbidden
❌ No puedo guardar branding
```

## La Solución

### 1️⃣ Re-aplicar Migración en Supabase (2 min)

1. **Ir a**: Supabase Dashboard > Tu Proyecto > SQL Editor
2. **Click**: "New Query"
3. **Copiar** TODO el contenido de: `supabase/migrations/032_tenant_branding.sql`
4. **Pegar** en el editor
5. **Click**: "Run"
6. **Ver**: "Query executed successfully" ✅

### 2️⃣ Logout y Login (1 min)

1. **Click**: "Salir" (logout)
2. **Login** nuevamente como **SUPERADMIN**
3. **Verificar**: Eres SUPERADMIN (ver foto/nombre en arriba a la derecha)

### 3️⃣ Probar Guardar Branding (2 min)

1. **Ir a**: Admin > Colegios
2. **Click**: Botón 🎨 (Palette) en un colegio
3. **Cambiar**: Cualquier color o nombre
4. **Click**: "Guardar"
5. **Ver**: Mensaje de éxito ✅

---

## ✅ ¡Listo!

Si funciona → Problema resuelto  
Si no funciona → Ir a docs/FIX_403_FORBIDDEN_ERROR.md para debugging completo

---

## 🆘 Si sigue fallando

**En el navegador**:

1. **F12** (abrir Developer Tools)
2. **Console tab**
3. **Copiar y pegar**:
   ```javascript
   const s = await supabase.auth.getSession();
   console.log('Mi rol:', s.data.session?.user?.user_metadata?.role);
   ```
4. **Ver el valor**
   - ✅ Si es `SUPERADMIN` → Ir a docs/FIX_403_FORBIDDEN_ERROR.md
   - ❌ Si es otro → No eres SUPERADMIN, necesitas permisos de admin

---

## 📚 Documentación Completa

- [BRANDING_403_FIX_SUMMARY.md](BRANDING_403_FIX_SUMMARY.md) - Resumen técnico
- [FIX_403_FORBIDDEN_ERROR.md](FIX_403_FORBIDDEN_ERROR.md) - Debugging exhaustivo
- [DEBUG_BRANDING_RLS.sql](../supabase/sql/DEBUG_BRANDING_RLS.sql) - SQL debug script

