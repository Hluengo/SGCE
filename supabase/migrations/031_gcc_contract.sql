-- =============================================================================
-- 031_gcc_contract.sql
-- Fase C (Contract): corte de dual-write legacy->v2 y compatibilidad controlada
-- =============================================================================

-- 1) Cortar dual-write legacy -> v2
DROP TRIGGER IF EXISTS trg_sync_legacy_mediaciones_to_v2 ON public.mediaciones_gcc;
DROP TRIGGER IF EXISTS trg_sync_legacy_compromisos_to_v2 ON public.compromisos_mediacion;

DROP FUNCTION IF EXISTS public.sync_legacy_mediaciones_to_v2();
DROP FUNCTION IF EXISTS public.sync_legacy_compromisos_to_v2();

-- 2) Activar sync inversa v2 -> legacy (compatibilidad temporal)
CREATE OR REPLACE FUNCTION public.sync_v2_mediaciones_to_legacy()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_estado mediacion_estado;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.mediaciones_gcc WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  v_estado := CASE NEW.estado_proceso
    WHEN 'abierta' THEN 'ABIERTA'::mediacion_estado
    WHEN 'en_proceso' THEN 'EN_PROCESO'::mediacion_estado
    WHEN 'sin_acuerdo' THEN 'CERRADA_SIN_ACUERDO'::mediacion_estado
    WHEN 'acuerdo_total' THEN 'CERRADA_EXITOSA'::mediacion_estado
    WHEN 'acuerdo_parcial' THEN 'CERRADA_EXITOSA'::mediacion_estado
    WHEN 'cerrada' THEN CASE WHEN NEW.resultado_final ILIKE '%sin acuerdo%' THEN 'CERRADA_SIN_ACUERDO'::mediacion_estado ELSE 'CERRADA_EXITOSA'::mediacion_estado END
    ELSE 'EN_PROCESO'::mediacion_estado
  END;

  INSERT INTO public.mediaciones_gcc (
    id,
    establecimiento_id,
    expediente_id,
    facilitador,
    estado,
    fecha_inicio,
    fecha_cierre,
    acuerdos,
    created_at
  ) VALUES (
    NEW.id,
    NEW.establecimiento_id,
    NEW.expediente_id,
    NULL,
    v_estado,
    NEW.fecha_inicio::date,
    NEW.fecha_cierre::date,
    NEW.resultado_final,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    establecimiento_id = EXCLUDED.establecimiento_id,
    expediente_id = EXCLUDED.expediente_id,
    estado = EXCLUDED.estado,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_cierre = EXCLUDED.fecha_cierre,
    acuerdos = EXCLUDED.acuerdos;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_v2_mediaciones_to_legacy ON public.mediaciones_gcc_v2;
CREATE TRIGGER trg_sync_v2_mediaciones_to_legacy
AFTER INSERT OR UPDATE OR DELETE ON public.mediaciones_gcc_v2
FOR EACH ROW EXECUTE FUNCTION public.sync_v2_mediaciones_to_legacy();

CREATE OR REPLACE FUNCTION public.sync_v2_compromisos_to_legacy()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.compromisos_mediacion WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.compromisos_mediacion (
    id,
    mediacion_id,
    descripcion,
    responsable,
    fecha_compromiso,
    cumplido,
    created_at
  ) VALUES (
    NEW.id,
    NEW.mediacion_id,
    NEW.descripcion,
    NULL,
    NEW.fecha_compromiso,
    NEW.cumplimiento_verificado,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    mediacion_id = EXCLUDED.mediacion_id,
    descripcion = EXCLUDED.descripcion,
    fecha_compromiso = EXCLUDED.fecha_compromiso,
    cumplido = EXCLUDED.cumplido;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_v2_compromisos_to_legacy ON public.compromisos_gcc_v2;
CREATE TRIGGER trg_sync_v2_compromisos_to_legacy
AFTER INSERT OR UPDATE OR DELETE ON public.compromisos_gcc_v2
FOR EACH ROW EXECUTE FUNCTION public.sync_v2_compromisos_to_legacy();

-- 3) Vistas de compatibilidad (lectura)
CREATE OR REPLACE VIEW public.v_mediaciones_gcc_compat AS
SELECT
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
  created_at,
  updated_at
FROM public.mediaciones_gcc_v2;

CREATE OR REPLACE VIEW public.v_compromisos_gcc_compat AS
SELECT
  id,
  establecimiento_id,
  mediacion_id,
  descripcion,
  fecha_compromiso,
  cumplimiento_verificado,
  fecha_verificacion,
  created_at,
  updated_at
FROM public.compromisos_gcc_v2;

COMMENT ON VIEW public.v_mediaciones_gcc_compat IS 'Vista de compatibilidad para consumidores legacy durante cutover';
COMMENT ON VIEW public.v_compromisos_gcc_compat IS 'Vista de compatibilidad para compromisos GCC v2';
