-- =============================================================================
-- 024_fix_operational_tables_superadmin_rls.sql
-- Asegura operatividad de frontend para superusuario y acceso por tenant.
-- Tablas: reportes_patio, derivaciones_externas, bitacora_psicosocial, medidas_apoyo
-- =============================================================================

-- reportes_patio
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'reportes_patio'
  ) then
    alter table public.reportes_patio enable row level security;

    drop policy if exists reportes_patio_isolation on public.reportes_patio;
    drop policy if exists patio_read on public.reportes_patio;
    drop policy if exists patio_write on public.reportes_patio;
    drop policy if exists public_read_reportes_patio on public.reportes_patio;
    drop policy if exists auth_write_reportes_patio on public.reportes_patio;
    drop policy if exists patio_update_estado on public.reportes_patio;

    create policy reportes_patio_tenant_access
    on public.reportes_patio
    for all
    using (public.can_access_tenant(establecimiento_id))
    with check (public.can_access_tenant(establecimiento_id));

    grant select, insert, update, delete on table public.reportes_patio to authenticated;
  end if;
end $$;

-- derivaciones_externas
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'derivaciones_externas'
  ) then
    alter table public.derivaciones_externas enable row level security;

    drop policy if exists derivaciones_externas_isolation on public.derivaciones_externas;
    drop policy if exists derivaciones_read on public.derivaciones_externas;
    drop policy if exists derivaciones_write on public.derivaciones_externas;
    drop policy if exists public_read_derivaciones_externas on public.derivaciones_externas;
    drop policy if exists auth_write_derivaciones_externas on public.derivaciones_externas;

    create policy derivaciones_externas_tenant_access
    on public.derivaciones_externas
    for all
    using (public.can_access_tenant(establecimiento_id))
    with check (public.can_access_tenant(establecimiento_id));

    grant select, insert, update, delete on table public.derivaciones_externas to authenticated;
  end if;
end $$;

-- bitacora_psicosocial
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'bitacora_psicosocial'
  ) then
    alter table public.bitacora_psicosocial enable row level security;

    drop policy if exists bitacora_psicosocial_isolation on public.bitacora_psicosocial;
    drop policy if exists bitacora_dupla_only on public.bitacora_psicosocial;
    drop policy if exists public_read_bitacora_psicosocial on public.bitacora_psicosocial;
    drop policy if exists auth_write_bitacora_psicosocial on public.bitacora_psicosocial;

    create policy bitacora_psicosocial_tenant_access
    on public.bitacora_psicosocial
    for all
    using (public.can_access_tenant(establecimiento_id))
    with check (public.can_access_tenant(establecimiento_id));

    grant select, insert, update, delete on table public.bitacora_psicosocial to authenticated;
  end if;
end $$;

-- medidas_apoyo
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'medidas_apoyo'
  ) then
    alter table public.medidas_apoyo enable row level security;

    drop policy if exists medidas_apoyo_isolation on public.medidas_apoyo;
    drop policy if exists medidas_read on public.medidas_apoyo;
    drop policy if exists medidas_write_equipo on public.medidas_apoyo;
    drop policy if exists medidas_update_equipo on public.medidas_apoyo;
    drop policy if exists public_read_medidas_apoyo on public.medidas_apoyo;
    drop policy if exists auth_write_medidas_apoyo on public.medidas_apoyo;

    create policy medidas_apoyo_tenant_access
    on public.medidas_apoyo
    for all
    using (public.can_access_tenant(establecimiento_id))
    with check (public.can_access_tenant(establecimiento_id));

    grant select, insert, update, delete on table public.medidas_apoyo to authenticated;
  end if;
end $$;

comment on schema public is
  'RLS operacional reforzado en 024 para acciones de dashboard por tenant/superadmin.';
