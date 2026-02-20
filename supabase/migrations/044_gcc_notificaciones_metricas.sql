-- =============================================================================
-- FASE 3 - SPRINT 5: Notificaciones y Recordatorios
-- FASE 4 - SPRINT 6: Métricas y Optimización
-- =============================================================================
-- Plan de Implementación: Optimización del Módulo GCC
-- Objetivo: Notificaciones automáticas y dashboard de métricas
-- Fecha: 2026-02-18
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Tabla de configuración de notificaciones GCC
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.gcc_config_notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE,
    dias_antes_vencimiento INTEGER DEFAULT 3,
    dias_para_seguimiento INTEGER DEFAULT 5,
    notificar_facilitador BOOLEAN DEFAULT true,
    notificar_apoderados BOOLEAN DEFAULT false,
    notificar_director BOOLEAN DEFAULT true,
    hora_notificacion TIME DEFAULT '09:00:00',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT gcc_config_notificaciones_establecimiento UNIQUE (establecimiento_id)
);

COMMENT ON TABLE public.gcc_config_notificaciones IS 'Configuración de notificaciones GCC por establecimiento';

-- -----------------------------------------------------------------------------
-- 2) Tabla de log de notificaciones enviadas
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.gcc_notificaciones_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establecimiento_id UUID REFERENCES public.establecimientos(id) ON DELETE CASCADE,
    mediacion_id UUID REFERENCES public.mediaciones_gcc_v2(id) ON DELETE CASCADE,
    tipo_notificacion TEXT NOT NULL CHECK (
        tipo_notificacion IN (
            'PLAZO_VENCIDO',
            'PLAZO_PROXIMO',
            'COMPROMISO_PENDIENTE',
            'COMPROMISO_VENCIDO',
            'SEGUIMIENTO',
            'CIERRE_AUTOMATICO'
        )
    ),
    destinatario_id UUID,
    destinatario_tipo TEXT,
    destinatario_email TEXT,
    mensaje TEXT,
    enviada BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMPTZ,
    error_envio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gcc_notificaciones_log_mediacion 
    ON public.gcc_notificaciones_log(mediacion_id);
CREATE INDEX IF NOT EXISTS idx_gcc_notificaciones_log_fecha 
    ON public.gcc_notificaciones_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gcc_notificaciones_log_enviada 
    ON public.gcc_notificaciones_log(enviada, fecha_envio);

COMMENT ON TABLE public.gcc_notificaciones_log IS 'Log de notificaciones enviadas por el sistema GCC';

-- -----------------------------------------------------------------------------
-- 3) Función: gcc_obtener_mediaciones_por_vencer
-- Descripción: Obtiene mediaciones proximas a vencer
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_obtener_mediaciones_por_vencer(
    p_establecimiento_id UUID,
    p_dias_antelacion INTEGER DEFAULT 3
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
            'fecha_inicio', m.fecha_inicio,
            'fecha_limite', m.fecha_limite_habil,
            'dias_restantes', m.fecha_limite_habil - CURRENT_DATE,
            'facilitador_id', m.facilitador_id,
            'participantes_count', (
                SELECT COUNT(*) 
                FROM public.participantes_gcc_v2 p 
                WHERE p.mediacion_id = m.id
            ),
            'compromisos_pendientes', (
                SELECT COUNT(*) 
                FROM public.compromisos_gcc_v2 c 
                WHERE c.mediacion_id = m.id AND c.cumplimiento_verificado = false
            )
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

-- -----------------------------------------------------------------------------
-- 4) Función: gcc_obtener_compromisos_pendientes
-- Descripción: Obtiene compromisos pendientes de seguimiento
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_obtener_compromisos_pendientes(
    p_establecimiento_id UUID,
    p_dias_antelacion INTEGER DEFAULT 2
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
            'dias_restantes', c.fecha_compromiso - CURRENT_DATE,
            'responsable_id', c.responsable_id,
            'tipo_responsable', c.tipo_responsable,
            'expediente_id', m.expediente_id,
            'establecimiento_id', m.establecimiento_id
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

-- -----------------------------------------------------------------------------
-- 5) Función: gcc_obtener_estadisticas
-- Descripción: Obtiene estadísticas completas del módulo GCC
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_obtener_estadisticas(
    p_establecimiento_id UUID,
    p_fecha_desde DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
    p_fecha_hasta DATE DEFAULT CURRENT_DATE
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
    v_acuerdos_parciales INTEGER;
    v_sin_acuerdo INTEGER;
    v_plazos_vencidos INTEGER;
    v_participantes_total INTEGER;
    v_compromisos_totales INTEGER;
    v_compromisos_cumplidos INTEGER;
    v_promedio_dias_cierre NUMERIC;
    v_tipos_mecanismo JSONB;
    v_por_estado JSONB;
    v_por_mes JSONB;
BEGIN
    -- Total de mediaciones
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial')),
           COUNT(*) FILTER (WHERE estado_proceso IN ('acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo'))
    INTO v_total_mediaciones, v_mediaciones_activas, v_mediaciones_cerradas
    FROM public.mediaciones_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta;

    -- Resultados
    SELECT 
        COUNT(*) FILTER (WHERE resultado_final = 'acuerdo_total' OR resultado_final LIKE '%acuerdo total%'),
        COUNT(*) FILTER (WHERE resultado_final = 'acuerdo_parcial' OR resultado_final LIKE '%acuerdo parcial%'),
        COUNT(*) FILTER (WHERE resultado_final = 'sin_acuerdo' OR resultado_final LIKE '%sin acuerdo%')
    INTO v_acuerdos_totales, v_acuerdos_parciales, v_sin_acuerdo
    FROM public.mediaciones_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND fecha_cierre BETWEEN p_fecha_desde AND p_fecha_hasta;

    -- Plazos vencidos
    SELECT COUNT(*)
    INTO v_plazos_vencidos
    FROM public.mediaciones_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND estado_proceso IN ('abierta', 'en_proceso')
      AND fecha_limite_habil < CURRENT_DATE;

    -- Participantes
    SELECT COUNT(DISTINCT p.id)
    INTO v_participantes_total
    FROM public.participantes_gcc_v2 p
    JOIN public.mediaciones_gcc_v2 m ON m.id = p.mediacion_id
    WHERE m.establecimiento_id = p_establecimiento_id
      AND m.fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta;

    -- Compromisos
    SELECT COUNT(*), COUNT(*) FILTER (WHERE cumplimiento_verificado = true)
    INTO v_compromisos_totales, v_compromisos_cumplidos
    FROM public.compromisos_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND created_at BETWEEN p_fecha_desde AND p_fecha_hasta;

    -- Promedio días cierre
    SELECT AVG(EXTRACT(DAYS FROM fecha_cierre - fecha_inicio))
    INTO v_promedio_dias_cierre
    FROM public.mediaciones_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND fecha_cierre IS NOT NULL
      AND fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta;

    -- Por tipo de mecanismo
    SELECT jsonb_object_agg(tipo_mecanismo, cantidad)
    INTO v_tipos_mecanismo
    FROM (
        SELECT tipo_mecanismo, COUNT(*) as cantidad
        FROM public.mediaciones_gcc_v2
        WHERE establecimiento_id = p_establecimiento_id
          AND fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
        GROUP BY tipo_mecanismo
    ) t;

    -- Por estado
    SELECT jsonb_object_agg(estado_proceso, cantidad)
    INTO v_por_estado
    FROM (
        SELECT estado_proceso, COUNT(*) as cantidad
        FROM public.mediaciones_gcc_v2
        WHERE establecimiento_id = p_establecimiento_id
          AND fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
        GROUP BY estado_proceso
    ) t;

    -- Por mes
    SELECT jsonb_agg(
        jsonb_build_object(
            'mes', mes,
            'total', total,
            'acuerdos', acuerdos
        )
    ) INTO v_por_mes
    FROM (
        SELECT 
            TO_CHAR(fecha_inicio, 'YYYY-MM') as mes,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE resultado_final IN ('acuerdo_total', 'acuerdo_parcial') OR resultado_final LIKE '%acuerdo%') as acuerdos
        FROM public.mediaciones_gcc_v2
        WHERE establecimiento_id = p_establecimiento_id
          AND fecha_inicio BETWEEN p_fecha_desde AND p_fecha_hasta
        GROUP BY TO_CHAR(fecha_inicio, 'YYYY-MM')
        ORDER BY mes
    ) t;

    RETURN jsonb_build_object(
        'periodo', jsonb_build_object(
            'desde', p_fecha_desde,
            'hasta', p_fecha_hasta
        ),
        'totales', jsonb_build_object(
            'mediaciones', v_total_mediaciones,
            'activas', v_mediaciones_activas,
            'cerradas', v_mediaciones_cerradas,
            'participantes', v_participantes_total,
            'compromisos', v_compromisos_totales,
            'compromisos_cumplidos', v_compromisos_cumplidos
        ),
        'resultados', jsonb_build_object(
            'acuerdos_totales', v_acuerdos_totales,
            'acuerdos_parciales', v_acuerdos_parciales,
            'sin_acuerdo', v_sin_acuerdo,
            'tasa_acuerdo', CASE 
                WHEN v_mediaciones_cerradas > 0 
                THEN ROUND((v_acuerdos_totales + v_acuerdos_parciales)::NUMERIC / v_mediaciones_cerradas * 100, 1)
                ELSE 0 
            END
        ),
        'alertas', jsonb_build_object(
            'plazos_vencidos', v_plazos_vencidos,
            'compromisos_pendientes', v_compromisos_totales - v_compromisos_cumplidos
        ),
        'metricas', jsonb_build_object(
            'promedio_dias_cierre', ROUND(v_promedio_dias_cierre, 1),
            'tasa_cumplimiento_compromisos', CASE 
                WHEN v_compromisos_totales > 0 
                THEN ROUND(v_compromisos_cumplidos::NUMERIC / v_compromisos_totales * 100, 1)
                ELSE 0 
            END
        ),
        'por_tipo_mecanismo', COALESCE(v_tipos_mecanismo, '{}'::JSONB),
        'por_estado', COALESCE(v_por_estado, '{}'::JSONB),
        'por_mes', COALESCE(v_por_mes, '[]'::JSONB)
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 6) Función: gcc_registrar_notificacion
-- Descripción: Registra una notificación en el log
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_registrar_notificacion(
    p_mediacion_id UUID,
    p_tipo_notificacion TEXT,
    p_destinatario_id UUID DEFAULT NULL,
    p_destinatario_tipo TEXT DEFAULT NULL,
    p_destinatario_email TEXT DEFAULT NULL,
    p_mensaje TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notificacion_id UUID;
    v_establecimiento_id UUID;
BEGIN
    -- Obtener establecimiento de la mediación
    SELECT establecimiento_id INTO v_establecimiento_id
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    -- Insertar en log
    INSERT INTO public.gcc_notificaciones_log (
        establecimiento_id,
        mediacion_id,
        tipo_notificacion,
        destinatario_id,
        destinatario_tipo,
        destinatario_email,
        mensaje,
        created_at
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        p_tipo_notificacion,
        p_destinatario_id,
        p_destinatario_tipo,
        p_destinatario_email,
        p_mensaje,
        NOW()
    ) RETURNING id INTO v_notificacion_id;

    RETURN v_notificacion_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7) Función: gcc_obtener_dashboard
-- Descripción: Obtiene datos completos para el dashboard
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gcc_obtener_dashboard(
    p_establecimiento_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_resultado JSONB;
    v_estadisticas JSONB;
    v_mediaciones_por_vencer JSONB;
    v_compromisos_pendientes JSONB;
    v_ultimas_notificaciones JSONB;
BEGIN
    -- Obtener estadísticas del período actual
    v_estadisticas := public.gcc_obtener_estadisticas(
        p_establecimiento_id,
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE
    );

    -- Obtener mediaciones por vencer
    v_mediaciones_por_vencer := public.gcc_obtener_mediaciones_por_vencer(p_establecimiento_id, 5);

    -- Obtener compromisos pendientes
    v_compromisos_pendientes := public.gcc_obtener_compromisos_pendientes(p_establecimiento_id, 3);

    -- Obtener últimas notificaciones
    SELECT jsonb_agg(
        jsonb_build_object(
            'tipo', tipo_notificacion,
            'mensaje', mensaje,
            'fecha', created_at,
            'enviada',enviada
        )
    ) INTO v_ultimas_notificaciones
    FROM public.gcc_notificaciones_log
    WHERE establecimiento_id = p_establecimiento_id
    ORDER BY created_at DESC
    LIMIT 10;

    -- Construir resultado
    v_resultado := jsonb_build_object(
        'error', false,
        'estadisticas', v_estadisticas,
        'alertas', jsonb_build_object(
            'mediaciones_por_vencer', jsonb_array_length(v_mediaciones_por_vencer),
            'compromisos_pendientes', jsonb_array_length(v_compromisos_pendientes),
            'mediaciones', v_mediaciones_por_vencer,
            'compromisos', v_compromisos_pendientes
        ),
        'notificaciones_recientes', COALESCE(v_ultimas_notificaciones, '[]'::JSONB),
        'timestamp', NOW()
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
-- 8) Trigger para actualizar fecha de modificación
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_gcc_config_notificaciones_updated_at 
    ON public.gcc_config_notificaciones;
CREATE TRIGGER trg_gcc_config_notificaciones_updated_at
    BEFORE UPDATE ON public.gcc_config_notificaciones
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- -----------------------------------------------------------------------------
-- 9) Habilitar RLS en nuevas tablas
-- -----------------------------------------------------------------------------

ALTER TABLE public.gcc_config_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gcc_notificaciones_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para gcc_config_notificaciones
DROP POLICY IF EXISTS gcc_config_notificaciones_isolation ON public.gcc_config_notificaciones;
CREATE POLICY gcc_config_notificaciones_isolation ON public.gcc_config_notificaciones
    FOR ALL USING (establecimiento_id = public.current_establecimiento_id());

-- Políticas RLS para gcc_notificaciones_log
DROP POLICY IF EXISTS gcc_notificaciones_log_isolation ON public.gcc_notificaciones_log;
CREATE POLICY gcc_notificaciones_log_isolation ON public.gcc_notificaciones_log
    FOR ALL USING (establecimiento_id = public.current_establecimiento_id());

-- -----------------------------------------------------------------------------
-- 10) Insertar configuración por defecto para establecimientos existentes
-- -----------------------------------------------------------------------------

INSERT INTO public.gcc_config_notificaciones (
    establecimiento_id,
    dias_antes_vencimiento,
    dias_para_seguimiento,
    notificar_facilitador,
    notificar_director,
    activo
)
SELECT 
    id,
    3,
    5,
    true,
    true,
    true
FROM public.establecimientos e
WHERE NOT EXISTS (
    SELECT 1 FROM public.gcc_config_notificaciones c 
    WHERE c.establecimiento_id = e.id
)
ON CONFLICT (establecimiento_id) DO NOTHING;

COMMIT;

-- Notificar éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Fases 3 y 4 instaladas correctamente';
    RAISE NOTICE '   -- Tablas:';
    RAISE NOTICE '   - gcc_config_notificaciones';
    RAISE NOTICE '   - gcc_notificaciones_log';
    RAISE NOTICE '   -- Funciones:';
    RAISE NOTICE '   - gcc_obtener_mediaciones_por_vencer';
    RAISE NOTICE '   - gcc_obtener_compromisos_pendientes';
    RAISE NOTICE '   - gcc_obtener_estadisticas';
    RAISE NOTICE '   - gcc_registrar_notificacion';
    RAISE NOTICE '   - gcc_obtener_dashboard';
END $$;
