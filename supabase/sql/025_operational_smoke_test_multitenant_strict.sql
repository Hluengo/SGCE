-- =============================================================================
-- 025_operational_smoke_test_multitenant_strict.sql
-- Version STRICT del smoke test operacional multi-tenant.
--
-- Comportamiento:
-- - Ejecuta inserts de prueba en 4 tablas operativas.
-- - Registra checks en tabla temporal.
-- - Si hay FAIL critico, lanza EXCEPTION.
-- - Todo termina en ROLLBACK (no deja datos).
--
-- Tablas:
-- - reportes_patio
-- - derivaciones_externas
-- - bitacora_psicosocial
-- - medidas_apoyo
-- =============================================================================

begin;

-- Config: poner true si quieres exigir 2do tenant como criterio de exito.
do $$
begin
  perform set_config('smoke.require_second_tenant', 'false', true);
end $$;

drop table if exists _strict_checks;
create temporary table _strict_checks (
  check_name text not null,
  status text not null,
  details jsonb not null default '{}'::jsonb
);

drop table if exists _strict_ctx;
create temporary table _strict_ctx as
with tenants as (
  select id, row_number() over (order by created_at nulls last, id) as rn
  from public.establecimientos
),
t1 as (
  select id as tenant_a_id from tenants where rn = 1
),
t2 as (
  select id as tenant_b_id from tenants where rn = 2
),
s1 as (
  select e.id as student_a_id
  from public.estudiantes e
  join t1 on t1.tenant_a_id = e.establecimiento_id
  order by e.created_at nulls last, e.id
  limit 1
),
s2 as (
  select e.id as student_b_id
  from public.estudiantes e
  join t2 on t2.tenant_b_id = e.establecimiento_id
  order by e.created_at nulls last, e.id
  limit 1
),
p1 as (
  select p.id as profile_a_id
  from public.perfiles p
  join t1 on t1.tenant_a_id = p.establecimiento_id
  order by p.created_at nulls last, p.id
  limit 1
),
p2 as (
  select p.id as profile_b_id
  from public.perfiles p
  join t2 on t2.tenant_b_id = p.establecimiento_id
  order by p.created_at nulls last, p.id
  limit 1
)
select
  t1.tenant_a_id,
  t2.tenant_b_id,
  s1.student_a_id,
  s2.student_b_id,
  p1.profile_a_id,
  p2.profile_b_id
from t1
left join t2 on true
left join s1 on true
left join s2 on true
left join p1 on true
left join p2 on true;

insert into _strict_checks(check_name, status, details)
select
  'context_ready',
  case
    when exists (
      select 1
      from _strict_ctx c
      where c.tenant_a_id is not null
        and c.student_a_id is not null
        and c.profile_a_id is not null
    ) then 'PASS'
    else 'FAIL'
  end,
  (
    select jsonb_build_object(
      'tenant_a_id', tenant_a_id,
      'tenant_b_id', tenant_b_id,
      'student_a_id', student_a_id,
      'student_b_id', student_b_id,
      'profile_a_id', profile_a_id,
      'profile_b_id', profile_b_id
    )
    from _strict_ctx
    limit 1
  );

drop table if exists _strict_ids;
create temporary table _strict_ids (
  table_name text not null,
  tenant_id uuid not null,
  id uuid not null
);

-- reportes_patio
with ins as (
  insert into public.reportes_patio (
    establecimiento_id, estudiante_id, estudiante_nombre, curso, informante,
    lugar, descripcion, gravedad_percibida, fecha_incidente
  )
  select c.tenant_a_id, c.student_a_id, '[STRICT] A', 'STRICT-A', '[STRICT] Informante A',
         'Patio A', '[STRICT] Incidente A', 'LEVE', now()
  from _strict_ctx c
  where c.tenant_a_id is not null and c.student_a_id is not null
  returning id, establecimiento_id
)
insert into _strict_ids(table_name, tenant_id, id)
select 'reportes_patio', ins.establecimiento_id, ins.id
from ins;

with ins as (
  insert into public.reportes_patio (
    establecimiento_id, estudiante_id, estudiante_nombre, curso, informante,
    lugar, descripcion, gravedad_percibida, fecha_incidente
  )
  select c.tenant_b_id, c.student_b_id, '[STRICT] B', 'STRICT-B', '[STRICT] Informante B',
         'Patio B', '[STRICT] Incidente B', 'RELEVANTE', now()
  from _strict_ctx c
  where c.tenant_b_id is not null and c.student_b_id is not null
  returning id, establecimiento_id
)
insert into _strict_ids(table_name, tenant_id, id)
select 'reportes_patio', ins.establecimiento_id, ins.id
from ins;

-- derivaciones_externas
with ins as (
  insert into public.derivaciones_externas (
    establecimiento_id, estudiante_id, nna_nombre, institucion, fecha_envio, estado, numero_oficio
  )
  select c.tenant_a_id, c.student_a_id, '[STRICT] NNA A', 'OPD', current_date, 'PENDIENTE', 'STRICT-OF-A'
  from _strict_ctx c
  where c.tenant_a_id is not null and c.student_a_id is not null
  returning id, establecimiento_id
)
insert into _strict_ids(table_name, tenant_id, id)
select 'derivaciones_externas', ins.establecimiento_id, ins.id
from ins;

with ins as (
  insert into public.derivaciones_externas (
    establecimiento_id, estudiante_id, nna_nombre, institucion, fecha_envio, estado, numero_oficio
  )
  select c.tenant_b_id, c.student_b_id, '[STRICT] NNA B', 'COSAM', current_date, 'PENDIENTE', 'STRICT-OF-B'
  from _strict_ctx c
  where c.tenant_b_id is not null
  returning id, establecimiento_id
)
insert into _strict_ids(table_name, tenant_id, id)
select 'derivaciones_externas', ins.establecimiento_id, ins.id
from ins;

-- bitacora_psicosocial
with ins as (
  insert into public.bitacora_psicosocial (
    establecimiento_id, estudiante_id, profesional_id, notas_confidenciales,
    nivel_privacidad, es_vulneracion, tipo, participantes, resumen, privado, autor
  )
  select c.tenant_a_id, c.student_a_id, c.profile_a_id, '[STRICT] Nota A',
         'alta', false, 'ENTREVISTA', '[STRICT] Profesional A', '[STRICT] Resumen A', true, '[STRICT] Autor A'
  from _strict_ctx c
  where c.tenant_a_id is not null and c.student_a_id is not null and c.profile_a_id is not null
  returning id, establecimiento_id
)
insert into _strict_ids(table_name, tenant_id, id)
select 'bitacora_psicosocial', ins.establecimiento_id, ins.id
from ins;

with ins as (
  insert into public.bitacora_psicosocial (
    establecimiento_id, estudiante_id, profesional_id, notas_confidenciales,
    nivel_privacidad, es_vulneracion, tipo, participantes, resumen, privado, autor
  )
  select c.tenant_b_id, c.student_b_id, coalesce(c.profile_b_id, c.profile_a_id), '[STRICT] Nota B',
         'alta', false, 'OBSERVACION', '[STRICT] Profesional B', '[STRICT] Resumen B', true, '[STRICT] Autor B'
  from _strict_ctx c
  where c.tenant_b_id is not null and c.student_b_id is not null and coalesce(c.profile_b_id, c.profile_a_id) is not null
  returning id, establecimiento_id
)
insert into _strict_ids(table_name, tenant_id, id)
select 'bitacora_psicosocial', ins.establecimiento_id, ins.id
from ins;

-- medidas_apoyo
with ins as (
  insert into public.medidas_apoyo (
    establecimiento_id, estudiante_id, tipo_accion, objetivo, fecha_ejecucion,
    tipo, responsable, resultados, estado, accion
  )
  select c.tenant_a_id, c.student_a_id, '[STRICT] Tipo A', '[STRICT] Objetivo A', current_date,
         'PEDAGOGICO', '[STRICT] Responsable A', '[STRICT] Resultado A', 'PENDIENTE', '[STRICT] Accion A'
  from _strict_ctx c
  where c.tenant_a_id is not null and c.student_a_id is not null
  returning id, establecimiento_id
)
insert into _strict_ids(table_name, tenant_id, id)
select 'medidas_apoyo', ins.establecimiento_id, ins.id
from ins;

with ins as (
  insert into public.medidas_apoyo (
    establecimiento_id, estudiante_id, tipo_accion, objetivo, fecha_ejecucion,
    tipo, responsable, resultados, estado, accion
  )
  select c.tenant_b_id, c.student_b_id, '[STRICT] Tipo B', '[STRICT] Objetivo B', current_date,
         'PSICOSOCIAL', '[STRICT] Responsable B', '[STRICT] Resultado B', 'PENDIENTE', '[STRICT] Accion B'
  from _strict_ctx c
  where c.tenant_b_id is not null and c.student_b_id is not null
  returning id, establecimiento_id
)
insert into _strict_ids(table_name, tenant_id, id)
select 'medidas_apoyo', ins.establecimiento_id, ins.id
from ins;

-- checks de insercion
insert into _strict_checks(check_name, status, details)
with counts as (
  select table_name, count(*)::int as inserted_rows, count(distinct tenant_id)::int as tenants_touched
  from _strict_ids
  group by table_name
)
select
  format('smoke_insert:%s', t.table_name),
  case when coalesce(c.inserted_rows, 0) >= 1 then 'PASS' else 'FAIL' end,
  jsonb_build_object(
    'inserted_rows', coalesce(c.inserted_rows, 0),
    'tenants_touched', coalesce(c.tenants_touched, 0)
  )
from (values
  ('reportes_patio'),
  ('derivaciones_externas'),
  ('bitacora_psicosocial'),
  ('medidas_apoyo')
) as t(table_name)
left join counts c on c.table_name = t.table_name;

-- checks de aislamiento
insert into _strict_checks(check_name, status, details)
with ctx as (
  select * from _strict_ctx limit 1
), counts as (
  select
    table_name,
    count(*) filter (where tenant_id = (select tenant_a_id from ctx))::int as rows_tenant_a,
    count(*) filter (where tenant_id = (select tenant_b_id from ctx))::int as rows_tenant_b
  from _strict_ids
  group by table_name
), cfg as (
  select current_setting('smoke.require_second_tenant', true) = 'true' as require_second_tenant
), expectations as (
  select
    v.table_name,
    case
      when v.table_name = 'bitacora_psicosocial' then
        ((select tenant_b_id from ctx) is not null and (select student_b_id from ctx) is not null and coalesce((select profile_b_id from ctx), (select profile_a_id from ctx)) is not null)
      when v.table_name in ('reportes_patio', 'medidas_apoyo') then
        ((select tenant_b_id from ctx) is not null and (select student_b_id from ctx) is not null)
      when v.table_name = 'derivaciones_externas' then
        ((select tenant_b_id from ctx) is not null)
      else false
    end as has_required_b_context
  from (values
    ('reportes_patio'),
    ('derivaciones_externas'),
    ('bitacora_psicosocial'),
    ('medidas_apoyo')
  ) as v(table_name)
)
select
  format('tenant_isolation:%s', c.table_name),
  case
    when not e.has_required_b_context and (select require_second_tenant from cfg) then 'FAIL'
    when not e.has_required_b_context then 'WARN'
    when c.rows_tenant_a >= 1 and c.rows_tenant_b >= 1 then 'PASS'
    else 'FAIL'
  end,
  jsonb_build_object(
    'rows_tenant_a', c.rows_tenant_a,
    'rows_tenant_b', c.rows_tenant_b,
    'has_tenant_b', (select tenant_b_id from ctx) is not null,
    'has_required_b_context', e.has_required_b_context,
    'student_b_id', (select student_b_id from ctx),
    'profile_b_id', (select profile_b_id from ctx),
    'profile_fallback_a_id', (select profile_a_id from ctx),
    'require_second_tenant', (select require_second_tenant from cfg)
  )
from counts c
join expectations e on e.table_name = c.table_name;

-- salida visible de checks
select * from _strict_checks order by check_name;

-- fallo estricto si hay FAIL
do $$
declare
  v_fail_count int;
  v_fail_list text;
begin
  select count(*), string_agg(check_name, ', ' order by check_name)
  into v_fail_count, v_fail_list
  from _strict_checks
  where status = 'FAIL';

  if coalesce(v_fail_count, 0) > 0 then
    raise exception using
      errcode = 'P0001',
      message = format('STRICT SMOKE TEST FAILED (%s checks)', v_fail_count),
      detail = coalesce(v_fail_list, 'No detail');
  end if;
end $$;

rollback;
