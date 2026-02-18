## Testing de RLS - Configuración de Branding por Tenant

### Resumen
Este documento proporciona instrucciones para verificar que la tabla `configuracion_branding` 
implementa correctamente Row Level Security (RLS) y que **solo superadmin puede leer/escribir** 
configuraciones de branding.

---

## Políticas de RLS Implementadas

1. **superadmin_read_all_branding** - SELECT: Solo superadmin
2. **superadmin_insert_branding** - INSERT: Solo superadmin
3. **superadmin_update_branding** - UPDATE: Solo superadmin
4. **superadmin_delete_branding** - DELETE: Solo superadmin

---

## Tests Manuales en Supabase SQL Editor

### Pre-requisitos
- Tener un proyecto Supabase activo
- Aplicar las migraciones 032_tenant_branding.sql y 033_setup_branding_storage.sql
- Crear usuarios de test con diferentes roles

### Test 1: Superadmin PUEDE insertar branding

```sql
-- Ejecutar como superadmin (verificar que el JWT tenga 'role': 'superadmin')
INSERT INTO public.configuracion_branding (
  establecimiento_id, 
  nombre_publico, 
  color_primario
)
VALUES (
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', -- UUID de test
  'Colegio Test',
  '#FF0000'
);

-- Resultado esperado: Inserción exitosa ✓
```

### Test 2: No-superadmin NO puede insertar branding

```sql
-- Ejecutar como usuario NO-superadmin (role: 'director', 'editor', etc)
INSERT INTO public.configuracion_branding (
  establecimiento_id, 
  nombre_publico
)
VALUES (
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
  'Intento de inserción'
);

-- Resultado esperado: ERROR - violates row-level security policy ✗
```

### Test 3: Superadmin PUEDE leer branding

```sql
-- Ejecutar como superadmin
SELECT * FROM public.configuracion_branding LIMIT 1;

-- Resultado esperado: Retorna registros ✓
```

### Test 4: No-superadmin NO puede leer branding

```sql
-- Ejecutar como usuario NO-superadmin
SELECT * FROM public.configuracion_branding;

-- Resultado esperado: Retorna 0 registros / ERROR ✗
```

### Test 5: Superadmin PUEDE actualizar branding

```sql
-- Obtener un ID válido primero (como superadmin)
WITH existing AS (
  SELECT id FROM public.configuracion_branding LIMIT 1
)
UPDATE public.configuracion_branding 
SET color_primario = '#0000FF'
FROM existing
WHERE public.configuracion_branding.id = existing.id;

-- Resultado esperado: UPDATE 1 ✓
```

### Test 6: Superadmin PUEDE eliminar branding

```sql
-- Obtener un ID válido primero
WITH toDelete AS (
  SELECT id FROM public.configuracion_branding LIMIT 1
)
DELETE FROM public.configuracion_branding
USING toDelete
WHERE public.configuracion_branding.id = toDelete.id;

-- Resultado esperado: DELETE 1 ✓
```

---

## Tests en Aplicación Frontend

### Test 7: Hook useTenantBranding() carga datos correctamente

```typescript
// En un componente React
import { useTenantBranding } from '@/shared/hooks';

export function TestBrandingHook() {
  const { branding, isLoading, error } = useTenantBranding();

  return (
    <div>
      {isLoading && <p>Cargando branding...</p>}
      {error && <p>Error: {error}</p>}
      {branding && (
        <div>
          <h2>{branding.nombre_publico}</h2>
          <p>Color primario: {branding.color_primario}</p>
          {branding.logo_url && <img src={branding.logo_url} alt="Logo" />}
        </div>
      )}
    </div>
  );
}

// Resultado esperado:
// - Si branding existe, mostra datos de personalización ✓
// - Si no existe, muestra valores por defecto ✓
```

### Test 8: ThemeProvider aplica colores dinámicamente

```typescript
// En cualquier componente dentro de ThemeProvider
export function TestThemeApplication() {
  useEffect(() => {
    const root = document.documentElement;
    const colorPrimario = getComputedStyle(root).getPropertyValue('--color-primario');
    const titulo = document.title;
    
    console.log('Color primario:', colorPrimario);
    console.log('Título del documento:', titulo);
  }, []);

  return <div className="bg-[color:var(--color-primario)]">Test</div>;
}

// Resultado esperado:
// - CSS variables inyectadas correctamente ✓
// - Documento título actualizado ✓
// - Favicon inyectado si existe ✓
```

### Test 9: BrandingConfigForm permite editar

```typescript
// En AdminColegios.tsx, abrir modal de branding
// 1. Hacer clic en botón "Palette" de un colegio
// 2. Cambiar nombre público
// 3. Cambiar colores usando color picker
// 4. Guardar

// Resultado esperado:
// - Formulario muestra branding actual ✓
// - Cambios se guardan en BD ✓
// - Validación: nombre_publico es requerido ✓
// - Actualización es solo para superadmin ✓
```

### Test 10: Upload de archivos funciona

```typescript
// En BrandingConfigForm
// 1. Hacer clic en "Subir logo"
// 2. Seleccionar imagen (PNG, JPEG, etc)
// 3. Logo aparece en preview

// Resultado esperado:
// - Archivo se sube a storage/branding-assets ✓
// - URL pública se asigna a logo_url ✓
// - Preview muestra imagen correctamente ✓
```

---

## Tests de Storage/RLS

### Test 11: Solo superadmin puede subir archivos

```bash
# Usar REST API de Supabase o cliente TypeScript
# Intentar subir como superadmin
curl -X POST 'https://your-project.supabase.co/storage/v1/object/branding-assets/test/logo.png' \
  -H 'Authorization: Bearer YOUR_SUPERADMIN_TOKEN' \
  -H 'Content-Type: image/png' \
  --data-binary "@path/to/logo.png"

# Resultado esperado: 200 OK ✓

# Intentar como no-superadmin
curl -X POST 'https://your-project.supabase.co/storage/v1/object/branding-assets/test/logo.png' \
  -H 'Authorization: Bearer YOUR_USER_TOKEN' \
  -H 'Content-Type: image/png' \
  --data-binary "@path/to/logo.png"

# Resultado esperado: 403 Forbidden ✗
```

### Test 12: Cualquiera puede leer archivos de branding

```bash
# URL pública están disponibles sin autenticación
curl 'https://your-project.supabase.co/storage/v1/object/public/branding-assets/uuid/logo_url/123456_logo.png'

# Resultado esperado: 200 OK, imagen descargada ✓
```

---

## Checklist de Validación Completa

- [ ] Migración 032_tenant_branding.sql aplicada
- [ ] Migración 033_setup_branding_storage.sql aplicada
- [ ] Tabla `configuracion_branding` existe
- [ ] RLS está habilitado en la tabla
- [ ] 4 políticas RLS están en lugar
- [ ] Bucket 'branding-assets' existe
- [ ] 4 políticas de storage existen
- [ ] Hook `useTenantBranding` funciona
- [ ] Hook `useApplyBrandingStyles` inyecta variables CSS
- [ ] ThemeProvider aplica branding dinámicamente
- [ ] BrandingConfigForm renderiza correctamente en AdminColegios
- [ ] Upload de logos funciona
- [ ] Solo superadmin puede crear/actualizar branding (probado en BD)
- [ ] Solo superadmin puede subir archivos (probado en storage)
- [ ] URL públicas de logos funcionar correctamente

---

## Troubleshooting

### Problema: "violates row-level security policy for table"
**Solución**: Verificar que:
- El usuario tiene `role: 'superadmin'` en JWT
- Las políticas de RLS están habilitadas (`ALTER TABLE ... ENABLE RLS`)
- El JWT tiene más de 1 día de antigüedad (token expirado)

### Problema: RLS no deja leer branding (no-superadmin)
**Solución esperada**: Es correcto. Por diseño, solo superadmin puede leer.

### Problema: Upload de archivos falla
**Solución**: Verificar:
- Bucket 'branding-assets' existe
- Politicas de storage están aplicadas
- MIME type del archivo está en allowed_mime_types
- Tamaño < 5MB

### Problema: CSS variables no se aplican
**Solución**: 
- Verificar que `useApplyBrandingStyles()` se llama en ThemeProvider
- Revisar console.log en navegador
- Limpiar cache del navegador (F12 > Storage > Clear All)

---

## Comando para verificar RLS status

```sql
-- Verificar que RLS esté habilitado
SELECT * FROM information_schema.tables 
WHERE table_name = 'configuracion_branding' AND table_schema = 'public';

-- Resultado esperado: relrowsecurity = true

-- Listar todas las políticas
SELECT * FROM pg_policies 
WHERE tablename = 'configuracion_branding';

-- Resultado esperado: 4 políticas listadas
```

---

## Notas de Seguridad

✓ **Implementado**:
- RLS obligatorio en tabla sensible
- Solo superadmin puede escribir
- Storage público pero controlado
- ForeignKey a establecimientos con CASCADE

⚠️ **Considerar**:
- Rate limiting en uploads si necesario
- Virus scanning para archivos
- Backup de configuración por colegio
- Audit logs de cambios de branding

