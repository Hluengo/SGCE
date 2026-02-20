-- ============================================================================
-- 047_circular_782_gcc_cierre_backend.sql
-- Alinea backend GCC con requisitos operativos Circular 782 para cierre:
-- - Persistir contexto normativo en mediaciones_gcc_v2
-- - Validar campos mínimos de Circular 782 en cierre
-- - Dejar constancia estructurada en hito y acta
-- - Insertar compromisos recibidos en el cierre
-- ============================================================================

BEGIN;

ALTER TABLE public.mediaciones_gcc_v2
  ADD COLUMN IF NOT EXISTS gcc_contexto_782 JSONB NOT NULL DEFAULT '{}'::JSONB;

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
    v_tipo_mecanismo TEXT;
    v_estado_proceso TEXT;
    v_tipo_acta TEXT;
    v_tipo_hito TEXT;
    v_acta_id UUID;
    v_compromisos JSONB := COALESCE(p_compromisos, '[]'::JSONB);
    v_c782 JSONB := COALESCE(p_acta_contenido -> 'circular782', '{}'::JSONB);
    v_compromisos_count INTEGER := 0;
    v_item JSONB;
    v_error TEXT;
BEGIN
    IF p_resultado NOT IN ('acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo') THEN
        RETURN jsonb_build_object('success', false, 'error', 'RESULTADO_INVALIDO');
    END IF;

    SELECT expediente_id, establecimiento_id, tipo_mecanismo
      INTO v_expediente_id, v_establecimiento_id, v_tipo_mecanismo
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_expediente_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'MEDIACION_NO_EXISTE');
    END IF;

    -- Reglas mínimas Circular 782 (exceptuando validación por delito/DDFF por decisión de negocio)
    IF COALESCE((v_c782 ->> 'aceptaParticipacion')::BOOLEAN, false) = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'C782_PARTICIPACION_VOLUNTARIA_REQUERIDA');
    END IF;

    IF COALESCE(v_c782 ->> 'escenarioProcedencia', '') = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'C782_ESCENARIO_PROCEDENCIA_REQUERIDO');
    END IF;

    IF COALESCE(v_c782 ->> 'consecuenciasIncumplimiento', '') = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'C782_CONSECUENCIAS_INCUMPLIMIENTO_REQUERIDAS');
    END IF;

    IF COALESCE(v_c782 ->> 'fechaSeguimiento', '') = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'C782_FECHA_SEGUIMIENTO_REQUERIDA');
    END IF;

    IF p_resultado IN ('acuerdo_total', 'acuerdo_parcial') AND jsonb_array_length(v_compromisos) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'C782_COMPROMISOS_REQUERIDOS_PARA_ACUERDO');
    END IF;

    CASE p_resultado
        WHEN 'acuerdo_total' THEN
            v_estado_proceso := 'acuerdo_total';
            IF v_tipo_mecanismo = 'CONCILIACION' THEN
                v_tipo_acta := 'ACTA_CONCILIACION';
            ELSIF v_tipo_mecanismo = 'ARBITRAJE_PEDAGOGICO' THEN
                v_tipo_acta := 'ACTA_ARBITRAJE';
            ELSE
                v_tipo_acta := 'ACTA_MEDIACION';
            END IF;
            v_tipo_hito := 'ACUERDO_FINAL';
        WHEN 'acuerdo_parcial' THEN
            v_estado_proceso := 'acuerdo_parcial';
            IF v_tipo_mecanismo = 'CONCILIACION' THEN
                v_tipo_acta := 'ACTA_CONCILIACION';
            ELSIF v_tipo_mecanismo = 'ARBITRAJE_PEDAGOGICO' THEN
                v_tipo_acta := 'ACTA_ARBITRAJE';
            ELSE
                v_tipo_acta := 'ACTA_MEDIACION';
            END IF;
            v_tipo_hito := 'ACUERDO_PARCIAL';
        ELSE
            v_estado_proceso := 'sin_acuerdo';
            v_tipo_acta := 'CONSTANCIA';
            v_tipo_hito := 'SIN_ACUERDO';
    END CASE;

    UPDATE public.mediaciones_gcc_v2
    SET estado_proceso = v_estado_proceso,
        resultado_final = COALESCE(NULLIF(p_detalle_resultado, ''), p_resultado),
        efecto_suspensivo_activo = false,
        fecha_cierre = NOW(),
        gcc_contexto_782 = v_c782,
        updated_at = NOW()
    WHERE id = p_mediacion_id;

    -- Inserta compromisos del cierre
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_compromisos)
    LOOP
        IF COALESCE(v_item ->> 'descripcion', '') = '' THEN
            CONTINUE;
        END IF;

        INSERT INTO public.compromisos_gcc_v2 (
            establecimiento_id,
            mediacion_id,
            descripcion,
            responsable_id,
            tipo_responsable,
            fecha_compromiso,
            cumplimiento_verificado
        ) VALUES (
            v_establecimiento_id,
            p_mediacion_id,
            v_item ->> 'descripcion',
            NULLIF(v_item ->> 'responsable_id', '')::UUID,
            NULLIF(v_item ->> 'tipo_responsable', ''),
            COALESCE(NULLIF(v_item ->> 'fecha_compromiso', '')::DATE, CURRENT_DATE),
            false
        );

        v_compromisos_count := v_compromisos_count + 1;
    END LOOP;

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
        'Cierre de mediación: ' || p_resultado,
        p_usuario_id,
        NOW(),
        jsonb_build_object(
            'resultado', p_resultado,
            'detalle', p_detalle_resultado,
            'compromisos_registrados', v_compromisos_count,
            'circular782', v_c782
        )
    );

    INSERT INTO public.actas_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_acta,
        contenido_json,
        fecha_emision,
        observaciones
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        v_tipo_acta,
        COALESCE(
            p_acta_contenido,
            jsonb_build_object(
                'resultado', p_resultado,
                'detalle', p_detalle_resultado,
                'compromisos', v_compromisos,
                'circular782', v_c782
            )
        ),
        CURRENT_DATE,
        p_detalle_resultado
    ) RETURNING id INTO v_acta_id;

    IF p_resultado = 'sin_acuerdo' THEN
        UPDATE public.expedientes
        SET etapa_proceso = 'RESOLUCION_PENDIENTE',
            estado_legal = 'investigacion',
            updated_at = NOW()
        WHERE id = v_expediente_id;
    ELSE
        UPDATE public.expedientes
        SET etapa_proceso = 'CERRADO_GCC',
            updated_at = NOW()
        WHERE id = v_expediente_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'mediacion_id', p_mediacion_id,
        'expediente_id', v_expediente_id,
        'estado', v_estado_proceso,
        'acta_id', v_acta_id,
        'compromisos_registrados', v_compromisos_count
    );
EXCEPTION
    WHEN OTHERS THEN
        v_error := SQLERRM;
        RETURN jsonb_build_object('success', false, 'error', v_error);
END;
$$;

COMMIT;

