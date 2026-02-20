---
title: Quick Integration Guide - GCC Panel Router
version: 1.0
status: READY TO USE
---

# 🚀 Guía Rápida de Integración - GCC Panel Router

## Punto Actual

✅ **Paneles creados y listos**
- 4 componentes específicos por mecanismo
- 1 router que coordina todo
- Exports actualizados en `components/index.ts`

❌ **Falta integración en CentroMediacionGCC.tsx**
- Todavía usa `GccSalaMediacion` genérico
- Necesita conectar el router

---

## Integración en 3 Pasos

### Step 1: Actualizar Imports (Top of file)

**ANTES:**
```typescript
import { 
  GccSalaMediacion,
  GccCompromisos,
  GccResolucion 
} from '@/features/mediacion/components';
```

**DESPUÉS:**
```typescript
import { 
  GccPanelRouter,
  GccCompromisos,
  GccResolucion,
  type MecanismoGCC
} from '@/features/mediacion/components';
```

### Step 2: Reemplazar Componente

**BUSCAR** (en el render del componente):
```jsx
<GccSalaMediacion
  // ... props actuales
/>
```

**REEMPLAZAR POR:**
```jsx
<GccPanelRouter
  mecanismo={mecanismoSeleccionado as MecanismoGCC}
  caso={currentCaso}
  userRole={getUserRole()} // Obtener del auth/context
  
  // Estado común
  estado={estadoActa}
  onEstadoChange={setEstadoActa}
  
  // Compromisos - Igual que antes
  compromisos={compromisos}
  nuevoCompromiso={nuevoCompromiso}
  onNuevoCompromisoChange={handleNuevoCompromisoChange}
  onAgregarCompromiso={handleAgregarCompromiso}
  onEliminarCompromiso={handleEliminarCompromiso}
  onToggleMarcaCompromiso={handleToggleMarcaCompromiso}
  
  // Negociación
  facilitadorApoyo={datosNegociacion.facilitador}
  onFacilitadorApoyoChange={(v) => setDatosNegociacion({...datosNegociacion, facilitador: v})}
  horaInicio={datosNegociacion.horaInicio}
  onHoraInicioChange={(v) => setDatosNegociacion({...datosNegociacion, horaInicio: v})}
  horaCierre={datosNegociacion.horaCierre}
  onHoraCierreChange={(v) => setDatosNegociacion({...datosNegociacion, horaCierre: v})}
  acuerdoAlcanzado={datosNegociacion.acuerdo}
  onAcuerdoChange={(v) => setDatosNegociacion({...datosNegociacion, acuerdo: v})}
  detallesAcuerdo={datosNegociacion.detalles}
  onDetallesAcuerdoChange={(v) => setDatosNegociacion({...datosNegociacion, detalles: v})}
  
  // Mediación
  mediador={datosMediacion.mediador}
  onMediadorChange={(v) => setDatosMediacion({...datosMediacion, mediador: v})}
  fechaMediacion={datosMediacion.fecha}
  onFechaMediacionChange={(v) => setDatosMediacion({...datosMediacion, fecha: v})}
  firmaEstudiante1={datosMediacion.firmaEst1}
  firmaEstudiante2={datosMediacion.firmaEst2}
  firmaMediador={datosMediacion.firmaMediador}
  
  // Conciliación
  conciliador={datosConciliacion.conciliador}
  onConciliadorChange={(v) => setDatosConciliacion({...datosConciliacion, conciliador: v})}
  fechaConciliacion={datosConciliacion.fecha}
  onFechaConciliacionChange={(v) => setDatosConciliacion({...datosConciliacion, fecha: v})}
  propuestaConciliador={datosConciliacion.propuesta}
  onPropuestaConciliadorChange={(v) => setDatosConciliacion({...datosConciliacion, propuesta: v})}
  propuestaAceptada={datosConciliacion.propuestaAceptada}
  onPropuestaAceptadaChange={(v) => setDatosConciliacion({...datosConciliacion, propuestaAceptada: v})}
  firmaConciliador={datosConciliacion.firmaConciliador}
  
  // Arbitraje
  arbitro="Director del Establecimiento"
  resolucionArbitro={datosArbitraje.resolucion}
  onResolucionArbitroChange={(v) => setDatosArbitraje({...datosArbitraje, resolucion: v})}
  entiendeVinculancia={datosArbitraje.entiende}
  onEntiendeVinculanciaChange={(v) => setDatosArbitraje({...datosArbitraje, entiende: v})}
  firmaArbitro={datosArbitraje.firma}
  
  // Acciones comunes
  onGenerarActa={handleGenerarActa}
  onCerrarExpediente={handleCerrarExpediente}
/>
```

### Step 3: Setup de Estado (Antes del componente)

```typescript
// Estado común
const [estadoActa, setEstadoActa] = useState<'PROCESO' | 'LOGRADO' | 'NO_ACUERDO'>('PROCESO');

// Negociación
const [datosNegociacion, setDatosNegociacion] = useState({
  facilitador: '',
  horaInicio: '',
  horaCierre: '',
  acuerdo: false,
  detalles: ''
});

// Mediación
const [datosMediacion, setDatosMediacion] = useState({
  mediador: '',
  fecha: '',
  firmaEst1: false,
  firmaEst2: false,
  firmaMediador: false
});

// Conciliación
const [datosConciliacion, setDatosConciliacion] = useState({
  conciliador: '',
  fecha: '',
  propuesta: '',
  propuestaAceptada: null as boolean | null,
  firmaConciliador: false
});

// Arbitraje
const [datosArbitraje, setDatosArbitraje] = useState({
  resolucion: '',
  entiende: false,
  firma: false
});
```

---

## Validación Rápida

### Test que Mecanismo Selecciona Panel Correcto

```typescript
// En CentroMediacionGCC.tsx
const mecanismoSeleccionado = 'CONCILIACION';
// El router debe mostrar GccConciliacionPanel (púrpura)

const mecanismoSeleccionado = 'ARBITRAJE_PEDAGOGICO';
const userRole = 'DIRECTOR';
// El router debe mostrar GccArbitrajePanel completo

const mecanismoSeleccionado = 'ARBITRAJE_PEDAGOGICO';
const userRole = 'FACILITADOR';
// El router debe mostrar "Acceso Restringido"
```

### Prueba Manual de Props

Cada panel debe recibir estos props:

| Panel | Props Requeridos |
|-------|------------------|
| Negociación | `caso`, `estado`, `facilitadorApoyo`, `horaInicio`, `horaCierre` |
| Mediación | `caso`, `estado`, `mediador` (no vacío), `fechaMediacion` |
| Conciliación | `caso`, `estado`, `conciliador`, `propuestaConciliador`, `propuestaAceptada` |
| Arbitraje | `caso`, `estado`, `userRole='DIRECTOR'`, `resolucionArbitro`, `entiendeVinculancia` |

---

## Errores Comunes & Soluciones

### Error 1: "GccPanelRouter is not exported"
**Solución:** Verificar que `components/index.ts` incluya la línea:
```typescript
export { GccPanelRouter, type MecanismoGCC } from './GccPanelRouter';
```

### Error 2: "Element implicitly has an 'any' type"
**Solución:** Añadir type cast:
```typescript
mecanismo={mecanismoSeleccionado as MecanismoGCC}
```

### Error 3: Panel muestra "Acceso Restringido" en Arbitraje
**Causa:** `userRole !== 'DIRECTOR'`
**Solución:** Verificar que el usuario actual tiene rol DIRECTOR

### Error 4: Botón "Generar Acta" deshabilitado en Conciliación
**Causa:** `propuesta` vacía o `propuestaAceptada = null`
**Solución:** Llenar propuesta y seleccionar Aceptan/Rechazan

### Error 5: Botón "Generar Acta" deshabilitado en Arbitraje
**Causa:** Falta marcar checkbox "Confirmo vinculancia"
**Solución:** Usuario debe hacer click en el checkbox

---

## Checklist de Pruebas Post-Integración

```
[ ] Importar GccPanelRouter exitosamente
[ ] Compilar sin errores (npm run build)
[ ] Cambiar mecanismo → Cambiar panel visual
[ ] Negociación → Muestra facilitador + horas
[ ] Mediación → Muestra mediador (obligatorio)
[ ] Conciliación → Muestra propuesta (obligatoria)
[ ] Arbitraje → Si no DIRECTOR, muestra error
[ ] Arbitraje → Si DIRECTOR, muestra resolución + checkbox
[ ] Cambiar estado → Refleja en botones
[ ] Llenar todos los campos → Botón "Generar Acta" habilitado
[ ] Tests siguen en 128/128 ✅
```

---

## Code Review Checklist

Si integras en un PR, verificar:

✅ Imports actualizados
✅ Props conectados correctamente
✅ Estado inicializado
✅ Handlers de cambio implementados
✅ No errores de TypeScript
✅ No errores de compilación
✅ Tests pasando (al menos los 128 existentes)
✅ Manejo de estados fallover (mecanismo desconocido)

---

## Ubicaciones de Archivos

```
📂 src/features/mediacion/components/
├── GccNegociacionPanel.tsx        ✅ Listo
├── GccMediacionPanel.tsx          ✅ Listo
├── GccConciliacionPanel.tsx       ✅ Listo
├── GccArbitrajePanel.tsx          ✅ Listo
├── GccPanelRouter.tsx             ✅ Listo (coordinador)
├── CentroMediacionGCC.tsx         ⏳ Pendiente: Integración
├── index.ts                       ✅ Exports actualizados
```

---

## Próximo Paso

Cuando estés listo para integrar, ejecuta estos comandos:

```bash
# 1. Verificar que los archivos existen
ls src/features/mediacion/components/Gcc*Panel*.tsx

# 2. Integrar cambios en CentroMediacionGCC.tsx
# (Reemplazar GccSalaMediacion con GccPanelRouter)

# 3. Compilar
npm run build

# 4. Tests
npm test -- --run

# 5. Si todo OK → commit
git add src/features/mediacion/components/
git commit -m "feat: Integrate GCC Panel Router (Phase 8)"
```

---

**Status:** 🟢 READY FOR INTEGRATION
**Complexity:** ⚡ Low - Simple replacement
**Impact:** ✨ High - Enables mechanism-specific UI
