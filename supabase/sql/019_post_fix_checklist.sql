-- =============================================================================
-- 019_post_fix_checklist.sql
-- Verificación post-fix para log_expediente_view / expedientes_auditoria
-- Ejecutar en Supabase SQL Editor (manual).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Verificar que la función existe y tiene SECURITY DEFINER
-- -----------------------------------------------------------------------------
select
  'function_exists:log_expediente_view' as check_name,
  case when exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'log_expediente_view'
  ) then 'PASS' else 'FAIL' end as status,
  jsonb_build_object(
    'schema', 'public',
    'function', 'log_expediente_view(uuid)'
  ) as details
union all
select
  'function_is_security_definer:log_expediente_view',
  case when exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'log_expediente_view'
      and p.prosecdef = true
  ) then 'PASS' else 'WARN' end,
  jsonb_build_object('expected', true);

-- -----------------------------------------------------------------------------
-- B) Verificar que el view existe
-- -----------------------------------------------------------------------------
select
  'view_exists:expedientes_auditoria' as check_name,
  case when exists (
    select 1
    from information_schema.views v
    where v.table_schema = 'public'
      and v.table_name = 'expedientes_auditoria'
  ) then 'PASS' else 'FAIL' end as status,
  jsonb_build_object('view', 'public.expedientes_auditoria') as details;

-- -----------------------------------------------------------------------------
-- C) Smoke test: leer desde la vista (no debe lanzar error)
-- -----------------------------------------------------------------------------
-- Si esto retorna filas o 0 filas sin error => fix OK
select
  id,
  folio,
  estudiante_id,
  estudiante_b_id,
  _audit
from public.expedientes_auditoria
limit 5;

-- -----------------------------------------------------------------------------
-- D) Control de calidad de logs: no deben existir SELECT con usuario nulo
-- -----------------------------------------------------------------------------
select
  'audit_select_rows_with_null_user' as check_name,
  case when count(*) = 0 then 'PASS' else 'FAIL' end as status,
  jsonb_build_object('rows', count(*)) as details
from public.logs_auditoria
where tabla_afectada = 'expedientes'
  and accion = 'SELECT'
  and usuario_id is null;

-- -----------------------------------------------------------------------------
-- E) Test explícito de la función con uid nulo (simulación SQL editor)
-- -----------------------------------------------------------------------------
-- Debe retornar true sin lanzar excepción
select set_config('request.jwt.claim.sub', '', true);
select
  'function_call_with_null_uid_no_error' as check_name,
  case when public.log_expediente_view((select id from public.expedientes limit 1)) then 'PASS' else 'WARN' end as status,
  jsonb_build_object('note', 'Debe retornar true sin error con uid nulo') as details;

-- -----------------------------------------------------------------------------
-- F) Test con usuario válido (si existe perfil)
-- -----------------------------------------------------------------------------
-- Si no existe perfil disponible, retornará SKIP.
do $$
declare
  v_user_id uuid;
  v_expediente_id uuid;
  v_before int;
  v_after int;
begin
  select p.id into v_user_id
  from public.perfiles p
  where coalesce(p.activo, true) = true
  limit 1;

  select e.id into v_expediente_id
  from public.expedientes e
  limit 1;

  if v_user_id is null or v_expediente_id is null then
    raise notice 'SKIP: no hay perfil activo o expediente para test de inserción de auditoría.';
    return;
  end if;

  select count(*) into v_before
  from public.logs_auditoria
  where tabla_afectada = 'expedientes'
    and accion = 'SELECT'
    and usuario_id = v_user_id
    and registro_id = v_expediente_id;

  perform set_config('request.jwt.claim.sub', v_user_id::text, true);
  perform public.log_expediente_view(v_expediente_id);

  select count(*) into v_after
  from public.logs_auditoria
  where tabla_afectada = 'expedientes'
    and accion = 'SELECT'
    and usuario_id = v_user_id
    and registro_id = v_expediente_id;

  if v_after > v_before then
    raise notice 'PASS: se registró auditoría SELECT con usuario válido (%).', v_user_id;
  else
    raise notice 'WARN: no aumentó el contador de logs SELECT para usuario válido (%).', v_user_id;
  end if;
end $$;
