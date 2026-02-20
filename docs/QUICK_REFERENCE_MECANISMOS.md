# ⚡ Quick Reference: Dónde encontrar cada mecanismo en el código

## 🎯 Ubicación Rápida

### 1️⃣ DEFINICIÓN DE TIPOS
**Archivo**: `src/shared/hooks/useGccForm.ts:14`
```typescript
export type MecanismoGCC = 
  | 'MEDIACION' 
  | 'CONCILIACION' 
  | 'ARBITRAJE_PEDAGOGICO' 
  | 'NEGOCIACION_ASISTIDA';
```

### 2️⃣ UI: SELECTOR MECANISMO
**Archivo**: `src/features/mediacion/CentroMediacionGCC.tsx:217-226`
```tsx
<select value={mecanismo} onChange={(e) => onMecanismoChange(e.target.value as MecanismoGCC)}>
  <option value="MEDIACION">Mediacion (formal)</option>
  <option value="CONCILIACION">Conciliacion (formal)</option>
  <option value="ARBITRAJE_PEDAGOGICO">Arbitraje Pedagogico (formal)</option>
  <option value="NEGOCIACION_ASISTIDA">Negociacion Asistida (gestion previa)</option>
</select>
```
🔗 **Componente**: `DerivacionForm` (línea 122)

### 3️⃣ ALMACENAMIENTO EN BD
**Archivo**: `src/shared/hooks/useGccDerivacion.ts:85`
```typescript
await supabase.rpc('gcc_crear_proceso', {
  p_tipo_mecanismo: mecanismoFinal,  // ← SE GUARDA AQUÍ
  // ...
})
```
⚠️ **Problema**: NEGOCIACION_ASISTIDA se convierte a MEDIACION (línea 79)

### 4️⃣ ESTADO CENTRAL
**Archivo**: `src/shared/hooks/useGccForm.ts:31`
```typescript
export interface GccFormState {
  mecanismoSeleccionado: MecanismoGCC;
}
```

**Acceso desde componentes:**
```typescript
const { mecanismoSeleccionado } = gccState;  // En CentroMediacionGCC
```

### 5️⃣ LABELS/DESCRIPCIONES
**Archivo**: `src/features/mediacion/CentroMediacionGCC.tsx:50-53`
```typescript
const mecanismoLabel: Record<MecanismoGCC, string> = {
  MEDIACION: 'Mediacion',
  CONCILIACION: 'Conciliacion',
  ARBITRAJE_PEDAGOGICO: 'Arbitraje Pedagogico',
  NEGOCIACION_ASISTIDA: 'Negociacion Asistida'
};
```

### 6️⃣ ACTAS GENERADAS POR MECANISMO
**Archivo**: `src/features/mediacion/CentroMediacionGCC.tsx:693-699`
```typescript
const tipoActa = 
  mecanismoSeleccionado === 'MEDIACION'
    ? 'ACTA_MEDIACION'
    : mecanismoSeleccionado === 'CONCILIACION'
      ? 'ACTA_CONCILIACION'
      : mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO'
        ? 'ACTA_ARBITRAJE'
        : 'ACTA_MEDIACION';
```

### 7️⃣ FLUJO DERIVACIÓN
**Archivo**: `src/shared/hooks/useGccDerivacion.ts:56-162`
```typescript
export async function handleDerivacionCompleta(
  expediente: any, 
  payload: DerivacionPayload  // ← Incluye mecanismo
): Promise<DerivacionResult> {
  // Línea 79: ⚠️ Conversión problemática
  // Línea 85: Llamada RPC
}
```

### 8️⃣ FORMULARIO DERIVACIÓN
**Archivo**: `src/features/mediacion/CentroMediacionGCC.tsx:122-330`
```typescript
const DerivacionForm: React.FC<DerivacionFormProps> = ({
  mecanismo,
  onMecanismoChange,  // Callback para actualizar mecanismo
  // ...
})
```

### 9️⃣ CIERRE Y ACTAS
**Archivo**: `src/features/mediacion/GccCierreModal.tsx:1-651`
```typescript
// Renderiza UI según mecanismo (sin diferenciación real actualmente)
// Genera acta en GccCierreModal
```

### 🔟 CONTEXTO CONVIVENCIA
**Archivo**: `src/shared/context/ConvivenciaContext.tsx`
```typescript
// Almacena expedientes que llegan a GCC
expedientes.filter(e => e.etapa === 'INVESTIGACION')
```

---

## 🏗️ Arquitectura Actual de Integración

```
USER INTERFACE
    │
    ├─→ DerivacionForm (selecciona mecanismo) [CentroMediacionGCC.tsx:217]
    │
ESTADO & LÓGICA
    │
    ├─→ useGccForm (almacena mecanismo) [useGccForm.ts]
    │
    ├─→ useGccDerivacion (procesa) [useGccDerivacion.ts:75-82]
    │   └─→ ⚠️ Convierte NEGOCIACION → MEDIACION
    │
    ├─→ supabase.rpc('gcc_crear_proceso') [useGccDerivacion.ts:85]
    │   └─→ p_tipo_mecanismo: mecanismoFinal
    │
ALMACENAMIENTO
    │
    └─→ BD: mediaciones_gcc_v2.tipo_mecanismo
        
PRESENTACIÓN
    │
    ├─→ GccSalaMediacion (formulario estándar) [CentroMediacionGCC.tsx:889]
    │   └─→ Ignorar mecanismo (no diferencia UI)
    │
CIERRE
    │
    └─→ GccCierreModal (genera acta diferenciada) [GccCierreModal.tsx]
        └─→ tipoActa basado en mecanismo [CentroMediacionGCC.tsx:693]
```

---

## 🚀 Cómo Extender: Checklist

### Para agregar lógica diferenciada a ARBITRAJE_PEDAGOGICO:

- [ ] 1. Crear `src/shared/hooks/useGccArbitraje.ts`
- [ ] 2. Crear `src/features/mediacion/components/GccArbitrajePanel.tsx`
- [ ] 3. Agregar validación de permisos (solo Director)
- [ ] 4. En `CentroMediacionGCC.tsx` línea 889, agregar:
  ```tsx
  {mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO' && <GccArbitrajePanel />}
  ```
- [ ] 5. Crear template acta: `src/features/documentos/templates/ActaArbitraje.ts`
- [ ] 6. Agregar RLS policy en Supabase para restringir a director
- [ ] 7. Crear tests E2E en `GCC.advanced.e2e.spec.ts`

### Para mantener NEGOCIACION distinto:

- [ ] 1. En `useGccDerivacion.ts` línea 79, COMENTAR la conversión
- [ ] 2. Crear `useGccNegociacion.ts` - sin acta formal
- [ ] 3. Crear `GccNegociacionPanel.tsx` - interfaz interactiva
- [ ] 4. Agregar timer/cronómetro para negociación directa
- [ ] 5. No generar acta, solo registro de intento

---

## 📊 Matriz: Quién Usa Cada Mecanismo

| Código | Define | Usa | Diferencia |
|--------|--------|-----|-----------|
| `useGccForm.ts` | ✅ tipos | ❌ no procesa | - |
| `useGccDerivacion.ts` | - | ✅ convierte | ⚠️ NEGOCIACION→MEDIACION |
| `CentroMediacionGCC.tsx` | ✅ labels | ✅ selector | ✅ tipoActa diferencia |
| `GccSalaMediacion.tsx` | - | ❌ ignora | ❌ UI estándar para todos |
| `GccCierreModal.tsx` | - | ✅ usa | ✅ acta diferenciada |
| `DerivacionForm.tsx` | - | ✅ selector | ✅ permite elegir |

---

## 🔍 Grep Commands para buscar cada mecanismo

```bash
# Todos los usos de mecanismos:
grep -r "MEDIACION\|CONCILIACION\|ARBITRAJE\|NEGOCIACION" src/

# Solo ARBITRAJE:
grep -r "ARBITRAJE_PEDAGOGICO" src/

# Conversiones problemáticas:
grep -r "NEGOCIACION_ASISTIDA\|mecanismoFinal" src/

# Diferenciación por tipo:
grep -r "tipoActa\|tipo_mecanismo\|mecanismoSeleccionado" src/

# RPC calls:
grep -r "gcc_crear_proceso\|gcc_actualizar_consentimiento" src/
```

---

## 🎓 Ejemplo: Usar mecanismo en un componente nuevo

```typescript
// En cualquier componente GCC:

import { useConvivencia } from '@/shared/context/ConvivenciaContext';

function MiComponente() {
  const { /* ... */ } = useConvivencia();
  
  // Acceder desde CentroMediacionGCC que tiene gccState
  
  function procesarPorMecanismo(mecanismo: MecanismoGCC) {
    switch(mecanismo) {
      case 'MEDIACION':
        console.log('Renderizar panel mediación');
        break;
      case 'CONCILIACION':
        console.log('Renderizar panel conciliación');
        break;
      case 'ARBITRAJE_PEDAGOGICO':
        console.log('Renderizar panel arbitraje (solo director)');
        validarDirector();
        break;
      case 'NEGOCIACION_ASISTIDA':
        console.log('Renderizar panel negociación');
        mostrarTimerNegociacion();
        break;
    }
  }
  
  return <div>{/* ... */}</div>;
}
```

---

## 🐛 Bugs Conocidos

| Situación | Ubicación | Problema | Solución |
|-----------|-----------|----------|----------|
| NEGOCIACION_ASISTIDA | useGccDerivacion.ts:79 | Se convierte a MEDIACION | Comentar línea 79 |
| Sin diferenciación UI | GccSalaMediacion.tsx | Todas usan mismo formulario | Crear componentes específicos |
| sin validación Director | CentroMediacionGCC.tsx | ARBITRAJE puede usarlo cualquiera | Agregar auth check |
| Sin timer negociación | GccNegociacionPanel | No existe | Crear componente con timer |

---

## 📈 Progreso Actual

```
✅ Definición tipos: 100%
✅ Selector UI: 100%
⚠️  Almacenamiento: 80% (NEGOCIACION→MEDIACION)
❌ Lógica diferenciada: 0%
⚠️  Validaciones: 20% (solo selector)
✅ Actas diferenciadas: 70% (está en código)
❌ Permisos granulares: 0%
❌ Tests por mecanismo: 0%
```

**Score General**: 37% integración completa

---

## 🎯 Próximo Sprint

1. **Arreglar NEGOCIACION_ASISTIDA** (15 min)
   - Comentar línea 79 en useGccDerivacion.ts
   - Mantener como NEGOCIACION en BD

2. **Crear componente GccArbitrajePanel** (1 hora)
   - Solo para rol director
   - Validación de permisos
   - Adversencia: "DECISIÓN VINCULANTE"

3. **Agregar validación de rol** (30 min)
   - En GccCierreModal, validar director si es arbitraje

4. **Tests básicos** (1 hora)
   - E2E test para cada mecanismo

