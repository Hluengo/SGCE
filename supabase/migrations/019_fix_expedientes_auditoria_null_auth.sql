-- =============================================================================
-- 019_fix_expedientes_auditoria_null_auth.sql
-- Evita error NOT NULL/FK al auditar SELECT cuando auth.uid() no está disponible.
-- =============================================================================

create or replace function public.log_expediente_view(p_expediente_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- En SQL editor / service role sin JWT, auth.uid() puede venir null.
  if v_uid is null then
    return true;
  end if;

  -- Si el usuario no tiene perfil en public.perfiles, no insertar auditoría.
  if not exists (
    select 1
    from public.perfiles p
    where p.id = v_uid
  ) then
    return true;
  end if;

  insert into public.logs_auditoria (establecimiento_id, usuario_id, accion, tabla_afectada, registro_id)
  select e.establecimiento_id, v_uid, 'SELECT', 'expedientes', e.id
  from public.expedientes e
  where e.id = p_expediente_id;

  return true;
exception
  when foreign_key_violation or not_null_violation then
    -- Fail-open controlado para no bloquear consultas de lectura del view.
    return true;
end;
$$;

comment on function public.log_expediente_view(uuid) is
  'Audita lectura de expedientes cuando existe usuario autenticado válido (auth.uid + perfil).';
