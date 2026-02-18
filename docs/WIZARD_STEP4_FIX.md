# Fix: Navegación Automática en Paso 4 del Wizard

## Problema
El wizard de expedientes avanza automáticamente desde el Paso 4 (Plazos/Cronograma Legal) al Paso 5 aproximadamente 1 segundo después de montar el componente, sin intervención del usuario.

## Análisis Realizado

### Posibles Fuentes del Problema
1. **Auto-click del navegador**: Algunos navegadores generan clicks automáticos en elementos interactivos
2. **React strict mode**: En desarrollo, React ejecuta efectos twice, causando comportamiento inesperado
3. **State update en useEffect**: Algún efecto que dispara navegación automáticamente
4. **Eventos de focus/autofill**: Elementos de formulario que disparan eventos automáticamente
5. **Librería de calendario**: El componente de plazos legales puede generar eventos inesperados

### Diagnóstico
El usuario identificó que es un **click real** (no programación de setTimeout/setInterval), confirmado por:
- Aparece en el stack trace como `executeDispatch` → `handleNext`
- Ocurre aproximadamente 1 segundo después de montar el componente
- Solo sucede en el Paso 4, no en otros pasos

## Solución Implementada

Se implementó un sistema de **múltiples capas de protección**:

### Capa 1: Detección de Auto-click (Nueva)
```typescript
const mountTimeRef = useRef<number>(Date.now());
const step4InitialRef = useRef<boolean>(step === 4);

// En handleNext:
if (step4InitialRef.current && (now - mountTimeRef.current < 2000)) {
  console.warn('[Wizard] 🚫 Navegación bloqueada - posible auto-click detectado');
  return;
}
```
- **Qué hace**: Detecta si el componente se montó en paso 4 Y el usuario intenta avanzar muy pronto (< 2 segundos)
- **Por qué funciona**: El auto-click ocurre ~1s después del mount, lo cual será bloqueado
- **Limitación**: Solo aplica cuando se inicia directamente en paso 4

### Capa 2: Tiempo Mínimo de Espera (Existente)
```typescript
const step4MinTimeElapsed = useRef(false);

useEffect(() => {
  const timer = setTimeout(() => {
    step4MinTimeElapsed.current = true;
  }, 2000);
  return () => clearTimeout(timer);
}, [step]);

// En handleNext:
if (step === 4 && !step4MinTimeElapsed.current) {
  setSubmitError('Por favor, revisa la información del Paso 4 (espera 2 segundos).');
  return;
}
```
- **Qué hace**: Requiere que pasen al menos 2 segundos antes de permitir navegación
- **Mensaje al usuario**: "Por favor, revisa la información del Paso 4 (espera 2 segundos)."

### Capa 3: Interacción Requerida (Existente)
```typescript
const [hasInteractedWithStep4, setHasInteractedWithStep4] = useState(false);

// El componente del paso 4 debe llamar:
// setHasInteractedWithStep4(true) al hacer click en elementos

// En handleNext:
if (step === 4 && !hasInteractedWithStep4) {
  setSubmitError('Por favor, haz click en el contenido del Paso 4 para continuar.');
  return;
}
```
- **Qué hace**: Requiere que el usuario interactúe con el contenido del paso 4
- **Mensaje al usuario**: "Por favor, haz click en el contenido del Paso 4 para continuar."

## Flujo de Protección Completo

```
Usuario entra al Wizard en Paso 4
        ↓
    ~1s después: Auto-click automático
        ↓
    [BLOQUEADO] Capa 1: Detección de auto-click (< 2s desde mount)
        ↓
    Usuario lee el contenido (~2+ segundos)
        ↓
    [BLOQUEADO] Capa 2: Tiempo mínimo no transcurrido aún
        ↓
    Pasan 2+ segundos, timer habilita step4MinTimeElapsed
        ↓
    Usuario hace click en el contenido
        ↓
    [BLOQUEADO] Capa 3: hasInteractedWithStep4 aún false
        ↓
    Usuario hace click en "Siguiente"
        ↓
    ✓ PASA: Todas las validaciones cumplidas
        ↓
    Navega al Paso 5
```

## Estado de la Solución
- **Implementado**: ✓ Sistema de múltiples capas de protección
- **Probando**: Requiere verificación por el usuario
- **Logging**: Se agregaron console.logs para debug en consola del navegador

## Archivos Modificados
- `src/features/expedientes/ExpedienteWizard.tsx`
  - Agregado `mountTimeRef` y `step4InitialRef` para detección de auto-click
  - Verificación de tiempo en `handleNext()` antes de permitir navegación

## Recomendaciones de Prueba
1. Crear un nuevo expediente y llegar al Paso 4
2. Observar la consola del navegador para mensajes de debug
3. Verificar que el auto-click ya no avanza automáticamente
4. Verificar que después de 2 segundos y hacer click en el contenido, el botón "Siguiente" funciona normalmente
