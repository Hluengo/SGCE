-- =============================================================================
-- 018_add_expediente_actor_b.sql
-- Agrega soporte para estudiante secundario (Actor B) en expedientes.
-- =============================================================================

alter table if exists public.expedientes
  add column if not exists estudiante_b_id uuid null
  references public.estudiantes(id) on delete set null;

create index if not exists idx_expedientes_estudiante_b_id
  on public.expedientes(estudiante_b_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expedientes_estudiante_a_b_distintos_chk'
      and conrelid = 'public.expedientes'::regclass
  ) then
    alter table public.expedientes
      add constraint expedientes_estudiante_a_b_distintos_chk
      check (
        estudiante_b_id is null
        or estudiante_id <> estudiante_b_id
      );
  end if;
end $$;

create or replace function public.validate_expediente_actor_b_same_tenant()
returns trigger
language plpgsql
as $$
declare
  v_establecimiento_a uuid;
  v_establecimiento_b uuid;
begin
  if new.estudiante_b_id is null then
    return new;
  end if;

  select establecimiento_id
  into v_establecimiento_a
  from public.estudiantes
  where id = new.estudiante_id;

  select establecimiento_id
  into v_establecimiento_b
  from public.estudiantes
  where id = new.estudiante_b_id;

  if v_establecimiento_a is null or v_establecimiento_b is null then
    raise exception 'Estudiante A o Estudiante B no existen';
  end if;

  if v_establecimiento_a <> v_establecimiento_b then
    raise exception 'Estudiante B debe pertenecer al mismo establecimiento que Estudiante A';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_expedientes_validate_actor_b on public.expedientes;
create trigger trg_expedientes_validate_actor_b
before insert or update on public.expedientes
for each row execute function public.validate_expediente_actor_b_same_tenant();

comment on column public.expedientes.estudiante_b_id is
  'Estudiante secundario (Actor B) asociado al expediente.';
