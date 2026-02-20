-- =============================================================================
-- CORRECCIÓN: Errores en migrations 042, 043, 044
-- =============================================================================
-- Fecha: 2026-02-19
-- =============================================================================

BEGIN;

-- =============================================================================
-- CORRECCIÓN 1: Error de typo en gcc_cierre_documentos.sql (línea 158)
-- "establecerimiento_id" -> "establecimiento_id"
-- =============================================================================

-- Verificar si la tabla existe y tiene la columna con el typo
DO $$
BEGIN
    -- Si existe la columna con typo, renombrar y crear correctamente
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'actas_gcc_v2' AND column_name = 'establecerimiento_id'
    ) THEN
        -- La columna tiene el typo,我们需要 renombrarla
        ALTER TABLE public.actas_gcc_v2 
        RENAME COLUMN establecerimiento_id TO establecimiento_id;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Si hay error, ignorar (la columna puede no existir o ya estar correcta)
        RAISE NOTICE 'Corrección 1: %', SQLERRM;
END;
$$;

-- =============================================================================
-- CORRECCIÓN 2: Error de sintaxis en gcc_generar_acta (línea 312)
-- "v_establecimiento 'rbd',.nombre" -> debe ser JSON válido
-- =============================================================================

-- Recrear la función con la sintaxis correcta
CREATE OR REPLACE FUNCTION public.gcc_generar_acta(
    p_tipo_acta TEXT,
    p_mediacion_id UUID,
    p_datos_adicionales JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_mediacion RECORD;
    v_expediente RECORD;
    v_establecimiento RECORD;
    v_participantes JSONB;
    v_resultado JSONB;
BEGIN
    -- Obtener datos de la mediación
    SELECT * INTO v_mediacion
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_mediacion.id IS NULL THEN
        RETURN jsonb_build_object(
            'error', true,
            'mensaje', 'Mediación no encontrada'
        );
    END IF;

    -- Obtener datos del expediente
    SELECT * INTO v_expediente
    FROM public.expedientes
    WHERE id = v_mediacion.expediente_id;

    -- Obtener datos del establecimiento
    SELECT * INTO v_establecimiento
    FROM public.establecimientos
    WHERE id = v_mediacion.establecimiento_id;

    -- Obtener participantes
    SELECT jsonb_agg(
        jsonb_build_object(
            'nombre', nombre_completo,
            'rol', rol_en_conflicto,
            'tipo', tipo_participante
        )
    ) INTO v_participantes
    FROM public.participantes_gcc_v2
    WHERE mediacion_id = p_mediacion_id;

    -- Generar contenido según tipo de acta
    CASE p_tipo_acta
        WHEN 'ACUERDO' THEN
            v_resultado := jsonb_build_object(
                'tipo_documento', 'Acta de Acuerdo',
                'tipo_acta', 'ACUERDO',
                'mediacion_id', p_mediacion_id,
                'expediente', jsonb_build_object(
                    'id', v_expediente.id,
                    'folio', v_expediente.folio_interno,
                    'estudiante', v_expediente.estudiante_id
                ),
                'establecimiento', jsonb_build_object(
                    'nombre', v_establecimiento.nombre,
                    'rbd', v_establecimiento.rbd
                ),
                'fechas', jsonb_build_object(
                    'mediacion', v_mediacion.fecha_inicio,
                    'cierre', CURRENT_DATE
                ),
                'participantes', COALESCE(v_participantes, '[]'::JSONB),
                'resultado', v_mediacion.resultado_final,
                'antecedentes', p_datos_adicionales->>'antecedentes',
                'acuerdos', p_datos_adicionales->>'acuerdos',
                'firma', jsonb_build_object(
                    'lugar_firma', v_establecimiento.direccion,
                    'fecha_firma', CURRENT_DATE
                )
            );

        WHEN 'ACTA_MEDIACION' THEN
            v_resultado := jsonb_build_object(
                'tipo_documento', 'Acta de Mediación',
                'tipo_acta', 'ACTA_MEDIACION',
                'mediacion_id', p_mediacion_id,
                'expediente', jsonb_build_object(
                    'id', v_expediente.id,
                    'folio', v_expediente.folio_interno
                ),
                'establecimiento', jsonb_build_object(
                    'nombre', v_establecimiento.nombre
                ),
                'fechas', jsonb_build_object(
                    'inicio', v_mediacion.fecha_inicio,
                    'cierre', CURRENT_DATE,
                    'plazo', v_mediacion.fecha_limite_habil
                ),
                'participantes', COALESCE(v_participantes, '[]'::JSONB),
                'resultado', v_mediacion.resultado_final,
                'desarrollo', p_datos_adicionales->>'desarrollo',
                'posiciones', p_datos_adicionales->>'posiciones',
                'firma', jsonb_build_object(
                    'lugar_firma', v_establecimiento.direccion,
                    'fecha_firma', CURRENT_DATE
                )
            );

        WHEN 'CONSTANCIA' THEN
            v_resultado := jsonb_build_object(
                'tipo_documento', 'Constancia de Actuación',
                'tipo_acta', 'CONSTANCIA',
                'mediacion_id', p_mediacion_id,
                'expediente', jsonb_build_object(
                    'id', v_expediente.id,
                    'folio', v_expediente.folio_interno
                ),
                'establecimiento', jsonb_build_object(
                    'nombre', v_establecimiento.nombre
                ),
                'fechas', jsonb_build_object(
                    'inicio', v_mediacion.fecha_inicio,
                    'cierre', CURRENT_DATE
                ),
                'participantes', COALESCE(v_participantes, '[]'::JSONB),
                'resultado', v_mediacion.resultado_final,
                'motivo_sin_acuerdo', p_datos_adicionales->>'motivo',
                'constancia', 'Se deja constancia que las partes no llegaron a acuerdo',
                'firma', jsonb_build_object(
                    'lugar_firma', v_establecimiento.direccion,
                    'fecha_firma', CURRENT_DATE
                )
            );

        ELSE
            v_resultado := jsonb_build_object(
                'error', true,
                'mensaje', 'Tipo de acta no válido'
            );
    END CASE;

    RETURN v_resultado;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', true,
            'mensaje', SQLERRM
        );
END;
$$;

-- =============================================================================
-- CORRECCIÓN 3: Verificar que las tablas GCC tengan las columnas correctas
-- =============================================================================

-- Verificar tablas y agregar columnas faltantes si es necesario
DO $$
BEGIN
    -- Verificar que la tabla actas_gcc_v2 tenga la columna correcta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'actas_gcc_v2' AND column_name = 'establecimiento_id'
    ) THEN
        -- Agregar columna si no existe
        ALTER TABLE public.actas_gcc_v2 
        ADD COLUMN IF NOT EXISTS establecimiento_id UUID REFERENCES public.establecimientos(id);
    END IF;
    
    RAISE NOTICE 'Verificación de tablas completada';
END;
$$;

-- =============================================================================
-- CORRECCIÓN 4: Agregar función helper si no existe
-- =============================================================================

-- Verificar que existe la función current_establecimiento_id()
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION public.current_establecimiento_id()
    RETURNS UUID
    LANGUAGE plpgsql
    STABLE
    AS $$
    DECLARE
        v_establecimiento_id UUID;
    BEGIN
        -- Intentar obtener de auth.jwt()
        v_establecimiento_id := (current_setting('request.jwt.claims', true)::jsonb->>'establecimiento_id')::UUID;
        
        -- Si no está en JWT, intentar de auth.users
        IF v_establecimiento_id IS NULL THEN
            v_establecimiento_id := (
                SELECT establecimiento_id 
                FROM auth.users 
                WHERE id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::UUID
            )::UUID;
        END IF;
        
        RETURN v_establecimiento_id;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NULL;
    END;
    $$;
    
    RAISE NOTICE 'Función current_establecimiento_id() verificada/creada';
END;
$$;

-- =============================================================================
-- CORRECCIÓN 5: Verificar extensión UUID si no existe
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

COMMIT;

-- Verificar resultado
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Contar funciones GCC
    SELECT COUNT(*) INTO v_count 
    FROM pg_proc 
    WHERE proname LIKE 'gcc_%';
    
    RAISE NOTICE 'Funciones GCC disponibles: %', v_count;
END;
$$;
