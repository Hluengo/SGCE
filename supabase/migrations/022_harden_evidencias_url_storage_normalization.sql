-- =============================================================================
-- 022_harden_evidencias_url_storage_normalization.sql
-- Depuracion backend de evidencias.url_storage:
-- - Soporta variantes adicionales de rutas Supabase.
-- - Normaliza slashes iniciales y %2F en paths.
-- - Auto-corrige filas recuperables existentes.
-- =============================================================================

create or replace function public.normalize_evidencia_url_storage(p_raw text)
returns text
language plpgsql
immutable
as $$
declare
  v_raw text;
  v_normalized text;
begin
  v_raw := btrim(coalesce(p_raw, ''));
  if v_raw = '' then
    return null;
  end if;

  -- Canonical con o sin slash inicial
  if v_raw ~ '^/?evidencias-(publicas|sensibles)/.+' then
    v_normalized := regexp_replace(v_raw, '^/+', '');
  -- URL firmada/public/authenticated de Supabase -> bucket/path
  elsif v_raw ~ '^https?://[^/]+/storage/v1/object/sign/.+' then
    v_normalized := regexp_replace(v_raw, '^https?://[^/]+/storage/v1/object/sign/([^?]+).*$', '\1');
  elsif v_raw ~ '^https?://[^/]+/storage/v1/object/public/.+' then
    v_normalized := regexp_replace(v_raw, '^https?://[^/]+/storage/v1/object/public/([^?]+).*$', '\1');
  elsif v_raw ~ '^https?://[^/]+/storage/v1/object/authenticated/.+' then
    v_normalized := regexp_replace(v_raw, '^https?://[^/]+/storage/v1/object/authenticated/([^?]+).*$', '\1');
  -- Path relativo (con slash inicial)
  elsif v_raw ~ '^/storage/v1/object/sign/.+' then
    v_normalized := regexp_replace(v_raw, '^/storage/v1/object/sign/([^?]+).*$', '\1');
  elsif v_raw ~ '^/storage/v1/object/public/.+' then
    v_normalized := regexp_replace(v_raw, '^/storage/v1/object/public/([^?]+).*$', '\1');
  elsif v_raw ~ '^/storage/v1/object/authenticated/.+' then
    v_normalized := regexp_replace(v_raw, '^/storage/v1/object/authenticated/([^?]+).*$', '\1');
  -- Path relativo (sin slash inicial)
  elsif v_raw ~ '^storage/v1/object/sign/.+' then
    v_normalized := regexp_replace(v_raw, '^storage/v1/object/sign/([^?]+).*$', '\1');
  elsif v_raw ~ '^storage/v1/object/public/.+' then
    v_normalized := regexp_replace(v_raw, '^storage/v1/object/public/([^?]+).*$', '\1');
  elsif v_raw ~ '^storage/v1/object/authenticated/.+' then
    v_normalized := regexp_replace(v_raw, '^storage/v1/object/authenticated/([^?]+).*$', '\1');
  else
    return null;
  end if;

  -- Limpieza defensiva final
  v_normalized := regexp_replace(v_normalized, '^/+', '');
  v_normalized := replace(replace(v_normalized, '%2F', '/'), '%2f', '/');

  if v_normalized ~ '^evidencias-(publicas|sensibles)/.+' then
    return v_normalized;
  end if;

  return null;
end;
$$;

-- Re-aplicar trigger de enforcement por si el entorno quedó inconsistente.
drop trigger if exists trg_evidencias_url_storage_strict on public.evidencias;
create trigger trg_evidencias_url_storage_strict
before insert or update of url_storage on public.evidencias
for each row execute function public.enforce_evidencias_url_storage_strict();

-- Auto-normalizacion de filas que sí son convertibles.
with normalized as (
  select
    e.id,
    e.url_storage as old_value,
    public.normalize_evidencia_url_storage(e.url_storage) as new_value
  from public.evidencias e
)
update public.evidencias e
set url_storage = n.new_value
from normalized n
where e.id = n.id
  and n.new_value is not null
  and n.new_value <> n.old_value;

comment on function public.normalize_evidencia_url_storage(text) is
  'Normaliza url_storage a bucket/path (incluye variantes sign/public/authenticated y paths con %2F).';

