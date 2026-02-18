-- =============================================================================
-- 032_gcc_smoke_multitenant.sql
-- Smoke test operacional multi-tenant para GCC v2.
--
-- Valida:
-- 1) Contexto minimo (tenant A + expediente + perfil)
-- 2) Enum estado_legal contiene 'pausa_legal'
-- 3) INSERT en:
--    - mediaciones_gcc_v2
--    - participantes_gcc_v2
--    - hitos_gcc_v2
--    - actas_gcc_v2
--    - compromisos_gcc_v2
-- 4) UPDATE de transición de estado en mediaciones_gcc_v2
-- 5) Aislamiento por tenant en registros creados
--
-- Nota:
-- - Todo corre en transacción y termina en ROLLBACK.
-- - Si no hay contexto completo en tenant B, se reporta WARN (por defecto).
-- =============================================================================

begin;

select set_config('smoke.require_second_tenant', 'false', true);

-- -----------------------------------------------------------------------------
-- A) Contexto base
-- -----------------------------------------------------------------------------
drop table if exists _gcc_ctx;
create temporary table _gcc_ctx as
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
e1 as (
  select e.id as expediente_a_id
  from public.expedientes e
  join t1 on t1.tenant_a_id = e.establecimiento_id
  order by e.created_at nulls last, e.id
  limit 1
),
e2 as (
  select e.id as expediente_b_id
  from public.expedientes e
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
  e1.expediente_a_id,
  e2.expediente_b_id,
  p1.profile_a_id,
  p2.profile_b_id
from t1
left join t2 on true
left join e1 on true
left join e2 on true
left join p1 on true
left join p2 on true;

drop table if exists _gcc_checks;
create temporary table _gcc_checks (
  check_name text not null,
  status text not null,
  details jsonb not null default '{}'::jsonb
);

drop table if exists _gcc_ids;
create temporary table _gcc_ids (
  table_name text not null,
  tenant_id uuid not null,
  id uuid not null
);

insert into _gcc_checks(check_name, status, details)
select
  '032_context_ready',
  case
    when exists (
      select 1
      from _gcc_ctx c
      where c.tenant_a_id is not null
        and c.expediente_a_id is not null
        and c.profile_a_id is not null
    ) then 'PASS'
    else 'FAIL'
  end,
  (
    select jsonb_build_object(
      'tenant_a_id', tenant_a_id,
      'tenant_b_id', tenant_b_id,
      'expediente_a_id', expediente_a_id,
      'expediente_b_id', expediente_b_id,
      'profile_a_id', profile_a_id,
      'profile_b_id', profile_b_id
    )
    from _gcc_ctx
    limit 1
  );

insert into _gcc_checks(check_name, status, details)
select
  '032_enum_estado_legal_has_pausa_legal',
  case
    when exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'estado_legal'
        and e.enumlabel = 'pausa_legal'
    ) then 'PASS'
    else 'FAIL'
  end,
  jsonb_build_object('enum', 'estado_legal', 'value', 'pausa_legal');

-- -----------------------------------------------------------------------------
-- B) Insert mediaciones_gcc_v2
-- -----------------------------------------------------------------------------
with ins as (
  insert into public.mediaciones_gcc_v2 (
    establecimiento_id,
    expediente_id,
    tipo_mecanismo,
    estado_proceso,
    efecto_suspensivo_activo,
    fecha_inicio,
    fecha_limite_habil,
    motivo_derivacion,
    created_by
  )
  select
    c.tenant_a_id,
    c.expediente_a_id,
    'MEDIACION',
    'abierta',
    true,
    now(),
    sumar_dias_habiles(current_date, 5),
    '[SMOKE] GCC tenant A',
    c.profile_a_id
  from _gcc_ctx c
  where c.tenant_a_id is not null
    and c.expediente_a_id is not null
    and c.profile_a_id is not null
  returning id, establecimiento_id
)
insert into _gcc_ids(table_name, tenant_id, id)
select 'mediaciones_gcc_v2', ins.establecimiento_id, ins.id
from ins;

with ins as (
  insert into public.mediaciones_gcc_v2 (
    establecimiento_id,
    expediente_id,
    tipo_mecanismo,
    estado_proceso,
    efecto_suspensivo_activo,
    fecha_inicio,
    fecha_limite_habil,
    motivo_derivacion,
    created_by
  )
  select
    c.tenant_b_id,
    c.expediente_b_id,
    'CONCILIACION',
    'abierta',
    true,
    now(),
    sumar_dias_habiles(current_date, 5),
    '[SMOKE] GCC tenant B',
    c.profile_b_id
  from _gcc_ctx c
  where c.tenant_b_id is not null
    and c.expediente_b_id is not null
    and c.profile_b_id is not null
  returning id, establecimiento_id
)
insert into _gcc_ids(table_name, tenant_id, id)
select 'mediaciones_gcc_v2', ins.establecimiento_id, ins.id
from ins;

-- -----------------------------------------------------------------------------
-- C) Insert tablas hijas (1 registro por mediación)
-- -----------------------------------------------------------------------------
with rows_src as (
  select s.id as mediacion_id, s.tenant_id
  from _gcc_ids s
  where s.table_name = 'mediaciones_gcc_v2'
), ins as (
  insert into public.participantes_gcc_v2 (
    establecimiento_id,
    mediacion_id,
    tipo_participante,
    nombre_completo,
    rol_en_conflicto,
    consentimiento_registrado,
    sujeto_id
  )
  select
    r.tenant_id,
    r.mediacion_id,
    'FACILITADOR',
    '[SMOKE] Facilitador',
    'FACILITADOR',
    true,
    case
      when r.tenant_id = (select tenant_a_id from _gcc_ctx limit 1) then (select profile_a_id from _gcc_ctx limit 1)
      else (select profile_b_id from _gcc_ctx limit 1)
    end
  from rows_src r
  returning id, establecimiento_id
)
insert into _gcc_ids(table_name, tenant_id, id)
select 'participantes_gcc_v2', ins.establecimiento_id, ins.id
from ins;

with rows_src as (
  select s.id as mediacion_id, s.tenant_id
  from _gcc_ids s
  where s.table_name = 'mediaciones_gcc_v2'
), ins as (
  insert into public.hitos_gcc_v2 (
    establecimiento_id,
    mediacion_id,
    tipo_hito,
    descripcion,
    registrado_por,
    datos_adicionales
  )
  select
    r.tenant_id,
    r.mediacion_id,
    'INICIO',
    '[SMOKE] Inicio GCC',
    case
      when r.tenant_id = (select tenant_a_id from _gcc_ctx limit 1) then (select profile_a_id from _gcc_ctx limit 1)
      else (select profile_b_id from _gcc_ctx limit 1)
    end,
    jsonb_build_object('source', 'smoke_032')
  from rows_src r
  returning id, establecimiento_id
)
insert into _gcc_ids(table_name, tenant_id, id)
select 'hitos_gcc_v2', ins.establecimiento_id, ins.id
from ins;

with rows_src as (
  select s.id as mediacion_id, s.tenant_id
  from _gcc_ids s
  where s.table_name = 'mediaciones_gcc_v2'
), ins as (
  insert into public.actas_gcc_v2 (
    establecimiento_id,
    mediacion_id,
    tipo_acta,
    contenido_json,
    firmado_por_partes,
    fecha_emision,
    observaciones
  )
  select
    r.tenant_id,
    r.mediacion_id,
    'CONSTANCIA',
    jsonb_build_object('nota', '[SMOKE] Acta GCC'),
    false,
    current_date,
    '[SMOKE] Observaciones acta'
  from rows_src r
  returning id, establecimiento_id
)
insert into _gcc_ids(table_name, tenant_id, id)
select 'actas_gcc_v2', ins.establecimiento_id, ins.id
from ins;

with rows_src as (
  select s.id as mediacion_id, s.tenant_id
  from _gcc_ids s
  where s.table_name = 'mediaciones_gcc_v2'
), ins as (
  insert into public.compromisos_gcc_v2 (
    establecimiento_id,
    mediacion_id,
    descripcion,
    responsable_id,
    tipo_responsable,
    fecha_compromiso,
    cumplimiento_verificado,
    resultado_evaluacion
  )
  select
    r.tenant_id,
    r.mediacion_id,
    '[SMOKE] Compromiso GCC',
    case
      when r.tenant_id = (select tenant_a_id from _gcc_ctx limit 1) then (select profile_a_id from _gcc_ctx limit 1)
      else (select profile_b_id from _gcc_ctx limit 1)
    end,
    'FACILITADOR',
    current_date,
    false,
    null
  from rows_src r
  returning id, establecimiento_id
)
insert into _gcc_ids(table_name, tenant_id, id)
select 'compromisos_gcc_v2', ins.establecimiento_id, ins.id
from ins;

-- -----------------------------------------------------------------------------
-- D) Update de transición de estado
-- -----------------------------------------------------------------------------
do $$
declare
  v_updated_rows int := 0;
begin
  update public.mediaciones_gcc_v2 m
  set estado_proceso = 'en_proceso'
  from _gcc_ids s
  where s.table_name = 'mediaciones_gcc_v2'
    and s.id = m.id;

  get diagnostics v_updated_rows = row_count;

  insert into _gcc_checks(check_name, status, details)
  values (
    '032_update_transition:mediaciones_gcc_v2',
    case when v_updated_rows >= 1 then 'PASS' else 'FAIL' end,
    jsonb_build_object('updated_rows', v_updated_rows)
  );
end $$;

-- -----------------------------------------------------------------------------
-- E) Checks de inserción por tabla
-- -----------------------------------------------------------------------------
insert into _gcc_checks(check_name, status, details)
with counts as (
  select table_name, count(*)::int as inserted_rows, count(distinct tenant_id)::int as tenants_touched
  from _gcc_ids
  group by table_name
)
select
  format('032_smoke_insert:%s', t.table_name),
  case when coalesce(c.inserted_rows, 0) >= 1 then 'PASS' else 'FAIL' end,
  jsonb_build_object(
    'inserted_rows', coalesce(c.inserted_rows, 0),
    'tenants_touched', coalesce(c.tenants_touched, 0)
  )
from (values
  ('mediaciones_gcc_v2'),
  ('participantes_gcc_v2'),
  ('hitos_gcc_v2'),
  ('actas_gcc_v2'),
  ('compromisos_gcc_v2')
) as t(table_name)
left join counts c on c.table_name = t.table_name;

-- -----------------------------------------------------------------------------
-- F) Check de aislamiento por tenant
-- -----------------------------------------------------------------------------
insert into _gcc_checks(check_name, status, details)
with ctx as (
  select * from _gcc_ctx limit 1
), counts as (
  select
    table_name,
    count(*) filter (where tenant_id = (select tenant_a_id from ctx))::int as rows_tenant_a,
    count(*) filter (where tenant_id = (select tenant_b_id from ctx))::int as rows_tenant_b
  from _gcc_ids
  group by table_name
), cfg as (
  select current_setting('smoke.require_second_tenant', true) = 'true' as require_second_tenant
), expectations as (
  select
    v.table_name,
    ((select tenant_b_id from ctx) is not null and (select expediente_b_id from ctx) is not null and (select profile_b_id from ctx) is not null) as has_required_b_context
  from (values
    ('mediaciones_gcc_v2'),
    ('participantes_gcc_v2'),
    ('hitos_gcc_v2'),
    ('actas_gcc_v2'),
    ('compromisos_gcc_v2')
  ) as v(table_name)
)
select
  format('032_tenant_isolation:%s', c.table_name),
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
    'expediente_b_id', (select expediente_b_id from ctx),
    'profile_b_id', (select profile_b_id from ctx),
    'require_second_tenant', (select require_second_tenant from cfg)
  )
from counts c
join expectations e on e.table_name = c.table_name;

-- -----------------------------------------------------------------------------
-- G) Salida visible
-- -----------------------------------------------------------------------------
select * from _gcc_checks order by check_name;

select * from _gcc_ids order by table_name, tenant_id;

rollback;
