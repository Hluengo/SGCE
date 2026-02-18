-- =============================================================================
-- 014_rls_recursion_hotfix.sql
-- Corrige recursión infinita en RLS de perfiles y endurece políticas abiertas.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) Helpers anti-recursión (SECURITY DEFINER)
-- ----------------------------------------------------------------------------

create or replace function public.get_current_establecimiento_id()
returns uuid
language sql
stable
security definer
set search_path = public
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
security definer
set search_path = public
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
security definer
set search_path = public
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
security definer
set search_path = public
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

create or replace function public.user_has_access_to_establecimiento(p_establecimiento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_access_tenant(p_establecimiento_id);
$$;

create or replace function public.can_user_access_row(p_establecimiento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_access_tenant(p_establecimiento_id);
$$;

-- ----------------------------------------------------------------------------
-- 2) Políticas sin subconsulta recursiva sobre perfiles
-- ----------------------------------------------------------------------------

-- establecimientos
alter table if exists public.establecimientos enable row level security;
drop policy if exists admin_write_establecimientos on public.establecimientos;
drop policy if exists public_read_establecimientos on public.establecimientos;

create policy public_read_establecimientos
on public.establecimientos
for select
using (true);

create policy admin_write_establecimientos
on public.establecimientos
for all
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

-- perfiles
alter table if exists public.perfiles enable row level security;

drop policy if exists perfiles_own_establecimiento on public.perfiles;
drop policy if exists public_read_perfiles on public.perfiles;
drop policy if exists auth_write_perfiles on public.perfiles;
drop policy if exists perfiles_self_read on public.perfiles;
drop policy if exists perfiles_read_directivos on public.perfiles;
drop policy if exists perfiles_insert_admin on public.perfiles;
drop policy if exists perfiles_update_admin on public.perfiles;
drop policy if exists perfiles_delete_admin on public.perfiles;
drop policy if exists perfiles_select_self_or_superadmin on public.perfiles;
drop policy if exists perfiles_insert_superadmin on public.perfiles;
drop policy if exists perfiles_update_self_or_superadmin on public.perfiles;
drop policy if exists perfiles_delete_superadmin on public.perfiles;

create policy perfiles_select_self_or_superadmin
on public.perfiles
for select
using (
  auth.uid() = id
  or public.is_platform_superadmin()
  or public.can_access_tenant(establecimiento_id)
);

create policy perfiles_insert_superadmin
on public.perfiles
for insert
with check (public.is_platform_superadmin());

create policy perfiles_update_self_or_superadmin
on public.perfiles
for update
using (
  auth.uid() = id
  or public.is_platform_superadmin()
)
with check (
  auth.uid() = id
  or public.is_platform_superadmin()
);

create policy perfiles_delete_superadmin
on public.perfiles
for delete
using (public.is_platform_superadmin());

-- ----------------------------------------------------------------------------
-- 3) Cerrar políticas legacy abiertas en tablas tenant
-- ----------------------------------------------------------------------------

do $$
declare
  v_table text;
  v_tables text[] := array[
    'estudiantes',
    'expedientes',
    'evidencias',
    'bitacora_psicosocial',
    'medidas_apoyo',
    'incidentes',
    'logs_auditoria',
    'cursos_inspector',
    'hitos_expediente',
    'derivaciones_externas',
    'bitacora_salida',
    'reportes_patio',
    'mediaciones_gcc',
    'compromisos_mediacion',
    'carpetas_documentales',
    'documentos_institucionales'
  ];
begin
  foreach v_table in array v_tables
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = v_table
    ) then
      execute format('alter table public.%I enable row level security', v_table);
      execute format('drop policy if exists public_read_%I on public.%I', v_table, v_table);
      execute format('drop policy if exists auth_write_%I on public.%I', v_table, v_table);
    end if;
  end loop;
end $$;

-- remover cualquier política permisiva remanente (qual/with_check abiertos)
do $$
declare
  v_policy record;
begin
  for v_policy in
    select p.tablename, p.policyname
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in (
        'estudiantes',
        'expedientes',
        'evidencias',
        'bitacora_psicosocial',
        'medidas_apoyo',
        'incidentes',
        'logs_auditoria',
        'cursos_inspector'
      )
      and (
        coalesce(p.qual, '') = 'true'
        or coalesce(p.qual, '') ilike '%auth.role() = ''authenticated''%'
        or coalesce(p.with_check, '') = 'true'
        or coalesce(p.with_check, '') ilike '%auth.role() = ''authenticated''%'
      )
  loop
    execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_policy.tablename);
  end loop;
end $$;

-- tenant_feature_flags: evitar política adicional conflictiva de 012
alter table if exists public.tenant_feature_flags enable row level security;
drop policy if exists tenant_feature_flags_isolation on public.tenant_feature_flags;

-- ----------------------------------------------------------------------------
-- 4) Reforzar grants de funciones helper
-- ----------------------------------------------------------------------------

revoke all on function public.get_current_establecimiento_id() from public;
revoke all on function public.get_current_user_rol_text() from public;
revoke all on function public.is_platform_superadmin() from public;
revoke all on function public.can_access_tenant(uuid) from public;
revoke all on function public.user_has_access_to_establecimiento(uuid) from public;
revoke all on function public.can_user_access_row(uuid) from public;

grant execute on function public.get_current_establecimiento_id() to authenticated, service_role;
grant execute on function public.get_current_user_rol_text() to authenticated, service_role;
grant execute on function public.is_platform_superadmin() to authenticated, service_role;
grant execute on function public.can_access_tenant(uuid) to authenticated, service_role;
grant execute on function public.user_has_access_to_establecimiento(uuid) to authenticated, service_role;
grant execute on function public.can_user_access_row(uuid) to authenticated, service_role;

comment on schema public is
  'Hotfix RLS 014 aplicado: sin recursión en perfiles y sin políticas legacy abiertas.';
