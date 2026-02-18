-- =============================================================================
-- 023_fix_hitos_expediente_rls.sql
-- Corrige RLS de hitos_expediente para permitir CRUD por acceso al tenant
-- del expediente relacionado (expedientes.establecimiento_id).
-- =============================================================================

alter table if exists public.hitos_expediente enable row level security;

-- Limpiar políticas legacy o conflictivas conocidas
drop policy if exists hitos_expediente_isolation on public.hitos_expediente;
drop policy if exists public_read_hitos_expediente on public.hitos_expediente;
drop policy if exists auth_write_hitos_expediente on public.hitos_expediente;
drop policy if exists hitos_read on public.hitos_expediente;
drop policy if exists hitos_write on public.hitos_expediente;
drop policy if exists hitos_expediente_select on public.hitos_expediente;
drop policy if exists hitos_expediente_insert on public.hitos_expediente;
drop policy if exists hitos_expediente_update on public.hitos_expediente;
drop policy if exists hitos_expediente_delete on public.hitos_expediente;

-- SELECT
create policy hitos_expediente_select
on public.hitos_expediente
for select
using (
  exists (
    select 1
    from public.expedientes e
    where e.id = hitos_expediente.expediente_id
      and public.can_access_tenant(e.establecimiento_id)
  )
);

-- INSERT
create policy hitos_expediente_insert
on public.hitos_expediente
for insert
with check (
  exists (
    select 1
    from public.expedientes e
    where e.id = hitos_expediente.expediente_id
      and public.can_access_tenant(e.establecimiento_id)
  )
);

-- UPDATE
create policy hitos_expediente_update
on public.hitos_expediente
for update
using (
  exists (
    select 1
    from public.expedientes e
    where e.id = hitos_expediente.expediente_id
      and public.can_access_tenant(e.establecimiento_id)
  )
)
with check (
  exists (
    select 1
    from public.expedientes e
    where e.id = hitos_expediente.expediente_id
      and public.can_access_tenant(e.establecimiento_id)
  )
);

-- DELETE
create policy hitos_expediente_delete
on public.hitos_expediente
for delete
using (
  exists (
    select 1
    from public.expedientes e
    where e.id = hitos_expediente.expediente_id
      and public.can_access_tenant(e.establecimiento_id)
  )
);

-- Grants mínimos para cliente autenticado
grant select, insert, update, delete on table public.hitos_expediente to authenticated;

comment on table public.hitos_expediente is
  'RLS corregido en 023: acceso por tenant del expediente relacionado.';
