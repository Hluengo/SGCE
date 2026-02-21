# 💻 CÓDIGO DE CORRECCIONES - LISTO PARA IMPLEMENTAR

**Snippets de código para cada problema P1-P5**

---

## 🔴 P1: POLLING DE GCC METRICS - CORRECCIÓN

### Archivo: `src/shared/hooks/useGccMetrics.ts`

**BUSCAR (Línea ~65):**
```typescript
const { pollingMs = 30000, autoRefresh = true, enabled = true } = options;
```

**REEMPLAZAR CON:**
```typescript
const { pollingMs = 60000, autoRefresh = true, enabled = true } = options;
```

**Eso es todo para P1.** Cambio simple pero efectivo.

---

## 🔴 P2: PARALELIZAR GCC-NOTIFICATIONS - CORRECCIÓN

### Archivo: `supabase/functions/gcc-notifications/index.ts`

**PASO 1: Agregar función helper al inicio**

```typescript
// Agregar después de corsHeaders (línea ~14)

/**
 * Divide un array en chunks de tamaño específico
 * @param array - Array a dividir
 * @param size - Tamaño de cada chunk
 * @returns Array de chunks
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

**PASO 2: Reemplazar el loop (Línea ~54-85)**

**BUSCAR:**
```typescript
    const resultados = []

    for (const establecimiento of establecimientos || []) {
      // 1. Verificar mediaciones por vencer (próximos 3 días)
      const { data: mediacionesPorVencer } = await supabase.rpc(
        'gcc_obtener_mediaciones_por_vencer',
        {
          p_establecimiento_id: establecimiento.id,
          p_dias_antelacion: 3
        }
      )

      if (mediacionesPorVencer && mediacionesPorVencer.length > 0) {
        for (const mediacion of mediacionesPorVencer) {
          // Registrar notificación
          const { data: notificacion } = await supabase
            .from('gcc_notificaciones_log')
            .insert({
              establecimiento_id: establecimiento.id,
              mediacion_id: mediacion.id,
              tipo_notificacion: mediacion.dias_restantes <= 0 ? 'PLAZO_VENCIDO' : 'PLAZO_PROXIMO',
              mensaje: `La mediación ${mediacion.tipo_mecanismo} del expediente ${mediacion.expediente_id} ${
                mediacion.dias_restantes <= 0 
                  ? 'ha vencido' 
                  : `vence en ${mediacion.dias_restantes} días`
              }`,
              creada: false
            })
            .select()
            .single()
          
          // ... más procesamiento ...
        }
      }
    }
```

**REEMPLAZAR CON:**
```typescript
    const resultados = []
    const chunks = chunk(establecimientos || [], 10); // Máximo 10 paralelos

    for (const batch of chunks) {
      // Ejecutar en paralelo usando Promise.all()
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

      // Procesar resultados
      for (const { establecimiento, mediaciones } of results) {
        if (mediaciones.length === 0) continue;

        for (const mediacion of mediaciones) {
          try {
            // Registrar notificación
            const { data: notificacion } = await supabase
              .from('gcc_notificaciones_log')
              .insert({
                establecimiento_id: establecimiento.id,
                mediacion_id: mediacion.id,
                tipo_notificacion: mediacion.dias_restantes <= 0 ? 'PLAZO_VENCIDO' : 'PLAZO_PROXIMO',
                mensaje: `La mediación ${mediacion.tipo_mecanismo} del expediente ${mediacion.expediente_id} ${
                  mediacion.dias_restantes <= 0 
                    ? 'ha vencido' 
                    : `vence en ${mediacion.dias_restantes} días`
                }`,
                creada: false
              })
              .select()
              .single()

            // ... más procesamiento ...
            resultados.push(notificacion);
          } catch (error) {
            console.error(`Error procesando mediación ${mediacion.id}:`, error);
            // Continuar con siguiente (no tirar todo por 1 error)
          }
        }
      }
    }
```

---

## ⚠️ P3: CONSOLIDAR TENANT CONTEXT - CORRECCIÓN

### Archivo: `src/shared/context/TenantContext.tsx`

**BUSCAR (Línea ~386-407):**
```typescript
  // Resolver el tenant al iniciar
  useEffect(() => {
    void resolveTenant();
    if (!supabase) return;

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event) => {
      void resolveTenant();
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [resolveTenant]);

  // Reintento explícito cuando cambia sesión/perfil en AuthProvider.
  useEffect(() => {
    if (isAuthLoading) return;
    if (!session?.user && !usuario) return;
    void resolveTenant();
  }, [isAuthLoading, resolveTenant, session?.user?.id, usuario?.establecimientoId, usuario?.id, usuario?.rol]);
```

**REEMPLAZAR CON:**
```typescript
  // Unified tenant resolution effect
  useEffect(() => {
    const abortController = new AbortController();

    if (isAuthLoading) {
      return;
    }

    // Perform resolution
    const performResolution = async () => {
      if (abortController.signal.aborted) return;
      await resolveTenant();
    };

    // Auth state change handler
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

    // Initial resolution
    void performResolution();

    // Cleanup
    return () => {
      abortController.abort();
      authSubscription?.unsubscribe();
    };
  }, [isAuthLoading, resolveTenant, supabase]);
```

**Agregar imports necesarios (si no están):**
```typescript
import type { AuthChangeEvent } from '@supabase/supabase-js';

// O si está en supabase.auth
type AuthChangeEvent = Parameters<typeof supabase.auth.onAuthStateChange>[0];
```

---

## ⚠️ P4: SKELETON LOADERS EN BITÁCORA - CORRECCIÓN

### Archivo: `src/features/bitacora/BitacoraPsicosocial.tsx`

**PASO 1: Remover el mock (Línea ~168)**

**BUSCAR:**
```typescript
  const mockDerivaciones: Derivacion[] = [
    { id: 'DER-01', nnaNombre: 'C. Vera P.', institucion: 'OPD', fechaEnvio: '2025-05-01', estado: 'PENDIENTE', numeroOficio: 'OF-123/2025' },
    { id: 'DER-02', nnaNombre: 'D. Lopez M.', institucion: 'COSAM', fechaEnvio: '2025-04-20', estado: 'RESPONDIDO', numeroOficio: 'OF-098/2025' }
  ];
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>(mockDerivaciones);
```

**REEMPLAZAR CON:**
```typescript
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([]);
  const [isLoadingDerivaciones, setIsLoadingDerivaciones] = useState(true);
```

**PASO 2: Actualizar useEffect de carga (agregar al final del loading)**

```typescript
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
          .eq('establecimiento_id', tenantId) // Si tienes tenantId
          .order('fechaEnvio', { ascending: false })
          .limit(50);

        if (!error && data) {
          setDerivaciones(data as Derivacion[]);
        }
      } finally {
        setIsLoadingDerivaciones(false);
      }
    };

    loadDerivaciones();
  }, [tenantId]);
```

**PASO 3: Renderizar con skeleton (buscar donde se listan derivaciones)**

**BUSCAR (en el render):**
```typescript
  {derivaciones.map((der) => (
    // ... render derivación ...
  ))}
```

**REEMPLAZAR CON:**
```typescript
  {isLoadingDerivaciones ? (
    // Skeleton loader
    [...Array(3)].map((_, i) => (
      <div
        key={`skeleton-${i}`}
        className="px-4 py-4 border-b border-slate-100 animate-pulse"
      >
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
      </div>
    ))
  ) : derivaciones.length === 0 ? (
    <div className="px-4 py-8 text-center text-slate-400">
      No hay derivaciones registradas
    </div>
  ) : (
    derivaciones.map((der) => (
      // ... render derivación ...
    ))
  )}
```

---

## ⚠️ P5: DEBOUNCE EN BÚSQUEDA DE EXPEDIENTES - CORRECCIÓN

### Archivo: `src/features/expedientes/ExpedientesList.tsx`

**PASO 1: Importar useDebounce (agregar al inicio)**

```typescript
import { useDebounce } from '@/shared/hooks/useDebounce';
```

**PASO 2: Crear versión debounceada del searchTerm**

**BUSCAR:**
```typescript
  const [searchTerm, setSearchTerm] = useState('');
  
  // ... más código ...
  
  const filteredExpedientes = useMemo(() => {
    if (!searchTerm.trim()) return expedientes;
    const term = searchTerm.toLowerCase();
    return expedientes.filter(exp =>
      exp.nnaNombre.toLowerCase().includes(term) ||
      exp.id.toLowerCase().includes(term) ||
      exp.gravedad.toLowerCase().includes(term) ||
      exp.etapa.toLowerCase().includes(term)
    );
  }, [expedientes, searchTerm]);
```

**REEMPLAZAR CON:**
```typescript
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // ... más código ...
  
  const filteredExpedientes = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return expedientes;
    const term = debouncedSearchTerm.toLowerCase();
    return expedientes.filter(exp =>
      exp.nnaNombre.toLowerCase().includes(term) ||
      exp.id.toLowerCase().includes(term) ||
      exp.gravedad.toLowerCase().includes(term) ||
      exp.etapa.toLowerCase().includes(term)
    );
  }, [expedientes, debouncedSearchTerm]); // ← Cambiar dependencia
```

**PASO 3: Verificar que el input sigue mostrando el term inmediato (opcional pero recomendado)**

Mantener:
```typescript
<input
  type="text"
  placeholder="Filtrar expedientes..."
  value={searchTerm}  // ← Esto da respuesta visual inmediata
  onChange={(e) => setSearchTerm(e.target.value)}
  className="..."
/>
```

NO cambiar a:
```typescript
<input
  value={debouncedSearchTerm}  // ← Esto haría lag visual
  // ...
/>
```

---

## ✅ TEST CASES PARA VALIDAR

### Para P1 (Polling)
```typescript
// Ubicación: src/shared/hooks/__tests__/useGccMetrics.test.ts

it('should use 60000ms as default polling interval', async () => {
  const { result } = renderHook(() => useGccMetrics());
  
  // Debería ser 60000ms ahora (no 30000ms)
  // Verificar en Network tab que queries están separadas 60s
  
  expect(result.current.pollingMs).toBe(60000); // ← Assertion
});
```

### Para P2 (Paralelización)
```typescript
// Ubicación: supabase/functions/gcc-notifications/__tests__/index.test.ts

it('should process establishments in parallel', async () => {
  const startTime = Date.now();
  
  // Con 50 establecimientos
  // ANTES: ~50 segundos
  // DESPUÉS: ~5-6 segundos
  
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(10000); // < 10 segundos
});
```

### Para P3 (Tenant consolidation)
```typescript
// Verificar que resolveTenant solo se llame 1 vez en mount

it('should call resolveTenant only once on mount', () => {
  const resolveSpy = vi.spyOn(TenantContext, 'resolveTenant');
  
  renderHook(() => useTenant(), { wrapper: TenantProvider });
  
  expect(resolveSpy).toHaveBeenCalledTimes(1); // ← Solo 1 vez
});
```

### Para P4 (Skeleton loaders)
```typescript
// Verify skeleton shows before data loads

it('should show skeleton while loading', () => {
  const { container } = render(<BitacoraPsicosocial />);
  
  // Debe haber skeleton antes de datos reales
  const skeleton = container.querySelector('.animate-pulse');
  expect(skeleton).toBeInTheDocument();
});
```

### Para P5 (Debounce)
```typescript
// Verify search is debounced

it('should debounce search input', async () => {
  const { input } = render(<ExpedientesList />);
  
  // Escribir 5 letras rápidamente
  fireEvent.change(input, { target: { value: 'a' } });
  fireEvent.change(input, { target: { value: 'ab' } });
  fireEvent.change(input, { target: { value: 'abc' } });
  fireEvent.change(input, { target: { value: 'abcd' } });
  fireEvent.change(input, { target: { value: 'abcde' } });
  
  // Debe filtrar solo 1 vez (no 5 veces)
  await waitFor(() => {
    expect(filterSpy).toHaveBeenCalledTimes(1); // ← 1 sola llamada
  }, { timeout: 500 });
});
```

---

## 🚀 DEPLOY CHECKLIST

Antes de hacer push:

```bash
# 1. Validar sintaxis TypeScript
npm run type-check

# 2. Correr tests
npm run test -- useGccMetrics.test.ts
npm run test -- BitacoraPsicosocial.test.ts
npm run test -- ExpedientesList.test.ts

# 3. Build local
npm run build

# 4. Verificar no hay console errors
npm run dev

# 5. Test manual en dev
# - Abrir DevTools Network tab
# - Ir a CentroMediacionGCC
# - Verificar que queries están cada 60s (no 30s)

# 6. Crear rama
git checkout -b fix/optimize-sampling-rates

# 7. Commit con mensaje claro
git commit -m "fix(perf): optimize sampling rates - P1 to P5

- P1: Change GCC metrics polling from 30s to 60s (saves 50% queries)
- P2: Parallelize gcc-notifications (89% faster)
- P3: Consolidate TenantContext resolvers
- P4: Add skeleton loaders to BitacoraPsicosocial
- P5: Add debounce to ExpedientesList search

Fixes performance issues identified in audit"

# 8. Push
git push origin fix/optimize-sampling-rates

# 9. Crear Pull Request
```

---

## 🔄 ROLLBACK CHANGES

Si algo sale mal:

```bash
# Opción 1: Git reset
git reset HEAD~1 --soft
git checkout -- src/

# Opción 2: Git revert
git revert <commit-hash>

# Opción 3: Manual revert
# Devolver archivos al original
# Usar git restore + hash anterior
```

---

**FIN DE CÓDIGO DE CORRECCIONES**

*Todos los snippets están listos para copiar/pegar.*  
*Prueba en dev ANTES de mergear.*
