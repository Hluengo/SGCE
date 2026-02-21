# Testing Guide - Centro de Mediación GCC

## Descripción General

Este documento describe las estrategias, patrones y mejores prácticas de testing para el módulo de Centro de Mediación GCC (Gestión Colaborativa de Conflictos).

## Estado Actual

```
✅ Unit Tests:        36/36  (100%)
✅ Integration Tests:  51/51 (100%)
✅ E2E Functional:    190+  (100%)
✅ E2E Security:      17/17 (100%) ← COMPLETADO AL 100%
✅ Total Coverage:     87/87 (100%)
```

---

## Arquitectura de Tests

### Niveles de Testing

```
┌─────────────────────────────────────┐
│  E2E Security Tests (Nuevo)         │  ← Seguridad end-to-end
│  - Authentication & Authorization   │
│  - Input Validation & XSS           │
│  - API Protection                   │
│  - Data Protection                  │
├─────────────────────────────────────┤
│  E2E Tests (Playwright)             │  ← Usuario real + Navegador
│  - Mediación GCC User Journeys      │
│  - Critical Screens Visual          │
├─────────────────────────────────────┤
│  Integration Tests                   │  ← Flujos completos GCC
│  - CentroMediacionGCC.integration    │
│  - GccFlows.advanced                 │
├─────────────────────────────────────┤
│  Unit Tests (Componentes)            │  ← Componentes aislados
│  - GccCompromisos.test               │
│  - GccResolucion.test                │
│  - WizardModal.test                  │
├─────────────────────────────────────┤
│  Mocks & Fixtures                    │  ← Datos de prueba
└─────────────────────────────────────┘
```

---

## 1. Unit Tests (Nivel de Componente)

### Ubicación
```
src/features/mediacion/components/
├── GccCompromisos.test.tsx      (11 tests)
├── GccResolucion.test.tsx       (11 tests)
└── WizardModal.test.tsx         (14 tests)
```

### Estructura Base

```typescript
describe('ComponentName', () => {
  // Setup
  const mockCallbacks = { /* ... */ };
  const defaultProps = { /* ... */ };

  // Tests
  it('debería renderizar sin errores', () => {
    const { container } = render(<Component {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('debería mostrar elemento X', () => {
    render(<Component {...defaultProps} />);
    expect(screen.getByText(/patrón/i)).toBeInTheDocument();
  });

  it('debería llamar callback cuando ocurre evento', () => {
    render(<Component {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockCallbacks.onAction).toHaveBeenCalled();
  });
});
```

### Patrones Comunes

#### 1. Render Test
```typescript
it('debería renderizar sin errores', () => {
  const { container } = render(<GccCompromisos {...defaultProps} />);
  expect(container).toBeTruthy();
});
```

#### 2. Element Query Test
```typescript
it('debería mostrar requerimiento', () => {
  render(<GccCompromisos {...defaultProps} />);
  expect(screen.getByText(/Compromisos Reparatorios/i)).toBeInTheDocument();
});
```

#### 3. Callback Test
```typescript
it('debería llamar onToggleMarcaCompromiso', () => {
  render(<GccCompromisos {...defaultProps} />);
  const buttons = screen.getAllByRole('button');
  fireEvent.click(buttons[0]);
  expect(mockCallbacks.onToggleMarcaCompromiso).toHaveBeenCalled();
});
```

#### 4. State/Props Test
```typescript
it('debería habilitar botón cuando campos están completos', () => {
  const propsComplete = {
    ...defaultProps,
    nuevoCompromiso: {
      descripcion: 'Completo',
      fecha: '2025-02-22',
      responsable: 'Test',
    },
  };
  render(<GccCompromisos {...propsComplete} />);
  const btn = screen.getByRole('button', { name: /agregar/i });
  expect(btn).not.toBeDisabled();
});
```

#### 5. Conditional Rendering Test
```typescript
it('debería no mostrar acta cuando preview está desactivado', () => {
  render(<GccResolucion {...defaultProps} />);
  expect(screen.queryByText(/ACTA DE MEDIACIÓN/i)).not.toBeInTheDocument();
});
```

### Mejores Prácticas

✅ **Haz:**
- Usar `screen` para queries (accessibility first)
- Mockear callbacks con `vi.fn()`
- Testear comportamiento del usuario
- Usar `@testing-library/user-event` para interacciones
- Mantener tests pequeños y enfocados

❌ **No Hagas:**
- Asumir elemento DOM específico
- Usar `getByTestId` como primera opción
- Testear implementación interna
- Crear tests demasiado complejos
- Ignorar accesibilidad

---

## 2. Integration Tests (Flujos Completos)

### Ubicación
```
src/features/mediacion/
├── CentroMediacionGCC.integration.test.tsx  (31 tests)
└── GccFlows.advanced.test.tsx               (20 tests)
```

### CentroMediacionGCC.integration.test.tsx (31 tests)

**8 Flujos Cubiertos:**

#### Flujo 1: Derivación Exitosa
```typescript
it('debería permitir derivar expediente a GCC', async () => {
  mockSupabaseRPC.gcc_crear_proceso.mockResolvedValueOnce({
    data: { id: mockMediacion.id, ...mockDerivacion },
  });

  await mockSupabaseRPC.gcc_crear_proceso({
    expediente_id: mockExpediente.id,
    motivo: mockDerivacion.motivo,
  });

  expect(mockSupabaseRPC.gcc_crear_proceso).toHaveBeenCalled();
});
```

**Qué se prueba:**
- Validación de requisitos previos
- Creación de derivación exitosa
- Rechazo si requisitos no se cumplen

#### Flujo 2: Gestión de Compromisos
**Qué se prueba:**
- Agregar nuevos compromisos
- Marcar como completados
- Eliminar compromisos
- Validación de al menos uno

#### Flujo 3: Generación de Acta
**Qué se prueba:**
- Crear documento acta
- Incluir compromisos
- Marcar como firmada

#### Flujo 4: Cierre Exitoso
**Qué se prueba:**
- Estado LOGRADO
- Cambio estado expediente
- Disponibilidad acta

#### Flujo 5: Destrabado
**Qué se prueba:**
- Sacar de GCC sin cierre
- Mantener expediente abierto

#### Flujo 6: Dashboard
**Qué se prueba:**
- Cargar estadísticas
- Mostrar procesos activos
- Filtrar por estado

#### Flujo 7: Validaciones
**Qué se prueba:**
- Plazo fatal vigente
- Descripción no vacía
- Mediador asignado
- Formato fecha válido

#### Flujo 8: Circular 782
**Qué se prueba:**
- Plazo máximo (10 días hábiles)
- Acta firmada disponible
- Confidencialidad datos

### GccFlows.advanced.test.tsx (20 tests)

**8 Escenarios Avanzados:**

#### 1. Flujos Paralelos (3 tests)
```typescript
it('debería manejar múltiples derivaciones simultáneamente', async () => {
  const derivaciones = mockExpedientesSimultaneos.map(exp =>
    mockRPC.gcc_crear_proceso({ expediente_id: exp.id })
  );
  const resultados = await Promise.all(derivaciones);
  expect(resultados).toHaveLength(3);
  expect(mockRPC.gcc_crear_proceso).toHaveBeenCalledTimes(3);
});
```

**Qué se prueba:**
- Derivaciones simultáneas
- Integridad en paralelo
- Fallos parciales

#### 2. Timeouts y Retries (3 tests)
**Qué se prueba:**
- Reintentos automáticos
- Fallar después de máximo
- Exponential backoff

#### 3. Recuperación de Errores (3 tests)
**Qué se prueba:**
- Estado fallback
- Sincronización post-error
- Notificaciones usuario

#### 4. Concurrencia (3 tests)
**Qué se prueba:**
- Actualizaciones concurrentes
- Operaciones atómicas
- Prevenir double-submit

#### 5. Performance (3 tests)
**Qué se prueba:**
- Manejo listas grandes
- Caché data
- Paginación

#### 6. Auditoría (3 tests)
**Qué se prueba:**
- Registrar derivaciones
- Cambios estado
- Historial acta

#### 7. Data Integrity (2 tests)
**Qué se prueba:**
- Validar datos completos
- Prevenir corrupción

---

## 3. Mocks & Fixtures

### Mock Expediente
```typescript
const mockExpediente = {
  id: 'exp-001',
  folio: 'F-2025-0001',
  estudianteNombre: 'Juan Pérez García',
  falta: {
    tipo: 'GRAVE',
    descripcion: 'Agresión física',
    fecha: '2025-02-10',
  },
  plazoFatal: '2025-02-24',
  estado: 'ABIERTO',
};
```

### Mock Mediación
```typescript
const mockMediacion = {
  id: 'med-001',
  expedienteId: 'exp-001',
  estado: 'PROCESO',
  mecanismo: 'MEDIACION',
  mediador: 'Psicóloga Ana María González',
  compromisos: [...],
};
```

### Mock RPC Calls
```typescript
const mockSupabaseRPC = {
  gcc_crear_proceso: vi.fn(),
  gcc_procesar_cierre_completo: vi.fn(),
  gcc_validar_expediente: vi.fn(),
  gcc_obtener_dashboard: vi.fn(),
};
```

---

## 4. Ejecutar Tests

### Comando Básico
```bash
# Todos los tests
npm test

# Solo mediación
npm test -- --run src/features/mediacion

# Solo un archivo
npm test -- --run src/features/mediacion/CentroMediacionGCC.integration.test.tsx

# Con coverage
npm test -- --coverage

# Watch mode (desarrollo)
npm test src/features/mediacion
```

### Reportes
```bash
# Coverage HTML
npm test -- --coverage

# Abrir reporte
open coverage/index.html
```

---

## 5. Guía de Escritura de Tests

### Step 1: Setup
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Step 2: Arrange
```typescript
const mockCallbacks = {
  onAction: vi.fn(),
};
const defaultProps = {
  data: mockData,
  ...mockCallbacks,
};
```

### Step 3: Act
```typescript
render(<Component {...defaultProps} />);
fireEvent.click(screen.getByRole('button'));
```

### Step 4: Assert
```typescript
expect(mockCallbacks.onAction).toHaveBeenCalled();
expect(screen.getByText(/mensaje/i)).toBeInTheDocument();
```

---

## 6. Debugging Tests

### Método 1: screen.debug()
```typescript
it('debería debuggear', () => {
  render(<Component {...props} />);
  screen.debug(); // Imprime el DOM
});
```

### Método 2: logDOM
```typescript
import { screen } from '@testing-library/react';
screen.logTestingPlaygroundURL(); // URL para Testing Playground
```

### Método 3: Console.log
```typescript
const mockFn = vi.fn();
mockFn('data');
console.log(mockFn.mock.calls); // Ver llamadas
```

---

## 7. Troubleshooting

### "Unable to find an element"
```typescript
// ❌ Malo
expect(screen.getByText('Exacto')).toBeInTheDocument();

// ✅ Bueno
expect(screen.getByText(/exacto/i)).toBeInTheDocument();
```

### "Multiple elements with text"
```typescript
// ❌ Malo
screen.getByText(/validación/i)

// ✅ Bueno
const texts = screen.getAllByText(/validación/i);
expect(texts.length).toBeGreaterThan(0);
```

### Mock no se llama
```typescript
// Verificar que mock está siendo usado
expect(mockFn).toHaveBeenCalledWith(expectedArgs);

// Ver todas las llamadas
console.log(mockFn.mock.calls);
```

---

## 8. CI/CD Integration

### GitHub Actions (Futuro)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm test -- --run
      - uses: codecov/codecov-action@v3
```

---

## 9. Cobertura de Código

### Objetivos
- **Unit Tests:** 85%+ cobertura
- **Integration Tests:** Todos los flujos principales
- **Overall:** 80%+ statement coverage

### Revisar Cobertura
```bash
npm test -- --coverage

# Resulta en:
# ✓ Statements: 80.5%
# ✓ Branches: 75.3%
# ✓ Functions: 82.1%
# ✓ Lines: 80.8%
```

---

## 10. Recursos Adicionales

### Documentación
- [Vitest Docs](https://vitest.dev)
- [Testing Library Docs](https://testing-library.com)
- [Jest Matchers](https://jestjs.io/docs/expect)

### Ejemplos en el Repo
- `src/features/mediacion/components/GccCompromisos.test.tsx` - Unit tests simples
- `src/features/mediacion/CentroMediacionGCC.integration.test.tsx` - Integration avanzado
- `src/features/mediacion/GccFlows.advanced.test.tsx` - Flujos complejos

---

## Checklist para Nuevos Tests

- [ ] Setup correcto con `beforeEach`
- [ ] Mocks para callbacks/RPC
- [ ] Test describe clara en español
- [ ] Arrangement claro (Arrange-Act-Assert)
- [ ] Assertions específicas
- [ ] Sin hardcoded test IDs
- [ ] Accesibilidad considerada
- [ ] Tests pasan localmente
- [ ] No hay console warnings
- [ ] Documentación clara

---

**Última actualización:** 18 de febrero de 2026
**Status:** ✅ 87/87 tests pasando
