# Quick Start: Branding Storage v2 Deployment

**⏱️ Tiempo estimado**: 15 minutos  
**📋 Pre-requisitos**: Acceso a Supabase Dashboard + npm  

---

## 🚀 TL;DR

```bash
# 1. Validar build
npm run build

# 2. En Supabase Dashboard > SQL Editor, ejecutar:
#    - supabase/migrations/032_tenant_branding.sql
#    - supabase/migrations/033_setup_branding_storage.sql

# 3. Deploy frontend
npm run deploy

# 4. Test: Upload logo como SUPERADMIN, verificar en storage
```

---

## 📋 Paso a Paso

### Paso 1: Clonar últimos cambios (2 min)

```bash
git pull origin main
npm install  # opcional, si hay cambios en deps
```

### Paso 2: Build local (2 min)

```bash
npm run build
# Esperado: ✅ 0 errors, ⟳ 4.6s
```

### Paso 3: Aplicar migraciones (5 min)

**3.1. Abrir Supabase Dashboard**
```
https://app.supabase.com → Tu Proyecto → SQL Editor
```

**3.2. Ejecutar Migración 032**
```
1. Click en "New Query"
2. Copiar contenido de: supabase/migrations/032_tenant_branding.sql
3. Pegar en editor
4. Click "Run"
5. ✅ Ver: "Query executed successfully"
```

**3.3. Ejecutar Migración 033**
```
1. Click en "New Query"
2. Copiar contenido de: supabase/migrations/033_setup_branding_storage.sql
3. Pegar en editor
4. Click "Run"
5. ✅ Ver: "Query executed successfully"
```

**3.4. Validar (opcional pero recomendado)**
```sql
-- En nueva query, ejecutar:
SELECT COUNT(*) as config_rows FROM configuracion_branding;
SELECT id, name FROM storage.buckets WHERE id = 'branding-assets';
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'branding%';

-- Esperado:
-- | config_rows: 0 (o más si hay datos previos)
-- | id: branding-assets, name: branding-assets
-- | policyname: branding_assets_public_read, branding_assets_superadmin_upload, ...
```

### Paso 4: Deploy frontend (3 min)

```bash
# Opción 1: Dev local
npm run dev
# Ir a http://localhost:5173

# Opción 2: Preview
npm run preview

# Opción 3: Producción
npm run deploy
```

### Paso 5: Testing (3 min)

```
1. Login como SUPERADMIN
2. Ir a Admin > Colegios
3. Click botón 🎨 (Palette)
4. Click "Seleccionar archivo" para Logo
5. Seleccionar imagen PNG/JPEG < 5MB
6. Debería ver preview de imagen
7. Click "Guardar"
8. ✅ Ver mensaje: "Logo subido correctamente"
9. F12 > Console, buscar: "[Upload] Attempting: ..."
10. Verificar en Supabase Storage > branding-assets que el archivo esté
```

---

## ❌ Si algo falla

### Error: "Query executed failed" en Supabase

**Causa**: Migración ya existe o sintaxis incorrecta  
**Solución**:
```sql
-- Verificar qué tablas existen:
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'config%';
-- DROP TABLE configuracion_branding CASCADE;  -- SOLO si necesitas limpiar
```

### Error: "Upload failed" en formulario

**Verificar rol**:
```javascript
// F12 > Console
const { data: { session } } = await supabase.auth.getSession();
console.log('Mi rol:', session?.user?.user_metadata?.role);
// Debería mostrar: "SUPERADMIN"
```

**Verificar bucket**:
```sql
-- En Supabase SQL Editor
SELECT * FROM storage.buckets WHERE id = 'branding-assets';
-- Debería mostrar 1 fila
```

**Verificar policies**:
```sql
SELECT policyname, permissive FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE 'branding%';
-- Debería mostrar 4 filas, todas con permissive = true
```

### Error: "Tipo no permitido" o "Archivo > 5MB"

Seleccionar imagen válida:
- ✅ PNG, JPEG, GIF, WebP, SVG
- ❌ PDF, DOC, WEBM, etc.
- 📏 < 5MB (5,242,880 bytes)

---

## 🎯 Validación Rápida (1 min)

Ejecutar en console (F12) después de login:

```javascript
// 1. Verificar rol
const s = await supabase.auth.getSession();
console.log('✅ Rol:', s.data.session?.user?.user_metadata?.role);

// 2. Verificar acceso a función pública
const config = await supabase.rpc('get_tenant_branding', { 
  p_establecimiento_id: 'uuid-aqui' // Reemplazar con UUID real
});
console.log('✅ Función RPC:', config);

// 3. Verificar CSS variables (después de visitar página con branding)
console.log('✅ CSS vars:', getComputedStyle(document.documentElement).getPropertyValue('--color-primario'));
```

---

## 📚 Documentación Completa

- **BRANDING_V2_EXECUTIVE_SUMMARY.md** → Para entender qué se hizo y por qué
- **BRANDING_STORAGE_FIX_v2.md** → Para detalles técnicos y troubleshooting
- **BRANDING_TESTING_PLAN.md** → Para test cases exhaustivos
- **deploy-branding-v2.sh** → Para automatizar el deployment

---

## ✨ Todos los cambios

```
📝 Modificados:
  supabase/migrations/032_tenant_branding.sql
  supabase/migrations/033_setup_branding_storage.sql
  src/features/admin/BrandingConfigForm.tsx

📄 Nuevos:
  docs/BRANDING_V2_EXECUTIVE_SUMMARY.md
  docs/BRANDING_STORAGE_FIX_v2.md
  docs/BRANDING_TESTING_PLAN.md
  scripts/deploy-branding-v2.sh
  docs/QUICKSTART_BRANDING_V2.md (este archivo)
```

---

## ✅ Después de Desplegar

- [ ] Verificar en Supabase: tabla + bucket + policies existen
- [ ] Probar upload como SUPERADMIN
- [ ] Probar que DIRECTOR NO pueda cambiar
- [ ] Verificar que branding se aplica en UI (CSS variables)
- [ ] Revisar console.log para debugging si hay problemas

---

**🎉 ¡Listo!** Branding storage v2 desplegado y funcionando.

