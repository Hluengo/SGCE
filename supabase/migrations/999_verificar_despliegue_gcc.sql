-- VERIFICACIÓN DE DESPLIEGUE GCC - Ejecución simple

-- 1. Funciones
SELECT proname AS func, pronargs AS args FROM pg_proc WHERE proname LIKE 'gcc_%' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Tablas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%gcc%';

-- 3. Políticas RLS
SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE '%gcc%';

-- 4. Resumen
SELECT 
  (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE 'gcc_%') AS funciones,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%gcc%') AS tablas,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE '%gcc%') AS politicas;
