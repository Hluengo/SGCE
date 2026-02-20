-- =============================================================================
-- MIGRACIÓN 046: Funciones GCC Faltantes (CORREGIDAS v2)
-- =============================================================================
-- Agrega las funciones que faltaban de las migraciones 042/043/044
-- Errores corregidos: 
-- - Syntax error: AS $ -> AS $$
-- - gcc_obtener_dashboard: parámetros faltantes agregados
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. gcc_calcular_fecha_limite
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_calcular_fecha_limite(
    p_fecha_inicio DATE,
    p_dias_habiles INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_fecha DATE := COALESCE(p_fecha_inicio, CURRENT_DATE);
    v_dias_contados INTEGER := 0;
    v_feriado BOOLEAN;
    v_dias_max INTEGER := COALESCE(p_dias_habiles, 5);
BEGIN
    WHILE v_dias_contados < v_dias_max LOOP
        v_fecha := v_fecha + 1;
        IF EXTRACT(DOW FROM v_fecha) BETWEEN 1 AND 5 THEN
            SELECT EXISTS (
                SELECT 1 FROM public.feriados_chile WHERE fecha = v_fecha
            ) INTO v_feriado;
            IF NOT v_feriado THEN
                v_dias_contados := v_dias_contados + 1;
            END IF;
        END IF;
    END LOOP;
    RETURN v_fecha;
END;
$$;

-- =============================================================================
-- 2. gcc_validar_expediente
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_validar_expediente(
    p_expediente_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_resultado JSONB;
    v_expediente RECORD;
    v_mediacion_existe BOOLEAN;
BEGIN
    SELECT id, establecimiento_id, etapa_proceso, estado_legal, estudiante_id
    INTO v_expediente
    FROM public.expedientes
    WHERE id = p_expediente_id;

    IF v_expediente.id IS NULL THEN
        RETURN jsonb_build_object(
            'valido', false,
            'error', 'EXPEDIENTE_NO_EXISTE',
            'mensaje', 'El expediente especificado no existe'
        );
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.mediaciones_gcc_v2 m
        WHERE m.expediente_id = p_expediente_id
          AND m.estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial')
    ) INTO v_mediacion_existe;

    IF v_mediacion_existe THEN
        RETURN jsonb_build_object(
            'valido', false,
            'error', 'YA_TIENE_MEDIACION',
            'mensaje', 'El expediente ya tiene una mediación activa'
        );
    END IF;

    IF v_expediente.etapa_proceso NOT IN ('INVESTIGACION', 'RESOLUCION_PENDIENTE', 'RECONSIDERACION') THEN
        RETURN jsonb_build_object(
            'valido', false,
            'error', 'ETAPA_NO_VALIDA',
            'mensaje', 'El expediente no está en una etapa válida para GCC'
        );
    END IF;

    RETURN jsonb_build_object(
        'valido', true,
        'error', NULL,
        'mensaje', 'El expediente puede ser derivado a GCC',
        'establecimiento_id', v_expediente.establecimiento_id,
        'estudiante_id', v_expediente.estudiante_id
    );
END;
$$;

-- =============================================================================
-- 3. gcc_actualizar_consentimiento
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_actualizar_consentimiento(
    p_participante_id UUID,
    p_consentimiento BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_participante RECORD;
BEGIN
    SELECT id, mediacion_id INTO v_participante
    FROM public.participantes_gcc_v2
    WHERE id = p_participante_id;

    IF v_participante.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'PARTICIPANTE_NO_EXISTE');
    END IF;

    UPDATE public.participantes_gcc_v2
    SET consentimiento_registrado = p_consentimiento,
        updated_at = NOW()
    WHERE id = p_participante_id;

    RETURN jsonb_build_object(
        'success', true,
        'mensaje', 'Consentimiento actualizado: ' || CASE WHEN p_consentimiento THEN 'Otorgado' ELSE 'Rechazado' END
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =============================================================================
-- 4. gcc_registrar_hito
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_registrar_hito(
    p_mediacion_id UUID,
    p_tipo_hito TEXT,
    p_descripcion TEXT,
    p_usuario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mediacion RECORD;
    v_hito_id UUID;
BEGIN
    SELECT id, establecimiento_id INTO v_mediacion
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_mediacion.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'MEDIACION_NO_EXISTE');
    END IF;

    INSERT INTO public.hitos_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_hito,
        descripcion,
        registrado_por,
        fecha_hito
    ) VALUES (
        v_mediacion.establecimiento_id,
        p_mediacion_id,
        p_tipo_hito,
        p_descripcion,
        p_usuario_id,
        NOW()
    ) RETURNING id INTO v_hito_id;

    RETURN jsonb_build_object(
        'success', true,
        'hito_id', v_hito_id,
        'mensaje', 'Hito registrado exitosamente'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =============================================================================
-- 5. gcc_obtener_proceso
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_obtener_proceso(
    p_mediacion_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_mediacion RECORD;
BEGIN
    SELECT * INTO v_mediacion
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_mediacion.id IS NULL THEN
        RETURN jsonb_build_object('error', true, 'mensaje', 'Mediación no encontrada');
    END IF;

    RETURN jsonb_build_object(
        'error', false,
        'mediacion', jsonb_build_object(
            'id', v_mediacion.id,
            'expediente_id', v_mediacion.expediente_id,
            'tipo_mecanismo', v_mediacion.tipo_mecanismo,
            'estado_proceso', v_mediacion.estado_proceso,
            'resultado_final', v_mediacion.resultado_final,
            'fecha_inicio', v_mediacion.fecha_inicio,
            'fecha_cierre', v_mediacion.fecha_cierre,
            'fecha_limite_habil', v_mediacion.fecha_limite_habil
        )
    );
END;
$$;

-- =============================================================================
-- 6. gcc_obtener_participantes
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_obtener_participantes(
    p_mediacion_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'nombre', nombre_completo,
            'tipo', tipo_participante,
            'rol', rol_en_conflicto,
            'consentimiento', consentimiento_registrado
        )
    ) INTO v_resultado
    FROM public.participantes_gcc_v2
    WHERE mediacion_id = p_mediacion_id;

    RETURN COALESCE(v_resultado, '[]'::JSONB);
END;
$$;

-- =============================================================================
-- 7. gcc_procesar_cierre_completo
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_procesar_cierre_completo(
    p_mediacion_id UUID,
    p_resultado TEXT,
    p_usuario_id UUID,
    p_detalle_resultado TEXT DEFAULT NULL,
    p_compromisos JSONB DEFAULT '[]'::JSONB,
    p_acta_contenido JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expediente_id UUID;
    v_establecimiento_id UUID;
    v_estado_proceso TEXT;
    v_tipo_acta TEXT;
    v_tipo_hito TEXT;
    v_acta_id UUID;
BEGIN
    SELECT expediente_id, establecimiento_id INTO v_expediente_id, v_establecimiento_id
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_expediente_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'MEDIACION_NO_EXISTE');
    END IF;

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

    UPDATE public.mediaciones_gcc_v2
    SET estado_proceso = v_estado_proceso,
        resultado_final = p_detalle_resultado,
        efecto_suspensivo_activo = false,
        fecha_cierre = NOW(),
        updated_at = NOW()
    WHERE id = p_mediacion_id;

    INSERT INTO public.hitos_gcc_v2 (
        establecimiento_id, mediacion_id, tipo_hito, descripcion, registrado_por, fecha_hito
    ) VALUES (
        v_establecimiento_id, p_mediacion_id, v_tipo_hito,
        'Cierre: ' || p_resultado, p_usuario_id, NOW()
    );

    IF p_resultado = 'sin_acuerdo' THEN
        UPDATE public.expedientes
        SET etapa_proceso = 'RESOLUCION_PENDIENTE', estado_legal = 'investigacion', updated_at = NOW()
        WHERE id = v_expediente_id;
    ELSE
        UPDATE public.expedientes
        SET etapa_proceso = 'CERRADO_GCC', updated_at = NOW()
        WHERE id = v_expediente_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'mediacion_id', p_mediacion_id,
        'expediente_id', v_expediente_id,
        'estado', v_estado_proceso
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =============================================================================
-- 8. gcc_generar_acta
-- =============================================================================

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
    SELECT * INTO v_mediacion FROM public.mediaciones_gcc_v2 WHERE id = p_mediacion_id;
    IF v_mediacion.id IS NULL THEN
        RETURN jsonb_build_object('error', true, 'mensaje', 'Mediación no encontrada');
    END IF;

    SELECT * INTO v_expediente FROM public.expedientes WHERE id = v_mediacion.expediente_id;
    SELECT * INTO v_establecimiento FROM public.establecimientos WHERE id = v_mediacion.establecimiento_id;

    SELECT jsonb_agg(jsonb_build_object('nombre', nombre_completo, 'rol', rol_en_conflicto))
    INTO v_participantes FROM public.participantes_gcc_v2 WHERE mediacion_id = p_mediacion_id;

    CASE p_tipo_acta
        WHEN 'ACUERDO' THEN
            v_resultado := jsonb_build_object(
                'tipo_documento', 'Acta de Acuerdo',
                'medicion_id', p_mediacion_id,
                'expediente_id', v_expediente.id,
                'establecimiento', v_establecimiento.nombre,
                'participantes', COALESCE(v_participantes, '[]'::JSONB),
                'resultado', v_mediacion.resultado_final,
                'fecha', CURRENT_DATE
            );
        ELSE
            v_resultado := jsonb_build_object(
                'tipo_documento', 'Acta de Mediación',
                'medicion_id', p_mediacion_id
            );
    END CASE;

    RETURN v_resultado;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', true, 'mensaje', SQLERRM);
END;
$$;

-- =============================================================================
-- 9. gcc_obtener_resumen_cierre
-- =============================================================================

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
    v_participantes JSONB;
    v_compromisos JSONB;
    v_hitos JSONB;
BEGIN
    SELECT * INTO v_mediacion FROM public.mediaciones_gcc_v2 WHERE id = p_mediacion_id;
    IF v_mediacion.id IS NULL THEN
        RETURN jsonb_build_object('error', true);
    END IF;

    SELECT id, folio_interno, estudiante_id INTO v_expediente
    FROM public.expedientes WHERE id = v_mediacion.expediente_id;

    SELECT jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre_completo, 'tipo', tipo_participante))
    INTO v_participantes FROM public.participantes_gcc_v2 WHERE mediacion_id = p_mediacion_id;

    SELECT jsonb_agg(jsonb_build_object('id', id, 'descripcion', descripcion, 'fecha', fecha_compromiso))
    INTO v_compromisos FROM public.compromisos_gcc_v2 WHERE mediacion_id = p_mediacion_id;

    SELECT jsonb_agg(jsonb_build_object('tipo', tipo_hito, 'descripcion', descripcion, 'fecha', fecha_hito))
    INTO v_hitos FROM public.hitos_gcc_v2 WHERE mediacion_id = p_mediacion_id ORDER BY fecha_hito;

    RETURN jsonb_build_object(
        'error', false,
        'mediacion', jsonb_build_object(
            'id', v_mediacion.id,
            'tipo_mecanismo', v_mediacion.tipo_mecanismo,
            'estado', v_mediacion.estado_proceso
        ),
        'expediente', jsonb_build_object('id', v_expediente.id, 'folio', v_expediente.folio_interno),
        'participantes', COALESCE(v_participantes, '[]'::JSONB),
        'compromisos', COALESCE(v_compromisos, '[]'::JSONB),
        'hitos', COALESCE(v_hitos, '[]'::JSONB)
    );
END;
$$;

-- =============================================================================
-- 10. gcc_obtener_mediaciones_por_vencer
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_obtener_mediaciones_por_vencer(
    p_establecimiento_id UUID,
    p_dias_antelacion INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', m.id,
            'expediente_id', m.expediente_id,
            'tipo_mecanismo', m.tipo_mecanismo,
            'estado_proceso', m.estado_proceso,
            'fecha_limite', m.fecha_limite_habil,
            'dias_restantes', m.fecha_limite_habil - CURRENT_DATE
        )
    ) INTO v_resultado
    FROM public.mediaciones_gcc_v2 m
    WHERE m.establecimiento_id = p_establecimiento_id
      AND m.estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial')
      AND m.fecha_limite_habil IS NOT NULL
      AND (m.fecha_limite_habil - CURRENT_DATE) BETWEEN 0 AND p_dias_antelacion
    ORDER BY m.fecha_limite_habil ASC;

    RETURN COALESCE(v_resultado, '[]'::JSONB);
END;
$$;

-- =============================================================================
-- 11. gcc_obtener_compromisos_pendientes
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_obtener_compromisos_pendientes(
    p_establecimiento_id UUID,
    p_dias_antelacion INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'mediacion_id', c.mediacion_id,
            'descripcion', c.descripcion,
            'fecha_compromiso', c.fecha_compromiso,
            'dias_restantes', c.fecha_compromiso - CURRENT_DATE
        )
    ) INTO v_resultado
    FROM public.compromisos_gcc_v2 c
    JOIN public.mediaciones_gcc_v2 m ON m.id = c.mediacion_id
    WHERE m.establecimiento_id = p_establecimiento_id
      AND c.cumplimiento_verificado = false
      AND c.fecha_compromiso IS NOT NULL
      AND (c.fecha_compromiso - CURRENT_DATE) BETWEEN 0 AND p_dias_antelacion
    ORDER BY c.fecha_compromiso ASC;

    RETURN COALESCE(v_resultado, '[]'::JSONB);
END;
$$;

-- =============================================================================
-- 12. gcc_obtener_estadisticas
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_obtener_estadisticas(
    p_establecimiento_id UUID,
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_total_mediaciones INTEGER;
    v_mediaciones_activas INTEGER;
    v_mediaciones_cerradas INTEGER;
    v_acuerdos_totales INTEGER;
    v_sin_acuerdo INTEGER;
    v_plazos_vencidos INTEGER;
BEGIN
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial')),
           COUNT(*) FILTER (WHERE estado_proceso IN ('acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo'))
    INTO v_total_mediaciones, v_mediaciones_activas, v_mediaciones_cerradas
    FROM public.mediaciones_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta;

    SELECT COUNT(*) FILTER (WHERE resultado_final LIKE '%acuerdo%'),
           COUNT(*) FILTER (WHERE resultado_final LIKE '%sin acuerdo%')
    INTO v_acuerdos_totales, v_sin_acuerdo
    FROM public.mediaciones_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND fecha_cierre BETWEEN p_fecha_desde AND p_fecha_hasta;

    SELECT COUNT(*) INTO v_plazos_vencidos
    FROM public.mediaciones_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND estado_proceso IN ('abierta', 'en_proceso')
      AND fecha_limite_habil < CURRENT_DATE;

    RETURN jsonb_build_object(
        'periodo', jsonb_build_object('desde', p_fecha_desde, 'hasta', p_fecha_hasta),
        'totales', jsonb_build_object(
            'mediaciones', v_total_mediaciones,
            'activas', v_mediaciones_activas,
            'cerradas', v_mediaciones_cerradas
        ),
        'resultados', jsonb_build_object(
            'acuerdos', v_acuerdos_totales,
            'sin_acuerdo', v_sin_acuerdo
        ),
        'alertas', jsonb_build_object('plazos_vencidos', v_plazos_vencidos)
    );
END;
$$;

-- =============================================================================
-- 13. gcc_obtener_dashboard (CORREGIDO - parámetros faltantes)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.gcc_obtener_dashboard(
    p_establecimiento_id UUID,
    p_fecha_desde DATE DEFAULT NULL,
    p_fecha_hasta DATE DEFAULT NULL,
    p_dias_antelacion INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_estadisticas JSONB;
    v_mediaciones_por_vencer JSONB;
    v_compromisos_pendientes JSONB;
    v_default_establecimiento UUID;
BEGIN
    -- Obtener establecimiento por defecto si no se provee
    SELECT id INTO v_default_establecimiento 
    FROM public.establecimientos 
    LIMIT 1;
    
    v_estadisticas := public.gcc_obtener_estadisticas(
        COALESCE(p_establecimiento_id, v_default_establecimiento),
        COALESCE(p_fecha_desde, CURRENT_DATE - INTERVAL '30 days'),
        COALESCE(p_fecha_hasta, CURRENT_DATE)
    );

    v_mediaciones_por_vencer := public.gcc_obtener_mediaciones_por_vencer(
        COALESCE(p_establecimiento_id, v_default_establecimiento), 
        p_dias_antelacion
    );
    v_compromisos_pendientes := public.gcc_obtener_compromisos_pendientes(
        COALESCE(p_establecimiento_id, v_default_establecimiento), 
        p_dias_antelacion
    );

    RETURN jsonb_build_object(
        'error', false,
        'estadisticas', v_estadisticas,
        'alertas', jsonb_build_object(
            'mediaciones_por_vencer', jsonb_array_length(v_mediaciones_por_vencer),
            'compromisos_pendientes', jsonb_array_length(v_compromisos_pendientes)
        ),
        'timestamp', NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', true, 'mensaje', SQLERRM);
END;
$$;

COMMIT;
