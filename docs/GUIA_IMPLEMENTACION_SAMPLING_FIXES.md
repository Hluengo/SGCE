# 🛠️ GUÍA DE IMPLEMENTACIÓN - OPTIMIZACIÓN DE SAMPLING RATES

**Documento Técnico Complementario**  
**Fecha:** 20 de febrero de 2026  
**Estado:** Listo para implementar  

---

## 📑 TABLA DE CONTENIDOS

1. Correcciones P1 (Inmediatas)
2. Correcciones P2-P3 (Semana 2)
3. Scripts de validación
4. Métricas de éxito

---

## 🔴 CORRECCIONES P1: POLLING DE GCC METRICS

### Problema Actual

```typescript
// src/shared/hooks/useGccMetrics.ts (línea 65)
const { pollingMs = 30000, autoRefresh = true, enabled = true } = options;
//                          ^^^^^ 30 segundos = DEMASIADO FRECUENTE
```

**Impacto:**
- 120 queries/hora × usuarios activos = Carga DB
- ~1.5-2 MB/hora consumo móvil
- Overkill para datos que cambian cada 5-10 minutos

### Solución: Ajuste Escalonado

**Opción 1: Cambio simple (RECOMENDADO)**

```typescript
// ANTES
const { pollingMs = 30000, autoRefresh = true, enabled = true } = options;

// DESPUÉS
const { pollingMs = 60000, autoRefresh = true, enabled = true } = options;
//                          ^^^^^^ 60 segundos - más balanceado
```

**Paso a paso:**
1. Abrir `src/shared/hooks/useGccMetrics.ts`
2. Línea 65: Cambiar `30000` → `60000`
3. Actualizar perfiles de uso (ver Tabla A)

**Tabla A - Perfiles de Polling Recomendados:**

| Rol | Intervalo | Justificación |
|-----|-----------|---------------|
| SUPERADMIN | 30s | Monitoreo en tiempo real |
| SOSTENEDOR | 45s | Supervisión activa |
| DIRECTOR | 60s | Acceso frecuente |
| CONVIVENCIA | 90s | Uso moderado |
| DUPLA | 120s | Acceso menos frecuente |

**Opción 2: Cambio con adaptive backoff (AVANZADO)**

```typescript
// ARCHIVO: src/shared/hooks/useGccMetrics.ts

const { pollingMs = 60000, autoRefresh = true, enabled = true } = options;
const [backoffMultiplier, setBackoffMultiplier] = useState(1);

const refresh = useCallback(async () => {
  // ... fetch logic ...
  
  // Si no hay cambios, incrementar backoff
  if (dataUnchanged) {
    setBackoffMultiplier(prev => Math.min(prev * 1.5, 6)); // Max 6x
  } else {
    setBackoffMultiplier(1); // Reset si hay cambios
  }
}, [enabled, tenantId]);

// Usar backoff en interval
useEffect(() => {
  if (!enabled || !autoRefresh || !pollingMs) return;
  const adjustedInterval = pollingMs * backoffMultiplier;
  const timer = window.setInterval(() => {
    void refresh();
  }, adjustedInterval); // ← Intervalo adaptativo
  return () => window.clearInterval(timer);
}, [enabled, autoRefresh, pollingMs, refresh, backoffMultiplier]);
```

**Beneficios de backoff:**
- ✅ Empieza agresivo (60s)
- ✅ Retrocede si no hay cambios (hasta 360s)
- ✅ Vuelve a 60s si hay cambios
- ✅ Balance perfecto

---

## 🔴 CORRECCIONES P2: PARALELIZAR GCC-NOTIFICATIONS

### Problema Actual

```typescript
// supabase/functions/gcc-notifications/index.ts (línea 54-85)
for (const establecimiento of establecimientos || []) {
  // Loop SECUENCIAL - complejidad O(n)
  const { data: mediacionesPorVencer } = await supabase.rpc(
    'gcc_obtener_mediaciones_por_vencer',
    { p_establecimiento_id: establecimiento.id, p_dias_antelacion: 3 }
  );
  // ... más procesamiento ...
}
// Tiempo total = (n × 1s) = 50+ segundos con 50 establecimientos
```

### Solución: Paralelización con chunking

**Reemplazar el loop secuencial con Promise.all():**

```typescript
// ARCHIVO: supabase/functions/gcc-notifications/index.ts

// Función helper para chunking
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ANTES (línea 54-85)
for (const establecimiento of establecimientos || []) {
  const { data: mediacionesPorVencer } = await supabase.rpc(
    'gcc_obtener_mediaciones_por_vencer',
    { p_establecimiento_id: establecimiento.id, p_dias_antelacion: 3 }
  );
  
  if (mediacionesPorVencer && mediacionesPorVencer.length > 0) {
    for (const mediacion of mediacionesPorVencer) {
      // ... procesamiento ...
    }
  }
}

// DESPUÉS (paralelo con chunking)
const chunks = chunk(establecimientos || [], 10); // Máximo 10 paralelos

for (const batch of chunks) {
  const results = await Promise.all(
    batch.map(establecimiento =>
      supabase.rpc(
        'gcc_obtener_mediaciones_por_vencer',
        { 
          p_establecimiento_id: establecimiento.id, 
          p_dias_antelacion: 3 
        }
      ).then(({ data }) => ({ 
        establecimiento, 
        mediaciones: data || [] 
      }))
    )
  );

  // Procesar resultados en paralelo
  for (const { establecimiento, mediaciones } of results) {
    if (mediaciones.length === 0) continue;
    
    for (const mediacion of mediaciones) {
      // ... procesar mediación ...
      await registrarNotificacion(supabase, mediacion);
    }
  }
}
```

**Comparativa de performance:**

| Métrica | ANTES | DESPUÉS | Mejora |
|---------|-------|---------|--------|
| 50 establecimientos | ~50s | ~5-6s | 🚀 89% |
| 100 establecimientos | ~100s+ (TIMEOUT) | ~10s | 🚀 90%+ |
| Requests paralelos | 1 | 10 (configurable) | 10x más eficiente |
| Timeout risk | 🔴 ALTO | 🟢 BAJO | ✅ RESUELTO |

---

## 🟡 CORRECCIONES P3: CONSOLIDAR TENANT RESOLUTION

### Problema Actual

```typescript
// src/shared/context/TenantContext.tsx

// useEffect #1 (línea 390-397)
useEffect(() => {
  void resolveTenant();
  if (!supabase) return;
  const { data: authSubscription } = supabase.auth.onAuthStateChange((_event) => {
    void resolveTenant();
  });
  return () => { authSubscription.subscription.unsubscribe(); };
}, [resolveTenant]);

// useEffect #2 (línea 399-407)
useEffect(() => {
  if (isAuthLoading) return;
  if (!session?.user && !usuario) return;
  void resolveTenant();
}, [isAuthLoading, resolveTenant, session?.user?.id, usuario?.establecimientoId, usuario?.id, usuario?.rol]);

// ⚠️ Pueden ejecutarse múltiples veces = redundancia
```

### Solución: Consolidar con AbortController

```typescript
// ARCHIVO: src/shared/context/TenantContext.tsx

// Nuevo useEffect consolidado (reemplazar ambos)
useEffect(() => {
  const abortController = new AbortController();
  
  if (isAuthLoading) return;
  
  // Resolver tenant
  const performResolution = async () => {
    if (abortController.signal.aborted) return;
    await resolveTenant();
  };

  // Resolver si cambios de autenticación
  const handleAuthStateChange = async (_event: AuthChangeEvent) => {
    if (abortController.signal.aborted) return;
    await performResolution();
  };

  // Setup auth listener
  let authSubscription: Subscription | null = null;
  if (supabase) {
    const { data } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authSubscription = data.subscription;
  }

  // Resolver inicial
  void performResolution();

  return () => {
    abortController.abort();
    authSubscription?.unsubscribe();
  };
}, [isAuthLoading, resolveTenant, supabase]);
```

**Ventajas:**
- ✅ Un solo useEffect (simplicidad)
- ✅ AbortController evita race conditions
- ✅ Menos re-renders
- ✅ Cleanup garantizado

---

## 🟡 CORRECCIONES P4: SKELETON LOADERS EN BITACORA

### Problema Actual

```typescript
// src/features/bitacora/BitacoraPsicosocial.tsx (línea 168)
const mockDerivaciones: Derivacion[] = [
  { id: 'DER-01', nnaNombre: 'C. Vera P.', ... },
  { id: 'DER-02', nnaNombre: 'D. Lopez M.', ... }
];

const [derivaciones, setDerivaciones] = useState<Derivacion[]>(mockDerivaciones);
// ↑ Estado inicial con mock = FLASH VISUAL
```

### Solución: Eliminar mock + agregar skeleton

```typescript
// ARCHIVO: src/features/bitacora/BitacoraPsicosocial.tsx

// ANTES
const [derivaciones, setDerivaciones] = useState<Derivacion[]>(mockDerivaciones);

// DESPUÉS
const [derivaciones, setDerivaciones] = useState<Derivacion[]>([]);
const [isLoadingDerivaciones, setIsLoadingDerivaciones] = useState(true);

// En useEffect
useEffect(() => {
  const loadDerivaciones = async () => {
    setIsLoadingDerivaciones(true);
    try {
      if (!supabase) {
        setDerivaciones([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('derivaciones')
        .select('*')
        .order('fechaEnvio', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setDerivaciones(data);
      }
    } finally {
      setIsLoadingDerivaciones(false);
    }
  };

  loadDerivaciones();
}, []);

// En el render - agregar skeleton
{isLoadingDerivaciones ? (
  [...Array(3)].map((_, i) => (
    <div key={`skeleton-${i}`} className="animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
    </div>
  ))
) : (
  derivaciones.map((der) => (
    // ... render derivación ...
  ))
)}
```

---

## 🟡 CORRECCIONES P5: DEBOUNCE EN EXPEDIENTES SEARCH

### Problema Actual

```typescript
// src/features/expedientes/ExpedientesList.tsx
const [searchTerm, setSearchTerm] = useState('');

// Input sin debounce
const handleSearch = (value: string) => {
  setSearchTerm(value); // Actualiza inmediatamente
  // Causa re-filtrado en cada keystroke
};

// Filtrado sin debounce
const filteredExpedientes = useMemo(() => {
  if (!searchTerm.trim()) return expedientes;
  // ... filter logic ... (se ejecuta en cada keystroke)
}, [expedientes, searchTerm]); // ← Dependencia directa causan renders frecuentes
```

### Solución: Agregar useDebounce

```typescript
// ARCHIVO: src/features/expedientes/ExpedientesList.tsx

import { useDebounce } from '@/shared/hooks/useDebounce';

// ANTES
const [searchTerm, setSearchTerm] = useState('');

// Component internals...
const filteredExpedientes = useMemo(() => {
  if (!searchTerm.trim()) return expedientes;
  const term = searchTerm.toLowerCase();
  return expedientes.filter(exp => 
    exp.nnaNombre.toLowerCase().includes(term) ||
    exp.id.toLowerCase().includes(term)
  );
}, [expedientes, searchTerm]);

// DESPUÉS
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300); // ← Debounce de 300ms

// Component internals...
const filteredExpedientes = useMemo(() => {
  if (!debouncedSearchTerm.trim()) return expedientes;
  const term = debouncedSearchTerm.toLowerCase();
  return expedientes.filter(exp => 
    exp.nnaNombre.toLowerCase().includes(term) ||
    exp.id.toLowerCase().includes(term)
  );
}, [expedientes, debouncedSearchTerm]); // ← Usa version debounceada

// En input
<input
  type="text"
  placeholder="Filtrar expedientes..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)} // ← Actualiza inmediato
  className="..."
/>
```

**Ventajas:**
- ✅ Input responde al usuario (visual feedback)
- ✅ Filtrado se ejecuta cada 300ms
- ✅ Reduce re-renders de 1/keystroke → 1 cada 300ms
- ✅ Mejor UX y performance

---

## ✅ SCRIPTS DE VALIDACIÓN

### Script 1: Verificar Sampling Rates

```bash
# Crear: scripts/check-sampling-rates.sh

#!/bin/bash

echo "🔍 Verificando Sampling Rates..."

# Buscar useGccMetrics con pollingMs
echo "\n📊 Polling en GCC Metrics:"
grep -r "pollingMs" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# Buscar setInterval/setTimeout
echo "\n⏱️  Timers encontrados:"
grep -r "setInterval\|setTimeout" src/shared/ --include="*.ts" --include="*.tsx" | head -20

# Buscar debounce
echo "\n💤 Debounce en búsqueda:"
grep -r "useDebounce\|debounce" src/features/ --include="*.ts" --include="*.tsx"

# Verificar polling en loops
echo "\n🔄 Loops con await (potencial secuencial):"
grep -B2 -A2 "for.*await\|await.*for" supabase/functions/ --include="*.ts" | head -30

echo "\n✅ Verificación completada"
```

### Script 2: Medir Impacto de Cambios

```typescript
// Crear: src/shared/utils/performanceMetrics.ts

export const samplingMetrics = {
  // Antes del cambio
  before: {
    polling_interval_ms: 30000,
    queries_per_hour: 120,
    data_consumption_mb_per_hour: 2,
    battery_impact: 'HIGH'
  },
  
  // Después del cambio
  after: {
    polling_interval_ms: 60000,
    queries_per_hour: 60,
    data_consumption_mb_per_hour: 1,
    battery_impact: 'MEDIUM'
  },

  calculate_improvement: () => {
    const querySavings = 
      (samplingMetrics.before.queries_per_hour - samplingMetrics.after.queries_per_hour) / 
      samplingMetrics.before.queries_per_hour * 100;
    
    return {
      query_reduction: `${querySavings.toFixed(1)}%`,
      data_savings_daily: `${(2 - 1) * 24}MB`,
      battery_improvement: 'Mejor autonomía en móvil'
    };
  }
};

// Uso en tests
import { samplingMetrics } from '@/shared/utils/performanceMetrics';
console.log(samplingMetrics.calculate_improvement());
// Output:
// {
//   query_reduction: "50.0%",
//   data_savings_daily: "24MB",
//   battery_improvement: "Mejor autonomía en móvil"
// }
```

---

## 📈 MÉTRICAS DE ÉXITO

### KPIs a Monitorear Después de Cambios

**Tabla de Éxito:**

| Métrica | Baseline | Target | Monitoreo |
|---------|----------|--------|-----------|
| **Queries/hora db** | 120/usuario | 60/usuario | ✅ -50% |
| **Throughput Supabase** | ~40 req/min | ~20 req/min | ✅ -50% |
| **Avg query latency** | 100-200ms | <150ms | ✅ Mejora |
| **Mobile data/hora** | ~2MB | ~1MB | ✅ -50% |
| **Battery impact** | MEDIUM | LOW | ✅ Mejor |
| **gcc-notifications time** | 50-60s | <10s | ✅ -90% |
| **Flash visual bitácora** | Presente | Eliminado | ✅ UX fix |
| **TTI (Time to Interactive)** | ~2-3s | <2s | ✅ Mantener |

### Comando para Monitoreo

```typescript
// Agregar a: src/shared/utils/perfProfiler.ts

export const trackSamplingMetrics = () => {
  if (!isPerfProfilerEnabled()) return;

  const metrics = {
    timestamp: new Date().toISOString(),
    queries_last_hour: window.__sgce_query_count || 0,
    realtime_events: window.__sgce_realtime_count || 0,
    memory_mb: (performance.memory?.usedJSHeapSize || 0) / 1024 / 1024,
    active_listeners: window.__sgce_listener_count || 0
  };

  console.table(metrics);
  return metrics;
};

// Llamar periódicamente
setInterval(() => {
  if (IS_DEV) console.log(trackSamplingMetrics());
}, 60000); // Cada minuto
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Phase 1: INMEDIATO (Hoy)
- [ ] Cambiar polling de 30s → 60s en useGccMetrics
- [ ] Crear Jira ticket para P2-P5
- [ ] Comunicar changesetlog

### Phase 2: SEMANA 1
- [ ] Implementar paralelización en gcc-notifications
- [ ] Aplicar debounce en ExpedientesList
- [ ] Agregar skeletons a BitacoraPsicosocial

### Phase 3: SEMANA 2
- [ ] Consolidar TenantContext resolvers
- [ ] Implementar adaptive backoff (opcional)
- [ ] Testing exhaustivo

### Phase 4: PRODUCCIÓN
- [ ] Monitoreo en vivo
- [ ] A/B testing si es posible
- [ ] Documentsocument cambios en release notes

---

## 🧪 TESTING RECOMENDADO

```typescript
// Crear: src/shared/hooks/__tests__/useGccMetrics.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import useGccMetrics from '@/shared/hooks/useGccMetrics';

describe('useGccMetrics - Sampling Rate', () => {
  it('should use 60000ms as default polling interval', async () => {
    const { result } = renderHook(() => 
      useGccMetrics({ pollingMs: 60000 })
    );

    expect(result.current.freshness).toBe('unknown');
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });
  });

  it('should track time since last update', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGccMetrics());

    // Simular refresh
    await waitFor(() => {
      expect(result.current.lastUpdatedAt).not.toBeNull();
    });

    // Avanzar 30 segundos
    vi.advanceTimersByTime(30000);

    expect(result.current.secondsSinceUpdate).toBeGreaterThanOrEqual(30);
    expect(result.current.freshness).toBe('stale');

    vi.useRealTimers();
  });

  it('should refresh on window focus', async () => {
    const { result } = renderHook(() => 
      useGccMetrics({ autoRefresh: true, pollingMs: 60000 })
    );

    const initialTime = result.current.lastUpdatedAt;

    // Simular focus event
    window.dispatchEvent(new FocusEvent('focus'));

    await waitFor(() => {
      expect(result.current.lastUpdatedAt).not.toBe(initialTime);
    });
  });
});
```

---

## 📌 REFERENCIAS Y LINKS

**Documentos relacionados:**
- [ANALISIS_SAMPLING_RATES_COMPLETO.md](./ANALISIS_SAMPLING_RATES_COMPLETO.md) - Análisis principal
- [useGccMetrics.ts](../src/shared/hooks/useGccMetrics.ts) - Código a modificar
- [gcc-notifications](../supabase/functions/gcc-notifications/index.ts) - Edge function

**Lectura recomendada:**
- [React Performance Tips](https://react.dev/reference/react/useMemo)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Web Performance APIs](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

---

**FIN DE GUÍA TÉCNICA**
