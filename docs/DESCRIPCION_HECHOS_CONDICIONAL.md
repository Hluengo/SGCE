# Modificación: Guardado Condicional de Campo `descripcion_hechos`

## Resumen de Cambios

Se ha implementado una lógica condicional en la construcción del campo `descripcion_hechos` que se adapta automáticamente según si hay un estudiante B (contraparte) registrado o no.

## Archivos Modificados

### 1. `src/shared/utils/buildDescripcionHechos.ts` (NUEVO)
- **Tipo**: Función utilitaria
- **Propósito**: Centralizar la lógica de construcción condicional de `descripcion_hechos`
- **Funciones exportadas**:
  - `buildDescripcionHechos()`: Valida con strings simples
  - `buildDescripcionHechosFromObject()`: Valida con objetos Estudiante

### 2. `src/shared/utils/index.ts`
- Añadido export de la nueva función utilitaria

### 3. `src/features/expedientes/ExpedienteWizard.tsx`
- **Línea 9**: Añadido import de `buildDescripcionHechos`
- **Línea 125-142**: Refactorizado `onSubmit()` para:
  - Usar `buildDescripcionHechos()` para construir la descripción
  - Hacer que `actoresResumen` sea condicional (solo si hay estudiante B)
  - Guardar `descripcion_hechos` sin estructura si no hay estudiante B

## Comportamiento Después de los Cambios

### Caso 1: Con Estudiante B Registrado
```
Entrada:
- Estudiante A: "Juan García" (curso: "4° Medio A")
- Estudiante B: "María López" (curso: "4° Medio A")
- Hecho: "Pelea con compañero de manera verbal, profiriendo palabras soeces."

Salida guardada en `descripcion_hechos`:
"Actores involucrados: A) Juan García (4° Medio A) | B) María López (4° Medio A)
Pelea con compañero de manera verbal, profiriendo palabras soeces."
```

### Caso 2: SIN Estudiante B (campo vacío)
```
Entrada:
- Estudiante A: "Juan García" (curso: "4° Medio A")
- Estudiante B: (vacío/no registrado)
- Hecho: "Pelea con compañero de manera verbal, profiriendo palabras soeces."

Salida guardada en `descripcion_hechos`:
"Pelea con compañero de manera verbal, profiriendo palabras soeces."
```

## Lógica de Validación

La función `buildDescripcionHechos()` evalúa:
1. Si `actorBNombre` existe Y tiene contenido (trim.length > 0)
2. Si es `true`: Construye estructura "Actores involucrados: A) ... | B) ..."
3. Si es `false`: Devuelve únicamente el hecho sin estructura

## Aplicación en el Sistema

### ✅ Implementado en:
- **Creación de nuevos expedientes**: `ExpedienteWizard.tsx` → formulario paso 5
  - El asistente verifica automáticamente si hay:
    - Estudiante A (obligatorio)
    - Estudiante B (opcional)

### Nota Importante:
El campo `estudiante_b_id` en la tabla `expedientes` sigue existiendo y se guarda normalmente. La modificación solo afecta a la presentación/estructura del campo `descripcion_hechos`.

## Validación y Testing

```bash
# El build pasó exitosamente:
✓ 1926 modules transformed
✓ ExpedienteWizard size: 26.86 kB
✓ No TypeScript errors
✓ Build time: 4.65s
```

## Ejemplo de Integración - Paso 3 del Wizard

El usuario llena el formulario:
```
Paso 3: Hechos
├─ Estudiante A: Juan García (automático del Paso 1)
├─ Estudiante B: [selector] → María López o [vacío]
├─ Fecha: 2025-02-18
├─ Hora: 14:30
├─ Lugar: Patio central
└─ Narrativa: "Discusión que escaló a golpes"
```

Resultado en BD:
- Si María fue seleccionada:
  ```
  descripcion_hechos = "Actores involucrados: A) Juan García (4° Medio A) | B) María López (4° Medio B)
  Discusión que escaló a golpes"
  ```
- Si NO fue seleccionada:
  ```
  descripcion_hechos = "Discusión que escaló a golpes"
  ```

## Próximos Pasos (Si es Necesario)

Si hay otros formularios o módulos que también crean expedientes/incidentes:
1. Buscar donde se construye `descripcion_hechos`
2. Reemplazar con `buildDescripcionHechos(actorA, cursoA, actorB, cursoB, hecho)`
3. Asegurar que `estudiante_b_id` sea opcional

## Notas de Implementación

- ✅ La lógica es **reusable** en múltiples formularios
- ✅ Evita **repetir código** de construcción condicional
- ✅ **Type-safe** con TypeScript
- ✅ La función valida **null/undefined** automáticamente
- ✅ No rompe cambios existentes en RLS policies o triggers

