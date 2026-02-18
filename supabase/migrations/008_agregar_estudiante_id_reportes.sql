-- Migración 008: Agregar foreign key estudiante_id a reportes_patio
-- La tabla estudiantes ya existe con la estructura definida por el usuario

-- 1. Agregar columna estudiante_id (nullable para backwards compatibility)
ALTER TABLE reportes_patio ADD COLUMN IF NOT EXISTS estudiante_id UUID NULL;

-- 2. Crear foreign key
ALTER TABLE reportes_patio 
ADD CONSTRAINT reportes_patio_estudiante_id_fkey 
FOREIGN KEY (estudiante_id) 
REFERENCES estudiantes(id) 
ON DELETE SET NULL;

-- 3. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_reportes_patio_estudiante_id 
ON reportes_patio(estudiante_id);

-- 4. Renombrar columna 'estudiante' a 'estudiante_nombre' para claridad
-- Esto permite mantener backwards compatibility mientras se migra a FK
ALTER TABLE reportes_patio RENAME COLUMN estudiante TO estudiante_nombre;

COMMENT ON COLUMN reportes_patio.estudiante_id IS 'Referencia FK a tabla estudiantes para trazabilidad';
COMMENT ON COLUMN reportes_patio.estudiante_nombre IS 'Campo legacy, usar estudiante_id';
