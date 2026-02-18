-- =============================================================================
-- 032_tenant_branding.sql
-- Creación de tabla configuracion_branding con RLS por tenant_id
-- Almacenaremos logo, favicon, colores y tema por establecimiento/colegio
-- =============================================================================

-- Crear tabla de configuración de branding por tenant (establecimiento)
CREATE TABLE IF NOT EXISTS public.configuracion_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES public.establecimientos(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  color_primario TEXT DEFAULT '#2563eb',
  color_secundario TEXT DEFAULT '#1e40af',
  color_acento TEXT DEFAULT '#059669',
  color_texto TEXT DEFAULT '#1f2937',
  color_fondo TEXT DEFAULT '#ffffff',
  nombre_publico TEXT NOT NULL,
  tipografia_body VARCHAR(50) DEFAULT 'Inter',
  tipografia_heading VARCHAR(50) DEFAULT 'Poppins',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_establecimiento_branding UNIQUE(establecimiento_id)
);

-- Índice para búsquedas rápidas por establecimiento
CREATE INDEX IF NOT EXISTS idx_configuracion_branding_establecimiento_id 
  ON public.configuracion_branding(establecimiento_id);

-- Habilitar RLS en la tabla
ALTER TABLE public.configuracion_branding ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES: Solo superadmin puede leer/escribir branding
-- =============================================================================

-- Política 1: Superadmin puede leer todas las configuraciones de branding
DROP POLICY IF EXISTS "superadmin_read_all_branding" ON public.configuracion_branding;
CREATE POLICY "superadmin_read_all_branding"
  ON public.configuracion_branding
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt() ->> 'role' = 'SUPERADMIN'
      OR auth.jwt() ->> 'email' = 'superadmin@gestionconvivencia.cl'
      OR EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid()
        AND rol::text ILIKE '%superadmin%'
      )
    )
  );

-- Política 2: Superadmin puede insertar configuraciones de branding
DROP POLICY IF EXISTS "superadmin_insert_branding" ON public.configuracion_branding;
CREATE POLICY "superadmin_insert_branding"
  ON public.configuracion_branding
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt() ->> 'role' = 'SUPERADMIN'
      OR auth.jwt() ->> 'email' = 'superadmin@gestionconvivencia.cl'
      OR EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid()
        AND rol::text ILIKE '%superadmin%'
      )
    )
  );

-- Política 3: Superadmin puede actualizar configuraciones de branding
DROP POLICY IF EXISTS "superadmin_update_branding" ON public.configuracion_branding;
CREATE POLICY "superadmin_update_branding"
  ON public.configuracion_branding
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt() ->> 'role' = 'SUPERADMIN'
      OR auth.jwt() ->> 'email' = 'superadmin@gestionconvivencia.cl'
      OR EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid()
        AND rol::text ILIKE '%superadmin%'
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt() ->> 'role' = 'SUPERADMIN'
      OR auth.jwt() ->> 'email' = 'superadmin@gestionconviencia.cl'
      OR EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid()
        AND rol::text ILIKE '%superadmin%'
      )
    )
  );

-- Política 4: Superadmin puede eliminar configuraciones de branding
DROP POLICY IF EXISTS "superadmin_delete_branding" ON public.configuracion_branding;
CREATE POLICY "superadmin_delete_branding"
  ON public.configuracion_branding
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt() ->> 'role' = 'SUPERADMIN'
      OR auth.jwt() ->> 'email' = 'superadmin@gestionconvivencia.cl'
      OR EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid()
        AND rol::text ILIKE '%superadmin%'
      )
    )
  );

-- =============================================================================
-- FUNCIÓN: RPC para obtener branding por establecimiento (lectura pública)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_tenant_branding(p_establecimiento_id UUID)
RETURNS TABLE (
  id UUID,
  establecimiento_id UUID,
  logo_url TEXT,
  favicon_url TEXT,
  color_primario TEXT,
  color_secundario TEXT,
  color_acento TEXT,
  color_texto TEXT,
  color_fondo TEXT,
  nombre_publico TEXT,
  tipografia_body VARCHAR,
  tipografia_heading VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cb.id,
    cb.establecimiento_id,
    cb.logo_url,
    cb.favicon_url,
    cb.color_primario,
    cb.color_secundario,
    cb.color_acento,
    cb.color_texto,
    cb.color_fondo,
    cb.nombre_publico,
    cb.tipografia_body,
    cb.tipografia_heading
  FROM public.configuracion_branding cb
  WHERE cb.establecimiento_id = p_establecimiento_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- GRANT en función pública (usuarios autenticados pueden leer branding de su tenant)
GRANT EXECUTE ON FUNCTION public.get_tenant_branding(UUID) TO authenticated;

-- =============================================================================
-- TESTS DE RLS: Verificar que solo superadmin puede escribir
-- =============================================================================

-- Nota: Estos tests deben ejecutarse manualmente con diferentes usuarios:
-- 
-- TEST 1 - Superadmin puede insertar:
-- SET LOCAL ROLE superadmin;
-- SET LOCAL request.jwt.claim.role = 'superadmin';
-- INSERT INTO configuracion_branding (establecimiento_id, nombre_publico, color_primario)
-- VALUES ('ABC123', 'Colegio Test', '#FF0000');
-- 
-- TEST 2 - Un usuario no-superadmin no puede insertar:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.role = 'director';
-- INSERT INTO configuracion_branding (establecimiento_id, nombre_publico)
-- VALUES ('ABC123', 'Colegio Test');
-- -- Debe fallar con: new row violates row-level security policy
-- 
-- TEST 3 - RPC get_tenant_branding funciona sin requerimientos de roles especiales:
-- SELECT * FROM get_tenant_branding('ABC123');

COMMIT;
