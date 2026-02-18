-- =============================================================================
-- 022_backend_debug_checklist.sql
-- Checklist de depuracion backend para evidencias.url_storage
-- =============================================================================

-- A) Funciones y trigger esperados
select
  'function_exists:normalize_evidencia_url_storage' as check_name,
  case when exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'normalize_evidencia_url_storage'
  ) then 'PASS' else 'FAIL' end as status;

select
  'function_exists:enforce_evidencias_url_storage_strict' as check_name,
  case when exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'enforce_evidencias_url_storage_strict'
  ) then 'PASS' else 'FAIL' end as status;

select
  'trigger_exists:trg_evidencias_url_storage_strict' as check_name,
  case when exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'evidencias'
      and t.tgname = 'trg_evidencias_url_storage_strict'
      and not t.tgisinternal
  ) then 'PASS' else 'FAIL' end as status;

-- B) Salud de datos: valores no canonical
with stats as (
  select
    count(*)::int as total_rows,
    count(*) filter (where url_storage ~ '^evidencias-(publicas|sensibles)/.+')::int as canonical_rows,
    count(*) filter (where not (url_storage ~ '^evidencias-(publicas|sensibles)/.+'))::int as non_canonical_rows
  from public.evidencias
)
select
  'evidencias_url_storage_health' as check_name,
  case when non_canonical_rows = 0 then 'PASS' else 'WARN' end as status,
  jsonb_build_object(
    'total_rows', total_rows,
    'canonical_rows', canonical_rows,
    'non_canonical_rows', non_canonical_rows
  ) as details
from stats;

-- C) Muestra de filas problemáticas (si existen)
select
  id,
  expediente_id,
  url_storage
from public.evidencias
where not (url_storage ~ '^evidencias-(publicas|sensibles)/.+')
order by created_at desc nulls last
limit 50;

