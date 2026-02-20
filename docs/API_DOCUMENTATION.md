# API Documentation - Centro de Mediación GCC

## Descripción General

Documentación técnica completa de componentes, hooks y funciones del módulo GCC.

---

## Componentes

### GccCompromisos

**Propósito:** Gestión de compromisos reparatorios durante mediación

**Ubicación:** `src/features/mediacion/components/GccCompromisos.tsx`

**Props:**
```typescript
interface GccCompromisosProps {
  // Datos
  compromisos: Compromiso[];
  nuevoCompromiso: NuevoCompromiso;
  
  // Callbacks
  onNuevoCompromisoChange: (field: string, value: string) => void;
  onAgregarCompromiso: () => void;
  onEliminarCompromiso: (id: string) => void;
  onToggleMarcaCompromiso: (id: string) => void;
}
```

**Interfaces:**
```typescript
interface Compromiso {
  id: string;
  descripcion: string;
  fechaCumplimiento: string;
  responsable: string;
  completado: boolean;
}

interface NuevoCompromiso {
  descripcion: string;
  fecha: string;
  responsable: string;
}
```

**Funcionalidades:**
- ✅ Listar compromisos existentes
- ✅ Agregar nuevos compromisos
- ✅ Marcar como completados
- ✅ Eliminar compromisos
- ✅ Validación: al menos descripción y fecha

**Performance:**
- ✅ React.memo wrapper
- ✅ useCallback para callbacks
- ✅ useMemo para validación

**Ejemplo:**
```tsx
import { GccCompromisos } from '@/features/mediacion/components';

<GccCompromisos
  compromisos={compromisos}
  nuevoCompromiso={nuevoCompromiso}
  onNuevoCompromisoChange={(field, value) => {
    setNuevoCompromiso({ ...nuevoCompromiso, [field]: value });
  }}
  onAgregarCompromiso={handleAgregar}
  onEliminarCompromiso={handleEliminar}
  onToggleMarcaCompromiso={handleToggle}
/>
```

---

### GccResolucion

**Propósito:** Panel de resolución y cierre de mediación

**Ubicación:** `src/features/mediacion/components/GccResolucion.tsx`

**Props:**
```typescript
interface GccResolucionProps {
  // Estado
  statusGCC: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  actaTemplate: string;
  showActaPreview: boolean;
  
  // Callbacks
  onToggleActaPreview: () => void;
  onDestrabarDesdeGCC: () => void;
  onCierreExitoso: () => void;
}
```

**Estados GCC:**
| Estado | Descripción | Botones Disponibles |
|---|---|---|
| `PROCESO` | Mediación en curso | Preview Acta, Destrabado |
| `LOGRADO` | Acuerdo alcanzado | Preview Acta, Destrabado, Cierre Exitoso |
| `NO_ACUERDO` | Sin acuerdo | Preview Acta, Destrabado |

**Funcionalidades:**
- ✅ Previsualizar acta de mediación
- ✅ Sacar de GCC (destrabado)
- ✅ Cierre exitoso (solo LOGRADO)

**Ejemplo:**
```tsx
import { GccResolucion } from '@/features/mediacion/components';

<GccResolucion
  statusGCC="LOGRADO"
  actaTemplate={actaContent}
  showActaPreview={true}
  onToggleActaPreview={() => setShowActa(!showActa)}
  onDestrabarDesdeGCC={() => handleDestrabado()}
  onCierreExitoso={() => handleCierre()}
/>
```

---

### WizardModal

**Propósito:** Asistente modalizado de 4 pasos para cierre de mediación

**Ubicación:** `src/features/mediacion/components/WizardModal.tsx`

**Props:**
```typescript
interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (resultado: WizardResult) => void;
  
  // Data
  mediacionId: string;
  caseName: string;
  stageName: WizardStep;
  totalCompromisosRegistrados: number;
  totalCompromisosCompletados: number;
}

type WizardStep = 'validacion' | 'confirmacion' | 'acta' | 'final';

interface WizardResult {
  mediacionId: string;
  timestamp: string;
  pasoFinal: WizardStep;
  confirmado: boolean;
}
```

**Pasos del Wizard:**

1. **Validación** - Verificar requisitos previos
   - Compromisos registrados
   - Validar completitud
   - Mostrar alertas si necesario

2. **Confirmación** - Confirmar datos finales
   - Revisar información
   - Confirmar participantes
   - Aceptar términos

3. **Acta** - Generación de acta
   - Preview documento
   - Incluir todos los datos
   - Firma digital

4. **Cierre** - Finalización
   - Confirmación final
   - Guardar acta
   - Cierre proceso

**Ejemplo:**
```tsx
import { WizardModal } from '@/features/mediacion/components';

<WizardModal
  isOpen={showWizard}
  onClose={() => setShowWizard(false)}
  onComplete={(resultado) => {
    console.log('Mediación completada:', resultado.mediacionId);
  }}
  mediacionId={mediacion.id}
  caseName={expediente.estudianteNombre}
  stageName="validacion"
  totalCompromisosRegistrados={5}
  totalCompromisosCompletados={3}
/>
```

---

### GccSalaMediacion

**Propósito:** Componente orchestrador principal de mediación

**Ubicación:** `src/features/mediacion/components/GccSalaMediacion.tsx`

**Props:** (25+ propiedades)

```typescript
interface GccSalaMediacionProps {
  // Datos básicos
  mediacionId: string;
  casoSeleccionado?: Expediente;
  statusGCC: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  
  // User info
  facilitador?: string;
  tenantId?: string;
  
  // Estados
  compromisos: Compromiso[];
  nuevoCompromiso: NuevoCompromiso;
  showActaPreview: boolean;
  
  // Callbacks (15+)
  onNuevoCompromisoChange: (field: string, value: string) => void;
  onAgregarCompromiso: () => void;
  onEliminarCompromiso: (id: string) => void;
  onToggleMarcaCompromiso: (id: string) => void;
  onToggleActaPreview: () => void;
  onDestrabarDesdeGCC: () => void;
  onCierreExitoso: () => void;
  // ... más callbacks
}
```

**Funcionalidades:**
- ✅ Integración GccCompromisos + GccResolucion
- ✅ Gestión completa de mediación
- ✅ Memoizado para performance

**Nota:** No está lazy-loaded (componente orquestador principal)

---

### GccCasosPanel

**Propósito:** Panel de selección de casos disponibles y activos

**Ubicación:** `src/features/mediacion/components/GccCasosPanel.tsx`

**Funcionalidades:**
- ✅ Casos Disponibles para GCC
- ✅ Procesos Activos en GCC
- ✅ Ordenar por plazo/fecha
- ✅ Alertas de vencimiento

**Props:**
```typescript
interface GccCasosPanelProps {
  casosDisponibles: Expediente[];
  procesosActivos: Mediacion[];
  onSeleccionarCaso: (caso: Expediente) => void;
  onSeleccionarProceso: (proceso: Mediacion) => void;
  isLoading?: boolean;
  filter?: 'todos' | 'proximo_vencimiento' | 'activos';
}
```

**Ejemplo:**
```tsx
import { GccCasosPanel } from '@/features/mediacion/components';

<GccCasosPanel
  casosDisponibles={disponibles}
  procesosActivos={activos}
  onSeleccionarCaso={(caso) => setSelected(caso)}
  onSeleccionarProceso={(proc) => handleProceso(proc)}
  filter="proximo_vencimiento"
/>
```

---

## Lazy Loading

**Ubicación:** `src/features/mediacion/components/lazy.tsx`

**Componentes con Lazy Loading:**
```typescript
export const GccCasosPanelWithSuspense = lazy(() =>
  import('./GccCasosPanel').then(m => ({ default: m.GccCasosPanel }))
);

export const GccCompromisosWithSuspense = lazy(() =>
  import('./GccCompromisos').then(m => ({ default: m.GccCompromisos }))
);

export const GccResolucionWithSuspense = lazy(() =>
  import('./GccResolucion').then(m => ({ default: m.GccResolucion }))
);

export const WizardModalWithSuspense = lazy(() =>
  import('./WizardModal').then(m => ({ default: m.WizardModal }))
);
```

**Fallback Component:**
```typescript
<Suspense fallback={<LazyComponentLoading label="Cargando..." />}>
  <GccCompromisosWithSuspense {...props} />
</Suspense>
```

---

## Custom Hooks

### useGccForm

**Propósito:** Gestión del formulario de derivación a GCC

**Returns:**
```typescript
{
  // Estado
  motivo: string;
  objetivos: string[];
  mediadorAsignado: string;
  fechaMediacion: string;
  isLoading: boolean;
  error: string | null;
  
  // Setters
  setMotivo: (value: string) => void;
  setObjetivos: (value: string[]) => void;
  setMediadorAsignado: (value: string) => void;
  setFechaMediacion: (value: string) => void;
  
  // Acciones
  agregarObjetivo: () => void;
  actualizarObjetivo: (index: number, value: string) => void;
  eliminarObjetivo: (index: number) => void;
  reset: () => void;
}
```

**Ejemplo:**
```typescript
const { motivo, setMotivo, agregarObjetivo } = useGccForm();

const handleSubmit = () => {
  setMotivo('Nueva descripción');
  agregarObjetivo();
};
```

---

### useGccDerivacion

**Propósito:** Lógica de derivación a GCC

**Returns:**
```typescript
{
  crear: (payload: DerivacionPayload) => Promise<Mediacion>;
  validar: (expedienteId: string) => Promise<ValidacionResult>;
  isLoading: boolean;
  error: Error | null;
}
```

---

### useGccCierre

**Propósito:** Lógica de cierre de mediación

**Returns:**
```typescript
{
  cerrar: (mediacionId: string, estado: 'LOGRADO' | 'NO_ACUERDO') => Promise<void>;
  destrabar: (mediacionId: string) => Promise<void>;
  generarActa: (mediacionId: string) => Promise<string>;
  isLoading: boolean;
}
```

---

## RPC Functions (Supabase)

### gcc_crear_proceso

**Propósito:** Crear nuevo proceso de GCC

**Request:**
```typescript
{
  expediente_id: string;
  motivo: string;
  objetivos?: string[];
  mediador_asignado: string;
  fecha_mediacion: string;
  mecanismo: 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE' | 'NEGOCIACION';
}
```

**Response:**
```typescript
{
  id: string;
  expediente_id: string;
  estado: 'PROCESO';
  fecha_creacion: string;
  compromisos: Compromiso[];
}
```

---

### gcc_procesar_cierre_completo

**Propósito:** Procesar cierre de mediación

**Request:**
```typescript
{
  mediacion_id: string;
  estado: 'LOGRADO' | 'NO_ACUERDO' | 'DESTRABADO';
  acta?: string;
  motivo_cierre?: string;
}
```

**Response:**
```typescript
{
  mediacion_id: string;
  estado: string;
  timestamp: string;
  acta_id?: string;
}
```

---

### gcc_validar_expediente

**Propósito:** Validar requisitos previos de derivación

**Request:**
```typescript
{
  expediente_id: string;
}
```

**Response:**
```typescript
{
  valido: boolean;
  razon?: string;
  requisitos: {
    tiene_apoderado: boolean;
    plazo_vigente: boolean;
    tipo_falta_compatible: boolean;
  };
}
```

---

### gcc_obtener_dashboard

**Propósito:** Obtener estadísticas de GCC

**Response:**
```typescript
{
  total_procesos: number;
  procesos_activos: number;
  procesos_cerrados_exitosamente: number;
  procesos_destrabados: number;
  promedio_dias_resolucion: number;
  tasa_exito: number;
  procesos: Mediacion[];
}
```

---

## Types & Interfaces

**Ubicación:** `src/types.ts`

```typescript
interface Expediente {
  id: string;
  folio: string;
  estudianteNombre: string;
  estudianteRun: string;
  apoderadoNombre: string;
  falta: {
    tipo: 'LEVE' | 'GRAVE' | 'GRAVÍSIMA';
    descripcion: string;
    fecha: string;
  };
  plazoFatal: string | null;
  estado: 'ABIERTO' | 'DERIVACION_COMPLETADA' | 'CERRADO';
}

interface Mediacion {
  id: string;
  expedienteId: string;
  estado: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO' | 'DESTRABADO';
  mecanismo: 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE' | 'NEGOCIACION';
  fechaInicio: string;
  mediador: string;
  compromisos: Compromiso[];
}

interface Compromiso {
  id: string;
  descripcion: string;
  fechaCumplimiento: string;
  responsable: string;
  completado: boolean;
}

interface Acta {
  id: string;
  mediacionId: string;
  contenido: string;
  firmada: boolean;
  fechaFirma: string | null;
  historial: ActaEvento[];
}
```

---

## Context API

### ConvivenciaContext

**Propósito:** Contexto global de convivencia escolar

```typescript
interface ConvivenciaContextType {
  expedientes: Expediente[];
  mediaciones: Mediacion[];
  loading: boolean;
  error: Error | null;
  
  // Funciones
  obtenerExpedientes: () => Promise<void>;
  obtenerMediaciones: () => Promise<void>;
  crearExpediente: (data: any) => Promise<void>;
}

const ConvivenciaContext = createContext<ConvivenciaContextType | undefined>(undefined);
```

**Uso:**
```typescript
const { expedientes, mediaciones } = useConvivencia();
```

---

## Utility Functions

### getAlertaPlazo

**Propósito:** Determinar alerta de plazo fatal

```typescript
function getAlertaPlazo(fecha?: string | null): 'OK' | 'T2' | 'T1' | 'VENCIDO'
```

**Returns:**
- `OK` - Más de 2 días
- `T2` - 2 días
- `T1` - 1 día
- `VENCIDO` - Plazo vencido

---

### parseFecha

**Propósito:** Parsear fecha en múltiples formatos

```typescript
function parseFecha(value?: string | null): Date | null
```

**Soporta:**
- ISO: `2025-02-18`
- DD-MM-YY: `18-02-25`

---

## Performance Tips

### 1. Usar Lazy Loading
```typescript
// ✅ Bueno
<Suspense fallback={<Loading />}>
  <GccCompromisosWithSuspense {...props} />
</Suspense>

// ❌ Evitar
import GccCompromisos from './GccCompromisos'; // Siempre cargado
```

### 2. Memoizar Callbacks
```typescript
// ✅ Bueno
const handleClick = useCallback(() => {
  onAction();
}, [onAction]);

// ❌ Evitar
const handleClick = () => onAction(); // Nueva función cada render
```

### 3. Usar useMemo
```typescript
// ✅ Bueno
const isDisabled = useMemo(
  () => !description || !date,
  [description, date]
);

// ❌ Evitar
const isDisabled = !description || !date; // Recalcula cada render
```

---

## Accessibility (A11y)

Todos los componentes cumplen:
- ✅ WCAG 2.1 Level AA
- ✅ Soporte screen readers
- ✅ Navegación keyboard completa
- ✅ Contrastes adecuados
- ✅ Labels y ARIA attributes

---

## Error Handling

### Patrón Try-Catch
```typescript
try {
  await createDerivacion(data);
  showToast('Derivación creada', 'success');
} catch (error) {
  showToast(error.message, 'error');
  console.error('Error:', error);
}
```

### Error Boundaries (Futuro)
```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <GccSalaMediacion {...props} />
</ErrorBoundary>
```

---

## Changelog

### v1.0.0 (2025-02-18)
- ✅ Componentes GCC refactorizados
- ✅ 87 tests pasando
- ✅ Lazy loading implementado
- ✅ Performance optimizado

---

**Última actualización:** 18 de febrero de 2026
**Versión:** 1.0.0
