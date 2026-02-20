-- =============================================================================
-- FASE 1 - SPRINT 1: Funciones RPC Core para GCC
-- =============================================================================
-- Plan de Implementación: Optimización del Módulo GCC
-- Objetivo: Automatizar operaciones complejas en la base de datos
-- Fecha: 2026-02-18
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Función: gcc_calcular_fecha_limite
-- Descripción: Calcula la fecha límite para un proceso GCC considerando días hábiles
-- Input: fecha_inicio (date), dias_habiles (integer)
-- Output: fecha límite (date)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_calcular_fecha_limite(
    p_fecha_inicio DATE DEFAULT CURRENT_DATE,
    p_dias_habiles INTEGER DEFAULT 5
)
RETURNS DATE
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_fecha DATE := p_fecha_inicio;
    v_dias_contados INTEGER := 0;
    v_feriado BOOLEAN;
BEGIN
    -- Contar solo días hábiles (lunes a viernes, no feriados)
    WHILE v_dias_contados < p_dias_habiles LOOP
        v_fecha := v_fecha + 1;
        
        -- Verificar si es día hábil (lunes = 1, viernes = 5)
        IF EXTRACT(DOW FROM v_fecha) BETWEEN 1 AND 5 THEN
            -- Verificar si es feriado
            SELECT EXISTS (
                SELECT 1 
                FROM public.feriados_chile 
                WHERE fecha = v_fecha
            ) INTO v_feriado;
            
            IF NOT v_feriado THEN
                v_dias_contados := v_dias_contados + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN v_fecha;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2) Función: gcc_validar_expediente
-- Descripción: Valida que un expediente pueda ser derivado a GCC
-- Input: expediente_id (uuid)
-- Output: JSON con resultado de validación
-- -----------------------------------------------------------------------------

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
    -- Obtener datos del expediente
    SELECT 
        e.id,
        e.establecimiento_id,
        e.etapa_proceso,
        e.estado_legal,
        e.estudiante_id
    INTO v_expediente
    FROM public.expedientes e
    WHERE e.id = p_expediente_id;

    -- Verificar que el expediente existe
    IF v_expediente.id IS NULL THEN
        RETURN jsonb_build_object(
            'valido', false,
            'error', 'EXPEDIENTE_NO_EXISTE',
            'mensaje', 'El expediente especificado no existe'
        );
    END IF;

    -- Verificar que no tiene una mediación activa
    SELECT EXISTS (
        SELECT 1 
        FROM public.mediaciones_gcc_v2 m
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

    -- Verificar etapa válida para GCC
    IF v_expediente.etapa_proceso NOT IN ('INVESTIGACION', 'RESOLUCION_PENDIENTE', 'RECONSIDERACION') THEN
        RETURN jsonb_build_object(
            'valido', false,
            'error', 'ETAPA_NO_VALIDA',
            'mensaje', 'El expediente no está en una etapa válida para GCC',
            'etapa_actual', v_expediente.etapa_proceso,
            'etapas_permitidas', ARRAY['INVESTIGACION', 'RESOLUCION_PENDIENTE', 'RECONSIDERACION']
        );
    END IF;

    -- Expediente válido
    RETURN jsonb_build_object(
        'valido', true,
        'error', NULL,
        'mensaje', 'El expediente puede ser derivado a GCC',
        'establecimiento_id', v_expediente.establecimiento_id,
        'estudiante_id', v_expediente.estudiante_id,
        'etapa_actual', v_expediente.etapa_proceso
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3) Función: gcc_crear_proceso
-- Descripción: Crea un proceso GCC completo en una transacción atómica
-- Input: expediente_id, tipo_mecanismo, facilitador_id, usuario_id
-- Output: UUID de la mediación creada o error
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_crear_proceso(
    p_expediente_id UUID,
    p_tipo_mecanismo TEXT,
    p_facilitador_id UUID DEFAULT NULL,
    p_usuario_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mediacion_id UUID;
    v_establecimiento_id UUID;
    v_fecha_limite DATE;
    v_validacion JSONB;
BEGIN
    -- Validar expediente primero
    v_validacion := public.gcc_validar_expediente(p_expediente_id);
    
    IF NOT (v_validacion->>'valido')::BOOLEAN THEN
        RAISE EXCEPTION '%', v_validacion->>'mensaje';
    END IF;

    -- Obtener datos necesarios
    v_establecimiento_id := (v_validacion->>'establecimiento_id')::UUID;
    
    -- Calcular fecha límite (5 días hábiles según Circular 782)
    v_fecha_limite := public.gcc_calcular_fecha_limite(CURRENT_DATE, 5);

    -- Crear mediación
    INSERT INTO public.mediaciones_gcc_v2 (
        establecimiento_id,
        expediente_id,
        tipo_mecanismo,
        estado_proceso,
        efecto_suspensivo_activo,
        fecha_inicio,
        fecha_limite_habil,
        facilitador_id,
        created_by
    ) VALUES (
        v_establecimiento_id,
        p_expediente_id,
        p_tipo_mecanismo,
        'en_proceso',
        true,
        CURRENT_DATE,
        v_fecha_limite,
        p_facilitador_id,
        p_usuario_id
    ) RETURNING id INTO v_mediacion_id;

    -- Crear hito inicial de INICIO
    INSERT INTO public.hitos_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_hito,
        descripcion,
        registrado_por,
        fecha_hito
    ) VALUES (
        v_establecimiento_id,
        v_mediacion_id,
        'INICIO',
        'Inicio del proceso de ' || p_tipo_mecanismo || ' - Derivado desde expediente',
        p_usuario_id,
        NOW()
    );

    -- Actualizar expediente: cambiar a etapa CERRADO_GCC y estado pausa_legal
    UPDATE public.expedientes
    SET 
        etapa_proceso = 'CERRADO_GCC'::public.etapa_proceso,
        estado_legal = 'pausa_legal'::public.estado_legal,
        updated_at = NOW()
    WHERE id = p_expediente_id;

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
        'INSERT',
        'mediaciones_gcc_v2',
        v_mediacion_id,
        jsonb_build_object(
            'accion', 'CREAR_PROCESO_GCC',
            'expediente_id', p_expediente_id,
            'tipo_mecanismo', p_tipo_mecanismo,
            'fecha_limite', v_fecha_limite
        )
    );

    RETURN v_mediacion_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4) Función: gcc_registrar_resultado
-- Descripción: Registra el resultado de una mediación y actualiza todos los registros relacionados
-- Input: mediacion_id, resultado, detalle_resultado, usuario_id
-- Output: BOOLEAN indicando éxito
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_registrar_resultado(
    p_mediacion_id UUID,
    p_resultado TEXT,
    p_detalle_resultado TEXT DEFAULT NULL,
    p_usuario_id UUID
)
RETURNS BOOLEAN
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
        RAISE EXCEPTION 'La mediación no existe';
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
        'Resultado GCC: ' || p_resultado || COALESCE(' - ' || p_detalle_resultado, ''),
        p_usuario_id,
        NOW(),
        jsonb_build_object(
            'resultado', p_resultado,
            'detalle', p_detalle_resultado
        )
    );

    -- Generar acta automáticamente
    INSERT INTO public.actas_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_acta,
        contenido_json,
        firmado_por_partes,
        fecha_emision
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        v_tipo_acta,
        jsonb_build_object(
            'resultado', p_resultado,
            'detalle', p_detalle_resultado,
            'fecha_cierre', CURRENT_DATE,
            'generado_automaticamente', true,
            'expediente_id', v_expediente_id
        ),
        false,
        CURRENT_DATE
    );

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
            'accion', 'REGISTRAR_RESULTADO',
            'resultado', p_resultado,
            'expediente_id', v_expediente_id
        )
    );

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5) Función: gcc_agregar_participante
-- Descripción: Agrega un participante a una mediación
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_agregar_participante(
    p_mediacion_id UUID,
    p_tipo_participante TEXT,
    p_sujeto_id UUID DEFAULT NULL,
    p_nombre_completo TEXT,
    p_rol_en_conflicto TEXT,
    p_consentimiento BOOLEAN DEFAULT FALSE,
    p_observaciones TEXT DEFAULT NULL,
    p_usuario_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_participante_id UUID;
    v_establecimiento_id UUID;
BEGIN
    -- Obtener establecimiento de la mediación
    SELECT establecimiento_id INTO v_establecimiento_id
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_establecimiento_id IS NULL THEN
        RAISE EXCEPTION 'La mediación no existe';
    END IF;

    -- Crear participante
    INSERT INTO public.participantes_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_participante,
        sujeto_id,
        nombre_completo,
        rol_en_conflicto,
        consentimiento_registrado,
        observaciones,
        created_at
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        p_tipo_participante,
        p_sujeto_id,
        p_nombre_completo,
        p_rol_en_conflicto,
        p_consentimiento,
        p_observaciones,
        NOW()
    ) RETURNING id INTO v_participante_id;

    -- Registrar hito de participante agregado
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
        'REUNION',
        'Participante agregado: ' || p_nombre_completo || ' (' || p_tipo_participante || ')',
        p_usuario_id,
        jsonb_build_object(
            'accion', 'AGREGAR_PARTICIPANTE',
            'participante_id', v_participante_id,
            'nombre', p_nombre_completo
        )
    );

    RETURN v_participante_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 6) Función: gcc_actualizar_consentimiento
-- Descripción: Actualiza el estado de consentimiento de un participante
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_actualizar_consentimiento(
    p_participante_id UUID,
    p_consentimiento BOOLEAN,
    p_usuario_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mediacion_id UUID;
    v_establecimiento_id UUID;
BEGIN
    -- Obtener datos del participante
    SELECT mediacion_id, establecimiento_id 
    INTO v_mediacion_id, v_establecimiento_id
    FROM public.participantes_gcc_v2
    WHERE id = p_participante_id;

    -- Actualizar consentimiento
    UPDATE public.participantes_gcc_v2
    SET consentimiento_registrado = p_consentimiento,
        updated_at = NOW()
    WHERE id = p_participante_id;

    -- Registrar en log
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
        'participantes_gcc_v2',
        p_participante_id,
        jsonb_build_object(
            'accion', 'ACTUALIZAR_CONSENTIMIENTO',
            'consentimiento', p_consentimiento
        )
    );

    RETURN TRUE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7) Función: gcc_agregar_compromiso
-- Descripción: Agrega un compromiso a una mediación
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

-- -----------------------------------------------------------------------------
-- 8) Función: gcc_verificar_cumplimiento
-- Descripción: Marca el cumplimiento de un compromiso
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_verificar_cumplimiento(
    p_compromiso_id UUID,
    p_cumplimiento BOOLEAN,
    p_resultado_evaluacion TEXT DEFAULT NULL,
    p_evidencia_url TEXT DEFAULT NULL,
    p_usuario_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mediacion_id UUID;
    v_establecimiento_id UUID;
BEGIN
    -- Obtener datos del compromiso
    SELECT mediacion_id, establecimiento_id 
    INTO v_mediacion_id, v_establecimiento_id
    FROM public.compromisos_gcc_v2
    WHERE id = p_compromiso_id;

    -- Actualizar cumplimiento
    UPDATE public.compromisos_gcc_v2
    SET 
        cumplimiento_verificado = p_cumplimiento,
        resultado_evaluacion = p_resultado_evaluacion,
        evidencia_cumplimiento_url = p_evidencia_url,
        fecha_verificacion = CASE WHEN p_cumplimiento THEN CURRENT_DATE ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_compromiso_id;

    -- Registrar en log
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
        'compromisos_gcc_v2',
        p_compromiso_id,
        jsonb_build_object(
            'accion', 'VERIFICAR_CUMPLIMIENTO',
            'cumplimiento', p_cumplimiento,
            'evaluacion', p_resultado_evaluacion
        )
    );

    RETURN TRUE;
END;
$$;

-- -----------------------------------------------------------------------------
-- 9) Función: gcc_obtener_datos_completos
-- Descripción: Obtiene todos los datos relacionados con una mediación
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_obtener_datos_completos(
    p_mediacion_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_resultado JSONB;
    v_mediacion RECORD;
    v_participantes JSONB;
    v_hitos JSONB;
    v_actas JSONB;
    v_compromisos JSONB;
BEGIN
    -- Obtener mediación
    SELECT * INTO v_mediacion
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_mediacion.id IS NULL THEN
        RETURN jsonb_build_object(
            'error', true,
            'mensaje', 'Mediación no encontrada'
        );
    END IF;

    -- Obtener participantes
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'tipo_participante', tipo_participante,
            'nombre_completo', nombre_completo,
            'rol_en_conflicto', rol_en_conflicto,
            'consentimiento_registrado', consentimiento_registrado,
            'observaciones', observaciones
        )
    ) INTO v_participantes
    FROM public.participantes_gcc_v2
    WHERE mediacion_id = p_mediacion_id;

    -- Obtener hitos
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'tipo_hito', tipo_hito,
            'descripcion', descripcion,
            'fecha_hito', fecha_hito,
            'datos_adicionales', datos_adicionales
        )
    ) INTO v_hitos
    FROM public.hitos_gcc_v2
    WHERE mediacion_id = p_mediacion_id
    ORDER BY fecha_hito DESC;

    -- Obtener actas
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'tipo_acta', tipo_acta,
            'contenido_json', contenido_json,
            'firmado_por_partes', firmado_por_partes,
            'fecha_emision', fecha_emision
        )
    ) INTO v_actas
    FROM public.actas_gcc_v2
    WHERE mediacion_id = p_mediacion_id;

    -- Obtener compromisos
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'descripcion', descripcion,
            'responsable_id', responsable_id,
            'tipo_responsable', tipo_responsable,
            'fecha_compromiso', fecha_compromiso,
            'cumplimiento_verificado', cumplimiento_verificado,
            'resultado_evaluacion', resultado_evaluacion,
            'fecha_verificacion', fecha_verificacion
        )
    ) INTO v_compromisos
    FROM public.compromisos_gcc_v2
    WHERE mediacion_id = p_mediacion_id;

    -- Construir resultado
    RETURN jsonb_build_object(
        'error', false,
        'mediacion', jsonb_build_object(
            'id', v_mediacion.id,
            'expediente_id', v_mediacion.expediente_id,
            'tipo_mecanismo', v_mediacion.tipo_mecanismo,
            'estado_proceso', v_mediacion.estado_proceso,
            'efecto_suspensivo_activo', v_mediacion.efecto_suspensivo_activo,
            'fecha_inicio', v_mediacion.fecha_inicio,
            'fecha_limite_habil', v_mediacion.fecha_limite_habil,
            'fecha_cierre', v_mediacion.fecha_cierre,
            'resultado_final', v_mediacion.resultado_final,
            'facilitador_id', v_mediacion.facilitador_id,
            'created_by', v_mediacion.created_by
        ),
        'participantes', COALESCE(v_participantes, '[]'::JSONB),
        'hitos', COALESCE(v_hitos, '[]'::JSONB),
        'actas', COALESCE(v_actas, '[]'::JSONB),
        'compromisos', COALESCE(v_compromisos, '[]'::JSONB)
    );

END;
$$;

-- -----------------------------------------------------------------------------
-- 10) Función: gcc_agregar_hito
-- Descripción: Agrega un hito/evento a una mediación
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_agregar_hito(
    p_mediacion_id UUID,
    p_tipo_hito TEXT,
    p_descripcion TEXT DEFAULT NULL,
    p_datos_adicionales JSONB DEFAULT '{}'::JSONB,
    p_usuario_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hito_id UUID;
    v_establecimiento_id UUID;
BEGIN
    -- Obtener establecimiento de la mediación
    SELECT establecimiento_id INTO v_establecimiento_id
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    IF v_establecimiento_id IS NULL THEN
        RAISE EXCEPTION 'La mediación no existe';
    END IF;

    -- Crear hito
    INSERT INTO public.hitos_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_hito,
        descripcion,
        registrado_por,
        datos_adicionales,
        fecha_hito
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        p_tipo_hito,
        COALESCE(p_descripcion, 'Hito registrado: ' || p_tipo_hito),
        p_usuario_id,
        p_datos_adicionales,
        NOW()
    ) RETURNING id INTO v_hito_id;

    RETURN v_hito_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

COMMIT;

-- Notificar éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Funciones RPC GCC instaladas correctamente';
    RAISE NOTICE '   - gcc_calcular_fecha_limite';
    RAISE NOTICE '   - gcc_validar_expediente';
    RAISE NOTICE '   - gcc_crear_proceso';
    RAISE NOTICE '   - gcc_registrar_resultado';
    RAISE NOTICE '   - gcc_agregar_participante';
    RAISE NOTICE '   - gcc_actualizar_consentimiento';
    RAISE NOTICE '   - gcc_agregar_compromiso';
    RAISE NOTICE '   - gcc_verificar_cumplimiento';
    RAISE NOTICE '   - gcc_obtener_datos_completos';
    RAISE NOTICE '   - gcc_agregar_hito';
END $$;
