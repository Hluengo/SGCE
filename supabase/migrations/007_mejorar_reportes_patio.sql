-- Migración 007: Agregar columnas faltantes a reportes_patio
-- Tabla existente: reportes_patio con columnas básicas

-- 1. Agregar columnas faltantes (solo si no existen)
ALTER TABLE reportes_patio ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'PENDIENTE';
ALTER TABLE reportes_patio ADD COLUMN IF NOT EXISTS accion_tomada TEXT;
ALTER TABLE reportes_patio ADD COLUMN IF NOT EXISTS expediente_id UUID REFERENCES expedientes(id) ON DELETE SET NULL;
ALTER TABLE reportes_patio ADD COLUMN IF NOT EXISTS usuario_responsable UUID REFERENCES auth.users(id);
ALTER TABLE reportes_patio ADD COLUMN IF NOT EXISTS fecha_accion TIMESTAMPTZ;

-- 2. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_reportes_patio_estado ON reportes_patio(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_patio_expediente ON reportes_patio(expediente_id);
CREATE INDEX IF NOT EXISTS idx_reportes_patio_fecha ON reportes_patio(created_at DESC);

-- 3. Crear función para actualizar estado
CREATE OR REPLACE FUNCTION actualizar_estado_reporte(
  reporte_id UUID,
  nuevo_estado TEXT,
  accion TEXT,
  user_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE reportes_patio
  SET 
    estado = nuevo_estado,
    accion_tomada = accion,
    usuario_responsable = user_id,
    fecha_accion = NOW()
  WHERE id = reporte_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Actualizar políticas RLS
ALTER TABLE reportes_patio ENABLE ROW LEVEL SECURITY;

-- 5. Crear política para que authenticated pueda actualizar estados
DROP POLICY IF EXISTS patio_update_estado ON reportes_patio;
CREATE POLICY patio_update_estado ON reportes_patio
  FOR UPDATE USING (auth.role() = 'authenticated');

COMMENT ON COLUMN reportes_patio.estado IS 'Estado del reporte: PENDIENTE, EN_REVISION, DERIVADO, CERRADO';
COMMENT ON COLUMN reportes_patio.accion_tomada IS 'Acción tomada por el encargado de convivencia';
COMMENT ON COLUMN reportes_patio.expediente_id IS 'Vinculación a expediente si se deriva';
COMMENT ON COLUMN reportes_patio.usuario_responsable IS 'Usuario que tomó la acción';
COMMENT ON COLUMN reportes_patio.fecha_accion IS 'Fecha y hora de la acción';
