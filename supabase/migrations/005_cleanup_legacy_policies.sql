-- Cleanup legacy RLS policies (keep public_read_* and auth_write_*)

-- Note: use this after 004_rls_public_read_auth_write.sql has been applied.

-- expedientes
 drop policy if exists expedientes_read on expedientes;
 drop policy if exists expedientes_insert_equipo on expedientes;
 drop policy if exists expedientes_update_directivos on expedientes;
 drop policy if exists expedientes_update_inspector on expedientes;

-- estudiantes
 drop policy if exists estudiantes_read on estudiantes;
 drop policy if exists estudiantes_update_equipo on estudiantes;
 drop policy if exists estudiantes_write_equipo on estudiantes;

-- evidencias
 drop policy if exists evidencias_read on evidencias;
 drop policy if exists evidencias_insert_equipo on evidencias;
 drop policy if exists evidencias_update_equipo on evidencias;

-- medidas_apoyo
 drop policy if exists medidas_read on medidas_apoyo;
 drop policy if exists medidas_write_equipo on medidas_apoyo;
 drop policy if exists medidas_update_equipo on medidas_apoyo;

-- bitacora_psicosocial
 drop policy if exists bitacora_dupla_only on bitacora_psicosocial;

-- hitos_expediente
 drop policy if exists hitos_read on hitos_expediente;
 drop policy if exists hitos_write on hitos_expediente;

-- derivaciones_externas
 drop policy if exists derivaciones_read on derivaciones_externas;
 drop policy if exists derivaciones_write on derivaciones_externas;

-- bitacora_salida
 drop policy if exists salida_read on bitacora_salida;
 drop policy if exists salida_write on bitacora_salida;

-- reportes_patio
 drop policy if exists patio_read on reportes_patio;
 drop policy if exists patio_write on reportes_patio;

-- mediaciones_gcc
 drop policy if exists mediaciones_read on mediaciones_gcc;
 drop policy if exists mediaciones_write on mediaciones_gcc;

-- compromisos_mediacion
 drop policy if exists compromisos_read on compromisos_mediacion;
 drop policy if exists compromisos_write on compromisos_mediacion;

-- carpetas_documentales
 drop policy if exists carpetas_read on carpetas_documentales;
 drop policy if exists carpetas_write on carpetas_documentales;

-- documentos_institucionales
 drop policy if exists docs_read on documentos_institucionales;
 drop policy if exists docs_write on documentos_institucionales;