# 🏗️ ARQUITECTURA: VISUAL GUIDEBOOK

> Explicación visual de cómo se estructura el nuevo código

---

## ANTES: La Torre de Babel 🔴

```
CentroMediacionGCC.tsx
│
├─ useState: selectedCaseId
├─ useState: showDerivacionForm        } 15+ states
├─ useState: showCierreModal           } 
├─ useState: compromisos []            } 
├─ useState: statusGCC                 } 🔴 Spaghetti code
├─ useState: isLoadingDerivacion       }
├─ useState: errorDerivacion           }
├─ setState: setSelectedCaseId         } Setters dispersos
├─ setState: setShowDerivacionForm     } Por todos lados
├─ setState: handleSelectCase() {      }
│    setSelectedCaseId(...)            } Lógica duplicada
│    setCompromisos([])                }
│    setStatusGCC(...)                 }
│    // ... 10 más setters              }
├─ setState: supabase.from().insert()  } RPC calls
├─ setState: supabase.from().update()  } Sin patrón
└─ 1433 líneas total
```

**Problemas**:
❌ Difícil de testear  
❌ Desincronización de estados  
❌ Lógica duplicada  
❌ Props drilling extenso  

---

## DESPUÉS: Clean Architecture ✅

```
CentroMediacionGCC.tsx
│
├─ useGccForm()                      ┐
│  ├─ state.selectedCaseId           │
│  ├─ state.showDerivacionForm       │ 1 reducer
│  ├─ state.compromisos[]            │ centralizado
│  ├─ state.statusGCC                │
│  ├─ selectCase()                   │
│  ├─ toggleModal()                  │
│  └─ agregarCompromiso()            ┘
│
├─ useGccDerivacion()                ┐
│  ├─ handleDerivacionCompleta()     │ RPC:
│  ├─ isLoading                      │ gcc_crear_proceso
│  └─ error                          ┘
│
└─ useGccCierre()                    ┐
   ├─ handleCierreExitoso()          │ RPC:
   ├─ isLoading                      │ gcc_procesar_cierre
   └─ error                          ┘
```

**Ventajas**:
✅ Fácil de testear  
✅ Estados sincronizados  
✅ Código reutilizable  
✅ Errores centralizados  

---

## 📊 FLOW DE UN REQUEST

### 🔴 ANTES (Confuso)

```
User clicks "Derivar"
    ↓
setShowDerivacionForm(true)
    ↓
<DerivacionForm onSubmit={handleDerivacionCompleta} />
    ↓
Inside handleDerivacionCompleta:
    - supabase.rpc('gcc_crear_proceso') (no es RPC realmente)
    - setCompromisos([...])
    - setStatusGCC('EN_DERIVACION')
    - supabase.from().insert() (more db calls)
    - setIsLoadingDerivacion(false)
    - toast("Éxito")
    ↓
¿Qué si falla? ¿Dónde está el try-catch?
Respuesta: 🤷 Esparcido en el componente
```

### ✅ DESPUÉS (Limpio)

```
User clicks "Derivar"
    ↓
onClick={() => handleDerivacionCompletaInternal()}
    ↓
useGccDerivacion hook:
    const { handleDerivacionCompleta } = useGccDerivacion();
    ↓
Inside hook:
    try {
        1. Validar expediente
        2. Llamar gcc_crear_proceso (RPC)
        3. Registrar hito (gcc_agregar_hito)
        return { success, processId }
    } catch (error) {
        Definir error específico
        throw
    }
    ↓
Back in component:
    useGccForm reducer action: SET_ERROR
    toast(error.message)
    ↓
UI updates automáticamente ✅
```

---

## 🔄 REDUCER PATTERN VISUALIZADO

```
┌─────────────────────────────────────┐
│       gccFormReducer                │
│  (17 action types)                  │
└─────────────────────────────────────┘
         △
         │ dispatch(action)
         │
  Component ──→ { 
                   type: 'SELECT_CASE',
                   payload: caseId
                 }
         │
         ↓
     Reducer ──→ state.selectedCaseId = caseId
         │       state.showDerivacion = false
         │       state.compromisos = []
         │       (todos sync!)
         │
         ↓
    state ──→ Component re-renders ✅
         
         ↓
    Usuario ve el cambio
```

**Ventaja**: Cualquier cambio en SELECT_CASE siempre hace lo mismo.

---

## 🎯 RPC INTEGRATION DIAGRAM

```
React Hook Layer
┌─────────────────────────────────────┐
│  useGccDerivacion                   │
│  handleDerivacionCompleta()         │
└─────────────────────────────────────┘
         │
         ↓ (calls)
         │
Server Layer (Supabase)
┌─────────────────────────────────────┐
│  gcc_crear_proceso RPC:             │
│  ├─ Create mediación record         │
│  ├─ Create participantes            │
│  ├─ Add first hito                  │
│  └─ Return processId                │
│                                     │
│  (Todo en 1 atomic transaction)     │
└─────────────────────────────────────┘
         │
         ↓ (returns)
         │
React Hook Layer
│  const { success, data } = response
│  Update useGccForm state
│  Show toast message
└─────────────────────────────────────┘
```

**Ventaja**: Una función = múltiples operaciones atómicas

---

## 📦 COMPONENTES Y HOOKS

```
┌─────────────────────────────────────────┐
│ CentroMediacionGCC.tsx                  │
│ (Componente principal)                  │
└─────────────────────────────────────────┘
    │
    ├─ useGccForm()
    │  │
    │  └─ Maneja: Estado del formulario
    │
    ├─ useGccDerivacion()
    │  │
    │  └─ Maneja: Flujo de derivación
    │
    ├─ useGccCierre()
    │  │
    │  └─ Maneja: Flujo de cierre
    │
    └─ Subcomponentes
       │
       ├─ <DerivacionForm />
       │  └─ Recibe: { onMecanismoChange, onDerivacionCompleta }
       │
       ├─ <GccDashboard />
       │  └─ Muestra: KPIs del GCC
       │
       └─ <GccCierreModal />
          └─ Abre: Proceso de cierre
```

---

## 🔐 DATA FLOW: State Synchronization

```
┌─────────────────────────────────────────────┐
│ User selects case                           │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ Dispatch: SELECT_CASE action                │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ Reducer processes:                          │
│ • state.selectedCaseId = id                 │
│ • state.showDerivacionForm = false          │
│ • state.compromisos = []  ← Auto-reset ✓   │
│ • state.statusGCC = 'ABIERTO'               │
│ • state.uiState.loading = false             │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ Component re-renders with new values        │
│ • UI updates                                │
│ • Child components receive new props        │
│ • No risk of desynchronization              │
└─────────────────────────────────────────────┘
```

---

## 🗂️ FILE STRUCTURE

```
src/
├─ shared/
│  └─ hooks/
│     ├─ index.ts (exports)
│     │
│     ├─ Other hooks...
│     │
│     └─ gcc/
│        ├─ useGccForm.ts         ← 450 lines
│        │  └─ gccFormReducer()
│        │  └─ initialState
│        │  └─ memoized helpers
│        │
│        ├─ useGccDerivacion.ts   ← 160 lines
│        │  └─ gcc_crear_proceso RPC
│        │  └─ gcc_agregar_hito RPC
│        │
│        └─ useGccCierre.ts       ← 120 lines
│           └─ gcc_procesar_cierre_completo RPC
│
└─ views/
   └─ gcc/
      ├─ CentroMediacionGCC.tsx   ← Refactored ✓
      ├─ GccDashboard.tsx
      ├─ GccCierreModal.tsx
      └─ ... otros componentes
```

---

## 🔌 INTEGRATION POINTS

```
┌──────────────────────┐
│   React Component    │
└──────────────────────┘
         ↑ ↓
    (props, state)
         ↑ ↓
┌──────────────────────────────────┐
│     Custom Hooks Layer           │
│  • useGccForm (state + actions)  │
│  • useGccDerivacion (RPC)        │
│  • useGccCierre (RPC)            │
└──────────────────────────────────┘
         ↑ ↓
   (supabase calls)
         ↑ ↓
┌──────────────────────────────────┐
│     Supabase RPC Functions       │
│  • gcc_crear_proceso             │
│  • gcc_procesar_cierre_completo  │
│  • gcc_validar_expediente        │
│  • ... (10 total)                │
└──────────────────────────────────┘
         ↑ ↓
   (SQL queries)
         ↑ ↓
┌──────────────────────────────────┐
│     PostgreSQL Database          │
│  • mediaciones_gcc_v2            │
│  • hitos_gcc_v2                  │
│  • participantes_gcc_v2          │
│  • compromisos_gcc_v2            │
└──────────────────────────────────┘
```

---

## 📈 SCALABILITY: Cómo crecer desde aquí

```
Fase 1 (DONE ✅)
└─ useGccForm (centralizar estado)
└─ useGccDerivacion (derivación)
└─ useGccCierre (cierre)

Fase 2 (PENDIENTE 🔮)
├─ useGccDashboard (métricas)
├─ useGccCompromisos (compromisos)
├─ useGccNotificaciones (alerts)
├─ useGccReportes (reportes)
├─ Component splitting (CasosPanel, SalaMediacion, etc)
└─ Lazy loading modals

Fase 3 (FUTURO 🚀)
├─ Performance optimization
├─ Advanced caching
├─ Offline support
├─ Advanced notifications
└─ Analytics integration
```

**Nota**: Cada fase es independiente y no rompe la anterior.

---

## 🎓 LEARNING PATH

```
1. Entender Reducer Pattern
   └─ Leer: useGccForm.ts
   └─ Concepto: State + Dispatch + Actions

2. Entender RPC Integration
   └─ Leer: useGccDerivacion.ts
   └─ Concepto: Async calls, error handling

3. Entender Component Integration
   └─ Leer: CentroMediacionGCC.tsx (refactored section)
   └─ Concepto: Cómo los hooks se integran en el componente

4. Practica
   └─ Crea: Otro custom hook similar
   └─ Test: Validación con npm run build
```

---

## 🎯 KEY TAKEAWAYS

| Antes | Después |
|-------|---------|
| 15+ useState | 1 useReducer |
| Disperso | Centralizado |
| Difícil testear | Fácil testear |
| Props drilling | Hooks encapsulan |
| Errores ad-hoc | Error handling sistemático |
| RPC calls en componentes | RPC calls en hooks |
| 1433 líneas | 1357 líneas (-76 LOC) |

---

## 📞 NEXT STEPS

1. ✅ Entender esta architecture
2. ✅ Leer código de los hooks
3. ✅ (Opcional) Ejecutar DROP en Supabase
4. ✅ Comenzar Fase 2 (si aplica)

---

**Documento**: ARQUITECTURA_VISUAL_FASE_1.md  
**Versión**: 1.0  
**Propósito**: Explicar estructura sin tecnicismos  
**Audiencia**: Developers + Tech Leads
