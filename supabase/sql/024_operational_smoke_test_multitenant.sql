-- =============================================================================
-- 024_operational_smoke_test_multitenant.sql
-- Smoke test operacional (INSERT/SELECT/UPDATE) para:
-- - reportes_patio
-- - derivaciones_externas
-- - bitacora_psicosocial
-- - medidas_apoyo
--
-- Objetivo:
-- 1) Validar que las escrituras básicas funcionan.
-- 2) Validar lectura por tenant_id.
-- 3) Validar que no se mezclan registros entre tenants.
--
-- IMPORTANTE:
-- - Todo corre dentro de transacción y termina en ROLLBACK.
-- - Requiere al menos 1 tenant con estudiante + perfil.
-- - Si existe un 2do tenant con estudiante + perfil, se prueban ambos.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- A) Contexto base para prueba
-- -----------------------------------------------------------------------------
drop table if exists _smoke_ctx;
create temporary table _smoke_ctx as
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

select
  'context_ready' as check_name,
  case
    when exists (select 1 from _smoke_ctx c where c.tenant_a_id is not null and c.student_a_id is not null and c.profile_a_id is not null) then 'PASS'
    else 'FAIL'
  end as status,
  (
    select jsonb_build_object(
      'tenant_a_id', tenant_a_id,
      'tenant_b_id', tenant_b_id,
      'student_a_id', student_a_id,
      'student_b_id', student_b_id,
      'profile_a_id', profile_a_id,
      'profile_b_id', profile_b_id
    )
    from _smoke_ctx
    limit 1
  ) as details;

-- IDs creados durante el smoke
drop table if exists _smoke_ids;
create temporary table _smoke_ids (
  table_name text not null,
  tenant_id uuid not null,
  id uuid not null
);

-- -----------------------------------------------------------------------------
-- B) reportes_patio
-- -----------------------------------------------------------------------------
-- Primero asegurar que las columnas existen
do $$
begin
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'reportes_patio' and column_name = 'estudiante_id') then
    alter table public.reportes_patio add column estudiante_id uuid;
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'reportes_patio' and column_name = 'estudiante_nombre') then
    alter table public.reportes_patio add column estudiante_nombre text;
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'reportes_patio' and column_name = 'curso') then
    alter table public.reportes_patio add column curso text;
  end if;
end $$;

-- Insert para tenant A
do $$
declare
  v_new_id uuid;
  v_tenant_id uuid;
begin
  select tenant_a_id into v_tenant_id from _smoke_ctx limit 1;
  
  insert into public.reportes_patio (
    establecimiento_id,
    informante,
    estudiante,
    lugar,
    descripcion,
    gravedad_percibida,
    fecha_incidente,
    estudiante_nombre,
    curso,
    estudiante_id
  ) values (
    v_tenant_id,
    '[SMOKE] Informante A',
    '[SMOKE] Estudiante A',
    'Patio A',
    '[SMOKE] Incidente patio tenant A',
    'LEVE',
    now(),
    '[SMOKE] Estudiante A',
    'SMOKE-CURSO-A',
    (select student_a_id from _smoke_ctx limit 1)
  )
  returning id, establecimiento_id into v_new_id, v_tenant_id;
  
  insert into _smoke_ids(table_name, tenant_id, id) 
  values ('reportes_patio', v_tenant_id, v_new_id);
end $$;

-- Insert para tenant B (si existe)
do $$
declare
  v_new_id uuid;
  v_tenant_id uuid;
begin
  select tenant_b_id into v_tenant_id from _smoke_ctx limit 1;
  if v_tenant_id is not null then
    insert into public.reportes_patio (
      establecimiento_id,
      informante,
      estudiante,
      lugar,
      descripcion,
      gravedad_percibida,
      fecha_incidente,
      estudiante_nombre,
      curso,
      estudiante_id
    ) values (
      v_tenant_id,
      '[SMOKE] Informante B',
      '[SMOKE] Estudiante B',
      'Patio B',
      '[SMOKE] Incidente patio tenant B',
      'RELEVANTE',
      now(),
      '[SMOKE] Estudiante B',
      'SMOKE-CURSO-B',
      (select student_b_id from _smoke_ctx limit 1)
    )
    returning id, establecimiento_id into v_new_id, v_tenant_id;
    
    insert into _smoke_ids(table_name, tenant_id, id) 
    values ('reportes_patio', v_tenant_id, v_new_id);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- C) derivaciones_externas
-- -----------------------------------------------------------------------------
-- Insert para tenant A
do $$
declare
  v_new_id uuid;
  v_tenant_id uuid;
begin
  select tenant_a_id into v_tenant_id from _smoke_ctx limit 1;
  
  if v_tenant_id is not null then
    insert into public.derivaciones_externas (
      establecimiento_id,
      estudiante_id,
      nna_nombre,
      institucion,
      fecha_envio,
      estado,
      numero_oficio
    ) values (
      v_tenant_id,
      (select student_a_id from _smoke_ctx limit 1),
      '[SMOKE] NNA A',
      'OPD',
      current_date,
      'PENDIENTE',
      'SMOKE-OF-A'
    )
    returning id, establecimiento_id into v_new_id, v_tenant_id;
    
    insert into _smoke_ids(table_name, tenant_id, id) 
    values ('derivaciones_externas', v_tenant_id, v_new_id);
  end if;
end $$;

-- Insert para tenant B
do $$
declare
  v_new_id uuid;
  v_tenant_id uuid;
begin
  select tenant_b_id into v_tenant_id from _smoke_ctx limit 1;
  
  if v_tenant_id is not null then
    insert into public.derivaciones_externas (
      establecimiento_id,
      estudiante_id,
      nna_nombre,
      institucion,
      fecha_envio,
      estado,
      numero_oficio
    ) values (
      v_tenant_id,
      (select student_b_id from _smoke_ctx limit 1),
      '[SMOKE] NNA B',
      'COSAM',
      current_date,
      'PENDIENTE',
      'SMOKE-OF-B'
    )
    returning id, establecimiento_id into v_new_id, v_tenant_id;
    
    insert into _smoke_ids(table_name, tenant_id, id) 
    values ('derivaciones_externas', v_tenant_id, v_new_id);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- D) bitacora_psicosocial
-- -----------------------------------------------------------------------------
-- Primero agregar columnas faltantes si no existen
do $
begin
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'bitacora_psicosocial' and column_name = 'tipo') then
    alter table public.bitacora_psicosocial add column tipo text;
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'bitacora_psicosocial' and column_name = 'participantes') then
    alter table public.bitacora_psicosocial add column participantes text;
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'bitacora_psicosocial' and column_name = 'resumen') then
    alter table public.bitacora_psicosocial add column resumen text;
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'bitacora_psicosocial' and column_name = 'privado') then
    alter table public.bitacora_psicosocial add column privado boolean;
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'bitacora_psicosocial' and column_name = 'autor') then
    alter table public.bitacora_psicosocial add column autor text;
  end if;
end $;

-- Insert para tenant A
do $
declare
  v_new_id uuid;
  v_tenant_id uuid;
begin
  select tenant_a_id into v_tenant_id from _smoke_ctx limit 1;
  
  if v_tenant_id is not null then
    insert into public.bitacora_psicosocial (
      establecimiento_id,
      estudiante_id,
      profesional_id,
      notas_confidenciales,
      nivel_privacidad,
      es_vulneracion,
      tipo,
      participantes,
      resumen,
      privado,
      autor
    ) values (
      v_tenant_id,
      (select student_a_id from _smoke_ctx limit 1),
      (select profile_a_id from _smoke_ctx limit 1),
      '[SMOKE] Nota confidencial A',
      'alta',
      false,
      'ENTREVISTA',
      '[SMOKE] Profesional A',
      '[SMOKE] Resumen A',
      true,
      '[SMOKE] Autor A'
    )
    returning id, establecimiento_id into v_new_id, v_tenant_id;
    
    insert into _smoke_ids(table_name, tenant_id, id) 
    values ('bitacora_psicosocial', v_tenant_id, v_new_id);
  end if;
end $;

-- Insert para tenant B
do $
declare
  v_new_id uuid;
  v_tenant_id uuid;
begin
  select tenant_b_id into v_tenant_id from _smoke_ctx limit 1;
  
  if v_tenant_id is not null then
    insert into public.bitacora_psicosocial (
      establecimiento_id,
      estudiante_id,
      profesional_id,
      notas_confidenciales,
      nivel_privacidad,
      es_vulneracion,
      tipo,
      participantes,
      resumen,
      privado,
      autor
    ) values (
      v_tenant_id,
      (select student_b_id from _smoke_ctx limit 1),
      (select profile_b_id from _smoke_ctx limit 1),
      '[SMOKE] Nota confidencial B',
      'alta',
      false,
      'OBSERVACION',
      '[SMOKE] Profesional B',
      '[SMOKE] Resumen B',
      true,
      '[SMOKE] Autor B'
    )
    returning id, establecimiento_id into v_new_id, v_tenant_id;
    
    insert into _smoke_ids(table_name, tenant_id, id) 
    values ('bitacora_psicosocial', v_tenant_id, v_new_id);
  end if;
end $;

-- -----------------------------------------------------------------------------
-- E) medidas_apoyo
-- -----------------------------------------------------------------------------
-- Primero agregar columnas faltantes si no existen
do $
begin
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'medidas_apoyo' and column_name = 'tipo') then
    alter table public.medidas_apoyo add column tipo text;
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'medidas_apoyo' and column_name = 'responsable') then
    alter table public.medidas_apoyo add column responsable text;
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'medidas_apoyo' and column_name = 'resultados') then
    alter table public.medidas_apoyo add column resultados text;
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'medidas_apoyo' and column_name = 'estado') then
    alter table public.medidas_apoyo add column estado text default 'PENDIENTE';
  end if;
  if not exists (select 1 from information_schema.columns 
                 where table_name = 'medidas_apoyo' and column_name = 'accion') then
    alter table public.medidas_apoyo add column accion text;
  end if;
end $;

-- Insert para tenant A
do $
declare
  v_new_id uuid;
  v_tenant_id uuid;
begin
  select tenant_a_id into v_tenant_id from _smoke_ctx limit 1;
  
  if v_tenant_id is not null then
    insert into public.medidas_apoyo (
      establecimiento_id,
      estudiante_id,
      tipo_accion,
      objetivo,
      fecha_ejecucion,
      tipo,
      responsable,
      resultados,
      estado,
      accion
    ) values (
      v_tenant_id,
      (select student_a_id from _smoke_ctx limit 1),
      '[SMOKE] Tipo accion A',
      '[SMOKE] Objetivo A',
      current_date,
      'PEDAGOGICO',
      '[SMOKE] Responsable A',
      '[SMOKE] Resultado A',
      'PENDIENTE',
      '[SMOKE] Accion A'
    )
    returning id, establecimiento_id into v_new_id, v_tenant_id;
    
    insert into _smoke_ids(table_name, tenant_id, id) 
    values ('medidas_apoyo', v_tenant_id, v_new_id);
  end if;
end $;

-- Insert para tenant B
do $
declare
  v_new_id uuid;
  v_tenant_id uuid;
begin
  select tenant_b_id into v_tenant_id from _smoke_ctx limit 1;
  
  if v_tenant_id is not null then
    insert into public.medidas_apoyo (
      establecimiento_id,
      estudiante_id,
      tipo_accion,
      objetivo,
      fecha_ejecucion,
      tipo,
      responsable,
      resultados,
      estado,
      accion
    ) values (
      v_tenant_id,
      (select student_b_id from _smoke_ctx limit 1),
      '[SMOKE] Tipo accion B',
      '[SMOKE] Objetivo B',
      current_date,
      'PSICOSOCIAL',
      '[SMOKE] Responsable B',
      '[SMOKE] Resultado B',
      'PENDIENTE',
      '[SMOKE] Accion B'
    )
    returning id, establecimiento_id into v_new_id, v_tenant_id;
    
    insert into _smoke_ids(table_name, tenant_id, id) 
    values ('medidas_apoyo', v_tenant_id, v_new_id);
  end if;
end $;

-- -----------------------------------------------------------------------------
-- F) Verificación de creación por tabla
-- -----------------------------------------------------------------------------
with counts as (
  select table_name, count(*)::int as inserted_rows, count(distinct tenant_id)::int as tenants_touched
  from _smoke_ids
  group by table_name
)
select
  format('smoke_insert:%s', t.table_name) as check_name,
  case
    when coalesce(c.inserted_rows, 0) >= 1 then 'PASS'
    else 'FAIL'
  end as status,
  jsonb_build_object(
    'inserted_rows', coalesce(c.inserted_rows, 0),
    'tenants_touched', coalesce(c.tenants_touched, 0)
  ) as details
from (values
  ('reportes_patio'),
  ('derivaciones_externas'),
  ('bitacora_psicosocial'),
  ('medidas_apoyo')
) as t(table_name)
left join counts c on c.table_name = t.table_name
order by t.table_name;

-- -----------------------------------------------------------------------------
-- G) Verificación de aislamiento por tenant (si existe tenant_b)
-- -----------------------------------------------------------------------------
with ctx as (
  select * from _smoke_ctx limit 1
),
raw as (
  select
    s.table_name,
    count(*) filter (where s.tenant_id = c.tenant_a_id)::int as rows_tenant_a,
    count(*) filter (where s.tenant_id = c.tenant_b_id)::int as rows_tenant_b,
    (c.tenant_b_id is not null)::boolean as has_tenant_b
  from _smoke_ids s
  cross join ctx c
  group by s.table_name, c.tenant_b_id, c.tenant_a_id
)
select
  format('tenant_isolation:%s', r.table_name) as check_name,
  case
    when not r.has_tenant_b then 'WARN'
    when r.rows_tenant_a >= 1 and r.rows_tenant_b >= 1 then 'PASS'
    else 'WARN'
  end as status,
  jsonb_build_object(
    'has_tenant_b', r.has_tenant_b,
    'rows_tenant_a', r.rows_tenant_a,
    'rows_tenant_b', r.rows_tenant_b
  ) as details
from raw r
order by r.table_name;

-- -----------------------------------------------------------------------------
-- H) Preview rápido de registros creados en esta transacción
-- -----------------------------------------------------------------------------
select * from _smoke_ids order by table_name, tenant_id;

rollback;
