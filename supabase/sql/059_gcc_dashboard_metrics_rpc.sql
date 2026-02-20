-- ============================================================================
-- 059_gcc_dashboard_metrics_rpc.sql
-- RPC optimizada para métricas del Dashboard GCC.
-- Reduce payload y mueve agregaciones al motor SQL.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.gcc_dashboard_metrics_v2(
  p_establecimiento_id UUID,
  p_limit_registros INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := GREATEST(1, LEAST(COALESCE(p_limit_registros, 60), 200));
  v_now TIMESTAMPTZ := NOW();
  v_30 TIMESTAMPTZ := v_now - INTERVAL '30 days';
  v_60 TIMESTAMPTZ := v_now - INTERVAL '60 days';
  v_activos INTEGER := 0;
  v_t2 INTEGER := 0;
  v_t1 INTEGER := 0;
  v_vencidos INTEGER := 0;
  v_total_terminal INTEGER := 0;
  v_acuerdo_total INTEGER := 0;
  v_acuerdo_parcial INTEGER := 0;
  v_sin_acuerdo INTEGER := 0;
  v_total_current INTEGER := 0;
  v_total_prev INTEGER := 0;
  v_med_cur INTEGER := 0;
  v_con_cur INTEGER := 0;
  v_arb_cur INTEGER := 0;
  v_med_prev INTEGER := 0;
  v_con_prev INTEGER := 0;
  v_arb_prev INTEGER := 0;
  v_total_mecanismos_cur INTEGER := 0;
  v_total_mecanismos_prev INTEGER := 0;
  v_activos_cur INTEGER := 0;
  v_activos_prev INTEGER := 0;
  v_vencidos_cur INTEGER := 0;
  v_vencidos_prev INTEGER := 0;
  v_pct_total INTEGER := 0;
  v_pct_parcial INTEGER := 0;
  v_pct_sin INTEGER := 0;
  v_pct_adopcion INTEGER := 0;
  v_trend_activos INTEGER := 0;
  v_trend_vencidos INTEGER := 0;
  v_trend_mecanismos INTEGER := 0;
  v_mecanismo_mas_usado TEXT := NULL;
  v_mecanismos JSONB := '[]'::JSONB;
  v_registros JSONB := '[]'::JSONB;
BEGIN
  IF p_establecimiento_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'TENANT_REQUIRED');
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial'))::INT,
    COUNT(*) FILTER (
      WHERE estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial')
        AND fecha_limite_habil IS NOT NULL
        AND (fecha_limite_habil::DATE - CURRENT_DATE) = 2
    )::INT,
    COUNT(*) FILTER (
      WHERE estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial')
        AND fecha_limite_habil IS NOT NULL
        AND (fecha_limite_habil::DATE - CURRENT_DATE) = 1
    )::INT,
    COUNT(*) FILTER (
      WHERE estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial')
        AND fecha_limite_habil IS NOT NULL
        AND (fecha_limite_habil::DATE - CURRENT_DATE) < 0
    )::INT,
    COUNT(*) FILTER (WHERE estado_proceso IN ('acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo', 'cerrada'))::INT,
    COUNT(*) FILTER (WHERE estado_proceso = 'acuerdo_total')::INT,
    COUNT(*) FILTER (WHERE estado_proceso = 'acuerdo_parcial')::INT,
    COUNT(*) FILTER (WHERE estado_proceso = 'sin_acuerdo')::INT
  INTO
    v_activos, v_t2, v_t1, v_vencidos, v_total_terminal, v_acuerdo_total, v_acuerdo_parcial, v_sin_acuerdo
  FROM public.mediaciones_gcc_v2
  WHERE establecimiento_id = p_establecimiento_id;

  IF v_total_terminal > 0 THEN
    v_pct_total := ROUND((v_acuerdo_total::NUMERIC / v_total_terminal::NUMERIC) * 100)::INT;
    v_pct_parcial := ROUND((v_acuerdo_parcial::NUMERIC / v_total_terminal::NUMERIC) * 100)::INT;
    v_pct_sin := ROUND((v_sin_acuerdo::NUMERIC / v_total_terminal::NUMERIC) * 100)::INT;
  END IF;

  WITH rows60 AS (
    SELECT estado_proceso, fecha_limite_habil, tipo_mecanismo, created_at
    FROM public.mediaciones_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND created_at >= v_60
  ),
  current_rows AS (
    SELECT * FROM rows60 WHERE created_at >= v_30
  ),
  previous_rows AS (
    SELECT * FROM rows60 WHERE created_at < v_30
  )
  SELECT
    (SELECT COUNT(*)::INT FROM current_rows),
    (SELECT COUNT(*)::INT FROM previous_rows),
    (SELECT COUNT(*) FILTER (WHERE tipo_mecanismo = 'MEDIACION')::INT FROM current_rows),
    (SELECT COUNT(*) FILTER (WHERE tipo_mecanismo = 'CONCILIACION')::INT FROM current_rows),
    (SELECT COUNT(*) FILTER (WHERE tipo_mecanismo = 'ARBITRAJE_PEDAGOGICO')::INT FROM current_rows),
    (SELECT COUNT(*) FILTER (WHERE tipo_mecanismo = 'MEDIACION')::INT FROM previous_rows),
    (SELECT COUNT(*) FILTER (WHERE tipo_mecanismo = 'CONCILIACION')::INT FROM previous_rows),
    (SELECT COUNT(*) FILTER (WHERE tipo_mecanismo = 'ARBITRAJE_PEDAGOGICO')::INT FROM previous_rows),
    (SELECT COUNT(*) FILTER (WHERE estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial'))::INT FROM current_rows),
    (SELECT COUNT(*) FILTER (WHERE estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial'))::INT FROM previous_rows),
    (SELECT COUNT(*) FILTER (
      WHERE fecha_limite_habil IS NOT NULL
        AND (fecha_limite_habil::DATE - CURRENT_DATE) < 0
    )::INT FROM current_rows),
    (SELECT COUNT(*) FILTER (
      WHERE fecha_limite_habil IS NOT NULL
        AND fecha_limite_habil::DATE < v_30::DATE
    )::INT FROM previous_rows)
  INTO
    v_total_current, v_total_prev,
    v_med_cur, v_con_cur, v_arb_cur,
    v_med_prev, v_con_prev, v_arb_prev,
    v_activos_cur, v_activos_prev, v_vencidos_cur, v_vencidos_prev;

  v_total_mecanismos_cur := v_med_cur + v_con_cur + v_arb_cur;
  v_total_mecanismos_prev := v_med_prev + v_con_prev + v_arb_prev;

  IF v_total_current > 0 THEN
    v_pct_adopcion := ROUND((v_total_mecanismos_cur::NUMERIC / v_total_current::NUMERIC) * 100)::INT;
  END IF;

  v_trend_activos := CASE
    WHEN v_activos_prev > 0 THEN ROUND(((v_activos_cur - v_activos_prev)::NUMERIC / v_activos_prev::NUMERIC) * 100)::INT
    ELSE 0
  END;

  v_trend_vencidos := CASE
    WHEN v_vencidos_prev > 0 THEN ROUND(((v_vencidos_cur - v_vencidos_prev)::NUMERIC / v_vencidos_prev::NUMERIC) * 100)::INT
    ELSE 0
  END;

  v_trend_mecanismos := CASE
    WHEN v_total_mecanismos_prev > 0 THEN ROUND(((v_total_mecanismos_cur - v_total_mecanismos_prev)::NUMERIC / v_total_mecanismos_prev::NUMERIC) * 100)::INT
    ELSE 0
  END;

  SELECT mecanismo
  INTO v_mecanismo_mas_usado
  FROM (
    SELECT 'MEDIACION'::TEXT AS mecanismo, v_med_cur AS total
    UNION ALL
    SELECT 'CONCILIACION'::TEXT, v_con_cur
    UNION ALL
    SELECT 'ARBITRAJE_PEDAGOGICO'::TEXT, v_arb_cur
  ) t
  ORDER BY total DESC, mecanismo ASC
  LIMIT 1;

  IF (v_med_cur + v_con_cur + v_arb_cur) = 0 THEN
    v_mecanismo_mas_usado := NULL;
  END IF;

  v_mecanismos := jsonb_build_array(
    jsonb_build_object(
      'mecanismo', 'MEDIACION',
      'count', v_med_cur,
      'percentage', CASE WHEN v_total_current > 0 THEN ROUND((v_med_cur::NUMERIC / v_total_current::NUMERIC) * 100)::INT ELSE 0 END,
      'trend', CASE
        WHEN v_med_prev = 0 AND v_med_cur > 0 THEN 'up'
        WHEN v_med_prev = 0 THEN 'stable'
        WHEN ((v_med_cur - v_med_prev)::NUMERIC / v_med_prev::NUMERIC) * 100 > 5 THEN 'up'
        WHEN ((v_med_cur - v_med_prev)::NUMERIC / v_med_prev::NUMERIC) * 100 < -5 THEN 'down'
        ELSE 'stable'
      END,
      'trendValue', CASE
        WHEN v_med_prev = 0 AND v_med_cur > 0 THEN 100
        WHEN v_med_prev = 0 THEN 0
        ELSE ROUND(((v_med_cur - v_med_prev)::NUMERIC / v_med_prev::NUMERIC) * 100)::INT
      END
    ),
    jsonb_build_object(
      'mecanismo', 'CONCILIACION',
      'count', v_con_cur,
      'percentage', CASE WHEN v_total_current > 0 THEN ROUND((v_con_cur::NUMERIC / v_total_current::NUMERIC) * 100)::INT ELSE 0 END,
      'trend', CASE
        WHEN v_con_prev = 0 AND v_con_cur > 0 THEN 'up'
        WHEN v_con_prev = 0 THEN 'stable'
        WHEN ((v_con_cur - v_con_prev)::NUMERIC / v_con_prev::NUMERIC) * 100 > 5 THEN 'up'
        WHEN ((v_con_cur - v_con_prev)::NUMERIC / v_con_prev::NUMERIC) * 100 < -5 THEN 'down'
        ELSE 'stable'
      END,
      'trendValue', CASE
        WHEN v_con_prev = 0 AND v_con_cur > 0 THEN 100
        WHEN v_con_prev = 0 THEN 0
        ELSE ROUND(((v_con_cur - v_con_prev)::NUMERIC / v_con_prev::NUMERIC) * 100)::INT
      END
    ),
    jsonb_build_object(
      'mecanismo', 'ARBITRAJE_PEDAGOGICO',
      'count', v_arb_cur,
      'percentage', CASE WHEN v_total_current > 0 THEN ROUND((v_arb_cur::NUMERIC / v_total_current::NUMERIC) * 100)::INT ELSE 0 END,
      'trend', CASE
        WHEN v_arb_prev = 0 AND v_arb_cur > 0 THEN 'up'
        WHEN v_arb_prev = 0 THEN 'stable'
        WHEN ((v_arb_cur - v_arb_prev)::NUMERIC / v_arb_prev::NUMERIC) * 100 > 5 THEN 'up'
        WHEN ((v_arb_cur - v_arb_prev)::NUMERIC / v_arb_prev::NUMERIC) * 100 < -5 THEN 'down'
        ELSE 'stable'
      END,
      'trendValue', CASE
        WHEN v_arb_prev = 0 AND v_arb_cur > 0 THEN 100
        WHEN v_arb_prev = 0 THEN 0
        ELSE ROUND(((v_arb_cur - v_arb_prev)::NUMERIC / v_arb_prev::NUMERIC) * 100)::INT
      END
    )
  );

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'casoId', id,
        'mecanismo', tipo_mecanismo,
        'estadoProceso', estado_proceso,
        'createdAt', created_at
      )
      ORDER BY created_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_registros
  FROM (
    SELECT id, tipo_mecanismo, estado_proceso, created_at
    FROM public.mediaciones_gcc_v2
    WHERE establecimiento_id = p_establecimiento_id
      AND created_at >= v_30
      AND tipo_mecanismo IN ('MEDIACION', 'CONCILIACION', 'ARBITRAJE_PEDAGOGICO')
    ORDER BY created_at DESC
    LIMIT v_limit
  ) t;

  RETURN jsonb_build_object(
    'success', true,
    'base', jsonb_build_object(
      'activos', v_activos,
      't2', v_t2,
      't1', v_t1,
      'vencidos', v_vencidos,
      'acuerdoTotalPct', v_pct_total,
      'acuerdoParcialPct', v_pct_parcial,
      'sinAcuerdoPct', v_pct_sin
    ),
    'mecanismos', v_mecanismos,
    'totalMecanismosAdoptados', v_total_mecanismos_cur,
    'mecanismoMasUsado', v_mecanismo_mas_usado,
    'tasaAdopcionMecanismos', v_pct_adopcion,
    'comparacionPeriodoAnterior', jsonb_build_object(
      'activos', v_trend_activos,
      'vencidos', v_trend_vencidos,
      'mecanismos', v_trend_mecanismos
    ),
    'registrosMecanismos', v_registros
  );
END;
$$;

REVOKE ALL ON FUNCTION public.gcc_dashboard_metrics_v2(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gcc_dashboard_metrics_v2(UUID, INTEGER) TO authenticated;

COMMIT;

