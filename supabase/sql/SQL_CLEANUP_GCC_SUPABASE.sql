/**
 * SCRIPT SQL: LIMPIAR FUNCIONES RPC INNECESARIAS
 * ===============================================
 * 
 * Descripción: Elimina funciones RPC que no se usan en la arquitectura
 *              final de hooks de React. MANTIENE todas las tablas y
 *              funciones críticas.
 * 
 * Seguridad: Solo elimina funciones, NO tablas. Las tablas GCC se mantienen
 *            para preservar datos históricos.
 * 
 * Fecha: 18 de febrero de 2026
 * Proyecto: SGCE - Centro de Mediación Escolar (GCC)
 * 
 * ⚠️  ANTES DE EJECUTAR:
 *     1. Hacer backup de la base de datos
 *     2. Verificar que NO hay triggers que dependan de estas funciones
 *     3. Ejecutar en orden: primero en develop, luego en producción
 */

-- ============================================================================
-- FUNCIONES A ELIMINAR (No usadas en React hooks)
-- ============================================================================

-- 1. gcc_registrar_resultado
--    RAZÓN: Funcionalidad incorporada en gcc_procesar_cierre_completo
--    IMPACTO: Bajo - No usar, hay alternativa
DROP FUNCTION IF EXISTS public.gcc_registrar_resultado(
    uuid,
    text,
    text,
    uuid
) CASCADE;

-- 2. gcc_registrar_notificacion
--    RAZÓN: Sistema de notificaciones no implementado en Fase 1
--    IMPACTO: Bajo - Feature futura
DROP FUNCTION IF EXISTS public.gcc_registrar_notificacion(
    uuid,
    text,
    text,
    uuid
) CASCADE;

-- 3. obtener_plazo_legal
--    RAZÓN: Funcionalidad duplicada en calcular_dias_habiles
--    IMPACTO: Bajo - Usar calcular_dias_habiles en su lugar
DROP FUNCTION IF EXISTS public.obtener_plazo_legal(
    date,
    integer
) CASCADE;

-- 4. verificar_permiso_establecimiento
--    RAZÓN: RLS (Row Level Security) ya maneja permisos en Supabase
--    IMPACTO: Bajo - RLS más seguro
DROP FUNCTION IF EXISTS public.verificar_permiso_establecimiento(
    uuid,
    uuid
) CASCADE;

-- ============================================================================
-- FUNCIONES A MANTENER (Críticas para React hooks)
-- ============================================================================

-- ✓ gcc_crear_proceso
--   Usada por: useGccDerivacion
--   Estado: MANTENER

-- ✓ gcc_agregar_hito
--   Usada por: useGccDerivacion
--   Estado: MANTENER

-- ✓ gcc_procesar_cierre_completo
--   Usada por: useGccCierre
--   Estado: MANTENER (CRÍTICA - Transacción atómica)

-- ✓ gcc_agregar_participante
--   Usada por: Future features
--   Estado: MANTENER

-- ✓ gcc_agregar_compromiso
--   Usada por: Future features
--   Estado: MANTENER

-- ✓ gcc_validar_expediente
--   Usada por: Validaciones en frontend (Fase 2)
--   Estado: MANTENER

-- ✓ gcc_verificar_cumplimiento
--   Usada por: Seguimiento post-cierre (Fase 2)
--   Estado: MANTENER

-- ✓ gcc_actualizar_consentimiento
--   Usada por: Gestión de consentimiento (Fase 2)
--   Estado: MANTENER

-- ✓ gcc_generar_acta
--   Usada por: gcc_procesar_cierre_completo (transitivo)
--   Estado: MANTENER

-- ✓ gcc_obtener_dashboard
--   Usada por: GccDashboard.tsx
--   Estado: MANTENER

-- ✓ calcular_dias_habiles
--   Usada por: Cálculos de plazo (respeta feriados)
--   Estado: MANTENER (CRÍTICA - Compliance Circular 782)

-- ============================================================================
-- TABLAS A MANTENER (No eliminar - Contienen datos históricos)
-- ============================================================================

-- ✓ mediaciones_gcc_v2
-- ✓ participantes_gcc_v2
-- ✓ compromisos_gcc_v2
-- ✓ hitos_gcc_v2
-- ✓ feriados_chile
-- ✓ actas_gcc_v2 (si existe)

-- ============================================================================
-- DESPUÉS DE EJECUTAR ESTE SCRIPT
-- ============================================================================

/**
 * 1. Verificar que no hay errores:
 *    SELECT * FROM pg_proc WHERE proname LIKE 'gcc_%';
 * 
 * 2. Verificar integridad de funciones mantidas:
 *    SELECT routine_name FROM information_schema.routines 
 *    WHERE routine_schema = 'public' AND routine_name LIKE 'gcc_%';
 * 
 * 3. Verificar que las tablas siguen intactas:
 *    SELECT table_name FROM information_schema.tables 
 *    WHERE table_schema = 'public' AND table_name LIKE '%gcc%';
 * 
 * 4. En caso de error, restaurar desde backup y revisar dependencias
 */

-- ============================================================================
-- VALIDACIÓN FINAL: Estas funciones DEBEN existir
-- ============================================================================

-- Verificar que existen las funciones críticas (ejecutar después del DROP)
-- Si alguna de estas falla, hay un problema

-- SELECT EXISTS (
--   SELECT 1 FROM pg_proc 
--   WHERE proname = 'gcc_crear_proceso' 
--   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
-- ) AS existe_gcc_crear_proceso;

-- SELECT EXISTS (
--   SELECT 1 FROM pg_proc 
--   WHERE proname = 'gcc_procesar_cierre_completo' 
--   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
-- ) AS existe_gcc_procesar_cierre_completo;

-- SELECT EXISTS (
--   SELECT 1 FROM pg_proc 
--   WHERE proname = 'calcular_dias_habiles' 
--   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
-- ) AS existe_calcular_dias_habiles;
