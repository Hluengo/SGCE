-- =============================================================================
-- 029_gcc_expand.sql
-- Fase A (Expand): Nueva base GCC v2 multi-tenant + estado pausa_legal
-- =============================================================================

-- 1) Extender enum de estado_legal sin romper ambientes existentes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'estado_legal'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'estado_legal'
      AND e.enumlabel = 'pausa_legal'
  ) THEN
    ALTER TYPE estado_legal ADD VALUE 'pausa_legal';
  END IF;
END $$;

-- 2) Tabla principal GCC v2
CREATE TABLE IF NOT EXISTS public.mediaciones_gcc_v2 (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id uuid NOT NULL REFERENCES public.establecimientos(id),
  expediente_id uuid NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  tipo_mecanismo text NOT NULL CHECK (tipo_mecanismo IN ('MEDIACION', 'CONCILIACION', 'ARBITRAJE_PEDAGOGICO')),
  estado_proceso text NOT NULL CHECK (estado_proceso IN ('abierta', 'en_proceso', 'acuerdo_parcial', 'acuerdo_total', 'sin_acuerdo', 'cerrada')),
  efecto_suspensivo_activo boolean NOT NULL DEFAULT true,
  fecha_inicio timestamptz NOT NULL DEFAULT now(),
  fecha_limite_habil date NOT NULL,
  fecha_cierre timestamptz,
  resultado_final text,
  motivo_derivacion text,
  facilitador_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mediaciones_gcc_v2_fecha_cierre_chk CHECK (fecha_cierre IS NULL OR fecha_cierre >= fecha_inicio)
);

-- 3) Tablas hijas GCC v2
CREATE TABLE IF NOT EXISTS public.participantes_gcc_v2 (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id uuid NOT NULL REFERENCES public.establecimientos(id),
  mediacion_id uuid NOT NULL REFERENCES public.mediaciones_gcc_v2(id) ON DELETE CASCADE,
  tipo_participante text NOT NULL CHECK (tipo_participante IN ('ESTUDIANTE', 'APODERADO', 'DOCENTE', 'DIRECTIVO', 'FACILITADOR', 'OTRO')),
  sujeto_id uuid,
  nombre_completo text NOT NULL,
  rol_en_conflicto text NOT NULL CHECK (rol_en_conflicto IN ('PARTE_A', 'PARTE_B', 'VICTIMA', 'TESTIGO', 'FACILITADOR', 'OTRO')),
  consentimiento_registrado boolean NOT NULL DEFAULT false,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hitos_gcc_v2 (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id uuid NOT NULL REFERENCES public.establecimientos(id),
  mediacion_id uuid NOT NULL REFERENCES public.mediaciones_gcc_v2(id) ON DELETE CASCADE,
  tipo_hito text NOT NULL CHECK (tipo_hito IN ('INICIO', 'REUNION', 'ACERCAMIENTO', 'ACUERDO_PARCIAL', 'ACUERDO_FINAL', 'SIN_ACUERDO', 'CIERRE', 'SUSPENSION')),
  descripcion text,
  fecha_hito timestamptz NOT NULL DEFAULT now(),
  registrado_por uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
  datos_adicionales jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.actas_gcc_v2 (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id uuid NOT NULL REFERENCES public.establecimientos(id),
  mediacion_id uuid NOT NULL REFERENCES public.mediaciones_gcc_v2(id) ON DELETE CASCADE,
  tipo_acta text NOT NULL CHECK (tipo_acta IN ('ACUERDO', 'CONSTANCIA', 'ACTA_MEDIACION', 'ACTA_CONCILIACION', 'ACTA_ARBITRAJE')),
  contenido_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  url_documento text,
  firmado_por_partes boolean NOT NULL DEFAULT false,
  fecha_emision date NOT NULL DEFAULT current_date,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compromisos_gcc_v2 (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id uuid NOT NULL REFERENCES public.establecimientos(id),
  mediacion_id uuid NOT NULL REFERENCES public.mediaciones_gcc_v2(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  responsable_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  tipo_responsable text,
  fecha_compromiso date NOT NULL DEFAULT current_date,
  cumplimiento_verificado boolean NOT NULL DEFAULT false,
  evidencia_cumplimiento_url text,
  fecha_verificacion date,
  resultado_evaluacion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Trigger updated_at genérico
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mediaciones_gcc_v2_updated_at ON public.mediaciones_gcc_v2;
CREATE TRIGGER trg_mediaciones_gcc_v2_updated_at
BEFORE UPDATE ON public.mediaciones_gcc_v2
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_participantes_gcc_v2_updated_at ON public.participantes_gcc_v2;
CREATE TRIGGER trg_participantes_gcc_v2_updated_at
BEFORE UPDATE ON public.participantes_gcc_v2
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_hitos_gcc_v2_updated_at ON public.hitos_gcc_v2;
CREATE TRIGGER trg_hitos_gcc_v2_updated_at
BEFORE UPDATE ON public.hitos_gcc_v2
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_actas_gcc_v2_updated_at ON public.actas_gcc_v2;
CREATE TRIGGER trg_actas_gcc_v2_updated_at
BEFORE UPDATE ON public.actas_gcc_v2
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_compromisos_gcc_v2_updated_at ON public.compromisos_gcc_v2;
CREATE TRIGGER trg_compromisos_gcc_v2_updated_at
BEFORE UPDATE ON public.compromisos_gcc_v2
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 5) Índices operativos
CREATE INDEX IF NOT EXISTS idx_mediaciones_gcc_v2_tenant_expediente_created
  ON public.mediaciones_gcc_v2 (establecimiento_id, expediente_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mediaciones_gcc_v2_tenant_estado_plazo
  ON public.mediaciones_gcc_v2 (establecimiento_id, estado_proceso, fecha_limite_habil);

CREATE INDEX IF NOT EXISTS idx_participantes_gcc_v2_tenant_mediacion
  ON public.participantes_gcc_v2 (establecimiento_id, mediacion_id);

CREATE INDEX IF NOT EXISTS idx_hitos_gcc_v2_tenant_mediacion_fecha
  ON public.hitos_gcc_v2 (establecimiento_id, mediacion_id, fecha_hito DESC);

CREATE INDEX IF NOT EXISTS idx_actas_gcc_v2_tenant_mediacion_fecha
  ON public.actas_gcc_v2 (establecimiento_id, mediacion_id, fecha_emision DESC);

CREATE INDEX IF NOT EXISTS idx_compromisos_gcc_v2_tenant_mediacion_cumplimiento
  ON public.compromisos_gcc_v2 (establecimiento_id, mediacion_id, cumplimiento_verificado);

-- 6) RLS
ALTER TABLE public.mediaciones_gcc_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes_gcc_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hitos_gcc_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actas_gcc_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compromisos_gcc_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mediaciones_gcc_v2_isolation ON public.mediaciones_gcc_v2;
CREATE POLICY mediaciones_gcc_v2_isolation ON public.mediaciones_gcc_v2
FOR ALL
USING (public.can_user_access_row(establecimiento_id))
WITH CHECK (public.can_user_access_row(establecimiento_id));

DROP POLICY IF EXISTS participantes_gcc_v2_isolation ON public.participantes_gcc_v2;
CREATE POLICY participantes_gcc_v2_isolation ON public.participantes_gcc_v2
FOR ALL
USING (public.can_user_access_row(establecimiento_id))
WITH CHECK (public.can_user_access_row(establecimiento_id));

DROP POLICY IF EXISTS hitos_gcc_v2_isolation ON public.hitos_gcc_v2;
CREATE POLICY hitos_gcc_v2_isolation ON public.hitos_gcc_v2
FOR ALL
USING (public.can_user_access_row(establecimiento_id))
WITH CHECK (public.can_user_access_row(establecimiento_id));

DROP POLICY IF EXISTS actas_gcc_v2_isolation ON public.actas_gcc_v2;
CREATE POLICY actas_gcc_v2_isolation ON public.actas_gcc_v2
FOR ALL
USING (public.can_user_access_row(establecimiento_id))
WITH CHECK (public.can_user_access_row(establecimiento_id));

DROP POLICY IF EXISTS compromisos_gcc_v2_isolation ON public.compromisos_gcc_v2;
CREATE POLICY compromisos_gcc_v2_isolation ON public.compromisos_gcc_v2
FOR ALL
USING (public.can_user_access_row(establecimiento_id))
WITH CHECK (public.can_user_access_row(establecimiento_id));

-- 7) Comentarios
COMMENT ON TABLE public.mediaciones_gcc_v2 IS 'GCC v2: proceso colaborativo separado de estado disciplinario del expediente';
COMMENT ON COLUMN public.expedientes.estado_legal IS 'Incluye pausa_legal para efecto suspensivo GCC';
