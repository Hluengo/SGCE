 # Análisis de Rendimiento - Dashboard SGCE

## Problema Reportado
La carga inicial del colegio demo tarda demasiado en mostrar los datos.

## Diagnóstico Realizado

### Consultas identificadas en la carga inicial:

1. **ConvivenciaContext** (`src/shared/context/ConvivenciaContext.tsx`)
   - Línea ~137: `loadExpedientes()` - Carga expedientes con 2 JOINs a estudiantes
   - Línea ~191: `loadEstudiantes()` - Carga todos los estudiantes (potencialmente redundante)
   - Límite: 200 registros

2. **useGccMetrics** (`src/shared/hooks/useGccMetrics.ts`)
   - Línea ~60: Carga `mediaciones_gcc_v2`
   - Límite: 500 registros
   - Polling: cada 30 segundos

3. **EstadisticasConvivencia** (sin consulta - procesa datos en memoria)

### Problemas identificados:

| Problema | Impacto | Severidad |
|----------|---------|-----------|
| JOINs en consulta de expedientes | Lento si no hay índices | Alta |
| Carga de estudiantes separada | Potencialmente redundante | Media |
| Sin cacheo efectivo | Siempre consulta Supabase | Alta |
| Polling de GCC | Consume recursos en background | Baja |
| Sin paginación | Carga todo a la vez | Media |

## Optimizaciones Implementadas

### 1. Mejor manejo de errores en LegalAssistant (error 503)
- Archivo: `src/features/legal/LegalAssistant.tsx`
- Mejor detección y mensaje para errores 503, 429, 400, red, API key

### 2. Retry inteligente en llamadas a API
- Archivo: `src/shared/utils/retry.ts`
- Delay exponencial
- Solo reintenta en errores recuperables

### 3. Mejor manejo de autenticación Supabase
- Archivo: `src/shared/lib/supabaseClient.ts`
- Listener de eventos de auth

## Recomendaciones Adicionales (pendientes de implementar)

### A. Crear función RPC para cargar datos del dashboard
```sql
-- Crear función en Supabase que combine las consultas
CREATE OR REPLACE FUNCTION get_dashboard_data(p_establecimiento_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'expedientes', (
      SELECT jsonb_agg(e.*)
      FROM expedientes e
      WHERE e.establecimiento_id = p_establecimiento_id
      LIMIT 200
    ),
    'estudiantes', (
      SELECT jsonb_agg(s.*)
      FROM estudiantes s
      WHERE s.establecimiento_id = p_establecimiento_id
      LIMIT 200
    ),
    'gcc_metrics', (
      SELECT jsonb_agg(g.*)
      FROM mediaciones_gcc_v2 g
      WHERE g.establecimiento_id = p_establecimiento_id
      LIMIT 500
    )
  );
END;
$$;
```

### B. Agregar índices en Supabase (si no existen)
```sql
-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_expedientes_establecimiento ON expedientes(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expediente(estado_legal, etapa_proceso);
CREATE INDEX IF NOT EXISTS idx_estudiantes_establecimiento ON estudiantes(establecimiento_id);
CREATE INDEX IF NOT EXISTS idx_mediaciones_gcc_establecimiento ON mediaciones_gcc_v2(establecimiento_id);
```

### C. Optimizar consultas del frontend
- Usar `Promise.all()` para ejecutar consultas en paralelo
- Reducir campos seleccionados (select solo lo necesario)
- Implementar paginación o carga lazy

### D. Habilitar cacheo en浏览器
- Usar `stale-while-revalidate` para datos que no cambian frecuentemente
- Cachear respuestas por tenant

## Verificación

Para verificar el rendimiento:
1. Abrir Chrome DevTools (F12)
2. Ir a Network tab
3. Filtrar por `supabase` o `fetch`
4. Recargar la página
5. Medir tiempo total de las consultas

### Tiempos objetivo:
- Carga inicial: < 2 segundos
- Tiempo por consulta: < 500ms

## Estado
- [x] Análisis completado
- [x] Optimizaciones menores implementadas
- [ ] Crear función RPC (requiere acceso a Supabase)
- [ ] Agregar índices (requiere acceso a Supabase)
- [ ] Optimizar consultas parallelizadas
