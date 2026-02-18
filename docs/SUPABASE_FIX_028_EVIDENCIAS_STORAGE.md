# Fix 028: Políticas RLS para bucket evidencias-publicas

## Problema
Error "Permiso denegado al subir evidencia (RLS)" al intentar subir archivos al bucket `evidencias-publicas`.

El código intenta subir con path: `{tenant_id}/{expediente_id}/{timestamp}-{filename}`
Ejemplo: `d645e547-054f-4ce4-bff7-7a18ca61db50/...`

Las políticas RLS del bucket están bloqueando la operación.

## Solución
Ejecutar las siguientes políticas RLS en Supabase SQL Editor:

```sql
-- =====================================================
-- FIX 028: Políticas RLS para bucket evidencias-publicas
-- Ejecutar en: Supabase SQL Editor
-- =====================================================

-- 1. Eliminar políticas existentes problemáticas del bucket evidencias-publicas
DROP POLICY IF EXISTS "Permitir acceso público a evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- 2. Crear política para permitir uploads autenticados
-- Permite a cualquier usuario autenticado subir archivos
CREATE POLICY "Allow authenticated uploads evidencias"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias-publicas'
);

-- 3. Crear política para permitir descargas a usuarios autenticados
CREATE POLICY "Allow authenticated read evidencias"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencias-publicas'
);

-- 4. Crear política para permitir actualizaciones a usuarios autenticados
CREATE POLICY "Allow authenticated update evidencias"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidencias-publicas'
);

-- 5. Crear política para permitir eliminaciones a usuarios autenticados
CREATE POLICY "Allow authenticated delete evidencias"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencias-publicas'
);

-- 6. Habilitar RLS en la tabla storage.objects si no está habilitada
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 7. Verificar que el bucket existe
-- (Esto es solo para información, no ejecuta nada)
-- SELECT id, name, public FROM storage.buckets WHERE name = 'evidencias-publicas';
```

## Verificación
Después de ejecutar el SQL:

1. Intentar subir una evidencia desde la UI
2. Verificar en Storage que el archivo aparece en la ruta correcta
3. Verificar que no hay errores en la consola del navegador

## Notas
- Estas políticas permiten acceso a cualquier usuario autenticado
- El código del frontend ya valida que el usuario solo pueda subir a su tenant
- Si se necesita mayor restricción, las políticas pueden refinarse para verificar el prefijo del tenant
