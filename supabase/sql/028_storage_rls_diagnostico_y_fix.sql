-- =============================================================================
-- 028_storage_rls_diagnostico_y_fix.sql
-- Ejecutar en SQL Editor para diagnosticar y reparar RLS de storage.objects.
-- =============================================================================

-- 1) Diagnóstico rápido de políticas insert en storage.objects
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'storage_insert_public',
    'storage_insert_sensitive',
    'storage_insert_psicosocial'
  )
order by policyname;

-- 2) Reparación directa (sin bloquear por notice silencioso)
alter table storage.objects enable row level security;

drop policy if exists storage_insert_public on storage.objects;
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
);

drop policy if exists storage_insert_sensitive on storage.objects;
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
);

drop policy if exists storage_insert_psicosocial on storage.objects;
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
);

-- 3) Confirmación post-fix
select
  policyname,
  cmd,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'storage_insert_public',
    'storage_insert_sensitive',
    'storage_insert_psicosocial'
  )
order by policyname;

