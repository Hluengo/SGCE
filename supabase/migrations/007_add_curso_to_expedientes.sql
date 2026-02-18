-- Agregar columna curso a expedientes para guardar el curso del estudiante al momento de crear el expediente
alter table expedientes add column if not exists curso text;

-- Crear política para permitir lectura pública del curso
create policy public_read_curso_expedientes on expedientes
for select using (true);

-- Crear política para permitir inserción autenticada del curso
create policy auth_insert_curso_expedientes on expedientes
for insert with check (auth.role() = 'authenticated');

-- Crear política para permitir actualización autenticada del curso
create policy auth_update_curso_expedientes on expedientes
for update using (auth.role() = 'authenticated');
