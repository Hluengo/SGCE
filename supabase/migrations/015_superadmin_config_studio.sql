-- =============================================================================
-- 015_superadmin_config_studio.sql
-- Control plane para administrar backend Supabase desde frontend superadmin.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1) Entidades de cambios y catálogos configurables
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'admin_changeset_status'
      and n.nspname = 'public'
  ) then
    create type public.admin_changeset_status as enum (
      'draft',
      'validated',
      'applied',
      'failed',
      'reverted'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'admin_scope'
      and n.nspname = 'public'
  ) then
    create type public.admin_scope as enum (
      'global',
      'tenant'
    );
  end if;
end $$;

create table if not exists public.admin_changesets (
  id uuid primary key default uuid_generate_v4(),
  scope public.admin_scope not null default 'global',
  tenant_id uuid references public.establecimientos(id) on delete set null,
  module text not null,
  title text not null,
  summary text,
  desired_state jsonb not null default '{}'::jsonb,
  generated_sql text[] not null default '{}'::text[],
  rollback_sql text[] not null default '{}'::text[],
  validation_report jsonb not null default '{}'::jsonb,
  status public.admin_changeset_status not null default 'draft',
  created_by uuid not null references public.perfiles(id) on delete restrict,
  applied_by uuid references public.perfiles(id) on delete set null,
  reverted_by uuid references public.perfiles(id) on delete set null,
  error_text text,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  reverted_at timestamptz
);

create index if not exists idx_admin_changesets_created_at on public.admin_changesets(created_at desc);
create index if not exists idx_admin_changesets_status on public.admin_changesets(status);
create index if not exists idx_admin_changesets_scope_tenant on public.admin_changesets(scope, tenant_id);

create table if not exists public.admin_change_events (
  id uuid primary key default uuid_generate_v4(),
  changeset_id uuid not null references public.admin_changesets(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.perfiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_change_events_changeset on public.admin_change_events(changeset_id, created_at desc);

create table if not exists public.storage_bucket_registry (
  id uuid primary key default uuid_generate_v4(),
  scope public.admin_scope not null default 'global',
  tenant_id uuid references public.establecimientos(id) on delete cascade,
  bucket_name text not null,
  is_public boolean not null default false,
  file_size_limit_mb int not null default 20,
  allowed_mime_types text[] not null default '{}'::text[],
  policy_json jsonb not null default '{}'::jsonb,
  updated_by uuid references public.perfiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, tenant_id, bucket_name)
);

create table if not exists public.edge_function_registry (
  id uuid primary key default uuid_generate_v4(),
  scope public.admin_scope not null default 'global',
  tenant_id uuid references public.establecimientos(id) on delete cascade,
  function_name text not null,
  enabled boolean not null default true,
  version text,
  source_hash text,
  env_json jsonb not null default '{}'::jsonb,
  route_path text,
  updated_by uuid references public.perfiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, tenant_id, function_name)
);

-- ----------------------------------------------------------------------------
-- 2) Validación SQL y ejecución controlada
-- ----------------------------------------------------------------------------

create or replace function public.validate_admin_sql_statements(p_sql text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_statement text;
  v_errors jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_index int := 0;
  v_forbidden_patterns text[] := array[
    'drop schema',
    'alter role postgres',
    'grant all on database',
    'truncate auth.',
    'drop table auth.',
    'delete from auth.users',
    'update auth.users set encrypted_password',
    'create extension dblink'
  ];
  v_pattern text;
begin
  if p_sql is null or cardinality(p_sql) = 0 then
    return jsonb_build_object(
      'ok', false,
      'errors', jsonb_build_array('No hay sentencias SQL para ejecutar.'),
      'warnings', '[]'::jsonb
    );
  end if;

  foreach v_statement in array p_sql
  loop
    v_index := v_index + 1;

    if btrim(v_statement) = '' then
      v_errors := v_errors || jsonb_build_array(format('Sentencia %s vacía.', v_index));
      continue;
    end if;

    foreach v_pattern in array v_forbidden_patterns
    loop
      if lower(v_statement) like '%' || v_pattern || '%' then
        v_errors := v_errors || jsonb_build_array(format('Sentencia %s contiene patrón bloqueado: %s', v_index, v_pattern));
      end if;
    end loop;

    if lower(v_statement) like '%drop table%' then
      v_warnings := v_warnings || jsonb_build_array(format('Sentencia %s elimina una tabla.', v_index));
    elsif lower(v_statement) like '%alter table%' then
      v_warnings := v_warnings || jsonb_build_array(format('Sentencia %s altera estructura de tabla.', v_index));
    end if;
  end loop;

  return jsonb_build_object(
    'ok', jsonb_array_length(v_errors) = 0,
    'errors', v_errors,
    'warnings', v_warnings,
    'statement_count', cardinality(p_sql)
  );
end;
$$;

create or replace function public.apply_admin_changeset(p_changeset_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sql text[];
  v_scope public.admin_scope;
  v_tenant_id uuid;
  v_validation jsonb;
  v_stmt text;
begin
  if auth.uid() is null then
    raise exception 'No authenticated user';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Forbidden';
  end if;

  select generated_sql, scope, tenant_id
  into v_sql, v_scope, v_tenant_id
  from public.admin_changesets
  where id = p_changeset_id
  for update;

  if not found then
    raise exception 'Changeset no existe';
  end if;

  v_validation := public.validate_admin_sql_statements(v_sql);

  update public.admin_changesets
  set validation_report = v_validation,
      status = case when (v_validation->>'ok')::boolean then 'validated'::public.admin_changeset_status else 'failed'::public.admin_changeset_status end,
      error_text = case when (v_validation->>'ok')::boolean then null else coalesce((v_validation->'errors')::text, 'Validación fallida') end
  where id = p_changeset_id;

  if not (v_validation->>'ok')::boolean then
    return jsonb_build_object('ok', false, 'validation', v_validation);
  end if;

  begin
    foreach v_stmt in array v_sql
    loop
      execute v_stmt;
    end loop;

    update public.admin_changesets
    set status = 'applied',
        applied_by = auth.uid(),
        applied_at = now(),
        error_text = null
    where id = p_changeset_id;

    insert into public.admin_change_events (changeset_id, event_type, payload, created_by)
    values (p_changeset_id, 'applied', jsonb_build_object('scope', v_scope, 'tenant_id', v_tenant_id), auth.uid());

    perform public.log_superadmin_action(
      p_action => 'changeset_apply',
      p_entity_type => 'admin_changesets',
      p_entity_id => p_changeset_id::text,
      p_tenant_id => v_tenant_id,
      p_payload => jsonb_build_object('scope', v_scope)
    );

    return jsonb_build_object('ok', true, 'validation', v_validation);
  exception when others then
    update public.admin_changesets
    set status = 'failed',
        error_text = SQLERRM
    where id = p_changeset_id;

    insert into public.admin_change_events (changeset_id, event_type, payload, created_by)
    values (p_changeset_id, 'failed', jsonb_build_object('error', SQLERRM), auth.uid());

    return jsonb_build_object('ok', false, 'error', SQLERRM, 'validation', v_validation);
  end;
end;
$$;

create or replace function public.revert_admin_changeset(p_changeset_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sql text[];
  v_tenant_id uuid;
  v_stmt text;
begin
  if auth.uid() is null then
    raise exception 'No authenticated user';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Forbidden';
  end if;

  select rollback_sql, tenant_id
  into v_sql, v_tenant_id
  from public.admin_changesets
  where id = p_changeset_id
  for update;

  if not found then
    raise exception 'Changeset no existe';
  end if;

  if v_sql is null or cardinality(v_sql) = 0 then
    return jsonb_build_object('ok', false, 'error', 'No rollback_sql definido para este changeset');
  end if;

  begin
    foreach v_stmt in array v_sql
    loop
      execute v_stmt;
    end loop;

    update public.admin_changesets
    set status = 'reverted',
        reverted_by = auth.uid(),
        reverted_at = now(),
        error_text = null
    where id = p_changeset_id;

    insert into public.admin_change_events (changeset_id, event_type, payload, created_by)
    values (p_changeset_id, 'reverted', '{}'::jsonb, auth.uid());

    perform public.log_superadmin_action(
      p_action => 'changeset_revert',
      p_entity_type => 'admin_changesets',
      p_entity_id => p_changeset_id::text,
      p_tenant_id => v_tenant_id,
      p_payload => '{}'::jsonb
    );

    return jsonb_build_object('ok', true);
  exception when others then
    update public.admin_changesets
    set error_text = SQLERRM
    where id = p_changeset_id;

    return jsonb_build_object('ok', false, 'error', SQLERRM);
  end;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3) Trigger updated_at
-- ----------------------------------------------------------------------------

drop trigger if exists trg_storage_bucket_registry_set_updated_at on public.storage_bucket_registry;
create trigger trg_storage_bucket_registry_set_updated_at
before update on public.storage_bucket_registry
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_edge_function_registry_set_updated_at on public.edge_function_registry;
create trigger trg_edge_function_registry_set_updated_at
before update on public.edge_function_registry
for each row execute function public.set_updated_at_timestamp();

-- ----------------------------------------------------------------------------
-- 4) RLS
-- ----------------------------------------------------------------------------

alter table public.admin_changesets enable row level security;
alter table public.admin_change_events enable row level security;
alter table public.storage_bucket_registry enable row level security;
alter table public.edge_function_registry enable row level security;

drop policy if exists admin_changesets_select on public.admin_changesets;
create policy admin_changesets_select
on public.admin_changesets
for select
using (
  public.is_platform_superadmin()
  or (
    scope = 'tenant'
    and tenant_id is not null
    and public.can_access_tenant(tenant_id)
  )
);

drop policy if exists admin_changesets_insert on public.admin_changesets;
create policy admin_changesets_insert
on public.admin_changesets
for insert
with check (
  public.is_platform_superadmin()
  and created_by = auth.uid()
  and (
    scope = 'global'
    or (scope = 'tenant' and tenant_id is not null and public.can_access_tenant(tenant_id))
  )
);

drop policy if exists admin_changesets_update on public.admin_changesets;
create policy admin_changesets_update
on public.admin_changesets
for update
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

drop policy if exists admin_change_events_select on public.admin_change_events;
create policy admin_change_events_select
on public.admin_change_events
for select
using (
  public.is_platform_superadmin()
  or exists (
    select 1
    from public.admin_changesets cs
    where cs.id = admin_change_events.changeset_id
      and cs.scope = 'tenant'
      and cs.tenant_id is not null
      and public.can_access_tenant(cs.tenant_id)
  )
);

drop policy if exists admin_change_events_insert on public.admin_change_events;
create policy admin_change_events_insert
on public.admin_change_events
for insert
with check (public.is_platform_superadmin());

drop policy if exists storage_bucket_registry_select on public.storage_bucket_registry;
create policy storage_bucket_registry_select
on public.storage_bucket_registry
for select
using (
  public.is_platform_superadmin()
  or (scope = 'tenant' and tenant_id is not null and public.can_access_tenant(tenant_id))
);

drop policy if exists storage_bucket_registry_write on public.storage_bucket_registry;
create policy storage_bucket_registry_write
on public.storage_bucket_registry
for all
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

drop policy if exists edge_function_registry_select on public.edge_function_registry;
create policy edge_function_registry_select
on public.edge_function_registry
for select
using (
  public.is_platform_superadmin()
  or (scope = 'tenant' and tenant_id is not null and public.can_access_tenant(tenant_id))
);

drop policy if exists edge_function_registry_write on public.edge_function_registry;
create policy edge_function_registry_write
on public.edge_function_registry
for all
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

-- ----------------------------------------------------------------------------
-- 5) Grants
-- ----------------------------------------------------------------------------

revoke all on function public.validate_admin_sql_statements(text[]) from public;
revoke all on function public.apply_admin_changeset(uuid) from public;
revoke all on function public.revert_admin_changeset(uuid) from public;

grant execute on function public.validate_admin_sql_statements(text[]) to authenticated, service_role;
grant execute on function public.apply_admin_changeset(uuid) to authenticated;
grant execute on function public.revert_admin_changeset(uuid) to authenticated;

comment on table public.admin_changesets is
  'Changesets generados desde UI de superadministración para aplicar/revertir configuraciones de backend.';

comment on function public.apply_admin_changeset(uuid) is
  'Aplica en transacción un changeset SQL validado y registra auditoría.';

comment on function public.revert_admin_changeset(uuid) is
  'Ejecuta rollback_sql asociado al changeset y registra auditoría.';
