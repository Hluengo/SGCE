-- =============================================================================
-- 013_bootstrap_superadmin_and_rls_checks.sql
-- Bootstrap de superadmin + checks automáticos de seguridad RLS
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1) Helpers
-- ----------------------------------------------------------------------------

create or replace function public.default_superadmin_permissions()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_array(
    'expedientes:crear',
    'expedientes:leer',
    'expedientes:editar',
    'expedientes:eliminar',
    'expedientes:archivar',
    'expedientes:asignar',
    'documentos:subir',
    'documentos:eliminar',
    'reportes:generar',
    'reportes:exportar',
    'usuarios:gestionar',
    'usuarios:roles:gestionar',
    'configuracion:editar',
    'configuracion:tenant:editar',
    'bitacora:ver',
    'bitacora:exportar',
    'tenants:gestionar',
    'dashboard:analitica:ver',
    'monitorizacion:ver',
    'mantenimiento:ejecutar',
    'backend:configurar',
    'system:manage'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2) Bootstrap superadmin por email (usuario auth existente)
-- ----------------------------------------------------------------------------

create or replace function public.bootstrap_superadmin_by_email(
  p_email text,
  p_nombre text,
  p_apellido text default '',
  p_establecimiento_id uuid default null,
  p_tenant_ids uuid[] default null,
  p_permisos jsonb default null,
  p_force_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_target_establecimiento_id uuid;
  v_target_tenant_ids uuid[];
  v_target_permisos jsonb;
  v_exists boolean;
begin
  if p_email is null or btrim(p_email) = '' then
    raise exception 'Email es obligatorio';
  end if;

  select u.id
  into v_user_id
  from auth.users u
  where lower(u.email) = lower(btrim(p_email))
  limit 1;

  if v_user_id is null then
    raise exception 'No existe usuario en auth.users para email: %', p_email;
  end if;

  if p_establecimiento_id is null then
    select e.id
    into v_target_establecimiento_id
    from public.establecimientos e
    where coalesce(e.activo, true) = true
    order by e.created_at asc
    limit 1;
  else
    v_target_establecimiento_id := p_establecimiento_id;
  end if;

  if v_target_establecimiento_id is null then
    raise exception 'No se pudo resolver establecimiento para bootstrap';
  end if;

  if p_tenant_ids is null or cardinality(p_tenant_ids) = 0 then
    v_target_tenant_ids := array[v_target_establecimiento_id];
  else
    v_target_tenant_ids := array_remove(array_cat(p_tenant_ids, array[v_target_establecimiento_id]), null);
  end if;

  v_target_permisos := coalesce(p_permisos, public.default_superadmin_permissions());

  select exists(select 1 from public.perfiles p where p.id = v_user_id)
  into v_exists;

  if v_exists then
    update public.perfiles
    set
      nombre = coalesce(nullif(btrim(p_nombre), ''), nombre),
      apellido = coalesce(p_apellido, apellido),
      rol = 'superadmin'::rol_usuario,
      establecimiento_id = v_target_establecimiento_id,
      tenant_ids = v_target_tenant_ids,
      permisos = v_target_permisos,
      activo = p_force_active,
      updated_at = now()
    where id = v_user_id;
  else
    insert into public.perfiles (
      id,
      nombre,
      apellido,
      rol,
      establecimiento_id,
      tenant_ids,
      permisos,
      activo
    )
    values (
      v_user_id,
      coalesce(nullif(btrim(p_nombre), ''), split_part(p_email, '@', 1)),
      coalesce(p_apellido, ''),
      'superadmin'::rol_usuario,
      v_target_establecimiento_id,
      v_target_tenant_ids,
      v_target_permisos,
      p_force_active
    );
  end if;

  update auth.users
  set
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'role', 'SUPERADMIN',
        'establecimiento_id', v_target_establecimiento_id::text,
        'tenant_ids', to_jsonb(v_target_tenant_ids)
      ),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'nombre', coalesce(nullif(btrim(p_nombre), ''), split_part(p_email, '@', 1)),
        'apellido', coalesce(p_apellido, ''),
        'establecimiento_id', v_target_establecimiento_id::text
      )
  where id = v_user_id;

  perform public.log_superadmin_action(
    p_action => 'bootstrap_superadmin',
    p_entity_type => 'perfiles',
    p_entity_id => v_user_id::text,
    p_tenant_id => v_target_establecimiento_id,
    p_payload => jsonb_build_object('email', lower(btrim(p_email)), 'tenant_ids', to_jsonb(v_target_tenant_ids))
  );

  return jsonb_build_object(
    'status', 'ok',
    'user_id', v_user_id,
    'email', lower(btrim(p_email)),
    'rol', 'superadmin',
    'establecimiento_id', v_target_establecimiento_id,
    'tenant_ids', to_jsonb(v_target_tenant_ids)
  );
end;
$$;

revoke all on function public.bootstrap_superadmin_by_email(text, text, text, uuid, uuid[], jsonb, boolean) from public;
revoke all on function public.bootstrap_superadmin_by_email(text, text, text, uuid, uuid[], jsonb, boolean) from anon;
revoke all on function public.bootstrap_superadmin_by_email(text, text, text, uuid, uuid[], jsonb, boolean) from authenticated;
grant execute on function public.bootstrap_superadmin_by_email(text, text, text, uuid, uuid[], jsonb, boolean) to service_role;

-- Bootstrap masivo desde JSON
create or replace function public.bootstrap_superadmins_from_json(
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_results jsonb := '[]'::jsonb;
  v_result jsonb;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'array' then
    raise exception 'El payload debe ser un arreglo JSON';
  end if;

  for v_item in select * from jsonb_array_elements(p_payload)
  loop
    v_result := public.bootstrap_superadmin_by_email(
      p_email => v_item->>'email',
      p_nombre => coalesce(v_item->>'nombre', split_part(v_item->>'email', '@', 1)),
      p_apellido => coalesce(v_item->>'apellido', ''),
      p_establecimiento_id => nullif(v_item->>'establecimiento_id', '')::uuid,
      p_tenant_ids => case
        when v_item ? 'tenant_ids' then
          array(select jsonb_array_elements_text(v_item->'tenant_ids')::uuid)
        else null
      end,
      p_permisos => case when v_item ? 'permisos' then v_item->'permisos' else null end,
      p_force_active => coalesce((v_item->>'activo')::boolean, true)
    );

    v_results := v_results || jsonb_build_array(v_result);
  end loop;

  return v_results;
end;
$$;

revoke all on function public.bootstrap_superadmins_from_json(jsonb) from public;
revoke all on function public.bootstrap_superadmins_from_json(jsonb) from anon;
revoke all on function public.bootstrap_superadmins_from_json(jsonb) from authenticated;
grant execute on function public.bootstrap_superadmins_from_json(jsonb) to service_role;

-- ----------------------------------------------------------------------------
-- 3) Checks automáticos de RLS (metadata + smoke test de helpers)
-- ----------------------------------------------------------------------------

create or replace function public.run_rls_policy_checks()
returns table(
  check_name text,
  status text,
  details jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table text;
  v_tables text[] := array[
    'establecimientos',
    'perfiles',
    'estudiantes',
    'expedientes',
    'evidencias',
    'bitacora_psicosocial',
    'medidas_apoyo',
    'incidentes',
    'logs_auditoria',
    'cursos_inspector',
    'tenant_feature_flags',
    'platform_settings',
    'superadmin_audit_logs'
  ];
  v_rls_enabled boolean;
  v_policy_count int;
  v_public_open_count int;
begin
  foreach v_table in array v_tables
  loop
    select c.relrowsecurity
      into v_rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = v_table
      and c.relkind = 'r';

    if v_rls_enabled is null then
      return query
      select
        format('rls_enabled:%s', v_table),
        'FAIL',
        jsonb_build_object('reason', 'tabla no existe');
    else
      return query
      select
        format('rls_enabled:%s', v_table),
        case when v_rls_enabled then 'PASS' else 'FAIL' end,
        jsonb_build_object('rls_enabled', v_rls_enabled);
    end if;

    select count(*)
      into v_policy_count
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = v_table;

    return query
    select
      format('policies_exist:%s', v_table),
      case when v_policy_count > 0 then 'PASS' else 'FAIL' end,
      jsonb_build_object('policy_count', v_policy_count);
  end loop;

  select count(*)
  into v_public_open_count
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename in ('estudiantes', 'expedientes', 'evidencias', 'bitacora_psicosocial', 'medidas_apoyo', 'incidentes', 'logs_auditoria')
    and (
      p.qual = 'true'
      or p.qual ilike '%auth.role() = ''authenticated''%'
    );

  return query
  select
    'tenant_tables_not_publicly_open',
    case when v_public_open_count = 0 then 'PASS' else 'WARN' end,
    jsonb_build_object('potentially_open_policies', v_public_open_count);

  return query
  select
    'required_functions_exist',
    case when (
      exists(select 1 from pg_proc where proname = 'is_platform_superadmin')
      and exists(select 1 from pg_proc where proname = 'log_superadmin_action')
      and exists(select 1 from pg_proc where proname = 'get_superadmin_dashboard_metrics')
      and exists(select 1 from pg_proc where proname = 'can_access_tenant')
    ) then 'PASS' else 'FAIL' end,
    jsonb_build_object('required', jsonb_build_array('is_platform_superadmin', 'log_superadmin_action', 'get_superadmin_dashboard_metrics', 'can_access_tenant'));
end;
$$;

revoke all on function public.run_rls_policy_checks() from public;
revoke all on function public.run_rls_policy_checks() from anon;
grant execute on function public.run_rls_policy_checks() to authenticated;
grant execute on function public.run_rls_policy_checks() to service_role;

create or replace function public.run_tenant_access_smoke_test(
  p_superadmin_user_id uuid,
  p_regular_user_id uuid,
  p_regular_user_tenant uuid,
  p_other_tenant uuid
)
returns table(
  check_name text,
  status text,
  details jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_sub text;
  v_superadmin_can_regular_tenant boolean;
  v_superadmin_can_other_tenant boolean;
  v_regular_can_own boolean;
  v_regular_can_other boolean;
begin
  v_old_sub := current_setting('request.jwt.claim.sub', true);

  perform set_config('request.jwt.claim.sub', p_superadmin_user_id::text, true);
  select public.can_access_tenant(p_regular_user_tenant), public.can_access_tenant(p_other_tenant)
  into v_superadmin_can_regular_tenant, v_superadmin_can_other_tenant;

  return query
  select
    'superadmin_access_any_tenant',
    case when v_superadmin_can_regular_tenant and v_superadmin_can_other_tenant then 'PASS' else 'FAIL' end,
    jsonb_build_object(
      'tenant_regular', v_superadmin_can_regular_tenant,
      'tenant_other', v_superadmin_can_other_tenant
    );

  perform set_config('request.jwt.claim.sub', p_regular_user_id::text, true);
  select public.can_access_tenant(p_regular_user_tenant), public.can_access_tenant(p_other_tenant)
  into v_regular_can_own, v_regular_can_other;

  return query
  select
    'regular_user_tenant_isolation',
    case when v_regular_can_own and not v_regular_can_other then 'PASS' else 'FAIL' end,
    jsonb_build_object(
      'own_tenant', v_regular_can_own,
      'other_tenant', v_regular_can_other
    );

  perform set_config('request.jwt.claim.sub', coalesce(v_old_sub, ''), true);
exception
  when others then
    perform set_config('request.jwt.claim.sub', coalesce(v_old_sub, ''), true);
    raise;
end;
$$;

revoke all on function public.run_tenant_access_smoke_test(uuid, uuid, uuid, uuid) from public;
revoke all on function public.run_tenant_access_smoke_test(uuid, uuid, uuid, uuid) from anon;
grant execute on function public.run_tenant_access_smoke_test(uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.run_tenant_access_smoke_test(uuid, uuid, uuid, uuid) to service_role;

comment on function public.bootstrap_superadmin_by_email(text, text, text, uuid, uuid[], jsonb, boolean) is
  'Bootstrap seguro de perfil superadmin a partir de usuario existente en auth.users.';

comment on function public.run_rls_policy_checks() is
  'Checks automáticos de seguridad RLS y políticas para tablas clave de tenant/superadmin.';

comment on function public.run_tenant_access_smoke_test(uuid, uuid, uuid, uuid) is
  'Smoke test de aislamiento: superadmin multi-tenant y usuario regular aislado a su tenant.';

-- ----------------------------------------------------------------------------
-- Uso sugerido
-- ----------------------------------------------------------------------------
-- 1) Bootstrap de un superadmin:
-- select public.bootstrap_superadmin_by_email(
--   p_email => 'superadmin@tu-dominio.cl',
--   p_nombre => 'Super',
--   p_apellido => 'Admin'
-- );
--
-- 2) Bootstrap masivo:
-- select public.bootstrap_superadmins_from_json(
--   '[
--      {"email":"sa1@dominio.cl","nombre":"SA","apellido":"Uno"},
--      {"email":"sa2@dominio.cl","nombre":"SA","apellido":"Dos"}
--    ]'::jsonb
-- );
--
-- 3) Checks de políticas RLS:
-- select * from public.run_rls_policy_checks();
--
-- 4) Smoke test de aislamiento por tenant:
-- select * from public.run_tenant_access_smoke_test(
--   p_superadmin_user_id => '00000000-0000-0000-0000-000000000001',
--   p_regular_user_id => '00000000-0000-0000-0000-000000000002',
--   p_regular_user_tenant => '00000000-0000-0000-0000-000000000010',
--   p_other_tenant => '00000000-0000-0000-0000-000000000011'
-- );
