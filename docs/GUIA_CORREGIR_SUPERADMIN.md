# 🔧 Guía: Corregir Usuario Superadmin

**UUID:** `f25d35d0-d30c-463c-9321-74568a060349`  
**Email:** `superadmin.20260216133309@gestionconvivencia.cl`

---

## ❌ Problema Detectado

Tu usuario superadmin tiene el `establecimiento_id` **INCORRECTO** en el JWT (Authentication):

```json
{
  "raw_app_meta_data": {
    "establecimiento_id": "d645e547-054f-4ce4-bff7-7a18ca61db50"  // ❌ INCORRECTO
  },
  "raw_user_meta_data": {
    "establecimiento_id": "d645e547-054f-4ce4-bff7-7a18ca61db50"  // ❌ INCORRECTO
  }
}
```

**Debería ser:**
```json
"establecimiento_id": "00000000-0000-0000-0000-000000000001"  // ✅ SUPERADMIN GLOBAL
```

---

## 🚀 Solución en 2 Pasos

### **PASO 1: Ejecutar Script SQL** ✅

1. Ve a **Supabase Dashboard → SQL Editor**
2. Copia el contenido de `038_fix_superadmin_complete.sql`
3. Ejecuta el script
4. Verifica el mensaje: ✅ "CORRECCIÓN COMPLETADA"

Este paso corrige:
- ✅ Tabla `perfiles` con el establecimiento correcto
- ⚠️ Intenta actualizar `auth.users` (puede requerir permisos)

---

### **PASO 2: Actualizar JWT en Dashboard** 🔑

> **IMPORTANTE:** Este paso es necesario si el script SQL no pudo actualizar `auth.users` automáticamente (por permisos).

#### **2.1 Acceder al Usuario**

1. Ve a **Supabase Dashboard**
2. Click en **Authentication** (en el menú lateral)
3. Click en **Users**
4. Busca: `superadmin.20260216133309@gestionconvivencia.cl`
5. Click en los **3 puntos (•••)** del usuario
6. Selecciona **"Edit user"**

#### **2.2 Editar Raw User Meta Data**

En el formulario de edición, busca la sección **"Raw User Meta Data"**:

**ANTES:**
```json
{
  "nombre": "Super",
  "apellido": "Admin",
  "email_verified": true,
  "establecimiento_id": "d645e547-054f-4ce4-bff7-7a18ca61db50"
}
```

**DESPUÉS (Cambia solo esta línea):**
```json
{
  "nombre": "Super",
  "apellido": "Admin",
  "email_verified": true,
  "establecimiento_id": "00000000-0000-0000-0000-000000000001"
}
```

#### **2.3 Editar Raw App Meta Data**

En la misma pantalla, busca **"Raw App Meta Data"**:

**ANTES:**
```json
{
  "role": "SUPERADMIN",
  "provider": "email",
  "providers": ["email"],
  "establecimiento_id": "d645e547-054f-4ce4-bff7-7a18ca61db50"
}
```

**DESPUÉS (Cambia estas dos líneas):**
```json
{
  "role": "superadmin",
  "provider": "email",
  "providers": ["email"],
  "establecimiento_id": "00000000-0000-0000-0000-000000000001"
}
```

> 💡 **Nota:** También cambié `"role": "SUPERADMIN"` a `"role": "superadmin"` (minúsculas) para que coincida con el enum de la base de datos.

#### **2.4 Guardar Cambios**

1. Revisa que ambos campos estén correctos
2. Click en **"Save"** (abajo a la derecha)
3. Espera confirmación: "User updated successfully"

---

### **PASO 3: Aplicar Cambios en la Aplicación** 🔄

El JWT no se actualiza hasta que el usuario cierre sesión y vuelva a iniciar.

1. **En tu aplicación web:**
   - Click en **Cerrar Sesión / Logout**
   - O borra cookies/localStorage manualmente

2. **Vuelve a iniciar sesión:**
   - Email: `superadmin.20260216133309@gestionconvivencia.cl`
   - Password: (tu contraseña)

3. **Verifica el nuevo JWT:**
   - Abre DevTools (F12)
   - Ve a: Application → Local Storage → Supabase
   - Busca el token y decodifícalo en [jwt.io](https://jwt.io)
   - Verifica que `establecimiento_id` sea: `00000000-0000-0000-0000-000000000001`

---

## ✅ Verificación Final

Después de completar todos los pasos, ejecuta este SQL para verificar:

```sql
-- Verificar perfil en DB
SELECT 
  p.id,
  p.nombre || ' ' || p.apellido as nombre,
  p.rol,
  e.nombre as establecimiento,
  e.id as establecimiento_id,
  CASE 
    WHEN e.id = '00000000-0000-0000-0000-000000000001' 
    THEN '✅ CORRECTO' 
    ELSE '❌ INCORRECTO' 
  END as estado
FROM public.perfiles p
JOIN public.establecimientos e ON p.establecimiento_id = e.id
WHERE p.id = 'f25d35d0-d30c-463c-9321-74568a060349';
```

**Resultado esperado:**
```
nombre: Super Admin
rol: superadmin
establecimiento: SUPERADMIN GLOBAL
establecimiento_id: 00000000-0000-0000-0000-000000000001
estado: ✅ CORRECTO
```

---

## 🎯 Resultado Final

Después de seguir esta guía:

✅ Tabla `perfiles` actualizada con establecimiento correcto  
✅ JWT (`raw_app_meta_data`) con establecimiento correcto  
✅ JWT (`raw_user_meta_data`) con establecimiento correcto  
✅ Rol en minúsculas para coincidir con el enum  
✅ Usuario puede acceder cross-tenant como superadmin  

---

## 🆘 Troubleshooting

### Problema: "No puedo acceder después del login"

**Causa:** El JWT antiguo está en caché.

**Solución:**
1. Abre DevTools (F12)
2. Application → Storage → Clear site data
3. Recarga la página (F5)
4. Inicia sesión nuevamente

### Problema: "El script SQL falló al actualizar auth.users"

**Normal.** No todos los roles tienen permisos para modificar `auth.users`.

**Solución:** Sigue el **PASO 2** manualmente en el Dashboard.

### Problema: "Sigo sin tener acceso multi-tenant"

**Verifica:**
1. ¿El perfil tiene `establecimiento_id` correcto? (Ejecuta SQL de verificación)
2. ¿El JWT tiene el `establecimiento_id` correcto? (Decodifica en jwt.io)
3. ¿Hiciste logout/login después del cambio?
4. ¿La función `is_platform_superadmin()` existe? (Ejecuta: `SELECT public.is_platform_superadmin();`)

---

## 📚 Referencias

- [037_final_corrections_complete.sql](../sql/037_final_corrections_complete.sql) - Correcciones generales
- [038_fix_superadmin_complete.sql](../sql/038_fix_superadmin_complete.sql) - Corrección específica del usuario
- [VERIFICAR_POST_037.sql](../sql/VERIFICAR_POST_037.sql) - Script de verificación
- [AUDITORIA_SUPABASE_COMPLETA_2026-02-18_FINAL.md](./AUDITORIA_SUPABASE_COMPLETA_2026-02-18_FINAL.md) - Auditoría completa

---

**Fecha:** 2026-02-18  
**Autor:** Análisis de Supabase SGCE
