-- =============================================================================
-- 017_tenant_management_columns.sql
-- Campos de gestion de colegios para administracion frontend de tenants.
-- =============================================================================

alter table if exists public.establecimientos
  add column if not exists direccion text,
  add column if not exists telefono text,
  add column if not exists email text,
  add column if not exists niveles_educativos text[] not null default '{}'::text[];

create index if not exists idx_establecimientos_nombre on public.establecimientos(nombre);
create index if not exists idx_establecimientos_rbd on public.establecimientos(rbd);

comment on column public.establecimientos.direccion is
  'Direccion del establecimiento administrable desde UI superadmin.';

comment on column public.establecimientos.telefono is
  'Telefono de contacto del establecimiento.';

comment on column public.establecimientos.email is
  'Email institucional del establecimiento.';

comment on column public.establecimientos.niveles_educativos is
  'Niveles educativos ofrecidos por el establecimiento.';
