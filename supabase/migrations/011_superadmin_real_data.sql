-- =============================================================================
-- 011_superadmin_real_data.sql
-- Base persistente para Superadmin (tenants, permisos, feature flags, settings,
-- auditoria operativa) con RLS y funciones helper.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1) Roles y perfiles ampliados
-- ----------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_type where typname = 'rol_usuario') then
    begin
      alter type rol_usuario add value if not exists 'superadmin';
    exception when duplicate_object then null;
    end;
  end if;
end $$;

alter table if exists public.establecimientos
  add column if not exists activo boolean not null default true;

alter table if exists public.perfiles
  add column if not exists apellido text,
  add column if not exists activo boolean not null default true,
  add column if not exists permisos jsonb not null default '[]'::jsonb,
  add column if not exists tenant_ids uuid[] not null default '{}'::uuid[],
  add column if not exists updated_at timestamptz not null default now();

update public.perfiles
set apellido = coalesce(apellido, '')
where apellido is null;

update public.perfiles
set tenant_ids = case
  when establecimiento_id is null then coalesce(tenant_ids, '{}'::uuid[])
  else array_remove(array_cat(coalesce(tenant_ids, '{}'::uuid[]), array[establecimiento_id]), null)
end
where tenant_ids is null
   or (establecimiento_id is not null and not (establecimiento_id = any(tenant_ids)));

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_perfiles_set_updated_at on public.perfiles;
create trigger trg_perfiles_set_updated_at
before update on public.perfiles
for each row execute function public.set_updated_at_timestamp();

-- ----------------------------------------------------------------------------
-- 2) Funciones helper para autorización de plataforma
-- ----------------------------------------------------------------------------

create or replace function public.get_current_establecimiento_id()
returns uuid
language sql
stable
as $$
  select p.establecimiento_id
  from public.perfiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.get_current_user_rol_text()
returns text
language sql
stable
as $$
  select lower(p.rol::text)
  from public.perfiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_platform_superadmin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and lower(p.rol::text) in ('superadmin', 'sostenedor', 'admin')
      and coalesce(p.activo, true) = true
  );
$$;

create or replace function public.can_access_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_platform_superadmin()
    or exists (
      select 1
      from public.perfiles p
      where p.id = auth.uid()
        and coalesce(p.activo, true) = true
        and (
          p.establecimiento_id = p_tenant_id
          or p_tenant_id = any(coalesce(p.tenant_ids, '{}'::uuid[]))
        )
    );
$$;

-- ----------------------------------------------------------------------------
-- 3) Tablas superadmin persistentes
-- ----------------------------------------------------------------------------

create table if not exists public.tenant_feature_flags (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.establecimientos(id) on delete cascade,
  feature_key text not null,
  feature_label text not null,
  description text,
  enabled boolean not null default false,
  updated_by uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, feature_key)
);

create table if not exists public.platform_settings (
  id uuid primary key default uuid_generate_v4(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.superadmin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_user_id uuid not null references public.perfiles(id) on delete restrict,
  actor_role text,
  tenant_id uuid references public.establecimientos(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tenant_feature_flags_tenant on public.tenant_feature_flags(tenant_id);
create index if not exists idx_tenant_feature_flags_key on public.tenant_feature_flags(feature_key);
create index if not exists idx_platform_settings_key on public.platform_settings(setting_key);
create index if not exists idx_superadmin_audit_logs_created on public.superadmin_audit_logs(created_at desc);
create index if not exists idx_superadmin_audit_logs_tenant on public.superadmin_audit_logs(tenant_id);
create index if not exists idx_superadmin_audit_logs_actor on public.superadmin_audit_logs(actor_user_id);

-- Updated_at triggers

drop trigger if exists trg_tenant_feature_flags_set_updated_at on public.tenant_feature_flags;
create trigger trg_tenant_feature_flags_set_updated_at
before update on public.tenant_feature_flags
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_platform_settings_set_updated_at on public.platform_settings;
create trigger trg_platform_settings_set_updated_at
before update on public.platform_settings
for each row execute function public.set_updated_at_timestamp();

-- ----------------------------------------------------------------------------
-- 4) Seeds iniciales para flags/settings
-- ----------------------------------------------------------------------------

with defaults as (
  select * from (values
    ('dashboard.v2', 'Dashboard analitico avanzado', 'Version analitica avanzada del dashboard', true),
    ('asistente.legal', 'Asistente legal', 'Asistente para redaccion y revision legal', true),
    ('auditoria.extendida', 'Auditoria extendida', 'Trazabilidad extendida de operaciones', true),
    ('portal.apoderados', 'Portal apoderados', 'Portal externo para apoderados', false)
  ) as t(feature_key, feature_label, description, enabled)
)
insert into public.tenant_feature_flags (tenant_id, feature_key, feature_label, description, enabled)
select e.id, d.feature_key, d.feature_label, d.description, d.enabled
from public.establecimientos e
cross join defaults d
on conflict (tenant_id, feature_key) do nothing;

insert into public.platform_settings (setting_key, setting_value, description)
values
  ('security.enforce_strong_password', '{"enabled": true}'::jsonb, 'Exige contrasenas robustas'),
  ('security.require_mfa_for_admins', '{"enabled": true}'::jsonb, 'Obliga MFA para perfiles administrativos'),
  ('audit.retention_days', '{"value": 365}'::jsonb, 'Dias de retencion de auditoria'),
  ('backend.read_only_window', '{"enabled": false}'::jsonb, 'Modo de solo lectura para mantenimiento')
on conflict (setting_key) do nothing;

-- ----------------------------------------------------------------------------
-- 5) Funciones RPC para panel superadmin
-- ----------------------------------------------------------------------------

create or replace function public.log_superadmin_action(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_tenant_id uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_user_agent text default null,
  p_ip_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No authenticated user';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Forbidden';
  end if;

  insert into public.superadmin_audit_logs (
    actor_user_id,
    actor_role,
    tenant_id,
    action,
    entity_type,
    entity_id,
    payload,
    user_agent,
    ip_address
  )
  values (
    auth.uid(),
    public.get_current_user_rol_text(),
    p_tenant_id,
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_payload, '{}'::jsonb),
    p_user_agent,
    p_ip_address
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

revoke all on function public.log_superadmin_action(text, text, text, uuid, jsonb, text, text) from public;
grant execute on function public.log_superadmin_action(text, text, text, uuid, jsonb, text, text) to authenticated;

create or replace function public.get_superadmin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'No authenticated user';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Forbidden';
  end if;

  with tenant_stats as (
    select
      count(*)::int as total_tenants,
      count(*) filter (where activo = true)::int as active_tenants
    from public.establecimientos
  ),
  profile_stats as (
    select
      count(*)::int as total_users,
      count(*) filter (where coalesce(activo, true) = true)::int as active_users,
      count(*) filter (where lower(rol::text) in ('superadmin', 'sostenedor', 'admin', 'director'))::int as admin_users
    from public.perfiles
  ),
  flag_stats as (
    select
      count(*)::int as total_features,
      count(*) filter (where enabled = true)::int as enabled_features
    from public.tenant_feature_flags
  )
  select jsonb_build_object(
    'total_tenants', tenant_stats.total_tenants,
    'active_tenants', tenant_stats.active_tenants,
    'total_users', profile_stats.total_users,
    'active_users', profile_stats.active_users,
    'admin_users', profile_stats.admin_users,
    'total_features', flag_stats.total_features,
    'enabled_features', flag_stats.enabled_features
  )
  into v_result
  from tenant_stats, profile_stats, flag_stats;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

revoke all on function public.get_superadmin_dashboard_metrics() from public;
grant execute on function public.get_superadmin_dashboard_metrics() to authenticated;

-- ----------------------------------------------------------------------------
-- 6) RLS
-- ----------------------------------------------------------------------------

alter table public.tenant_feature_flags enable row level security;
alter table public.platform_settings enable row level security;
alter table public.superadmin_audit_logs enable row level security;

-- tenant_feature_flags

drop policy if exists tenant_feature_flags_select on public.tenant_feature_flags;
create policy tenant_feature_flags_select
on public.tenant_feature_flags
for select
using (
  public.is_platform_superadmin()
  or public.can_access_tenant(tenant_id)
);

drop policy if exists tenant_feature_flags_write on public.tenant_feature_flags;
create policy tenant_feature_flags_write
on public.tenant_feature_flags
for all
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

-- platform_settings

drop policy if exists platform_settings_select on public.platform_settings;
create policy platform_settings_select
on public.platform_settings
for select
using (public.is_platform_superadmin());

drop policy if exists platform_settings_write on public.platform_settings;
create policy platform_settings_write
on public.platform_settings
for all
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

-- superadmin_audit_logs

drop policy if exists superadmin_audit_logs_select on public.superadmin_audit_logs;
create policy superadmin_audit_logs_select
on public.superadmin_audit_logs
for select
using (public.is_platform_superadmin());

drop policy if exists superadmin_audit_logs_insert on public.superadmin_audit_logs;
create policy superadmin_audit_logs_insert
on public.superadmin_audit_logs
for insert
with check (public.is_platform_superadmin() and actor_user_id = auth.uid());

comment on table public.tenant_feature_flags is
  'Feature flags por tenant para habilitar/deshabilitar funcionalidades por colegio.';

comment on table public.platform_settings is
  'Configuraciones globales de plataforma administradas por superadmin.';

comment on table public.superadmin_audit_logs is
  'Auditoria detallada de acciones de superadministracion.';
