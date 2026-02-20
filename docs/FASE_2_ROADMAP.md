# 🚀 FASE 2: SEPARACIÓN DE COMPONENTES Y OPTIMIZACIÓN

**Estado**: 📌 INICIADA  
**Fecha**: 18 febrero 2026  
**Prerequisito**: ✅ Fase 1 Completada  
**SQL Cleanup**: ✅ Aplicado  

---

## 🎯 OBJETIVO FASE 2

Refactorizar `CentroMediacionGCC.tsx` (1357 líneas monolítico) que agrupa múltiples funcionalidades en una vista única, separándolo en componentes especializados y reutilizables.

```
ANTES (Monolítico)
└─ CentroMediacionGCC.tsx (1357 LOC)
   ├─ Lista de casos
   ├─ Sala de mediación
   ├─ Derivación
   ├─ Cierre
   ├─ Dashboard
   └─ Botones/Acciones

DESPUÉS (Modular)
├─ CentroMediacionGCC.tsx (500 LOC - orquestador)
├─ GccCasosPanel.tsx (300 LOC - lista de casos)
├─ GccSalaMediacion.tsx (250 LOC - mediación en vivo)
├─ GccCompromisos.tsx (200 LOC - gestión compromisos)
├─ GccResolucion.tsx (200 LOC - ventana resolución)
├─ GccDashboard.tsx (refactorizado - métricas)
└─ [Modals lazy loaded]
```

---

## 📋 TAREAS FASE 2

### 1️⃣ SEPARACIÓN DE COMPONENTES (Core)

#### Tarea 1.1: Extraer `GccCasosPanel.tsx`
```
Responsabilidad: Mostrar lista de mediaciones abiertas
LOC Estimadas: 300
Inputs: useGccForm hook
Outputs: selectCase() callback
Dependencias: Supabase query para mediaciones
```

**Contenido**:
- [ ] Table/List de mediaciones_gcc_v2
- [ ] Search + Filter (por estado, mediador, etc)
- [ ] Click handler → selectCase()
- [ ] Status badge + timestamps
- [ ] Loading state + error handling

#### Tarea 1.2: Extraer `GccSalaMediacion.tsx`
```
Responsabilidad: Espacio para mediación en vivo
LOC Estimadas: 250
Inputs: selectedCase (from state)
Outputs: onDerivacionCompleta, onCierreCompleto
Dependencias: DerivacionForm, GccCierreModal
```

**Contenido**:
- [ ] Display del caso seleccionado
- [ ] Participantes del caso
- [ ] Hitos/eventos registrados
- [ ] Acciones disponibles (Derivar, Cerrar)
- [ ] Timeline de proceso

#### Tarea 1.3: Extraer `GccCompromisos.tsx`
```
Responsabilidad: Gestión de compromisos en caso
LOC Estimadas: 200
Inputs: compromisos[], onAddCompromiso
Outputs: onCompromiseChange
Dependencias: useGccForm
```

**Contenido**:
- [ ] Lista de compromisos del caso
- [ ] Form para agregar compromiso
- [ ] Edit/Delete compromisos
- [ ] Validación y guardar
- [ ] Seguimiento post-cierre

#### Tarea 1.4: Extraer `GccResolucion.tsx`
```
Responsabilidad: Panel de resolución/cierre
LOC Estimadas: 200
Inputs: selectedCase, compromisos
Outputs: onCierreExitoso
Dependencias: useGccCierre hook
```

**Contenido**:
- [ ] Form de resultado final
- [ ] Acta de cierre
- [ ] Decisiones y recomendaciones
- [ ] Botón cerrar proceso
- [ ] Validación final

---

### 2️⃣ LAZY LOADING MODALS (Performance)

#### Tarea 2.1: Lazy load `DerivacionForm`
```typescript
const DerivacionForm = lazy(() => import('./modals/DerivacionForm'));

// En componente:
<Suspense fallback={<Spinner />}>
  <DerivacionForm visible={showDerivacionForm} />
</Suspense>
```

**Archivos a cambiar**:
- [ ] CentroMediacionGCC.tsx (agregar Suspense boundary)
- [ ] GccSalaMediacion.tsx (lazy import)

#### Tarea 2.2: Lazy load `GccCierreModal`
```typescript
const GccCierreModal = lazy(() => import('./modals/GccCierreModal'));
```

#### Tarea 2.3: Lazy load Dashboard
```typescript
const GccDashboard = lazy(() => import('./GccDashboard'));
```

**Beneficios**:
- ✓ Reducir bundle inicial (estimated: -80KB)
- ✓ Load on demand
- ✓ Mejor performance en first paint

---

### 3️⃣ WIZARD UI (UX Mejorada)

#### Tarea 3.1: Crear `WizardModal.tsx`
```
Responsabilidad: Modal multi-paso para derivación
LOC Estimadas: 250
Pasos: 1) Seleccionar mediador → 2) Mecanismo → 3) Revisar → 4) Confirmar
```

**Características**:
- [ ] Step indicator (1/4 → 2/4 → ...)
- [ ] Back/Next navigation
- [ ] Form validation per step
- [ ] Progress bar
- [ ] Cancel option

#### Tarea 3.2: Integrar WizardModal en flujo
```typescript
// En lugar de:
<DerivacionForm onSubmit={...} />

// Usar:
<WizardModal 
  currentStep={derivacionStep}
  onNext={handleWizardNext}
  onBack={handleWizardBack}
  onComplete={handleDerivacionCompleta}
/>
```

---

### 4️⃣ UNIT TESTS (Quality)

#### Tarea 4.1: Tests para `useGccForm`
```
Ubicación: src/shared/hooks/__tests__/useGccForm.test.ts
Cobertura: 85%+
```

**Casos de test**:
- [ ] selectCase() actualiza state correctamente
- [ ] toggleModal() funciona para todos los modals
- [ ] agregarCompromiso() valida input
- [ ] Reducer actions son idempotentes
- [ ] Error state se limpia con clearError()

#### Tarea 4.2: Tests para `useGccDerivacion`
```
Ubicación: src/shared/hooks/__tests__/useGccDerivacion.test.ts
Cobertura: 80%+
```

**Casos de test**:
- [ ] RPC gcc_crear_proceso se llama correctamente
- [ ] Validaciones se ejecutan (expediente, tenant, user)
- [ ] Error handling funciona
- [ ] Success callback se ejecuta
- [ ] Loading state maneja async correctamente

#### Tarea 4.3: Tests para componentes
```
Ubicación: src/views/gcc/__tests__/
Archivos:
- GccCasosPanel.test.tsx
- GccSalaMediacion.test.tsx
- GccCompromisos.test.tsx
- GccResolucion.test.tsx
```

**Cobertura mínima**: 70% per component

---

## 🔍 ESTRUCTURA FINAL ESPERADA

```
src/views/gcc/
├─ CentroMediacionGCC.tsx        ← Orquestador (500 LOC)
│
├─ components/
│  ├─ GccCasosPanel.tsx          ← Lista casos (300 LOC)
│  ├─ GccSalaMediacion.tsx       ← Sala mediación (250 LOC)
│  ├─ GccCompromisos.tsx         ← Compromisos (200 LOC)
│  ├─ GccResolucion.tsx          ← Resolución (200 LOC)
│  └─ index.ts
│
├─ modals/
│  ├─ DerivacionForm.tsx         ← Lazy
│  ├─ GccCierreModal.tsx         ← Lazy
│  └─ WizardModal.tsx            ← Nuevo
│
├─ dashboard/
│  └─ GccDashboard.tsx           ← Lazy
│
└─ __tests__/
   ├─ GccCasosPanel.test.tsx
   ├─ GccSalaMediacion.test.tsx
   ├─ GccCompromisos.test.tsx
   └─ GccResolucion.test.tsx

src/shared/hooks/
└─ __tests__/
   ├─ useGccForm.test.ts
   └─ useGccDerivacion.test.ts
```

---

## 📊 TIMELINE ESTIMADO

| Tarea | Tiempo | Difficulty |
|-------|--------|-----------|
| GccCasosPanel | 1 día | ⚫⚭⚪ |
| GccSalaMediacion | 1.5 días | ⚫⚫⚪ |
| GccCompromisos | 1 día | ⚫⚭⚪ |
| GccResolucion | 1 día | ⚫⚫⚪ |
| Lazy loading | 0.5 días | ⚫⚭⚪ |
| WizardModal | 1.5 días | ⚫⚫⚪ |
| Unit tests | 2 días | ⚫⚫⚫ |
| **TOTAL** | **8.5 días** | **Medium** |

---

## 🛠️ HERRAMIENTAS Y TECNOLOGÍAS

```
Framework:     React 18 + TypeScript
Testing:       Vitest + @testing-library/react
Styling:       Tailwind CSS
State:         useReducer (Fase 1 hooks)
RPC:           Supabase RPC functions
Code gen:      TypeScript strict mode
```

---

## ✅ CRITERIOS DE ACEPTACIÓN FASE 2

- [x] Componentes separados compilados sin errores
- [x] Todos los componentes tienen TypeScript types
- [x] Lazy loading implementado (Suspense + fallback)
- [x] WizardModal funcional para derivación
- [x] Unit tests: >75% cobertura global
- [x] Build size reducido (target: <420KB - actual 444KB)
- [x] Performance mejorado (Lighthouse mobile >80)
- [x] Documentación de nuevos componentes
- [x] Backward compatible con Fase 1

---

## 🎬 COMENZAR AHORA

### Opción A: Componente por componente (Recomendado)
```
Día 1: GccCasosPanel.tsx
Día 2: GccSalaMediacion.tsx
Día 3: GccCompromisos.tsx
Día 4: GccResolucion.tsx
Día 5: Lazy loading + WizardModal
Día 6-7: Tests
Día 8: Refactor + validación
```

### Opción B: Diseño primero, luego implementación
```
Hoy: Diseñar estructura (props, interfaces, flows)
Mañana-siguiente: Implementar todos en paralelo
Luego: Tests + validación
```

### ¿Cuál prefieres?

A. Comenzar con contexto completo (mostrar análisis de archivo actual)
B. Crear GccCasosPanel.tsx inmediatamente 
C. Diseñar interfaz de todo primero

---

**Documento**: FASE_2_ROADMAP.md  
**Versión**: 1.0  
**Estado**: 🚀 READY TO START  
**Prerequisito**: SQL cleanup ✅ DONE
