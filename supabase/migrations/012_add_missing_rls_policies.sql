-- =============================================================================
-- Multi-Tenancy: Políticas RLS Adicionales
-- =============================================================================
-- Este archivo añade políticas RLS faltantes identificadas en el análisis
-- de multi-tenancy para tablas que no fueron cubiertass en la migración 010
-- =============================================================================

-- =============================================================================
-- PARTE 1: Políticas para tenant_feature_flags
-- =============================================================================

-- tenant_feature_flags: tiene tenant_id (no establecimiento_id)
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'tenant_feature_flags' and column_name = 'tenant_id'
  ) then
    -- Habilitar RLS si no está habilitado
    alter table tenant_feature_flags enable row level security;
    
    drop policy if exists tenant_feature_flags_isolation on tenant_feature_flags;
    create policy tenant_feature_flags_isolation on tenant_feature_flags
    for all using (
      public.user_has_access_to_establecimiento(tenant_id)
    );
  end if;
end $$;

-- =============================================================================
-- PARTE 2: Índices para optimizar consultas de tenant
-- =============================================================================

-- Índices compuestos para mejor rendimiento en filtrado por tenant
create index if not exists idx_establecimiento_id on estudiantes(establecimiento_id);
create index if not exists idx_establecimiento_id on expedientes(establecimiento_id);
create index if not exists idx_establecimiento_id on evidencias(establecimiento_id);
create index if not exists idx_establecimiento_id on incidentes(establecimiento_id);
create index if not exists idx_establecimiento_id on bitacora_psicosocial(establecimiento_id);
create index if not exists idx_establecimiento_id on medidas_apoyo(establecimiento_id);
create index if not exists idx_establecimiento_id on derivaciones_externas(establecimiento_id);
create index if not exists idx_establecimiento_id on bitacora_salida(establecimiento_id);
create index if not exists idx_establecimiento_id on reportes_patio(establecimiento_id);
create index if not exists idx_establecimiento_id on mediaciones_gcc(establecimiento_id);
create index if not exists idx_establecimiento_id on carpetas_documentales(establecimiento_id);
create index if not exists idx_establecimiento_id on documentos_institucionales(establecimiento_id);

-- Índices para búsquedas comunes
create index if not exists idx_expedientes_estudiante on expedientes(estudiante_id);
create index if not exists idx_expedientes_estado on expedientes(estado_legal);
create index if not exists idx_expedientes_fecha on expedienteS(fecha_inicio);
create index if not exists idx_estudiantes_curso on estudiantes(curso);
create index if not exists idx_estudiantes_rut on estudiantes(rut);

-- =============================================================================
-- PARTE 3: Función helper para verificar acceso a registros heredados
-- =============================================================================

/**
 * Obtiene el establecimiento_id de un registro a través de su foreign key
 * Útil para tablas que heredan el establecimiento de otra tabla
 */
create or replace function public.get_establecimiento_from_entity(
  p_table_name text,
  p_record_id uuid
)
returns uuid
language plpgsql
stable
as $$
declare
  v_establecimiento_id uuid;
begin
  -- Mapeo de tablas a su FK de establecimiento
  case p_table_name
    when 'hitos_expediente' then
      select e.establecimiento_id into v_establecimiento_id
      from hitos_expediente h
      join expedientes e on e.id = h.expediente_id
      where h.id = p_record_id;
    
    when 'compromisos_mediacion' then
      select m.establecimiento_id into v_establecimiento_id
      from compromisos_mediacion c
      join mediaciones_gcc m on m.id = c.mediacion_id
      where c.id = p_record_id;
    
    when 'documentos_institucionales' then
      select d.establecimiento_id into v_establecimiento_id
      from documentos_institucionales d
      where d.id = p_record_id;
    
    else
      -- Intentar directamente si la tabla tiene establecimiento_id
      execute format('SELECT establecimiento_id FROM %I WHERE id = %L', p_table_name, p_record_id)
      into v_establecimiento_id;
  end case;
  
  return v_establecimiento_id;
end;
$$;

-- =============================================================================
-- PARTE 4: Verificar que todas las tablas requeridas tengan políticas
-- =============================================================================

-- Consulta de verificación (para revisar manualmente)
-- SELECT 
--   t.table_name,
--   case when exists (
--     select 1 from pg_policies p 
--     where p.tablename = t.table_name
--   ) then 'CON POLÍTICA' else 'SIN POLÍTICA' end as estado
-- FROM information_schema.tables t
-- WHERE t.table_schema = 'public'
--   AND t.table_type = 'BASE TABLE'
--   AND t.table_name NOT IN ('pg_statistic', 'pg_foreign_server', 
--     'pg_user_mappings', 'pg_subscription', 'pg_stats', 'pg_seclabel',
--     'pg_seclabels', 'pg_shseclabel', 'pg_shseclabels')
-- ORDER BY t.table_name;
