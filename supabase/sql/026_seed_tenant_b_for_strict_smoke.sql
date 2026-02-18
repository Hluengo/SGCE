-- =============================================================================
-- 026_seed_tenant_b_for_strict_smoke.sql
-- Crea datos mínimos en tenant B para que 025 strict pueda pasar en full PASS:
-- - profile_b (si no existe)
-- - student_b (si no existe)
--
-- Idempotente y transaccional (BEGIN/COMMIT).
-- =============================================================================

begin;

do $$
declare
  v_tenant_b uuid;
  v_profile_b_id uuid;
  v_student_b_id uuid;
  v_orphan_user_id uuid;
  v_cols text;
  v_vals text;
  v_rut text;
begin
  -- tenant B = segundo establecimiento
  with tenants as (
    select id, row_number() over (order by created_at nulls last, id) as rn
    from public.establecimientos
  )
  select id into v_tenant_b
  from tenants
  where rn = 2;

  if v_tenant_b is null then
    raise exception 'No existe tenant B (se requieren al menos 2 establecimientos)';
  end if;

  -- profile_b: buscar existente
  select p.id
  into v_profile_b_id
  from public.perfiles p
  where p.establecimiento_id = v_tenant_b
  order by p.created_at nulls last, p.id
  limit 1;

  -- profile_b: crear si falta usando un auth.users sin perfil
  if v_profile_b_id is null then
    select u.id
    into v_orphan_user_id
    from auth.users u
    left join public.perfiles p on p.id = u.id
    where p.id is null
    order by u.created_at nulls last, u.id
    limit 1;

    if v_orphan_user_id is null then
      -- No romper seed: continuar con student_b y dejar profile_b como null.
      raise notice 'No hay auth.users sin perfil para crear profile_b. Se omite profile_b en este seed.';
    else
      v_cols := 'id, nombre, rol, establecimiento_id';
      v_vals := '$1, ''SMOKE Perfil Tenant B'', ''admin''::rol_usuario, $2';

      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'perfiles'
          and column_name = 'activo'
      ) then
        v_cols := v_cols || ', activo';
        v_vals := v_vals || ', true';
      end if;

      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'perfiles'
          and column_name = 'tenant_ids'
      ) then
        v_cols := v_cols || ', tenant_ids';
        v_vals := v_vals || ', array[$2]::uuid[]';
      end if;

      execute format(
        'insert into public.perfiles (%s) values (%s)
         on conflict (id) do update set establecimiento_id = excluded.establecimiento_id',
        v_cols, v_vals
      )
      using v_orphan_user_id, v_tenant_b;

      v_profile_b_id := v_orphan_user_id;
    end if;
  end if;

  -- student_b: buscar existente
  select e.id
  into v_student_b_id
  from public.estudiantes e
  where e.establecimiento_id = v_tenant_b
  order by e.created_at nulls last, e.id
  limit 1;

  -- student_b: crear si falta
  if v_student_b_id is null then
    v_rut := 'SMOKE-' || replace(v_tenant_b::text, '-', '') || '-' || to_char(now(), 'HH24MISS');

    insert into public.estudiantes (
      establecimiento_id,
      nombre_completo,
      rut,
      curso
    )
    values (
      v_tenant_b,
      '[SMOKE] Estudiante Tenant B',
      v_rut,
      'SMOKE-B'
    )
    returning id into v_student_b_id;
  end if;

  raise notice 'tenant_b=% profile_b=% student_b=%', v_tenant_b, v_profile_b_id, v_student_b_id;
end $$;

-- resumen final
with tenants as (
  select id, row_number() over (order by created_at nulls last, id) as rn
  from public.establecimientos
),
ctx as (
  select
    (select id from tenants where rn = 2) as tenant_b_id
),
summary as (
  select
    c.tenant_b_id,
    (select p.id from public.perfiles p where p.establecimiento_id = c.tenant_b_id limit 1) as profile_b_id,
    (select e.id from public.estudiantes e where e.establecimiento_id = c.tenant_b_id limit 1) as student_b_id
  from ctx c
)
select
  'seed_tenant_b_ready' as check_name,
  case
    when tenant_b_id is null then 'FAIL'
    when student_b_id is null then 'FAIL'
    when profile_b_id is null then 'WARN'
    else 'PASS'
  end as status,
  jsonb_build_object(
    'tenant_b_id', tenant_b_id,
    'profile_b_id', profile_b_id,
    'student_b_id', student_b_id
  ) as details
from summary;

commit;
