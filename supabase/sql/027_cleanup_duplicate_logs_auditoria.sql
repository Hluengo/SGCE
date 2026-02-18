-- =============================================================================
-- 027_cleanup_duplicate_logs_auditoria.sql
-- Limpia duplicados en public.logs_auditoria.
--
-- Criterio de duplicado:
-- - mismo establecimiento_id
-- - mismo usuario_id
-- - misma accion
-- - misma tabla_afectada
-- - mismo registro_id
-- - mismo detalle (normalizado a texto)
-- - misma ventana de 5 segundos en created_at
--
-- Mantiene 1 registro (el más antiguo por ventana) y elimina el resto.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- A) Diagnóstico: cuántos duplicados serían eliminados
-- -----------------------------------------------------------------------------
with base as (
  select
    l.id,
    l.establecimiento_id,
    l.usuario_id,
    l.accion,
    l.tabla_afectada,
    l.registro_id,
    coalesce(l.detalle::text, '{}') as detalle_txt,
    l.created_at,
    floor(extract(epoch from l.created_at) / 5)::bigint as ts_bucket_5s
  from public.logs_auditoria l
),
ranked as (
  select
    b.*,
    row_number() over (
      partition by
        b.establecimiento_id,
        b.usuario_id,
        b.accion,
        b.tabla_afectada,
        b.registro_id,
        b.detalle_txt,
        b.ts_bucket_5s
      order by b.created_at asc, b.id asc
    ) as rn
  from base b
)
select
  'audit_duplicates_detected' as check_name,
  case when count(*) = 0 then 'PASS' else 'WARN' end as status,
  jsonb_build_object(
    'duplicate_rows', count(*),
    'kept_rows', (
      select count(*) from ranked where rn = 1
    )
  ) as details
from ranked
where rn > 1;

-- Muestra de duplicados detectados
with base as (
  select
    l.id,
    l.establecimiento_id,
    l.usuario_id,
    l.accion,
    l.tabla_afectada,
    l.registro_id,
    coalesce(l.detalle::text, '{}') as detalle_txt,
    l.created_at,
    floor(extract(epoch from l.created_at) / 5)::bigint as ts_bucket_5s
  from public.logs_auditoria l
),
ranked as (
  select
    b.*,
    row_number() over (
      partition by
        b.establecimiento_id,
        b.usuario_id,
        b.accion,
        b.tabla_afectada,
        b.registro_id,
        b.detalle_txt,
        b.ts_bucket_5s
      order by b.created_at asc, b.id asc
    ) as rn
  from base b
)
select
  id,
  establecimiento_id,
  usuario_id,
  accion,
  tabla_afectada,
  registro_id,
  created_at
from ranked
where rn > 1
order by created_at desc
limit 100;

-- -----------------------------------------------------------------------------
-- B) Aplicar limpieza (DELETE de duplicados)
-- -----------------------------------------------------------------------------
with base as (
  select
    l.id,
    l.establecimiento_id,
    l.usuario_id,
    l.accion,
    l.tabla_afectada,
    l.registro_id,
    coalesce(l.detalle::text, '{}') as detalle_txt,
    l.created_at,
    floor(extract(epoch from l.created_at) / 5)::bigint as ts_bucket_5s
  from public.logs_auditoria l
),
ranked as (
  select
    b.id,
    row_number() over (
      partition by
        b.establecimiento_id,
        b.usuario_id,
        b.accion,
        b.tabla_afectada,
        b.registro_id,
        b.detalle_txt,
        b.ts_bucket_5s
      order by b.created_at asc, b.id asc
    ) as rn
  from base b
),
to_delete as (
  select id
  from ranked
  where rn > 1
)
delete from public.logs_auditoria l
using to_delete d
where l.id = d.id;

-- -----------------------------------------------------------------------------
-- C) Verificación post limpieza
-- -----------------------------------------------------------------------------
with base as (
  select
    l.id,
    l.establecimiento_id,
    l.usuario_id,
    l.accion,
    l.tabla_afectada,
    l.registro_id,
    coalesce(l.detalle::text, '{}') as detalle_txt,
    floor(extract(epoch from l.created_at) / 5)::bigint as ts_bucket_5s
  from public.logs_auditoria l
),
ranked as (
  select
    b.*,
    row_number() over (
      partition by
        b.establecimiento_id,
        b.usuario_id,
        b.accion,
        b.tabla_afectada,
        b.registro_id,
        b.detalle_txt,
        b.ts_bucket_5s
      order by b.id asc
    ) as rn
  from base b
)
select
  'audit_duplicates_remaining' as check_name,
  case when count(*) = 0 then 'PASS' else 'WARN' end as status,
  jsonb_build_object('remaining_duplicates', count(*)) as details
from ranked
where rn > 1;

commit;

