-- 035_add_additional_data_to_expedientes.sql
-- Extiende la tabla expedientes para incluir metadata JSON usada por triggers/auditoría.

alter table if exists public.expedientes
  add column if not exists additional_data jsonb default '{}'::jsonb;

comment on column public.expedientes.additional_data is
  'Blob JSON con metadatos auxiliares capturados por el frontend (ej: resumen de actores, contexto).';

update public.expedientes
   set additional_data = coalesce(additional_data, '{}'::jsonb)
 where additional_data is null;
