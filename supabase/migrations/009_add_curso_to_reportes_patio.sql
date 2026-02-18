-- Agregar columna curso a reportes_patio para filtrar por curso
ALTER TABLE reportes_patio ADD COLUMN IF NOT EXISTS curso TEXT;

COMMENT ON COLUMN reportes_patio.curso IS 'Curso del estudiante al momento del reporte';
