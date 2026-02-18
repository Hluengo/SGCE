-- =============================================================================
-- 023_superadmin_manageability_checklist.sql
-- Verifica capacidad operativa de superusuario en acciones clave del frontend.
-- Ejecutar en SQL Editor con una sesión autenticada de superadmin.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Estado base por tabla: existencia, RLS y cantidad de politicas
-- -----------------------------------------------------------------------------
with expected_tables as (
  select *
  from (values
    ('establecimientos'),
    ('estudiantes'),
    ('expedientes'),
    ('hitos_expediente'),
    ('evidencias'),
    ('medidas_apoyo'),
    ('bitacora_psicosocial'),
    ('derivaciones_externas'),
    ('reportes_patio')
  ) as t(table_name)
), table_meta as (
  select
    e.table_name,
    c.oid is not null as table_exists,
    coalesce(c.relrowsecurity, false) as rls_enabled
  from expected_tables e
  left join pg_class c on c.relname = e.table_name
  left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
), policy_counts as (
  select
    p.tablename as table_name,
    count(*)::int as policy_count
  from pg_policies p
  where p.schemaname = 'public'
  group by p.tablename
)
select
  format('table_health:%s', m.table_name) as check_name,
  case
    when not m.table_exists then 'FAIL'
    when not m.rls_enabled then 'FAIL'
    when coalesce(pc.policy_count, 0) = 0 then 'WARN'
    else 'PASS'
  end as status,
  jsonb_build_object(
    'table_exists', m.table_exists,
    'rls_enabled', m.rls_enabled,
    'policy_count', coalesce(pc.policy_count, 0)
  ) as details
from table_meta m
left join policy_counts pc on pc.table_name = m.table_name
order by m.table_name;

-- -----------------------------------------------------------------------------
-- B) Grants esperados para role authenticated (operacion desde frontend)
-- -----------------------------------------------------------------------------
with expected_grants as (
  select *
  from (values
    ('public.establecimientos', 'SELECT'),
    ('public.estudiantes', 'SELECT'),
    ('public.estudiantes', 'INSERT'),
    ('public.expedientes', 'SELECT'),
    ('public.expedientes', 'INSERT'),
    ('public.expedientes', 'UPDATE'),
    ('public.hitos_expediente', 'SELECT'),
    ('public.hitos_expediente', 'INSERT'),
    ('public.hitos_expediente', 'UPDATE'),
    ('public.evidencias', 'SELECT'),
    ('public.evidencias', 'INSERT'),
    ('public.medidas_apoyo', 'SELECT'),
    ('public.medidas_apoyo', 'INSERT'),
    ('public.bitacora_psicosocial', 'SELECT'),
    ('public.bitacora_psicosocial', 'INSERT'),
    ('public.derivaciones_externas', 'SELECT'),
    ('public.derivaciones_externas', 'INSERT'),
    ('public.reportes_patio', 'SELECT'),
    ('public.reportes_patio', 'INSERT'),
    ('public.reportes_patio', 'UPDATE')
  ) as t(object_name, privilege)
)
select
  format('grant:%s:%s', object_name, privilege) as check_name,
  case
    when has_table_privilege('authenticated', object_name, privilege) then 'PASS'
    else 'WARN'
  end as status,
  jsonb_build_object(
    'object', object_name,
    'privilege', privilege,
    'granted', has_table_privilege('authenticated', object_name, privilege)
  ) as details
from expected_grants
order by object_name, privilege;

-- -----------------------------------------------------------------------------
-- C) Funciones helper criticas para RLS multi-tenant/superadmin
-- -----------------------------------------------------------------------------
select
  'function_exists:is_platform_superadmin' as check_name,
  case when exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_platform_superadmin'
  ) then 'PASS' else 'FAIL' end as status,
  jsonb_build_object('exists', exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_platform_superadmin'
  )) as details
union all
select
  'function_exists:can_access_tenant',
  case when exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'can_access_tenant'
  ) then 'PASS' else 'FAIL' end,
  jsonb_build_object('exists', exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'can_access_tenant'
  ));

-- -----------------------------------------------------------------------------
-- D) Politicas potencialmente restrictivas por rol literal (diagnostico)
-- -----------------------------------------------------------------------------
select
  format('policy_review:%s:%s', p.tablename, p.policyname) as check_name,
  case
    when coalesce(p.qual, '') ilike '%current_rol()%dupla%' then 'WARN'
    when coalesce(p.qual, '') ilike '%auth.jwt()%'
      and coalesce(p.qual, '') not ilike '%can_access_tenant%'
      and coalesce(p.qual, '') not ilike '%is_platform_superadmin%' then 'WARN'
    else 'PASS'
  end as status,
  jsonb_build_object(
    'table', p.tablename,
    'policy', p.policyname,
    'qual', p.qual,
    'with_check', p.with_check
  ) as details
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in (
    'expedientes',
    'hitos_expediente',
    'reportes_patio',
    'derivaciones_externas',
    'bitacora_psicosocial',
    'medidas_apoyo',
    'evidencias'
  )
order by p.tablename, p.policyname;
