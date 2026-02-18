-- Supabase initialization script for Convivencia Escolar
-- Generated for Circulares 781/782 compliance needs

-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type rol_usuario as enum (
  'admin',
  'director',
  'convivencia',
  'dupla',
  'inspector',
  'sostenedor'
);

create type tipo_falta as enum (
  'leve',
  'relevante',
  'expulsion'
);

create type estado_legal as enum (
  'apertura',
  'investigacion',
  'resolucion',
  'cerrado'
);

create type nivel_privacidad as enum (
  'baja',
  'media',
  'alta'
);

-- Core tables
create table if not exists establecimientos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  rbd text,
  created_at timestamptz not null default now()
);

create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol rol_usuario not null,
  establecimiento_id uuid not null references establecimientos(id),
  created_at timestamptz not null default now()
);

create table if not exists estudiantes (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  nombre_completo text not null,
  rut text not null unique,
  curso text not null,
  programa_pie boolean not null default false,
  alerta_nee boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists expedientes (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  estudiante_id uuid not null references estudiantes(id) on delete restrict,
  folio text not null unique,
  tipo_falta tipo_falta not null,
  estado_legal estado_legal not null default 'apertura',
  fecha_inicio date not null,
  plazo_fatal timestamptz,
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now()
);

create table if not exists evidencias (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  expediente_id uuid not null references expedientes(id) on delete cascade,
  url_storage text not null,
  tipo_archivo text not null,
  hash_integridad text,
  subido_por uuid not null references perfiles(id),
  created_at timestamptz not null default now()
);

create table if not exists bitacora_psicosocial (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  estudiante_id uuid not null references estudiantes(id) on delete cascade,
  profesional_id uuid not null references perfiles(id),
  notas_confidenciales text not null,
  nivel_privacidad nivel_privacidad not null default 'alta',
  es_vulneracion boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists medidas_apoyo (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  estudiante_id uuid not null references estudiantes(id) on delete cascade,
  tipo_accion text not null,
  objetivo text not null,
  fecha_ejecucion date not null,
  acta_url text,
  created_at timestamptz not null default now()
);

create table if not exists incidentes (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  estudiante_id uuid references estudiantes(id) on delete set null,
  expediente_id uuid references expedientes(id) on delete set null,
  descripcion text not null,
  fecha_incidente timestamptz not null default now(),
  creado_por uuid not null references perfiles(id),
  created_at timestamptz not null default now()
);

create table if not exists logs_auditoria (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  usuario_id uuid not null references perfiles(id),
  accion text not null,
  tabla_afectada text not null,
  registro_id uuid,
  detalle jsonb,
  created_at timestamptz not null default now()
);

create table if not exists feriados_chile (
  fecha date primary key,
  descripcion text not null,
  es_irrenunciable boolean not null default false
);

create table if not exists cursos_inspector (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  inspector_id uuid not null references perfiles(id),
  curso text not null,
  created_at timestamptz not null default now(),
  unique (inspector_id, curso)
);

-- Helpers for RLS
create or replace function current_rol()
returns rol_usuario
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'rol')::rol_usuario,
    (auth.jwt() -> 'user_metadata' ->> 'rol')::rol_usuario
  );
$$;

create or replace function current_establecimiento_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'establecimiento_id')::uuid,
    (auth.jwt() -> 'user_metadata' ->> 'establecimiento_id')::uuid
  );
$$;

-- Ensure establecimiento_id is consistent
create or replace function set_establecimiento_from_estudiante()
returns trigger
language plpgsql
as $$
begin
  if new.estudiante_id is null then
    return new;
  end if;
  select e.establecimiento_id into new.establecimiento_id
  from estudiantes e
  where e.id = new.estudiante_id;
  return new;
end;
$$;

create or replace function set_establecimiento_from_expediente()
returns trigger
language plpgsql
as $$
begin
  if new.expediente_id is null then
    return new;
  end if;
  select e.establecimiento_id into new.establecimiento_id
  from expedientes e
  where e.id = new.expediente_id;
  return new;
end;
$$;

create trigger trg_expedientes_establecimiento
before insert or update on expedientes
for each row execute function set_establecimiento_from_estudiante();

create trigger trg_evidencias_establecimiento
before insert or update on evidencias
for each row execute function set_establecimiento_from_expediente();

create trigger trg_bitacora_establecimiento
before insert or update on bitacora_psicosocial
for each row execute function set_establecimiento_from_estudiante();

create trigger trg_medidas_establecimiento
before insert or update on medidas_apoyo
for each row execute function set_establecimiento_from_estudiante();

create trigger trg_incidentes_establecimiento
before insert or update on incidentes
for each row execute function set_establecimiento_from_estudiante();

-- Audit logging for expediente changes
create or replace function log_expediente_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into logs_auditoria (establecimiento_id, usuario_id, accion, tabla_afectada, registro_id, detalle)
  values (
    coalesce(new.establecimiento_id, old.establecimiento_id),
    auth.uid(),
    tg_op,
    'expedientes',
    coalesce(new.id, old.id),
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
  );
  return coalesce(new, old);
end;
$$;

create trigger trg_expedientes_audit
after insert or update or delete on expedientes
for each row execute function log_expediente_change();

-- Optional: log views via view + function (Postgres has no SELECT trigger)
create or replace function log_expediente_view(p_expediente_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into logs_auditoria (establecimiento_id, usuario_id, accion, tabla_afectada, registro_id)
  select e.establecimiento_id, auth.uid(), 'SELECT', 'expedientes', e.id
  from expedientes e
  where e.id = p_expediente_id;
  return true;
end;
$$;

create or replace view expedientes_auditoria as
select
  e.*,
  log_expediente_view(e.id) as _audit
from expedientes e;

-- RLS
alter table perfiles enable row level security;
alter table estudiantes enable row level security;
alter table expedientes enable row level security;
alter table evidencias enable row level security;
alter table bitacora_psicosocial enable row level security;
alter table medidas_apoyo enable row level security;
alter table incidentes enable row level security;
alter table logs_auditoria enable row level security;
alter table cursos_inspector enable row level security;

-- perfiles
create policy perfiles_self_read on perfiles
for select using (id = auth.uid());

create policy perfiles_read_directivos on perfiles
for select using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','sostenedor')
);

create policy perfiles_insert_admin on perfiles
for insert with check (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director')
);

create policy perfiles_update_admin on perfiles
for update using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director')
)
with check (establecimiento_id = current_establecimiento_id());

create policy perfiles_delete_admin on perfiles
for delete using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin')
);

-- estudiantes
create policy estudiantes_read on estudiantes
for select using (establecimiento_id = current_establecimiento_id());

create policy estudiantes_write_equipo on estudiantes
for insert with check (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','convivencia','dupla')
);

create policy estudiantes_update_equipo on estudiantes
for update using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','convivencia','dupla')
)
with check (establecimiento_id = current_establecimiento_id());

-- expedientes
drop policy if exists expedientes_read on expedientes;
create policy expedientes_read on expedientes
for select using (
  establecimiento_id = current_establecimiento_id()
  and (
    current_rol() <> 'inspector'
    or creado_por = auth.uid()
    or exists (
      select 1
      from estudiantes s
      join cursos_inspector ci on ci.curso = s.curso
      where s.id = expedientes.estudiante_id
        and ci.inspector_id = auth.uid()
        and ci.establecimiento_id = expedientes.establecimiento_id
    )
  )
);

create policy expedientes_insert_equipo on expedientes
for insert with check (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','convivencia')
);

create policy expedientes_update_directivos on expedientes
for update using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','convivencia')
)
with check (establecimiento_id = current_establecimiento_id());

create policy expedientes_update_inspector on expedientes
for update using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() = 'inspector'
  and estado_legal <> 'resolucion'
)
with check (
  establecimiento_id = current_establecimiento_id()
  and estado_legal <> 'resolucion'
);

-- evidencias
create policy evidencias_read on evidencias
for select using (establecimiento_id = current_establecimiento_id());

create policy evidencias_insert_equipo on evidencias
for insert with check (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','convivencia','inspector')
);

create policy evidencias_update_equipo on evidencias
for update using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','convivencia')
)
with check (establecimiento_id = current_establecimiento_id());

-- bitacora_psicosocial: only 'dupla' can read/write
create policy bitacora_dupla_only on bitacora_psicosocial
for all using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() = 'dupla'
)
with check (
  establecimiento_id = current_establecimiento_id()
  and current_rol() = 'dupla'
);

-- medidas_apoyo
create policy medidas_read on medidas_apoyo
for select using (establecimiento_id = current_establecimiento_id());

create policy medidas_write_equipo on medidas_apoyo
for insert with check (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','convivencia','dupla')
);

create policy medidas_update_equipo on medidas_apoyo
for update using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','convivencia','dupla')
)
with check (establecimiento_id = current_establecimiento_id());

-- incidentes
create policy incidentes_read on incidentes
for select using (establecimiento_id = current_establecimiento_id());

create policy incidentes_insert_inspector on incidentes
for insert with check (
  establecimiento_id = current_establecimiento_id()
  and current_rol() = 'inspector'
);

create policy incidentes_update_equipo on incidentes
for update using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','convivencia')
)
with check (establecimiento_id = current_establecimiento_id());

-- logs_auditoria
create policy logs_read on logs_auditoria
for select using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director','sostenedor')
);

create policy logs_insert_system on logs_auditoria
for insert with check (true);

-- cursos_inspector (solo admin/director pueden asignar)
create policy cursos_inspector_read on cursos_inspector
for select using (establecimiento_id = current_establecimiento_id());

create policy cursos_inspector_write on cursos_inspector
for all using (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director')
)
with check (
  establecimiento_id = current_establecimiento_id()
  and current_rol() in ('admin','director')
);

-- Storage RLS (storage.objects)
-- Enforce object paths like "{establecimiento_id}/..."
do $$
begin
  begin
    execute 'alter table storage.objects enable row level security';

    execute 'drop policy if exists storage_read_public on storage.objects';
    execute 'create policy storage_read_public on storage.objects for select using (bucket_id = ''evidencias-publicas'' and auth.role() = ''authenticated'' and (name like current_establecimiento_id()::text || ''/%''))';

    execute 'drop policy if exists storage_read_sensitive on storage.objects';
    execute 'create policy storage_read_sensitive on storage.objects for select using (bucket_id in (''evidencias-sensibles'',''documentos-psicosociales'') and auth.role() = ''authenticated'' and current_rol() in (''admin'',''director'',''convivencia'',''dupla'') and (name like current_establecimiento_id()::text || ''/%''))';

    execute 'drop policy if exists storage_insert_public on storage.objects';
    execute 'create policy storage_insert_public on storage.objects for insert with check (bucket_id = ''evidencias-publicas'' and auth.role() = ''authenticated'' and current_rol() in (''admin'',''director'',''convivencia'',''inspector'') and (name like current_establecimiento_id()::text || ''/%''))';

    execute 'drop policy if exists storage_insert_sensitive on storage.objects';
    execute 'create policy storage_insert_sensitive on storage.objects for insert with check (bucket_id = ''evidencias-sensibles'' and auth.role() = ''authenticated'' and current_rol() in (''admin'',''director'',''convivencia'',''inspector'') and (name like current_establecimiento_id()::text || ''/%''))';

    execute 'drop policy if exists storage_insert_psicosocial on storage.objects';
    execute 'create policy storage_insert_psicosocial on storage.objects for insert with check (bucket_id = ''documentos-psicosociales'' and auth.role() = ''authenticated'' and current_rol() = ''dupla'' and (name like current_establecimiento_id()::text || ''/%''))';

    execute 'drop policy if exists storage_update_delete_equipo on storage.objects';
    execute 'create policy storage_update_delete_equipo on storage.objects for update using (bucket_id in (''evidencias-publicas'',''evidencias-sensibles'') and auth.role() = ''authenticated'' and current_rol() in (''admin'',''director'',''convivencia'') and (name like current_establecimiento_id()::text || ''/%'')) with check (name like current_establecimiento_id()::text || ''/%'')';

    execute 'drop policy if exists storage_update_delete_psicosocial on storage.objects';
    execute 'create policy storage_update_delete_psicosocial on storage.objects for update using (bucket_id = ''documentos-psicosociales'' and auth.role() = ''authenticated'' and current_rol() = ''dupla'' and (name like current_establecimiento_id()::text || ''/%'')) with check (name like current_establecimiento_id()::text || ''/%'')';

    execute 'drop policy if exists storage_delete_equipo on storage.objects';
    execute 'create policy storage_delete_equipo on storage.objects for delete using (bucket_id in (''evidencias-publicas'',''evidencias-sensibles'') and auth.role() = ''authenticated'' and current_rol() in (''admin'',''director'',''convivencia'') and (name like current_establecimiento_id()::text || ''/%''))';

    execute 'drop policy if exists storage_delete_psicosocial on storage.objects';
    execute 'create policy storage_delete_psicosocial on storage.objects for delete using (bucket_id = ''documentos-psicosociales'' and auth.role() = ''authenticated'' and current_rol() = ''dupla'' and (name like current_establecimiento_id()::text || ''/%''))';
  exception
    when insufficient_privilege then
      raise notice 'Skipping storage RLS/policies: insufficient privileges for storage.objects';
  end;
end
$$;
