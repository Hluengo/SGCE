# Plan de Testing: Branding Storage Upload

## 📋 Checklist Técnico

### Fase 1: Verificación de Migraciones  
- [ ] Ejecutar migration 032 (`configuracion_branding` table)
- [ ] Ejecutar migration 033 (storage policies - v2 simplificada)
- [ ] Verificar en Supabase: tabla `configuracion_branding` existe
- [ ] Verificar en Supabase Storage: bucket `branding-assets` existe
- [ ] Verificar RLS policies: 4 policies visibles en storage settings

**Comando para verificar**:
```sql
-- En Supabase SQL Editor
SELECT 
  policyname,
  USING,
  WITH_CHECK
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY policyname;

-- Debería mostrar 4 filas con 'branding_assets_*'
```

---

### Fase 2: Testing de Frontend

#### Escenario A: Usuario SUPERADMIN ✓

**Setup**:
- Usuario logged in con rol = 'SUPERADMIN'
- Navegación: Admin > Colegios
- Seleccionar un colegio

**Test Case 1: Upload de Logo**
```
1. Click en botón 🎨 (Palette) 
2. Se abre modal BrandingConfigForm
3. Click en "Seleccionar archivo" (campo Logo)
4. Seleccionar PNG/JPEG < 5MB
5. Verificar: Vista previa de imagen
6. Click en "Guardar"

Esperado:
✅ Logo uploaded successfully
✅ Archivo visible en Supabase Storage: 
   branding-assets/{establecimiento_id}/logo_url/{timestamp}_{nombre}.png
✅ URL pública generada
✅ Icono de éxito en formulario
```

**Test Case 2: Upload de Favicon**
```
Igual que Test Case 1 pero con campo Favicon (ICO/SVG)

Esperado:
✅ Favicon uploaded successfully
✅ Favicon aparece en pestaña del navegador
```

**Test Case 3: Cambio de Colores**
```
1. En modal BrandingConfigForm
2. Cambiar Color Primario (selector color picker)
3. Cambiar Tipografía Heading
4. Click "Guardar"

Esperado:
✅ Se guarda en BD (tabla configuracion_branding)
✅ Al recargar página: CSS variables aplicadas
```

**Console Logs esperados**:
```
[Upload] Attempting: {uuid}/logo_url/1708123456_logo.png, 
isSuperadmin: true, role: SUPERADMIN

[Success] Logo subido correctamente
```

---

#### Escenario B: Usuario NO SUPERADMIN ✗

**Setup**:
- Usuario logged in con rol = 'DIRECTOR' (o similar)
- Navegación: Admin > Colegios

**Test Case 4: Intento de Upload (Denegado)**
```
1. Click en botón 🎨 (Palette)
2. Se abre modal
3. Intentar click en "Seleccionar archivo"

Esperado:
❌ Botón deshabilitado (opacidad-50)
❌ Banner rojo: "Solo administradores pueden subir. Rol: DIRECTOR"
❌ Campo de input disabled
❌ Botón "Guardar" deshabilitado con ícono de lock
```

**Console Logs esperados**:
```
[Error] logo_url: Solo administradores pueden subir. Rol: DIRECTOR
```

---

#### Escenario C: Validaciones de Archivo

**Test Case 5: Archivo tipo NO permitido**
```
1. Seleccionar archivo PDF o DOC
2. Click "Guardar"

Esperado:
❌ Error: "Tipo no permitido: application/pdf"
```

**Test Case 6: Archivo muy grande**
```
1. Seleccionar imagen > 5MB (19MB JPEG)
2. Click "Guardar"

Esperado:
❌ Error: "Archivo > 5MB"
```

**Test Case 7: Archivo vacío**
```
1. Crear archivo PNG 0 bytes
2. Click "Guardar"

Esperado:
Depende de validación (null check)
Debería rechazar o no hacer nada (sin consumir créditos storage)
```

---

### Fase 3: Testing de Database RLS

#### Test Case 8: Verificar RLS (UPDATE solo SUPERADMIN)

**Setup SQL**:
```sql
-- Como SUPERADMIN
UPDATE configuracion_branding 
SET color_primario = '#FF0000'
WHERE establecimiento_id = 'uuid-del-colegio';
-- ✅ Debería funcionar

-- Como DIRECTOR
UPDATE configuracion_branding 
SET color_primario = '#00FF00'
WHERE establecimiento_id = 'uuid-del-colegio';
-- ❌ "Violates row-level security policy"
```

---

#### Test Case 9: Verificar RLS (SELECT público vía RPC)

```sql
-- Sin autenticación
SELECT get_tenant_branding('uuid-del-colegio'::UUID);
-- ✅ Debería retornar config pública (logo_url, colores, etc)

-- Debería retornar JSON:
{
  "id": "...",
  "establecimiento_id": "...",
  "logo_url": "https://...",
  "favicon_url": "https://...",
  "color_primario": "#...",
  ...
}
```

---

### Fase 4: Testing de Aplicación de Themes

#### Test Case 10: CSS Variables Inyectadas

```javascript
// En console (F12) después de cargar página:
getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primario')
// Debería retornar: " #1e40af" (con espacios)

getComputedStyle(document.documentElement)
  .getPropertyValue('--tipografia-body')
// Debería retornar: " 'Inter', sans-serif"
```

#### Test Case 11: Favicon Dinámico

```
1. Subir favicon.ico en branding
2. Recargar página
3. Verificar pestaña del navegador

Esperado:
✅ Favicon nuevo visible en pestaña (puede tomar caché de 24h)
```

#### Test Case 12: Documento Title

```javascript
// En console:
document.title
// Si se configuró nombre_publico:
// Debería mostrar: "Colegio XYZ - Mi Institución"
```

---

## 🐛 Debugging Steps

### Si falla Test Case 1 (Upload)

**Paso 1: Verificar JWT**
```javascript
// F12 > Console
const { data: { session } } = await supabase.auth.getSession();
console.log('Role en JWT:', session?.user?.user_metadata?.role);
// Debería mostrar: "SUPERADMIN"
```

**Paso 2: Verificar Storage Permissions**
```sql
-- En Supabase SQL Editor
SELECT 
  policyname,
  permissive,
  qual AS using_clause,
  req AS with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;
```

**Paso 3: Revisar Supabase Storage Logs**
- Dashboard > Storage > branding-assets
- Revisar sección "Activity" para RLS errors

### Si falla Test Case 10 (CSS Variables)

**Paso 1: Verificar que hook `useApplyBrandingStyles` ejecute**
```typescript
// En BrandingConfigForm.tsx, agregar log:
useEffect(() => {
  console.log('[useApplyBrandingStyles] Ejecutando', { branding });
  // ...
}, [branding, tenantId]);
```

**Paso 2: Revisar document.documentElement**
```javascript
// F12 > Console
document.documentElement.style.cssText
// Debería contener: --color-primario: #..., --color-secundario: #..., etc
```

---

## 📊 Matriz de Resultados Esperados

| Test Case | Usuario | Acción | Esperado | Resultado |
|-----------|---------|--------|----------|-----------|
| 1 | SUPERADMIN | Upload logo | ✅ Success | [ ] Pass / [ ] Fail |
| 2 | SUPERADMIN | Upload favicon | ✅ Success | [ ] Pass / [ ] Fail |
| 3 | SUPERADMIN | Cambiar colores | ✅ Guardado | [ ] Pass / [ ] Fail |
| 4 | DIRECTOR | Intento upload | ❌ Denegado | [ ] Pass / [ ] Fail |
| 5 | SUPERADMIN | Archivo PDF | ❌ Rechazado | [ ] Pass / [ ] Fail |
| 6 | SUPERADMIN | Archivo >5MB | ❌ Rechazado | [ ] Pass / [ ] Fail |
| 8 | SUPERADMIN | RLS UPDATE | ✅ Success | [ ] Pass / [ ] Fail |
| 8 | DIRECTOR | RLS UPDATE | ❌ Policy violation | [ ] Pass / [ ] Fail |
| 9 | Anónimo | RLS SELECT via RPC | ✅ Datos públicos | [ ] Pass / [ ] Fail |
| 10 | N/A | CSS variables | ✅ Variables inyectadas | [ ] Pass / [ ] Fail |
| 11 | N/A | Favicon dinámico | ✅ Favicon en pestaña | [ ] Pass / [ ] Fail |

---

## 🎯 Criterios de Éxito

✅ **PASS**: 
- Tests 1-3: Uploads funcionan para SUPERADMIN
- Tests 4-6: Validaciones funcionan
- Test 8: RLS funciona en BD
- Test 9: RPC retorna datos (public read)
- Tests 10-12: Branding aplicado en UI

❌ **FAIL**: 
- Cualquier test de SUPERADMIN falla
- RLS no protege descargas no-autorizadas
- CSS variables no se inyectan

---

## 📱 Plataformas a Testear

- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (si disponible)
- [ ] Mobile (iOS Safari / Chrome)

---

## ✅ Rollout Checklist

- [ ] Todos los tests Fase 1-4 pasan
- [ ] Logs de console limpios (sin errores)
- [ ] Supabase Storage dashboard muestra archivos
- [ ] Base de datos tiene registros en `configuracion_branding`
- [ ] Documentación actualizada (BRANDING_STORAGE_FIX_v2.md)
- [ ] Ready para producción

