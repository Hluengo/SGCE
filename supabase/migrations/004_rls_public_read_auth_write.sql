-- RLS: public read, authenticated write

-- helper: allow select to anyone
-- apply to core tables
do $$
begin
  -- expedientes
  drop policy if exists public_read_expedientes on expedientes;
  create policy public_read_expedientes on expedientes for select using (true);
  drop policy if exists auth_write_expedientes on expedientes;
  create policy auth_write_expedientes on expedientes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- estudiantes
  drop policy if exists public_read_estudiantes on estudiantes;
  create policy public_read_estudiantes on estudiantes for select using (true);
  drop policy if exists auth_write_estudiantes on estudiantes;
  create policy auth_write_estudiantes on estudiantes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- evidencias
  drop policy if exists public_read_evidencias on evidencias;
  create policy public_read_evidencias on evidencias for select using (true);
  drop policy if exists auth_write_evidencias on evidencias;
  create policy auth_write_evidencias on evidencias for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- medidas_apoyo
  drop policy if exists public_read_medidas_apoyo on medidas_apoyo;
  create policy public_read_medidas_apoyo on medidas_apoyo for select using (true);
  drop policy if exists auth_write_medidas_apoyo on medidas_apoyo;
  create policy auth_write_medidas_apoyo on medidas_apoyo for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- bitacora_psicosocial
  drop policy if exists public_read_bitacora_psicosocial on bitacora_psicosocial;
  create policy public_read_bitacora_psicosocial on bitacora_psicosocial for select using (true);
  drop policy if exists auth_write_bitacora_psicosocial on bitacora_psicosocial;
  create policy auth_write_bitacora_psicosocial on bitacora_psicosocial for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- hitos_expediente
  drop policy if exists public_read_hitos_expediente on hitos_expediente;
  create policy public_read_hitos_expediente on hitos_expediente for select using (true);
  drop policy if exists auth_write_hitos_expediente on hitos_expediente;
  create policy auth_write_hitos_expediente on hitos_expediente for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- derivaciones_externas
  drop policy if exists public_read_derivaciones_externas on derivaciones_externas;
  create policy public_read_derivaciones_externas on derivaciones_externas for select using (true);
  drop policy if exists auth_write_derivaciones_externas on derivaciones_externas;
  create policy auth_write_derivaciones_externas on derivaciones_externas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- bitacora_salida
  drop policy if exists public_read_bitacora_salida on bitacora_salida;
  create policy public_read_bitacora_salida on bitacora_salida for select using (true);
  drop policy if exists auth_write_bitacora_salida on bitacora_salida;
  create policy auth_write_bitacora_salida on bitacora_salida for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- reportes_patio
  drop policy if exists public_read_reportes_patio on reportes_patio;
  create policy public_read_reportes_patio on reportes_patio for select using (true);
  drop policy if exists auth_write_reportes_patio on reportes_patio;
  create policy auth_write_reportes_patio on reportes_patio for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- mediaciones_gcc
  drop policy if exists public_read_mediaciones_gcc on mediaciones_gcc;
  create policy public_read_mediaciones_gcc on mediaciones_gcc for select using (true);
  drop policy if exists auth_write_mediaciones_gcc on mediaciones_gcc;
  create policy auth_write_mediaciones_gcc on mediaciones_gcc for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- compromisos_mediacion
  drop policy if exists public_read_compromisos_mediacion on compromisos_mediacion;
  create policy public_read_compromisos_mediacion on compromisos_mediacion for select using (true);
  drop policy if exists auth_write_compromisos_mediacion on compromisos_mediacion;
  create policy auth_write_compromisos_mediacion on compromisos_mediacion for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- carpetas_documentales
  drop policy if exists public_read_carpetas_documentales on carpetas_documentales;
  create policy public_read_carpetas_documentales on carpetas_documentales for select using (true);
  drop policy if exists auth_write_carpetas_documentales on carpetas_documentales;
  create policy auth_write_carpetas_documentales on carpetas_documentales for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

  -- documentos_institucionales
  drop policy if exists public_read_documentos_institucionales on documentos_institucionales;
  create policy public_read_documentos_institucionales on documentos_institucionales for select using (true);
  drop policy if exists auth_write_documentos_institucionales on documentos_institucionales;
  create policy auth_write_documentos_institucionales on documentos_institucionales for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
end
$$;
