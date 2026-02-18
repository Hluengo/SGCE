-- =============================================================================
-- Multi-Tenancy Migration: Shared Database, Shared Schema with tenant isolation
-- =============================================================================
-- Este archivo implementa el patrón de aislamiento de datos donde cada 
-- establecimiento (tenant) tiene sus datos aislados mediante RLS.
--
-- ESTRATEGIA:
-- 1. Todas las tablas ya tienen `establecimiento_id` como FK a establecimientos
-- 2. RLS filtra automáticamente por el establecimiento del usuario autenticado
-- 3. No se usa columna tenant_id separada - establecimiento_id cumple esa función
-- =============================================================================

-- =============================================================================
-- PARTE 1: Funciones helper para Multi-Tenancy
-- =============================================================================

/**
 * Obtiene el establecimiento_id del usuario actual desde su perfil
 * Returns: uuid del establecimiento o null si no hay sesión
 */
create or replace function public.get_current_establecimiento_id()
returns uuid
language plpgsql
stable
as $$
declare
  v_establecimiento_id uuid;
begin
  -- Intentar obtener desde la sesión de auth
  select p.establecimiento_id
  into v_establecimiento_id
  from auth.users u
  join public.perfiles p on p.id = u.id
  where u.id = auth.uid();

  return v_establecimiento_id;
end;
$$;

/**
 * Obtiene el rol del usuario actual desde su perfil
 */
create or replace function public.get_current_user_rol()
returns rol_usuario
language plpgsql
stable
as $$
declare
  v_rol rol_usuario;
begin
  select p.rol
  into v_rol
  from auth.users u
  join public.perfiles p on p.id = u.id
  where u.id = auth.uid();

  return v_rol;
end;
$$;

/**
 * Verifica si el usuario tiene acceso a un establecimiento específico
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

/**
 * Función auxiliar para usar en políticas RLS
 * Retorna true si el usuario puede acceder a la fila basada en establecimiento_id
 */
create or replace function public.can_user_access_row(p_establecimiento_id uuid)
returns boolean
language plpgsql
stable
as $$
begin
  return public.user_has_access_to_establecimiento(p_establecimiento_id);
end;
$$;

-- =============================================================================
-- PARTE 2: Políticas RLS específicas por tabla
-- =============================================================================

-- Tabla: establecimientos (tabla maestra de tenants)
-- Solo admins pueden modificar, pero todos pueden leer para mostrar en UI
drop policy if exists public_read_establecimientos on establecimientos;
drop policy if exists admin_write_establecimientos on establecimientos;

create policy public_read_establecimientos on establecimientos
for select using (true);

create policy admin_write_establecimientos on establecimientos
for all using (
  auth.uid() in (
    select id from perfiles where rol in ('admin', 'sostenedor')
  )
);

-- Tabla: perfiles (usuarios)
-- Cada usuario solo ve usuarios de su establecimiento
drop policy if exists perfiles_own_establecimiento on perfiles;

create policy perfiles_own_establecimiento on perfiles
for all using (
  public.get_current_establecimiento_id() = establecimiento_id
  or auth.uid() in (
    select id from perfiles where rol in ('admin', 'sostenedor')
  )
);

-- Tabla: estudiantes
drop policy if exists estudiantes_isolation on estudiantes;

create policy estudiantes_isolation on estudiantes
for all using (
  public.can_user_access_row(establecimiento_id)
);

-- Tabla: expedientes
drop policy if exists expedientes_isolation on expedientes;

create policy expedientes_isolation on expedientes
for all using (
  public.can_user_access_row(establecimiento_id)
);

-- Tabla: evidencias
drop policy if exists evidencias_isolation on evidencias;

create policy evidencias_isolation on evidencias
for all using (
  public.can_user_access_row(establecimiento_id)
);

-- Tabla: bitacora_psicosocial (datos sensibles)
drop policy if exists bitacora_psicosocial_isolation on bitacora_psicosocial;

create policy bitacora_psicosocial_isolation on bitacora_psicosocial
for all using (
  public.can_user_access_row(establecimiento_id)
);

-- Tabla: medidas_apoyo
drop policy if exists medidas_apoyo_isolation on medidas_apoyo;

create policy medidas_apoyo_isolation on medidas_apoyo
for all using (
  public.can_user_access_row(establecimiento_id)
);

-- Tabla: incidentes
drop policy if exists incidentes_isolation on incidentes;

create policy incidentes_isolation on incidentes
for all using (
  public.can_user_access_row(establecimiento_id)
);

-- Tabla: logs_auditoria
drop policy if exists logs_auditoria_isolation on logs_auditoria;

create policy logs_auditoria_isolation on logs_auditoria
for all using (
  public.can_user_access_row(establecimiento_id)
);

-- Tabla: cursos_inspector
drop policy if exists cursos_inspector_isolation on cursos_inspector;

create policy cursos_inspector_isolation on cursos_inspector
for all using (
  public.can_user_access_row(establecimiento_id)
);

-- =============================================================================
-- PARTE 3: Tablas adicionales del proyecto 
-- (solo crear políticas si la tabla Y la columna establecimiento_id existen)
-- =============================================================================

-- hitos_expediente
do $$
begin
  if exists (
    select 1 from information_schema.tables t
    join information_schema.columns c on c.table_name = t.table_name 
    where t.table_name = 'hitos_expediente' 
    and c.column_name = 'establecimiento_id'
  ) then
    drop policy if exists hitos_expediente_isolation on hitos_expediente;
    create policy hitos_expediente_isolation on hitos_expediente
    for all using (
      exists (
        select 1 from expedientes e
        where e.id = hitos_expediente.expediente_id
        and public.can_user_access_row(e.establecimiento_id)
      )
    );
  end if;
end $$;

-- derivaciones_externas
do $$
begin
  if exists (
    select 1 from information_schema.tables t
    join information_schema.columns c on c.table_name = t.table_name 
    where t.table_name = 'derivaciones_externas' 
    and c.column_name = 'establecimiento_id'
  ) then
    drop policy if exists derivaciones_externas_isolation on derivaciones_externas;
    create policy derivaciones_externas_isolation on derivaciones_externas
    for all using (
      public.can_user_access_row(establecimiento_id)
    );
  end if;
end $$;

-- bitacora_salida
do $$
begin
  if exists (
    select 1 from information_schema.tables t
    join information_schema.columns c on c.table_name = t.table_name 
    where t.table_name = 'bitacora_salida' 
    and c.column_name = 'establecimiento_id'
  ) then
    drop policy if exists bitacora_salida_isolation on bitacora_salida;
    create policy bitacora_salida_isolation on bitacora_salida
    for all using (
      public.can_user_access_row(establecimiento_id)
    );
  end if;
end $$;

-- reportes_patio
do $$
begin
  if exists (
    select 1 from information_schema.tables t
    join information_schema.columns c on c.table_name = t.table_name 
    where t.table_name = 'reportes_patio' 
    and c.column_name = 'establecimiento_id'
  ) then
    drop policy if exists reportes_patio_isolation on reportes_patio;
    create policy reportes_patio_isolation on reportes_patio
    for all using (
      public.can_user_access_row(establecimiento_id)
    );
  end if;
end $$;

-- mediaciones_gcc
do $$
begin
  if exists (
    select 1 from information_schema.tables t
    join information_schema.columns c on c.table_name = t.table_name 
    where t.table_name = 'mediaciones_gcc' 
    and c.column_name = 'establecimiento_id'
  ) then
    drop policy if exists mediaciones_gcc_isolation on mediaciones_gcc;
    create policy mediaciones_gcc_isolation on mediaciones_gcc
    for all using (
      public.can_user_access_row(establecimiento_id)
    );
  end if;
end $$;

-- compromisos_mediacion
do $$
begin
  if exists (
    select 1 from information_schema.tables t
    join information_schema.columns c on c.table_name = t.table_name 
    where t.table_name = 'compromisos_mediacion' 
    and c.column_name = 'establecimiento_id'
  ) then
    drop policy if exists compromisos_mediacion_isolation on compromisos_mediacion;
    create policy compromisos_mediacion_isolation on compromisos_mediacion
    for all using (
      public.can_user_access_row(establecimiento_id)
    );
  end if;
end $$;

-- carpetas_documentales
do $$
begin
  if exists (
    select 1 from information_schema.tables t
    join information_schema.columns c on c.table_name = t.table_name 
    where t.table_name = 'carpetas_documentales' 
    and c.column_name = 'establecimiento_id'
  ) then
    drop policy if exists carpetas_documentales_isolation on carpetas_documentales;
    create policy carpetas_documentales_isolation on carpetas_documentales
    for all using (
      public.can_user_access_row(establecimiento_id)
    );
  end if;
end $$;

-- documentos_institucionales
do $$
begin
  if exists (
    select 1 from information_schema.tables t
    join information_schema.columns c on c.table_name = t.table_name 
    where t.table_name = 'documentos_institucionales' 
    and c.column_name = 'establecimiento_id'
  ) then
    drop policy if exists documentos_institucionales_isolation on documentos_institucionales;
    create policy documentos_institucionales_isolation on documentos_institucionales
    for all using (
      public.can_user_access_row(establecimiento_id)
    );
  end if;
end $$;

-- =============================================================================
-- PARTE 4: Trigger para logging de auditoría automático
-- =============================================================================

/**
 * Trigger que registra automáticamente operaciones DML en logs_auditoria
 */
create or replace function public.audit_trigger()
returns trigger
language plpgsql
as $$
declare
  v_accion text;
  v_tabla text;
begin
  -- Determinar acción
  if TG_OP = 'INSERT' then
    v_accion := 'INSERT';
  elsif TG_OP = 'UPDATE' then
    v_accion := 'UPDATE';
  elsif TG_OP = 'DELETE' then
    v_accion := 'DELETE';
  end if;

  -- Obtener nombre de tabla
  v_tabla := TG_TABLE_NAME;

  -- Insertar en logs_auditoria si la columna establecimiento_id existe
  if exists (
    select 1 from information_schema.columns 
    where table_name = TG_TABLE_NAME and column_name = 'establecimiento_id'
  ) then
    insert into logs_auditoria (
      establecimiento_id,
      usuario_id,
      accion,
      tabla_afectada,
      registro_id,
      detalle
    ) values (
      coalesce(NEW.establecimiento_id, public.get_current_establecimiento_id()),
      auth.uid(),
      v_accion,
      v_tabla,
      coalesce(NEW.id, OLD.id),
      jsonb_build_object(
        'old_data', case when TG_OP != 'INSERT' then row_to_json(OLD) end,
        'new_data', case when TG_OP != 'DELETE' then row_to_json(NEW) end
      )
    );
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

-- =============================================================================
-- PARTE 5: Habilitar RLS en todas las tablas que corresponda
-- =============================================================================

-- Habilitar RLS en establecimientos
alter table establecimientos enable row level security;

-- Habilitar RLS en perfiles (si no está habilitado)
alter table perfiles enable row level security;

-- Nota: Las demás tablas ya deberían tener RLS habilitado de migraciones anteriores

-- =============================================================================
-- PARTE 6: Función para obtener tenant desde header personalizado (para APIs)
-- =============================================================================

/**
 * Obtiene el establishment_id desde un header personalizado x-establishment-id
 * Útil para integraciones API donde no hay sesión de usuario
 */
create or replace function public.get_establishment_from_header()
returns uuid
language plpgsql
stable
as $$
declare
  v_header_value text;
  v_establecimiento_id uuid;
begin
  -- Buscar header personalizado en la solicitud
  v_header_value := current_setting('request.headers', true)->>'x-establishment-id';
  
  if v_header_value is null or v_header_value = '' then
    return null;
  end if;

  -- Validar que es un UUID válido y que el establecimiento existe
  begin
    v_establecimiento_id := v_header_value::uuid;
  exception
    when others then
      return null;
  end;

  -- Verificar que el establecimiento existe
  if not exists (select 1 from establecimientos where id = v_establecimiento_id) then
    return null;
  end if;

  return v_establecimiento_id;
end;
$$;

-- Comentario para documentar la estrategia
comment on function public.get_current_establecimiento_id() is 
  'Obtiene el establecimiento (tenant) del usuario autenticado actual. Usado para filtrado automático en RLS.';

comment on function public.can_user_access_row(uuid) is 
  'Función auxiliar para políticas RLS. Retorna true si el usuario puede acceder a filas del establecimiento especificado.';

comment on schema public is 
  'Esquema público con funciones de multi-tenancy para aislamiento de datos por establecimiento.';
