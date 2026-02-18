-- =============================================================================
-- Fix: RLS para superadmin - permite acceso a todos los establecimientos
-- =============================================================================
-- Este fix corrige la función user_has_access_to_establecimiento para:
-- 1. Incluir 'superadmin' en los roles que pueden ver todos los establecimientos
-- 2. Verificar el rol ANTES de verificar establecimiento_id
--    (así un superadmin sin establecimiento_id puede acceder a todos)
-- =============================================================================

/**
 * Verifica si el usuario tiene acceso a un establecimiento específico
 * Versión corregida para soportar superadmin
 */
create or replace function public.user_has_access_to_establecimiento(p_establecimiento_id uuid)
returns boolean
language plpgsql
stable
as $$
declare
  v_user_establecimiento_id uuid;
  v_rol rol_usuario;
begin
  -- Obtener el rol del usuario
  v_rol := public.get_current_user_rol();
  
  -- Superadmin/sostenedor/admin puede ver todos los establecimientos
  if v_rol in ('superadmin', 'admin', 'sostenedor') then
    return true;
  end if;
  
  -- Obtener el establecimiento del usuario
  v_user_establecimiento_id := public.get_current_establecimiento_id();
  
  -- Si no hay establecimiento configurado, denegar acceso
  if v_user_establecimiento_id is null then
    return false;
  end if;
  
  -- Otros roles solo pueden ver su propio establecimiento
  return v_user_establecimiento_id = p_establecimiento_id;
end;
$$;

-- Verificar que la función se actualizó correctamente
select 
  proname as function_name,
  prosrc as function_body
from pg_proc
where proname = 'user_has_access_to_establecimiento';
