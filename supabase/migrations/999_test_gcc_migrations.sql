-- =============================================================================
-- TEST: Verificación de Funciones GCC
-- =============================================================================

-- =============================================================================
-- FUNCIONES EXISTENTES
-- =============================================================================

SELECT 
    proname AS function_name,
    pronargs AS arg_count
FROM pg_proc 
WHERE proname LIKE 'gcc_%'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- =============================================================================
-- TABLAS EXISTENTES
-- =============================================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%gcc%'
ORDER BY table_name;

-- =============================================================================
-- RESUMEN
-- =============================================================================

SELECT 
    (SELECT COUNT(*) FROM pg_proc 
     WHERE proname LIKE 'gcc_%' 
     AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) AS funciones_gcc,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name LIKE '%gcc%') AS tablas_gcc;
