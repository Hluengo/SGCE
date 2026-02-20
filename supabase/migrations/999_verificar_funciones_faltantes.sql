-- Funciones GCC actualmente desplegadas
SELECT proname FROM pg_proc WHERE proname LIKE 'gcc_%' ORDER BY proname;
