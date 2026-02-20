# Guía de Integración - Componentes GCC

Este documento explica cómo integrar los nuevos componentes GCC en el proyecto existente.

## Paso 1: Importar los componentes

En el archivo `src/features/mediacion/CentroMediacionGCC.tsx`, agregar los imports:

```tsx
// Imports existentes...
import GccCierreModal from './GccCierreModal';
import GccDashboard from './GccDashboard';
```

## Paso 2: Agregar estados para el modal

En el componente `CentroMediacionGCC`, agregar:

```tsx
// Dentro del componente, agregar estos estados:
const [showCierreModal, setShowCierreModal] = useState(false);
const [showDashboard, setShowDashboard] = useState(true); // Por defecto mostrar dashboard
```

## Paso 3: Agregar el modal y el dashboard

En el return del componente, agregar antes del cierre:

```tsx
{
  showCierreModal && selectedMediacionId && (
    <GccCierreModal
      mediacionId={selectedMediacionId}
      onClose={() => {
        setShowCierreModal(false);
        refreshGccMetrics();
      }}
      onCierreExitoso={(resultado) => {
        toast?.showToast('success', 'GCC', 'Mediación cerrada correctamente');
        refreshGccMetrics();
        // Opcional: actualizar el expediente
      }}
    />
  )
}
```

## Paso 4: Agregar botón para cerrar mediación

Buscar donde se muestra el botón de "Registrar Resultado" y agregar el nuevo botón:

```tsx
<div className="flex space-x-4">
  {/* Botón existente para resultado */}
  <button
    onClick={() => setShowResultadoForm(true)}
    className="..."
  >
    Registrar Resultado
  </button>
  
  {/* Nuevo botón para modal de cierre */}
  {selectedMediacionId && statusGCC === 'PROCESO' && (
    <button
      onClick={() => setShowCierreModal(true)}
      className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
    >
      Cerrar Mediación
    </button>
  )}
</div>
```

## Paso 5: Alternar entre Dashboard y Lista

Agregar un tab o botón para cambiar entre vista de dashboard y lista:

```tsx
<div className="flex mb-4">
  <button
    onClick={() => setShowDashboard(true)}
    className={`px-4 py-2 ${showDashboard ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
  >
    Dashboard
  </button>
  <button
    onClick={() => setShowDashboard(false)}
    className={`px-4 py-2 ${!showDashboard ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
  >
    Lista de Casos
  </button>
</div>

{showDashboard ? (
  <GccDashboard onNavigateToMediacion={(id) => {
    // Navegar a la mediación
    handleSelectCase(id);
    setShowDashboard(false);
  }} />
) : (
  // Contenido existente de la lista de casos
  <div>...</div>
)}
```

## Hooks disponibles para usar en el componente

### useGccCrearProceso
```tsx
const { crearProceso, creando, error } = useGccCrearProceso();

// Usage:
const nuevaMediacionId = await crearProceso(
  expedienteId,
  'MEDIACION', // o 'CONCILIACION', 'ARBITRAJE'
  facilitadorId
);
```

### useGccMediacion
```tsx
const { 
  mediacion,
  estadoActual,
  estaCerrada,
  compromisosPendientes,
  agregarParticipante,
  registrarResultado
} = useGccMediacion(mediacionId);
```

### useGccProcesarCierre
```tsx
const { procesarCierre, procesando, error } = useGccProcesarCierre();

// Usage:
const resultado = await procesarCierre(
  mediacionId,
  'acuerdo_total', // o 'acuerdo_parcial', 'sin_acuerdo'
  'Detalles del acuerdo...',
  [
    { descripcion: 'Compromiso 1', fecha_compromiso: '2026-03-01' }
  ]
);
```

### useGccDashboard
```tsx
const { datos, cargando, error, recargar } = useGccDashboard(establecimientoId);

// datos contiene:
// - datos.estadisticas: totales, resultados, metricas
// - datos.alertas: mediaciones_por_vencer, compromisos_pendientes
// - datos.notificaciones_recientes
```

## Ejemplo: Actualizar handleDerivacionCompleta para usar RPC

```tsx
const handleDerivacionCompleta = async (payload: {...}) => {
  // En lugar de inserts individuales, usar:
  const { crearProceso } = useGccCrearProceso();
  
  const mediacionId = await crearProceso(
    target.dbId,
    mecanismoSeleccionado,
    usuario.id
  );
  
  if (mediacionId) {
    toast?.showToast('success', 'GCC', 'Derivación creada correctamente');
  }
};
```

## Estilos existentes a mantener

El componente actual usa clases de Tailwind como:
- `bg-emerald-600` - Botones principales
- `bg-slate-50` - Fondos de formularios
- `rounded-2xl` - Bordes redondeados
- `shadow-xl` - Sombras

Mantener estos estilos para consistencia visual.
