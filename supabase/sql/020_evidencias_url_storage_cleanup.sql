-- =============================================================================
-- 020_evidencias_url_storage_cleanup.sql
-- Detecta y corrige valores inválidos de public.evidencias.url_storage
-- =============================================================================
-- Objetivo:
-- 1) Detectar formatos problemáticos de url_storage.
-- 2) Migrar automáticamente casos seguros a formato canonical: bucket/path.
-- 3) Registrar todo en una tabla de auditoría de migración.
--
-- Formato canonical esperado:
--   evidencias-publicas/<path>
--   evidencias-sensibles/<path>
--
-- Casos que se auto-migran:
-- - URL firmada Supabase: /storage/v1/object/sign/<bucket>/<path>?token=...
-- - URL pública Supabase: /storage/v1/object/public/<bucket>/<path>
-- - URL autenticada:       /storage/v1/object/authenticated/<bucket>/<path>
--
-- Casos que NO se migran automáticamente:
-- - Paths ambiguos sin bucket (ej: demo.pdf)
-- - URLs externas no-Supabase
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Tabla de log de migración
-- -----------------------------------------------------------------------------
create table if not exists public.evidencias_url_storage_migration_log (
  id uuid primary key default gen_random_uuid(),
  evidencia_id uuid not null,
  old_url_storage text,
  new_url_storage text,
  reason text not null,
  status text not null check (status in ('migrated', 'skipped', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists idx_evidencias_url_storage_migration_log_evidencia
  on public.evidencias_url_storage_migration_log(evidencia_id, created_at desc);

-- -----------------------------------------------------------------------------
-- B) Diagnóstico rápido antes de migrar
-- -----------------------------------------------------------------------------
with base as (
  select
    e.id,
    e.url_storage,
    case
      when e.url_storage is null or btrim(e.url_storage) = '' then 'empty'
      when e.url_storage ~ '^evidencias-(publicas|sensibles)/.+' then 'canonical_ok'
      when e.url_storage ~ '^https?://[^/]+/storage/v1/object/(sign|public|authenticated)/.+' then 'supabase_url_extractable'
      when e.url_storage ~ '^/storage/v1/object/(sign|public|authenticated)/.+' then 'supabase_path_extractable'
      when e.url_storage ~ '^[^/]+\.[A-Za-z0-9]{2,6}$' then 'ambiguous_filename_only'
      when e.url_storage ~ '^https?://' then 'external_url_or_unknown'
      else 'unknown_format'
    end as category
  from public.evidencias e
)
select
  category,
  count(*) as rows
from base
group by category
order by rows desc, category;

-- -----------------------------------------------------------------------------
-- C) Preview de normalización (sin actualizar)
-- -----------------------------------------------------------------------------
with normalized as (
  select
    e.id,
    e.url_storage as old_url_storage,
    case
      when e.url_storage ~ '^evidencias-(publicas|sensibles)/.+' then e.url_storage
      when e.url_storage ~ '^https?://[^/]+/storage/v1/object/sign/.+' then
        regexp_replace(e.url_storage, '^https?://[^/]+/storage/v1/object/sign/([^?]+).*$', '\1')
      when e.url_storage ~ '^https?://[^/]+/storage/v1/object/public/.+' then
        regexp_replace(e.url_storage, '^https?://[^/]+/storage/v1/object/public/([^?]+).*$', '\1')
      when e.url_storage ~ '^https?://[^/]+/storage/v1/object/authenticated/.+' then
        regexp_replace(e.url_storage, '^https?://[^/]+/storage/v1/object/authenticated/([^?]+).*$', '\1')
      when e.url_storage ~ '^/storage/v1/object/sign/.+' then
        regexp_replace(e.url_storage, '^/storage/v1/object/sign/([^?]+).*$', '\1')
      when e.url_storage ~ '^/storage/v1/object/public/.+' then
        regexp_replace(e.url_storage, '^/storage/v1/object/public/([^?]+).*$', '\1')
      when e.url_storage ~ '^/storage/v1/object/authenticated/.+' then
        regexp_replace(e.url_storage, '^/storage/v1/object/authenticated/([^?]+).*$', '\1')
      else null
    end as proposed_url_storage
  from public.evidencias e
)
select
  id,
  old_url_storage,
  proposed_url_storage,
  case
    when proposed_url_storage is null then 'manual_review'
    when proposed_url_storage = old_url_storage then 'already_ok'
    else 'will_migrate'
  end as action
from normalized
order by action, id
limit 200;

-- -----------------------------------------------------------------------------
-- D) Migración automática de casos seguros
-- -----------------------------------------------------------------------------
-- Ejecuta solo si quieres aplicar cambios.
-- Recomendación: revisar secciones B y C antes de correr esta parte.
with candidates as (
  select
    e.id,
    e.url_storage as old_url_storage,
    case
      when e.url_storage ~ '^https?://[^/]+/storage/v1/object/sign/.+' then
        regexp_replace(e.url_storage, '^https?://[^/]+/storage/v1/object/sign/([^?]+).*$', '\1')
      when e.url_storage ~ '^https?://[^/]+/storage/v1/object/public/.+' then
        regexp_replace(e.url_storage, '^https?://[^/]+/storage/v1/object/public/([^?]+).*$', '\1')
      when e.url_storage ~ '^https?://[^/]+/storage/v1/object/authenticated/.+' then
        regexp_replace(e.url_storage, '^https?://[^/]+/storage/v1/object/authenticated/([^?]+).*$', '\1')
      when e.url_storage ~ '^/storage/v1/object/sign/.+' then
        regexp_replace(e.url_storage, '^/storage/v1/object/sign/([^?]+).*$', '\1')
      when e.url_storage ~ '^/storage/v1/object/public/.+' then
        regexp_replace(e.url_storage, '^/storage/v1/object/public/([^?]+).*$', '\1')
      when e.url_storage ~ '^/storage/v1/object/authenticated/.+' then
        regexp_replace(e.url_storage, '^/storage/v1/object/authenticated/([^?]+).*$', '\1')
      else null
    end as new_url_storage
  from public.evidencias e
), to_update as (
  select *
  from candidates
  where new_url_storage is not null
    and new_url_storage <> old_url_storage
    and new_url_storage ~ '^evidencias-(publicas|sensibles)/.+'
), updated as (
  update public.evidencias e
  set url_storage = u.new_url_storage
  from to_update u
  where e.id = u.id
  returning e.id, u.old_url_storage, u.new_url_storage
)
insert into public.evidencias_url_storage_migration_log (
  evidencia_id,
  old_url_storage,
  new_url_storage,
  reason,
  status
)
select
  id,
  old_url_storage,
  new_url_storage,
  'normalized_supabase_storage_url_to_bucket_path',
  'migrated'
from updated;

-- -----------------------------------------------------------------------------
-- E) Registrar casos pendientes de revisión manual
-- -----------------------------------------------------------------------------
insert into public.evidencias_url_storage_migration_log (
  evidencia_id,
  old_url_storage,
  new_url_storage,
  reason,
  status
)
select
  e.id,
  e.url_storage,
  null,
  case
    when e.url_storage is null or btrim(e.url_storage) = '' then 'empty_url_storage'
    when e.url_storage ~ '^[^/]+\.[A-Za-z0-9]{2,6}$' then 'ambiguous_filename_only'
    when e.url_storage ~ '^https?://' then 'external_or_unrecognized_url'
    else 'unknown_or_unhandled_format'
  end,
  'skipped'
from public.evidencias e
where not (
  e.url_storage ~ '^evidencias-(publicas|sensibles)/.+'
  or e.url_storage ~ '^https?://[^/]+/storage/v1/object/(sign|public|authenticated)/.+'
  or e.url_storage ~ '^/storage/v1/object/(sign|public|authenticated)/.+'
)
and not exists (
  select 1
  from public.evidencias_url_storage_migration_log l
  where l.evidencia_id = e.id
    and l.reason in (
      'empty_url_storage',
      'ambiguous_filename_only',
      'external_or_unrecognized_url',
      'unknown_or_unhandled_format'
    )
);

-- -----------------------------------------------------------------------------
-- F) Resultado final resumido
-- -----------------------------------------------------------------------------
select
  status,
  reason,
  count(*) as rows
from public.evidencias_url_storage_migration_log
group by status, reason
order by status, reason;
