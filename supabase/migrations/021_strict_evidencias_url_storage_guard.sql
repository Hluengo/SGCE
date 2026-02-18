-- =============================================================================
-- 021_strict_evidencias_url_storage_guard.sql
-- Modo estricto para public.evidencias.url_storage:
-- - Normaliza formatos válidos de Supabase a bucket/path.
-- - Bloquea inserts/updates con formatos inválidos.
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

  -- Ya en formato canonical: bucket/path
  if v_raw ~ '^evidencias-(publicas|sensibles)/.+' then
    return v_raw;
  end if;

  -- URL firmada/public/authenticated de Supabase -> bucket/path
  if v_raw ~ '^https?://[^/]+/storage/v1/object/sign/.+' then
    v_normalized := regexp_replace(v_raw, '^https?://[^/]+/storage/v1/object/sign/([^?]+).*$', '\1');
    return v_normalized;
  end if;
  if v_raw ~ '^https?://[^/]+/storage/v1/object/public/.+' then
    v_normalized := regexp_replace(v_raw, '^https?://[^/]+/storage/v1/object/public/([^?]+).*$', '\1');
    return v_normalized;
  end if;
  if v_raw ~ '^https?://[^/]+/storage/v1/object/authenticated/.+' then
    v_normalized := regexp_replace(v_raw, '^https?://[^/]+/storage/v1/object/authenticated/([^?]+).*$', '\1');
    return v_normalized;
  end if;

  -- Path relativo de endpoint storage -> bucket/path
  if v_raw ~ '^/storage/v1/object/sign/.+' then
    v_normalized := regexp_replace(v_raw, '^/storage/v1/object/sign/([^?]+).*$', '\1');
    return v_normalized;
  end if;
  if v_raw ~ '^/storage/v1/object/public/.+' then
    v_normalized := regexp_replace(v_raw, '^/storage/v1/object/public/([^?]+).*$', '\1');
    return v_normalized;
  end if;
  if v_raw ~ '^/storage/v1/object/authenticated/.+' then
    v_normalized := regexp_replace(v_raw, '^/storage/v1/object/authenticated/([^?]+).*$', '\1');
    return v_normalized;
  end if;

  -- Formato inválido
  return null;
end;
$$;

create or replace function public.enforce_evidencias_url_storage_strict()
returns trigger
language plpgsql
as $$
declare
  v_normalized text;
begin
  v_normalized := public.normalize_evidencia_url_storage(new.url_storage);

  if v_normalized is null then
    raise exception using
      errcode = '22023',
      message = 'url_storage inválido en public.evidencias',
      detail = format(
        'Valor recibido: "%s". Formato esperado: evidencias-publicas/<path> o evidencias-sensibles/<path> (también se aceptan URLs Supabase convertibles).',
        coalesce(new.url_storage, 'NULL')
      );
  end if;

  if v_normalized !~ '^evidencias-(publicas|sensibles)/.+' then
    raise exception using
      errcode = '22023',
      message = 'url_storage fuera de buckets permitidos',
      detail = format('Valor normalizado: "%s". Buckets permitidos: evidencias-publicas, evidencias-sensibles.', v_normalized);
  end if;

  new.url_storage := v_normalized;
  return new;
end;
$$;

drop trigger if exists trg_evidencias_url_storage_strict on public.evidencias;
create trigger trg_evidencias_url_storage_strict
before insert or update of url_storage on public.evidencias
for each row execute function public.enforce_evidencias_url_storage_strict();

comment on function public.normalize_evidencia_url_storage(text) is
  'Normaliza url_storage de evidencias a formato canonical bucket/path.';

comment on function public.enforce_evidencias_url_storage_strict() is
  'Bloquea escritura de url_storage inválido y fuerza formato canonical.';
