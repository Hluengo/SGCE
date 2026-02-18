-- =============================================================================
-- 017_post_migration_checklist.sql
-- Checklist post-migracion para 017_tenant_management_columns.sql
-- Ejecutar en Supabase SQL Editor (manual).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Estructura: columnas requeridas en public.establecimientos
-- -----------------------------------------------------------------------------
with required_columns as (
  select *
  from (values
    ('direccion', 'text'),
    ('telefono', 'text'),
    ('email', 'text'),
    ('niveles_educativos', 'ARRAY')
  ) as t(column_name, expected_type)
), actual_columns as (
  select
    c.column_name,
    c.data_type,
    c.udt_name
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'establecimientos'
), checks as (
  select
    rc.column_name,
    rc.expected_type,
    ac.data_type,
    ac.udt_name,
    case
      when ac.column_name is null then false
      when rc.expected_type = 'ARRAY' and ac.data_type = 'ARRAY' and ac.udt_name = '_text' then true
      when rc.expected_type = 'text' and ac.data_type = 'text' then true
      else false
    end as ok
  from required_columns rc
  left join actual_columns ac on ac.column_name = rc.column_name
)
select
  format('column_exists:%s', column_name) as check_name,
  case when ok then 'PASS' else 'FAIL' end as status,
  jsonb_build_object(
    'expected_type', expected_type,
    'actual_data_type', data_type,
    'actual_udt_name', udt_name
  ) as details
from checks
order by column_name;

-- -----------------------------------------------------------------------------
-- B) Índices recomendados
-- -----------------------------------------------------------------------------
with required_indexes as (
  select *
  from (values
    ('idx_establecimientos_nombre'),
    ('idx_establecimientos_rbd')
  ) as t(index_name)
), actual_indexes as (
  select i.indexname
  from pg_indexes i
  where i.schemaname = 'public'
    and i.tablename = 'establecimientos'
)
select
  format('index_exists:%s', r.index_name) as check_name,
  case when a.indexname is not null then 'PASS' else 'FAIL' end as status,
  jsonb_build_object('index_name', r.index_name) as details
from required_indexes r
left join actual_indexes a on a.indexname = r.index_name
order by r.index_name;

-- -----------------------------------------------------------------------------
-- C) RLS en establecimientos (estado + cantidad de políticas)
-- -----------------------------------------------------------------------------
with rls as (
  select c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'establecimientos'
    and c.relkind = 'r'
), policies as (
  select count(*)::int as policy_count
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'establecimientos'
)
select
  'rls_enabled:establecimientos' as check_name,
  case when coalesce((select rls_enabled from rls), false) then 'PASS' else 'FAIL' end as status,
  jsonb_build_object('rls_enabled', (select rls_enabled from rls)) as details
union all
select
  'policies_exist:establecimientos' as check_name,
  case when (select policy_count from policies) > 0 then 'PASS' else 'FAIL' end as status,
  jsonb_build_object('policy_count', (select policy_count from policies)) as details;

-- -----------------------------------------------------------------------------
-- D) Grants base para frontend autenticado (tabla + funciones helper)
-- -----------------------------------------------------------------------------
select
  'grant_select_establecimientos_to_authenticated' as check_name,
  case
    when has_table_privilege('authenticated', 'public.establecimientos', 'SELECT') then 'PASS'
    else 'WARN'
  end as status,
  jsonb_build_object(
    'has_select', has_table_privilege('authenticated', 'public.establecimientos', 'SELECT')
  ) as details
union all
select
  'grant_execute_run_rls_policy_checks_to_authenticated',
  case
    when has_function_privilege('authenticated', 'public.run_rls_policy_checks()', 'EXECUTE') then 'PASS'
    else 'WARN'
  end,
  jsonb_build_object(
    'has_execute', has_function_privilege('authenticated', 'public.run_rls_policy_checks()', 'EXECUTE')
  )
union all
select
  'grant_execute_can_access_tenant_to_authenticated',
  case
    when has_function_privilege('authenticated', 'public.can_access_tenant(uuid)', 'EXECUTE') then 'PASS'
    else 'WARN'
  end,
  jsonb_build_object(
    'has_execute', has_function_privilege('authenticated', 'public.can_access_tenant(uuid)', 'EXECUTE')
  );

-- -----------------------------------------------------------------------------
-- E) Smoke test transaccional de lectura/escritura en establecimientos
--    (No deja datos persistentes: finaliza en ROLLBACK)
-- -----------------------------------------------------------------------------
begin;

with inserted as (
  insert into public.establecimientos (
    nombre,
    rbd,
    direccion,
    telefono,
    email,
    niveles_educativos,
    activo
  )
  values (
    '[SMOKE] Colegio Verificacion 017',
    'SMOKE-017',
    'Direccion Smoke 123',
    '+56900000000',
    'smoke017@example.com',
    array['Basica', 'Media']::text[],
    true
  )
  returning id
), updated as (
  update public.establecimientos e
  set
    direccion = 'Direccion Smoke 456',
    niveles_educativos = array['Parvularia', 'Basica']::text[]
  where e.id = (select id from inserted)
  returning id, direccion, niveles_educativos
)
select
  'smoke_write_establecimientos' as check_name,
  case when exists (select 1 from updated) then 'PASS' else 'FAIL' end as status,
  jsonb_build_object(
    'updated_rows', (select count(*) from updated),
    'direccion', (select direccion from updated limit 1),
    'niveles_educativos', (select niveles_educativos from updated limit 1)
  ) as details;

rollback;

-- -----------------------------------------------------------------------------
-- F) Checks RLS globales existentes (si la función está creada)
-- -----------------------------------------------------------------------------
-- Si existe la función, ejecutar para validar que no hay regresiones.
-- Esperado: tenant_tables_not_publicly_open => PASS.
select *
from public.run_rls_policy_checks();

-- -----------------------------------------------------------------------------
-- G) Consulta rápida para frontend (lectura de listado de colegios)
-- -----------------------------------------------------------------------------
select
  id,
  nombre,
  rbd,
  direccion,
  telefono,
  email,
  niveles_educativos,
  activo,
  created_at
from public.establecimientos
order by nombre
limit 50;
