-- Frontend alignment: add missing fields/tables to match UI (ASCII only)

-- enums to match UI states
do $$
begin
  if not exists (select 1 from pg_type where typname = 'etapa_proceso') then
    create type etapa_proceso as enum (
      'INICIO',
      'NOTIFICADO',
      'DESCARGOS',
      'INVESTIGACION',
      'RESOLUCION_PENDIENTE',
      'RECONSIDERACION',
      'CERRADO_SANCION',
      'CERRADO_GCC'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'evidencia_tipo') then
    create type evidencia_tipo as enum ('IMG','VIDEO','AUDIO','PDF');
  end if;

  if not exists (select 1 from pg_type where typname = 'evidencia_fuente') then
    create type evidencia_fuente as enum ('ESCUELA','APODERADO','SIE');
  end if;

  if not exists (select 1 from pg_type where typname = 'apoyo_tipo') then
    create type apoyo_tipo as enum ('PEDAGOGICO','PSICOSOCIAL');
  end if;

  if not exists (select 1 from pg_type where typname = 'apoyo_estado') then
    create type apoyo_estado as enum ('REALIZADA','PENDIENTE');
  end if;

  if not exists (select 1 from pg_type where typname = 'intervencion_tipo') then
    create type intervencion_tipo as enum ('ENTREVISTA','OBSERVACION','VISITA','DERIVACION');
  end if;

  if not exists (select 1 from pg_type where typname = 'derivacion_institucion') then
    create type derivacion_institucion as enum ('OPD','COSAM','TRIBUNAL','SALUD');
  end if;

  if not exists (select 1 from pg_type where typname = 'derivacion_estado') then
    create type derivacion_estado as enum ('PENDIENTE','RESPONDIDO');
  end if;

  if not exists (select 1 from pg_type where typname = 'mediacion_estado') then
    create type mediacion_estado as enum ('ABIERTA','EN_PROCESO','CERRADA_EXITOSA','CERRADA_SIN_ACUERDO');
  end if;

  if not exists (select 1 from pg_type where typname = 'patio_gravedad') then
    create type patio_gravedad as enum ('LEVE','RELEVANTE','GRAVE');
  end if;
end
$$;

-- expedientes: add UI fields and etapa_proceso mapping
alter table expedientes
  add column if not exists etapa_proceso etapa_proceso not null default 'INICIO',
  add column if not exists acciones_previas boolean not null default false,
  add column if not exists es_proceso_expulsion boolean not null default false,
  add column if not exists descripcion_hechos text,
  add column if not exists fecha_incidente date,
  add column if not exists hora_incidente time,
  add column if not exists lugar_incidente text;

-- hitos
create table if not exists hitos_expediente (
  id uuid primary key default uuid_generate_v4(),
  expediente_id uuid not null references expedientes(id) on delete cascade,
  titulo text not null,
  descripcion text not null,
  fecha_cumplimiento date,
  completado boolean not null default false,
  requiere_evidencia boolean not null default true,
  evidencia_url text,
  es_obligatorio_expulsion boolean not null default false,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

-- evidencias: add UI metadata
alter table evidencias
  add column if not exists nombre text,
  add column if not exists tipo evidencia_tipo,
  add column if not exists fecha date,
  add column if not exists hora time,
  add column if not exists autor text,
  add column if not exists descripcion text,
  add column if not exists fuente evidencia_fuente,
  add column if not exists seleccionado boolean not null default false;

-- medidas_apoyo: align with UI
alter table medidas_apoyo
  add column if not exists tipo apoyo_tipo,
  add column if not exists responsable text,
  add column if not exists resultados text,
  add column if not exists estado apoyo_estado not null default 'PENDIENTE',
  add column if not exists evidencia_url text,
  add column if not exists accion text;

-- bitacora_psicosocial: align with UI
alter table bitacora_psicosocial
  add column if not exists tipo intervencion_tipo,
  add column if not exists participantes text,
  add column if not exists resumen text,
  add column if not exists privado boolean not null default true,
  add column if not exists autor text;

-- derivaciones (from bitacora)
create table if not exists derivaciones_externas (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  estudiante_id uuid references estudiantes(id) on delete set null,
  nna_nombre text,
  institucion derivacion_institucion not null,
  fecha_envio date not null,
  estado derivacion_estado not null default 'PENDIENTE',
  numero_oficio text,
  created_at timestamptz not null default now()
);

-- bitacora salida
create table if not exists bitacora_salida (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  estudiante_id uuid references estudiantes(id) on delete set null,
  nna_nombre text not null,
  fecha date not null default current_date,
  hora time not null,
  motivo text not null,
  retirado_por text not null,
  rut text,
  firma boolean not null default false,
  created_at timestamptz not null default now()
);

-- reportes patio
create table if not exists reportes_patio (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  informante text not null,
  estudiante text,
  lugar text,
  descripcion text not null,
  gravedad_percibida patio_gravedad not null default 'LEVE',
  fecha_incidente timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- mediacion GCC
create table if not exists mediaciones_gcc (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  expediente_id uuid references expedientes(id) on delete set null,
  facilitador text,
  estado mediacion_estado not null default 'ABIERTA',
  fecha_inicio date not null default current_date,
  fecha_cierre date,
  acuerdos text,
  created_at timestamptz not null default now()
);

create table if not exists compromisos_mediacion (
  id uuid primary key default uuid_generate_v4(),
  mediacion_id uuid not null references mediaciones_gcc(id) on delete cascade,
  descripcion text not null,
  responsable text,
  fecha_compromiso date,
  cumplido boolean not null default false,
  created_at timestamptz not null default now()
);

-- archivo documental (metadata)
create table if not exists carpetas_documentales (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  nombre text not null,
  created_at timestamptz not null default now(),
  unique (establecimiento_id, nombre)
);

create table if not exists documentos_institucionales (
  id uuid primary key default uuid_generate_v4(),
  establecimiento_id uuid not null references establecimientos(id),
  carpeta_id uuid references carpetas_documentales(id) on delete set null,
  nombre text not null,
  tipo text,
  size_bytes bigint,
  url_storage text,
  creado_por uuid references perfiles(id),
  created_at timestamptz not null default now()
);

-- RLS enablement for new tables
alter table hitos_expediente enable row level security;
alter table derivaciones_externas enable row level security;
alter table bitacora_salida enable row level security;
alter table reportes_patio enable row level security;
alter table mediaciones_gcc enable row level security;
alter table compromisos_mediacion enable row level security;
alter table carpetas_documentales enable row level security;
alter table documentos_institucionales enable row level security;

-- Basic policies (read within establecimiento)
drop policy if exists hitos_read on hitos_expediente;
create policy hitos_read on hitos_expediente
for select using (
  exists (
    select 1 from expedientes e
    where e.id = hitos_expediente.expediente_id
      and e.establecimiento_id = current_establecimiento_id()
  )
);

drop policy if exists hitos_write on hitos_expediente;
create policy hitos_write on hitos_expediente
for all using (
  exists (
    select 1 from expedientes e
    where e.id = hitos_expediente.expediente_id
      and e.establecimiento_id = current_establecimiento_id()
  )
)
with check (
  exists (
    select 1 from expedientes e
    where e.id = hitos_expediente.expediente_id
      and e.establecimiento_id = current_establecimiento_id()
  )
);

drop policy if exists derivaciones_read on derivaciones_externas;
create policy derivaciones_read on derivaciones_externas
for select using (establecimiento_id = current_establecimiento_id());

drop policy if exists derivaciones_write on derivaciones_externas;
create policy derivaciones_write on derivaciones_externas
for all using (establecimiento_id = current_establecimiento_id())
with check (establecimiento_id = current_establecimiento_id());

drop policy if exists salida_read on bitacora_salida;
create policy salida_read on bitacora_salida
for select using (establecimiento_id = current_establecimiento_id());

drop policy if exists salida_write on bitacora_salida;
create policy salida_write on bitacora_salida
for all using (establecimiento_id = current_establecimiento_id())
with check (establecimiento_id = current_establecimiento_id());

drop policy if exists patio_read on reportes_patio;
create policy patio_read on reportes_patio
for select using (establecimiento_id = current_establecimiento_id());

drop policy if exists patio_write on reportes_patio;
create policy patio_write on reportes_patio
for all using (establecimiento_id = current_establecimiento_id())
with check (establecimiento_id = current_establecimiento_id());

drop policy if exists mediaciones_read on mediaciones_gcc;
create policy mediaciones_read on mediaciones_gcc
for select using (establecimiento_id = current_establecimiento_id());

drop policy if exists mediaciones_write on mediaciones_gcc;
create policy mediaciones_write on mediaciones_gcc
for all using (establecimiento_id = current_establecimiento_id())
with check (establecimiento_id = current_establecimiento_id());

drop policy if exists compromisos_read on compromisos_mediacion;
create policy compromisos_read on compromisos_mediacion
for select using (
  exists (
    select 1 from mediaciones_gcc m
    where m.id = compromisos_mediacion.mediacion_id
      and m.establecimiento_id = current_establecimiento_id()
  )
);

drop policy if exists compromisos_write on compromisos_mediacion;
create policy compromisos_write on compromisos_mediacion
for all using (
  exists (
    select 1 from mediaciones_gcc m
    where m.id = compromisos_mediacion.mediacion_id
      and m.establecimiento_id = current_establecimiento_id()
  )
)
with check (
  exists (
    select 1 from mediaciones_gcc m
    where m.id = compromisos_mediacion.mediacion_id
      and m.establecimiento_id = current_establecimiento_id()
  )
);

drop policy if exists carpetas_read on carpetas_documentales;
create policy carpetas_read on carpetas_documentales
for select using (establecimiento_id = current_establecimiento_id());

drop policy if exists carpetas_write on carpetas_documentales;
create policy carpetas_write on carpetas_documentales
for all using (establecimiento_id = current_establecimiento_id())
with check (establecimiento_id = current_establecimiento_id());

drop policy if exists docs_read on documentos_institucionales;
create policy docs_read on documentos_institucionales
for select using (establecimiento_id = current_establecimiento_id());

drop policy if exists docs_write on documentos_institucionales;
create policy docs_write on documentos_institucionales
for all using (establecimiento_id = current_establecimiento_id())
with check (establecimiento_id = current_establecimiento_id());
