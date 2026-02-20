-- =============================================================================
-- FASE 2 - SPRINT 3 y 4: Flujo de Cierre Unificado + Generación de Documentos
-- =============================================================================
-- Plan de Implementación: Optimización del Módulo GCC
-- Objetivo: Flujo de cierre guiado y generación automática de documentos
-- Fecha: 2026-02-18
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Función: gcc_procesar_cierre_completo
-- Descripción: Procesa el cierre completo de una mediación de forma atómica
-- Input: datos completos del cierre
-- Output: JSON con resultado
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_procesar_cierre_completo(
    p_mediacion_id UUID,
    p_resultado TEXT,
    p_detalle_resultado TEXT DEFAULT NULL,
    p_compromisos JSONB DEFAULT '[]'::JSONB,
    p_acta_contenido JSONB DEFAULT NULL,
    p_usuario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultado JSONB;
    v_expediente_id UUID;
    v_establecimiento_id UUID;
    v_estado_proceso TEXT;
    v_tipo_acta TEXT;
    v_tipo_hito TEXT;
    v_compromiso_record JSONB;
    v_compromiso_id UUID;
    v_acta_id UUID;
BEGIN
    -- Obtener datos de la mediación
    SELECT 
        expediente_id, 
        establecimiento_id,
        estado_proceso
    INTO v_expediente_id, v_establecimiento_id, v_estado_proceso
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_expediente_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'MEDIACION_NO_EXISTE',
            'mensaje', 'La mediación especificada no existe'
        );
    END IF;

    -- Determinar estado según resultado
    CASE p_resultado
        WHEN 'acuerdo_total' THEN
            v_estado_proceso := 'acuerdo_total';
            v_tipo_acta := 'ACUERDO';
            v_tipo_hito := 'ACUERDO_FINAL';
        WHEN 'acuerdo_parcial' THEN
            v_estado_proceso := 'acuerdo_parcial';
            v_tipo_acta := 'ACTA_MEDIACION';
            v_tipo_hito := 'ACUERDO_PARCIAL';
        ELSE
            v_estado_proceso := 'sin_acuerdo';
            v_tipo_acta := 'CONSTANCIA';
            v_tipo_hito := 'SIN_ACUERDO';
    END CASE;

    -- Actualizar mediación
    UPDATE public.mediaciones_gcc_v2
    SET 
        estado_proceso = v_estado_proceso,
        resultado_final = p_detalle_resultado,
        efecto_suspensivo_activo = false,
        fecha_cierre = NOW(),
        updated_at = NOW()
    WHERE id = p_mediacion_id;

    -- Crear hito de cierre
    INSERT INTO public.hitos_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_hito,
        descripcion,
        registrado_por,
        fecha_hito,
        datos_adicionales
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        v_tipo_hito,
        'Cierre de mediación: ' || p_resultado || COALESCE(' - ' || p_detalle_resultado, ''),
        p_usuario_id,
        NOW(),
        jsonb_build_object(
            'resultado', p_resultado,
            'detalle', p_detalle_resultado,
            'cierre_automatico', true
        )
    );

    -- Procesar compromisos si existen
    IF jsonb_array_length(p_compromisos) > 0 THEN
        FOR v_compromiso_record IN SELECT * FROM jsonb_array_elements(p_compromisos)
        LOOP
            INSERT INTO public.compromisos_gcc_v2 (
                establecimiento_id,
                mediacion_id,
                descripcion,
                responsable_id,
                tipo_responsable,
                fecha_compromiso,
                cumplimiento_verificado,
                created_at
            ) VALUES (
                v_establecimiento_id,
                p_mediacion_id,
                v_compromiso_record->>'descripcion',
                v_compromiso_record->>'responsable_id',
                v_compromiso_record->>'tipo_responsable',
                COALESCE(
                    (v_compromiso_record->>'fecha_compromiso')::DATE,
                    CURRENT_DATE + 15
                ),
                false,
                NOW()
            ) RETURNING id INTO v_compromiso_id;

            -- Crear hito para cada compromiso
            INSERT INTO public.hitos_gcc_v2 (
                establecimiento_id,
                mediacion_id,
                tipo_hito,
                descripcion,
                registrado_por,
                datos_adicionales
            ) VALUES (
                v_establecimiento_id,
                p_mediacion_id,
                'ACUERDO_PARCIAL',
                'Compromiso registrado: ' || SUBSTRING(v_compromiso_record->>'descripcion', 1, 50),
                p_usuario_id,
                jsonb_build_object(
                    'compromiso_id', v_compromiso_id
                )
            );
        END LOOP;
    END IF;

    -- Generar acta automáticamente
    INSERT INTO public.actas_gcc_v2 (
        establecerimiento_id,
        mediacion_id,
        tipo_acta,
        contenido_json,
        firmado_por_partes,
        fecha_emision
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        v_tipo_acta,
        COALESCE(
            p_acta_contenido,
            jsonb_build_object(
                'resultado', p_resultado,
                'detalle', p_detalle_resultado,
                'fecha_cierre', CURRENT_DATE,
                'generado_automaticamente', true,
                'expediente_id', v_expediente_id,
                'compromisos', p_compromisos
            )
        ),
        false,
        CURRENT_DATE
    ) RETURNING id INTO v_acta_id;

    -- Actualizar expediente según resultado
    IF p_resultado = 'sin_acuerdo' THEN
        -- Reactivar expediente para continuar procedimiento disciplinario
        UPDATE public.expedientes
        SET 
            etapa_proceso = 'RESOLUCION_PENDIENTE'::public.etapa_proceso,
            estado_legal = 'investigacion'::public.estado_legal,
            updated_at = NOW()
        WHERE id = v_expediente_id;
    ELSE
        -- Mantener cerrado por GCC (acuerdo alcanzado)
        UPDATE public.expedientes
        SET etapa_proceso = 'CERRADO_GCC'::public.etapa_proceso,
            updated_at = NOW()
        WHERE id = v_expediente_id;
    END IF;

    -- Registrar en log de auditoría
    INSERT INTO public.logs_auditoria (
        establecimiento_id,
        usuario_id,
        accion,
        tabla_afectada,
        registro_id,
        detalle
    ) VALUES (
        v_establecimiento_id,
        p_usuario_id,
        'UPDATE',
        'mediaciones_gcc_v2',
        p_mediacion_id,
        jsonb_build_object(
            'accion', 'CIERRE_COMPLETO',
            'resultado', p_resultado,
            'expediente_id', v_expediente_id,
            'compromisos_creados', jsonb_array_length(p_compromisos),
            'acta_generada', v_acta_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'mediacion_id', p_mediacion_id,
        'expediente_id', v_expediente_id,
        'estado', v_estado_proceso,
        'acta_id', v_acta_id,
        'compromisos_creados', jsonb_array_length(p_compromisos),
        'mensaje', 'Cierre procesado correctamente'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLSTATE,
            'mensaje', SQLERRM
        );
END;
$$;

-- -----------------------------------------------------------------------------
-- 2) Función: gcc_generar_acta
-- Descripción: Genera contenido de acta según templates predefinidos
-- Input: tipo_acta, datos de la mediación
-- Output: JSON con contenido del acta
-- -----------------------------------------------------------------------------

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
                'medicion_id', p_mediacion_id,
                'expediente', jsonb_build_object(
                    'id', v_expediente.id,
                    'folio', v_expediente.folio_interno,
                    'estudiante', v_expediente.estudiante_id
                ),
                'establecimiento', jsonb_build_object(
                    'nombre', v_establecimiento 'rbd',.nombre,
                    v_establecimiento.rbd
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

-- -----------------------------------------------------------------------------
-- 3) Función: gcc_obtener_resumen_cierre
-- Descripción: Obtiene datos necesarios para el formulario de cierre
-- Input: mediacion_id
-- Output: JSON con datos completos para el UI
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_obtener_resumen_cierre(
    p_mediacion_id UUID
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
    v_compromisos JSONB;
    v_hitos JSONB;
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
    SELECT id, folio_interno, estudiante_id, establecimiento_id, hechos_descripcion
    INTO v_expediente
    FROM public.expedientes
    WHERE id = v_mediacion.expediente_id;

    -- Obtener datos del establecimiento
    SELECT nombre, rbd, direccion
    INTO v_establecimiento
    FROM public.establecimientos
    WHERE id = v_mediacion.establecimiento_id;

    -- Obtener participantes
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'nombre', nombre_completo,
            'rol', rol_en_conflicto,
            'tipo', tipo_participante,
            'consentimiento', consentimiento_registrado
        )
    ) INTO v_participantes
    FROM public.participantes_gcc_v2
    WHERE mediacion_id = p_mediacion_id;

    -- Obtener compromisos existentes
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'descripcion', descripcion,
            'responsable_id', responsable_id,
            'tipo_responsable', tipo_responsable,
            'fecha', fecha_compromiso,
            'cumplido', cumplimiento_verificado
        )
    ) INTO v_compromisos
    FROM public.compromisos_gcc_v2
    WHERE mediacion_id = p_mediacion_id;

    -- Obtener timeline de hitos
    SELECT jsonb_agg(
        jsonb_build_object(
            'tipo', tipo_hito,
            'descripcion', descripcion,
            'fecha', fecha_hito
        )
    ) INTO v_hitos
    FROM public.hitos_gcc_v2
    WHERE mediacion_id = p_mediacion_id
    ORDER BY fecha_hito ASC;

    -- Construir resultado
    v_resultado := jsonb_build_object(
        'error', false,
        'mediacion', jsonb_build_object(
            'id', v_mediacion.id,
            'tipo_mecanismo', v_mediacion.tipo_mecanismo,
            'estado', v_mediacion.estado_proceso,
            'fecha_inicio', v_mediacion.fecha_inicio,
            'fecha_limite', v_mediacion.fecha_limite_habil,
            'efecto_suspensivo', v_mediacion.efecto_suspensivo_activo
        ),
        'expediente', jsonb_build_object(
            'id', v_expediente.id,
            'folio', v_expediente.folio_interno,
            'estudiante_id', v_expediente.estudiante_id,
            'hechos', v_expediente.hechos_descripcion
        ),
        'establecimiento', jsonb_build_object(
            'nombre', v_establecimiento.nombre,
            'rbd', v_establecimiento.rbd,
            'direccion', v_establecimiento.direccion
        ),
        'participantes', COALESCE(v_participantes, '[]'::JSONB),
        'compromisos_previos', COALESCE(v_compromisos, '[]'::JSONB),
        'timeline', COALESCE(v_hitos, '[]'::JSONB),
        'dias_transcurridos', CURRENT_DATE - v_mediacion.fecha_inicio,
        'dias_restantes', v_mediacion.fecha_limite_habil - CURRENT_DATE
    );

    RETURN v_resultado;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', true,
            'mensaje', SQLERRM
        );
END;
$$;

-- -----------------------------------------------------------------------------
-- 4) Función: gcc_validar_cierre
-- Descripción: Valida que se cumplan los requisitos para cerrar una mediación
-- Input: mediacion_id
-- Output: JSON con resultado de validación
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_validar_cierre(
    p_mediacion_id UUID,
    p_resultado TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_mediacion RECORD;
    v_participantes_count INTEGER;
    v_participantes_con_consentimiento INTEGER;
    v_compromisos_pendientes INTEGER;
    v_resultado JSONB;
    v_errores TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Obtener datos de la mediación
    SELECT * INTO v_mediacion
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_mediacion.id IS NULL THEN
        RETURN jsonb_build_object(
            'valido', false,
            'errores', ARRAY['La mediación no existe']
        );
    END IF;

    -- Verificar que no esté ya cerrada
    IF v_mediacion.estado_proceso IN ('acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo') THEN
        v_errores := array_append(v_errores, 'La mediación ya está cerrada');
    END IF;

    -- Contar participantes
    SELECT COUNT(*), COUNT(*) FILTER (WHERE consentimiento_registrado = true)
    INTO v_participantes_count, v_participantes_con_consentimiento
    FROM public.participantes_gcc_v2
    WHERE mediacion_id = p_mediacion_id;

    IF v_participantes_count = 0 THEN
        v_errores := array_append(v_errores, 'No hay participantes registrados');
    END IF;

    IF v_participantes_con_consentimiento < 2 AND p_resultado != 'sin_acuerdo' THEN
        v_errores := array_append(v_errores, 'Se requiere consentimiento de al menos 2 participantes para acuerdo');
    END IF;

    -- Contar compromisos pendientes
    SELECT COUNT(*)
    INTO v_compromisos_pendientes
    FROM public.compromisos_gcc_v2
    WHERE mediacion_id = p_mediacion_id
      AND cumplimiento_verificado = false;

    -- Si hay acuerdos, verificar que haya compromisos
    IF p_resultado IN ('acuerdo_total', 'acuerdo_parcial') AND v_compromisos_pendientes = 0 THEN
        v_errores := array_append(v_errores, 'Para acuerdo total/parcial se requieren compromisos registrados');
    END IF;

    -- Retornar resultado
    IF array_length(v_errores, 1) > 0 THEN
        v_resultado := jsonb_build_object(
            'valido', false,
            'errores', v_errores
        );
    ELSE
        v_resultado := jsonb_build_object(
            'valido', true,
            'errores', ARRAY[]::TEXT[],
            'advertencias', CASE 
                WHEN v_participantes_con_consentimiento < v_participantes_count 
                THEN ARRAY['Algunos participantes no tienen consentimiento registrado']
                ELSE ARRAY[]::TEXT[]
            END
        );
    END IF;

    RETURN v_resultado;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'valido', false,
            'errores', ARRAY[SQLERRM]
        );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5) Actualizar función gcc_agregar_compromiso para usar establecimiento correcto
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_agregar_compromiso(
    p_mediacion_id UUID,
    p_descripcion TEXT,
    p_responsable_id UUID DEFAULT NULL,
    p_tipo_responsable TEXT DEFAULT NULL,
    p_fecha_compromiso DATE DEFAULT NULL,
    p_usuario_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_compromiso_id UUID;
    v_establecimiento_id UUID;
BEGIN
    -- Obtener establecimiento de la mediación
    SELECT establecimiento_id INTO v_establecimiento_id
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_establecimiento_id IS NULL THEN
        RAISE EXCEPTION 'La mediación no existe';
    END IF;

    -- Crear compromiso
    INSERT INTO public.compromisos_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        descripcion,
        responsable_id,
        tipo_responsable,
        fecha_compromiso,
        cumplimiento_verificado,
        created_at
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        p_descripcion,
        p_responsable_id,
        p_tipo_responsable,
        COALESCE(p_fecha_compromiso, CURRENT_DATE + 15),
        false,
        NOW()
    ) RETURNING id INTO v_compromiso_id;

    -- Registrar hito
    INSERT INTO public.hitos_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_hito,
        descripcion,
        registrado_por,
        datos_adicionales
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        'ACUERDO_PARCIAL',
        'Compromiso agregado: ' || SUBSTRING(p_descripcion, 1, 50),
        p_usuario_id,
        jsonb_build_object(
            'accion', 'AGREGAR_COMPROMISO',
            'compromiso_id', v_compromiso_id
        )
    );

    RETURN v_compromiso_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

COMMIT;

-- Notificar éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Funciones de Cierre y Generación de Documentos instaladas';
    RAISE NOTICE '   - gcc_procesar_cierre_completo';
    RAISE NOTICE '   - gcc_generar_acta';
    RAISE NOTICE '   - gcc_obtener_resumen_cierre';
    RAISE NOTICE '   - gcc_validar_cierre';
    RAISE NOTICE '   - gcc_agregar_compromiso (corregida)';
END $$;
