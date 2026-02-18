-- =============================================================================
-- 033_setup_branding_storage.sql
-- Configuración de storage para archivos de branding (logos, favicons)
-- =============================================================================

-- Crear bucket de storage para branding
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding-assets',
  'branding-assets',
  true,
  5242880, -- 5MB
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- RLS Policies para Storage
-- =============================================================================

-- Política 1: Cualquiera puede leer archivos de branding (público)
DROP POLICY IF EXISTS "branding_assets_public_read" ON storage.objects;
CREATE POLICY "branding_assets_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'branding-assets');

-- Política 2: Solo usuarios autenticados como SUPERADMIN pueden subir
DROP POLICY IF EXISTS "branding_assets_superadmin_upload" ON storage.objects;
CREATE POLICY "branding_assets_superadmin_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND auth.uid() IS NOT NULL
  );

-- Política 3: Solo usuarios autenticados como SUPERADMIN pueden actualizar
DROP POLICY IF EXISTS "branding_assets_superadmin_update" ON storage.objects;
CREATE POLICY "branding_assets_superadmin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'branding-assets'
    AND auth.uid() IS NOT NULL
  );

-- Política 4: Solo usuarios autenticados como SUPERADMIN pueden eliminar
DROP POLICY IF EXISTS "branding_assets_superadmin_delete" ON storage.objects;
CREATE POLICY "branding_assets_superadmin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'branding-assets'
    AND auth.uid() IS NOT NULL
  );

-- =============================================================================
-- DOCUMENTACIÓN: URL pública de archivos de branding
-- =============================================================================

-- Las URLs públicas tendrán el formato:
-- https://<project_id>.supabase.co/storage/v1/object/public/branding-assets/{establecimiento_id}/{tipo}/{archivo}
--
-- Ejemplos:
-- Logo: https://proyecto.supabase.co/storage/v1/object/public/branding-assets/uuid123/logo_url/1708374000000_logo.png
-- Favicon: https://proyecto.supabase.co/storage/v1/object/public/branding-assets/uuid123/favicon_url/1708374000000_favicon.ico

COMMIT;
