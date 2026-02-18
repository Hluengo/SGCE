-- =============================================================================
-- 030_gcc_backfill_dualwrite.sql
-- Fase B (Backfill + Dual-write): migración de legacy a GCC v2
-- =============================================================================

-- 1) Backfill mediaciones legacy -> v2
INSERT INTO public.mediaciones_gcc_v2 (
  id,
  establecimiento_id,
  expediente_id,
  tipo_mecanismo,
  estado_proceso,
  efecto_suspensivo_activo,
  fecha_inicio,
  fecha_limite_habil,
  fecha_cierre,
  resultado_final,
  motivo_derivacion,
  facilitador_id,
  created_by,
  created_at,
  updated_at
)
SELECT
  m.id,
  m.establecimiento_id,
  m.expediente_id,
  'MEDIACION' AS tipo_mecanismo,
  CASE m.estado::text
    WHEN 'ABIERTA' THEN 'abierta'
    WHEN 'EN_PROCESO' THEN 'en_proceso'
    WHEN 'CERRADA_EXITOSA' THEN 'acuerdo_total'
    WHEN 'CERRADA_SIN_ACUERDO' THEN 'sin_acuerdo'
    ELSE 'en_proceso'
  END AS estado_proceso,
  CASE
    WHEN m.estado::text IN ('ABIERTA', 'EN_PROCESO') THEN true
    ELSE false
  END AS efecto_suspensivo_activo,
  (m.fecha_inicio::timestamp at time zone 'UTC')::timestamptz AS fecha_inicio,
  COALESCE(sumar_dias_habiles(m.fecha_inicio, 5), m.fecha_inicio + 5) AS fecha_limite_habil,
  CASE WHEN m.fecha_cierre IS NOT NULL THEN (m.fecha_cierre::timestamp at time zone 'UTC')::timestamptz ELSE NULL END AS fecha_cierre,
  m.acuerdos AS resultado_final,
  NULL::text AS motivo_derivacion,
  NULL::uuid AS facilitador_id,
  COALESCE(
    (SELECT e.creado_por FROM public.expedientes e WHERE e.id = m.expediente_id),
    (SELECT p.id FROM public.perfiles p WHERE p.establecimiento_id = m.establecimiento_id ORDER BY p.created_at ASC NULLS LAST, p.id ASC LIMIT 1)
  ) AS created_by,
  m.created_at,
  now() AS updated_at
FROM public.mediaciones_gcc m
WHERE m.expediente_id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  establecimiento_id = EXCLUDED.establecimiento_id,
  expediente_id = EXCLUDED.expediente_id,
  tipo_mecanismo = EXCLUDED.tipo_mecanismo,
  estado_proceso = EXCLUDED.estado_proceso,
  efecto_suspensivo_activo = EXCLUDED.efecto_suspensivo_activo,
  fecha_inicio = EXCLUDED.fecha_inicio,
  fecha_limite_habil = EXCLUDED.fecha_limite_habil,
  fecha_cierre = EXCLUDED.fecha_cierre,
  resultado_final = EXCLUDED.resultado_final,
  updated_at = now();

-- 2) Backfill compromisos legacy -> v2
INSERT INTO public.compromisos_gcc_v2 (
  id,
  establecimiento_id,
  mediacion_id,
  descripcion,
  responsable_id,
  tipo_responsable,
  fecha_compromiso,
  cumplimiento_verificado,
  evidencia_cumplimiento_url,
  fecha_verificacion,
  resultado_evaluacion,
  created_at,
  updated_at
)
SELECT
  c.id,
  COALESCE(v2.establecimiento_id, m.establecimiento_id) AS establecimiento_id,
  c.mediacion_id,
  c.descripcion,
  NULL::uuid AS responsable_id,
  'OTRO'::text AS tipo_responsable,
  COALESCE(c.fecha_compromiso, current_date) AS fecha_compromiso,
  COALESCE(c.cumplido, false) AS cumplimiento_verificado,
  NULL::text AS evidencia_cumplimiento_url,
  CASE WHEN c.cumplido THEN COALESCE(c.fecha_compromiso, current_date) ELSE NULL END AS fecha_verificacion,
  NULL::text AS resultado_evaluacion,
  c.created_at,
  now() AS updated_at
FROM public.compromisos_mediacion c
LEFT JOIN public.mediaciones_gcc_v2 v2 ON v2.id = c.mediacion_id
LEFT JOIN public.mediaciones_gcc m ON m.id = c.mediacion_id
WHERE COALESCE(v2.establecimiento_id, m.establecimiento_id) IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  establecimiento_id = EXCLUDED.establecimiento_id,
  mediacion_id = EXCLUDED.mediacion_id,
  descripcion = EXCLUDED.descripcion,
  fecha_compromiso = EXCLUDED.fecha_compromiso,
  cumplimiento_verificado = EXCLUDED.cumplimiento_verificado,
  fecha_verificacion = EXCLUDED.fecha_verificacion,
  updated_at = now();

-- 3) Sync de estado expedientes cuando existe GCC activa
UPDATE public.expedientes e
SET estado_legal = 'pausa_legal'
WHERE EXISTS (
  SELECT 1
  FROM public.mediaciones_gcc_v2 m
  WHERE m.expediente_id = e.id
    AND m.estado_proceso IN ('abierta', 'en_proceso')
    AND COALESCE(m.efecto_suspensivo_activo, false) = true
)
AND e.estado_legal <> 'pausa_legal';

-- 4) Dual-write legacy -> v2 para mediaciones
CREATE OR REPLACE FUNCTION public.sync_legacy_mediaciones_to_v2()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_created_by uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.mediaciones_gcc_v2 WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT e.creado_por
  INTO v_created_by
  FROM public.expedientes e
  WHERE e.id = NEW.expediente_id
  LIMIT 1;

  IF v_created_by IS NULL THEN
    SELECT p.id
    INTO v_created_by
    FROM public.perfiles p
    WHERE p.establecimiento_id = NEW.establecimiento_id
    ORDER BY p.created_at ASC NULLS LAST, p.id ASC
    LIMIT 1;
  END IF;

  INSERT INTO public.mediaciones_gcc_v2 (
    id,
    establecimiento_id,
    expediente_id,
    tipo_mecanismo,
    estado_proceso,
    efecto_suspensivo_activo,
    fecha_inicio,
    fecha_limite_habil,
    fecha_cierre,
    resultado_final,
    motivo_derivacion,
    facilitador_id,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.establecimiento_id,
    NEW.expediente_id,
    'MEDIACION',
    CASE NEW.estado::text
      WHEN 'ABIERTA' THEN 'abierta'
      WHEN 'EN_PROCESO' THEN 'en_proceso'
      WHEN 'CERRADA_EXITOSA' THEN 'acuerdo_total'
      WHEN 'CERRADA_SIN_ACUERDO' THEN 'sin_acuerdo'
      ELSE 'en_proceso'
    END,
    CASE WHEN NEW.estado::text IN ('ABIERTA', 'EN_PROCESO') THEN true ELSE false END,
    (NEW.fecha_inicio::timestamp at time zone 'UTC')::timestamptz,
    COALESCE(sumar_dias_habiles(NEW.fecha_inicio, 5), NEW.fecha_inicio + 5),
    CASE WHEN NEW.fecha_cierre IS NOT NULL THEN (NEW.fecha_cierre::timestamp at time zone 'UTC')::timestamptz ELSE NULL END,
    NEW.acuerdos,
    NULL,
    NULL,
    v_created_by,
    NEW.created_at,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    establecimiento_id = EXCLUDED.establecimiento_id,
    expediente_id = EXCLUDED.expediente_id,
    estado_proceso = EXCLUDED.estado_proceso,
    efecto_suspensivo_activo = EXCLUDED.efecto_suspensivo_activo,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_limite_habil = EXCLUDED.fecha_limite_habil,
    fecha_cierre = EXCLUDED.fecha_cierre,
    resultado_final = EXCLUDED.resultado_final,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_legacy_mediaciones_to_v2 ON public.mediaciones_gcc;
CREATE TRIGGER trg_sync_legacy_mediaciones_to_v2
AFTER INSERT OR UPDATE OR DELETE ON public.mediaciones_gcc
FOR EACH ROW EXECUTE FUNCTION public.sync_legacy_mediaciones_to_v2();

-- 5) Dual-write legacy -> v2 para compromisos
CREATE OR REPLACE FUNCTION public.sync_legacy_compromisos_to_v2()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_establecimiento_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.compromisos_gcc_v2 WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT m.establecimiento_id
  INTO v_establecimiento_id
  FROM public.mediaciones_gcc m
  WHERE m.id = NEW.mediacion_id
  LIMIT 1;

  IF v_establecimiento_id IS NULL THEN
    SELECT m2.establecimiento_id
    INTO v_establecimiento_id
    FROM public.mediaciones_gcc_v2 m2
    WHERE m2.id = NEW.mediacion_id
    LIMIT 1;
  END IF;

  IF v_establecimiento_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.compromisos_gcc_v2 (
    id,
    establecimiento_id,
    mediacion_id,
    descripcion,
    responsable_id,
    tipo_responsable,
    fecha_compromiso,
    cumplimiento_verificado,
    evidencia_cumplimiento_url,
    fecha_verificacion,
    resultado_evaluacion,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_establecimiento_id,
    NEW.mediacion_id,
    NEW.descripcion,
    NULL,
    'OTRO',
    COALESCE(NEW.fecha_compromiso, current_date),
    COALESCE(NEW.cumplido, false),
    NULL,
    CASE WHEN NEW.cumplido THEN COALESCE(NEW.fecha_compromiso, current_date) ELSE NULL END,
    NULL,
    NEW.created_at,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    establecimiento_id = EXCLUDED.establecimiento_id,
    mediacion_id = EXCLUDED.mediacion_id,
    descripcion = EXCLUDED.descripcion,
    fecha_compromiso = EXCLUDED.fecha_compromiso,
    cumplimiento_verificado = EXCLUDED.cumplimiento_verificado,
    fecha_verificacion = EXCLUDED.fecha_verificacion,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_legacy_compromisos_to_v2 ON public.compromisos_mediacion;
CREATE TRIGGER trg_sync_legacy_compromisos_to_v2
AFTER INSERT OR UPDATE OR DELETE ON public.compromisos_mediacion
FOR EACH ROW EXECUTE FUNCTION public.sync_legacy_compromisos_to_v2();
