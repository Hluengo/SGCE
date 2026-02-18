-- 034_add_interaction_type_to_expedientes.sql
-- Alinea la tabla expedientes con los triggers de auditoría que esperan el campo interaction_type
-- y evita errores "record 'new' has no field 'interaction_type'" al crear registros desde el wizard.

alter table if exists public.expedientes
  add column if not exists interaction_type text default 'creacion';

comment on column public.expedientes.interaction_type is
  'Tipo de interacción que originó el registro (creacion, actualizacion, derivacion, etc.)';

update public.expedientes
   set interaction_type = coalesce(interaction_type, 'creacion')
 where interaction_type is distinct from 'creacion';
