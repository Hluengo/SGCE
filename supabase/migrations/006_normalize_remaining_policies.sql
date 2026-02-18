-- Normalize remaining tables to public_read_* / auth_write_*

-- cursos_inspector
 drop policy if exists cursos_inspector_read on cursos_inspector;
 drop policy if exists cursos_inspector_write on cursos_inspector;

 drop policy if exists public_read_cursos_inspector on cursos_inspector;
 create policy public_read_cursos_inspector on cursos_inspector for select using (true);
 drop policy if exists auth_write_cursos_inspector on cursos_inspector;
 create policy auth_write_cursos_inspector on cursos_inspector for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- incidentes
 drop policy if exists incidentes_read on incidentes;
 drop policy if exists incidentes_insert_inspector on incidentes;
 drop policy if exists incidentes_update_equipo on incidentes;

 drop policy if exists public_read_incidentes on incidentes;
 create policy public_read_incidentes on incidentes for select using (true);
 drop policy if exists auth_write_incidentes on incidentes;
 create policy auth_write_incidentes on incidentes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- logs_auditoria
 drop policy if exists logs_read on logs_auditoria;
 drop policy if exists logs_insert_system on logs_auditoria;

 drop policy if exists public_read_logs_auditoria on logs_auditoria;
 create policy public_read_logs_auditoria on logs_auditoria for select using (true);
 drop policy if exists auth_write_logs_auditoria on logs_auditoria;
 create policy auth_write_logs_auditoria on logs_auditoria for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- perfiles
 drop policy if exists perfiles_self_read on perfiles;
 drop policy if exists perfiles_read_directivos on perfiles;
 drop policy if exists perfiles_insert_admin on perfiles;
 drop policy if exists perfiles_update_admin on perfiles;
 drop policy if exists perfiles_delete_admin on perfiles;

 drop policy if exists public_read_perfiles on perfiles;
 create policy public_read_perfiles on perfiles for select using (true);
 drop policy if exists auth_write_perfiles on perfiles;
 create policy auth_write_perfiles on perfiles for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');