-- =============================================================================
-- 028_fix_storage_superadmin_insert_policies.sql
-- Permite inserción en Storage para superadmin en buckets operativos.
-- Corrige error: "new row violates row-level security policy" al subir evidencias.
-- =============================================================================

do $$
begin
  begin
    execute 'alter table storage.objects enable row level security';

    execute 'drop policy if exists storage_insert_public on storage.objects';
    execute $p$
      create policy storage_insert_public
      on storage.objects
      for insert
      with check (
        bucket_id = 'evidencias-publicas'
        and auth.role() = 'authenticated'
        and (
          current_rol() in ('admin','director','convivencia','inspector')
          or public.is_platform_superadmin()
        )
        and (
          name like current_establecimiento_id()::text || '/%'
          or public.is_platform_superadmin()
        )
      )
    $p$;

    execute 'drop policy if exists storage_insert_sensitive on storage.objects';
    execute $p$
      create policy storage_insert_sensitive
      on storage.objects
      for insert
      with check (
        bucket_id = 'evidencias-sensibles'
        and auth.role() = 'authenticated'
        and (
          current_rol() in ('admin','director','convivencia','inspector')
          or public.is_platform_superadmin()
        )
        and (
          name like current_establecimiento_id()::text || '/%'
          or public.is_platform_superadmin()
        )
      )
    $p$;

    execute 'drop policy if exists storage_insert_psicosocial on storage.objects';
    execute $p$
      create policy storage_insert_psicosocial
      on storage.objects
      for insert
      with check (
        bucket_id = 'documentos-psicosociales'
        and auth.role() = 'authenticated'
        and (
          current_rol() = 'dupla'
          or public.is_platform_superadmin()
        )
        and (
          name like current_establecimiento_id()::text || '/%'
          or public.is_platform_superadmin()
        )
      )
    $p$;
  exception
    when insufficient_privilege then
      raise notice 'Skipping storage policy patch: insufficient privileges on storage.objects';
  end;
end $$;

