# Guía de Despliegue: Personalización de Marca por Tenant

**Fecha**: 18 de Febrero de 2026  
**Estado**: Listo para desplegar ✅

---

## Pre-requisitos

- [ ] Acceso a Supabase project
- [ ] Credenciales de superadmin
- [ ] Base de datos actualizada hasta migración 031
- [ ] Node.js 18+ y npm instalado localmente

---

## Paso 1: Aplicar Migraciones en Supabase

### Opción A: Vía Supabase CLI (Recomendado)

```bash
cd c:\gestionconvivencia-main

# Aplicar todas las pendientes
supabase migration list

# Debería mostrar como pendientes:
# - 032_tenant_branding.sql
# - 033_setup_branding_storage.sql

# Push las migraciones
supabase db push
```

### Opción B: Manualmente en SQL Editor

1. Ir a **Supabase Dashboard > SQL Editor**
2. Crear nueva query
3. Copiar contenido de `supabase/migrations/032_tenant_branding.sql`
4. Ejecutar (✓ debe completar sin errores)
5. Repetir con `supabase/migrations/033_setup_branding_storage.sql`

### Comando de verificación

```sql
-- Verificar tabla creada
SELECT * FROM information_schema.tables 
WHERE table_name = 'configuracion_branding';

-- Resultado esperado: 1 fila (existe la tabla)

-- Verificar bucket creado
SELECT * FROM storage.buckets 
WHERE name = 'branding-assets';

-- Resultado esperado: 1 fila (existe el bucket)
```

---

## Paso 2: Verificar RLS

```sql
-- Verificar RLS habilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'configuracion_branding';

-- Resultado esperado: rowsecurity = true

-- Listar políticas
SELECT * FROM pg_policies 
WHERE tablename = 'configuracion_branding';

-- Resultado esperado: 4 filas (4 políticas)
```

---

## Paso 3: Desplegar Frontend

### Compilación local

```bash
cd c:\gestionconvivencia-main

# Instalar dependencias (si aún no están)
npm install

# Build de producción
npm run build

# Validar output
# Resultado esperado: "vite built in X.XXs" sin errores
```

### Desplegar a hosting (según tu setup)

```bash
# Ejemplo con Vercel
vercel deploy --prod

# Ejemplo con Supabase Hosting
supabase projects publish

# O tu método de despliegue actual...
```

---

## Paso 4: Testing Post-Despliegue

### Test 1: Verificar table + RLC en BD

```sql
-- Como superadmin, intentar insertar
INSERT INTO configuracion_branding (
  establecimiento_id,
  nombre_publico,
  color_primario
)
SELECT 
  id,
  'Colegio Test',
  '#FF0000'
FROM establecimientos 
LIMIT 1;

-- Esperado: INSERT 1 ✓
```

### Test 2: Verificar Storage

```bash
# Verificar acceso público (sin autenticación)
curl -I https://your-project.supabase.co/storage/v1/object/public/branding-assets

# Esperado: 404 (bucket existe pero vacío) ✓
```

### Test 3: Probar UI en navegador

1. Ir a `https://tu-dominio.com/admin/colegios`
2. Buscar botón "🎨" (Palette) en card de colegio
3. Hacer clic para abrir BrandingConfigForm
4. Llenar formulario:
   - Nombre público: "Colegio Test 2026"
   - Buscar archivos para logo/favicon (opcional)
   - Cambiar colores
5. Guardar
6. Verificar en consola del navegador (F12):
   - No hay errores
   - CSS variables inyectadas

---

## Paso 5: Validación de Seguridad RLS

### TEST: No-superadmin no puede leer

```bash
# Conectar como usuario director (no-superadmin)
# Intentar:

SELECT * FROM configuracion_branding;

# Esperado: 0 filas / ERROR (violates row-level security) ✓
```

### TEST: No-superadmin no puede actualizar storage

```bash
# Como no-superadmin, intentar subir archivo
curl -X POST \
  'https://your-project.supabase.co/storage/v1/object/branding-assets/test/logo.png' \
  -H "Authorization: Bearer TOKEN_DIRECTOR" \
  -H "Content-Type: image/png" \
  --data-binary "@logo.png"

# Esperado: 403 Forbidden ✓
```

---

## Paso 6: Seed Data (Opcional)

Crear configuración de branding para colegios existentes:

```sql
-- Para cada establecimiento, crear entrada default
INSERT INTO configuracion_branding (
  establecimiento_id,
  nombre_publico,
  color_primario,
  color_secundario,
  color_acento,
  color_texto,
  color_fondo,
  tipografia_body,
  tipografia_heading
)
SELECT 
  id,
  nombre,
  '#2563eb',
  '#1e40af',
  '#059669',
  '#1f2937',
  '#ffffff',
  'Inter',
  'Poppins'
FROM establecimientos
WHERE id NOT IN (SELECT establecimiento_id FROM configuracion_branding)
ON CONFLICT (establecimiento_id) DO NOTHING;

-- Verificar
SELECT COUNT(*) FROM configuracion_branding;
-- Resultado esperado: N colegios
```

---

## Paso 7: Monitoreo Post-Deploy

### Logs a revisar

```bash
# Errores en API (Supabase)
# Dashboard > Logs > API requests
# Filtrar por tabla: configuracion_branding

# Errores en Frontend (Sentry o similar)
# Buscar: "useTenantBranding", "BrandingConfigForm"

# Storage upload errors
# Dashboard > Logs > Storage
# Bucket: branding-assets
```

### Performance Check

```sql
-- Ver tabla size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE tablename = 'configuracion_branding';

-- Ver índices
SELECT * FROM pg_indexes 
WHERE tablename = 'configuracion_branding';
```

---

## Checklist de Go-Live

### Pre-Deploy
- [ ] Migraciones 032 y 033 generadas
- [ ] Build local sin errores (`npm run build`)
- [ ] Todos los tipos TypeScript correctos
- [ ] Tests de RLS documentados en BRANDING_RLS_TESTING.md

### Deploy
- [ ] Migraciones aplicadas a Supabase
- [ ] RLS verificado (4 políticas tabla + 4 storage)
- [ ] Frontend desplegado
- [ ] Bucket de storage creado

### Post-Deploy
- [ ] Test 1: Insert branding como superadmin ✓
- [ ] Test 2: SELECT branding como no-superadmin ✗ (esperado)
- [ ] Test 3: Upload archivo como no-superadmin ✗ (esperado)
- [ ] Test 4: UI funciona (abrir modal de branding)
- [ ] Test 5: Guardar branding persiste en BD
- [ ] Test 6: CSS variables inyectadas en browser
- [ ] Test 7: Título del doc actualizado
- [ ] Test 8: Favicon inyectado (si existe)

### Monitoring (Primeras 24h)
- [ ] Logs sin errores
- [ ] Storage uploads exitosos
- [ ] Usuarios pueden abrir AdminColegios
- [ ] Superadmin puede guardar branding
- [ ] Performance normal

---

## Rollback (Si necesario)

```bash
# Revertir migraciones
supabase migration repair 031

# O manualmente en SQL:
DROP TABLE IF EXISTS public.configuracion_branding;
DROP FUNCTION IF EXISTS public.get_tenant_branding(UUID);
DROP BUCKET IF EXISTS branding-assets;
```

---

## Troubleshooting

### Error: "violates row-level security"
**Causa**: Usuario no es superadmin  
**Solución**: Verificar JWT tiene `role: 'superadmin'`

### Error: "Bucket not found"
**Causa**: Storage bucket no existe  
**Solución**: Ejecutar migración 033 nuevamente

### Error: "FK constraint failed" al insertar
**Causa**: establecimiento_id no existe  
**Solución**: Verificar que colegio/establecimiento existe en tabla

### Upload falsa: "CORS error"
**Causa**: Politicas de CORS de storage  
**Solución**: Revisar `supabase/migrations/033_setup_branding_storage.sql` - políticas

### UI Modal no abre
**Causa**: Componente BrandingConfigForm no se renderiza  
**Solución**: 
- Verificar AdminColegios.tsx importa BrandingConfigForm
- Revisar console (F12) por errores de TypeScript
- Limpiar cache del navegador (Ctrl+Shift+Del)

---

## Support / Escalations

### Para errores de Base de Datos
- Revisar `docs/BRANDING_RLS_TESTING.md`
- Ejecutar tests SQL manualmente
- Contactar al DBA

### Para errores de Frontend
- Revisar console del navegador (F12)
- Revisar `src/shared/hooks/useTenantBranding.ts`
- Limpiar cache y localStorage

### Para errores de Storage
- Verificar archivos suben correctamente
- Revisar URLs públicas son accesibles
- Comprobar MIME types permitidos (PNG, JPEG, etc)

---

## Documentación Relacionada

- **Implementación**: `docs/BRANDING_IMPLEMENTATION_SUMMARY.md`
- **Testing**: `docs/BRANDING_RLS_TESTING.md`
- **Código**: 
  - BB: `supabase/migrations/032_tenant_branding.sql`
  - Storage: `supabase/migrations/033_setup_branding_storage.sql`
  - Frontend: `src/features/admin/BrandingConfigForm.tsx`
  - Hooks: `src/shared/hooks/useTenantBranding.ts`

---

## Próximo Sprint (Recomendaciones)

1. Rate limiting en uploads
2. Virus scanning para archivos
3. Audit logs de cambios de branding
4. Plantillas presets de color
5. Validación de contraste WCAG
6. Sincronización realtime con Supabase Realtime

---

**✅ Estimado de tiempo total: 30-45 minutos**

¿Necesitas ayuda en algún paso? Revisar logs con `supabase functions logs` 

