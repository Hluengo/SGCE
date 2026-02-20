# 🔧 Integración de Mecanismos GCC - Guía Técnica

## 📋 Resumen de los 4 Mecanismos

```
NEGOCIACION_ASISTIDA  →  MEDIACION  →  CONCILIACION  →  ARBITRAJE_PEDAGOGICO
(Gestión previa)      (formal)       (formal)           (formal - decisivo)
```

| Mecanismo | Rol | Estado | Decisión | RLS | Circular |
|-----------|-----|--------|----------|-----|----------|
| **NEGOCIACIÓN** | Las partes negocia directamente | Gestión previa | Acuerdo de partes | Público | 781 |
| **MEDIACIÓN** | Facilitador neutral asiste | Formal (5 días hábiles) | Acuerdo asistido | Formal | 782 |
| **CONCILIACIÓN** | Facilitador propone soluciones | Formal (5 días hábiles) | Acuerdo con propuesta | Formal | 782 |
| **ARBITRAJE** | Director decide acuerdo | Formal (5 días hábiles) | Vinculante | Vinculante | 782 |

---

## 🌳 Dónde está definido cada mecanismo

### 1️⃣ Definición de Tipos

**Archivo**: `src/shared/hooks/useGccForm.ts` (línea 14)

```typescript
export type MecanismoGCC = 
  | 'MEDIACION' 
  | 'CONCILIACION' 
  | 'ARBITRAJE_PEDAGOGICO' 
  | 'NEGOCIACION_ASISTIDA';
```

### 2️⃣ Labels y Descripciones

**Archivo**: `src/features/mediacion/CentroMediacionGCC.tsx` (línea 50-53)

```typescript
const mecanismoLabel: Record<MecanismoGCC, string> = {
  MEDIACION: 'Mediacion',
  CONCILIACION: 'Conciliacion',
  ARBITRAJE_PEDAGOGICO: 'Arbitraje Pedagogico',
  NEGOCIACION_ASISTIDA: 'Negociacion Asistida'
};
```

### 3️⃣ Selector de Mecanismo

**Archivo**: `src/features/mediacion/CentroMediacionGCC.tsx` (línea 220-225)

En el componente `DerivacionForm`:

```tsx
<select value={mecanismo} onChange={(e) => onMecanismoChange(e.target.value as MecanismoGCC)}>
  <option value="MEDIACION">Mediacion (formal)</option>
  <option value="CONCILIACION">Conciliacion (formal)</option>
  <option value="ARBITRAJE_PEDAGOGICO">Arbitraje Pedagogico (formal)</option>
  <option value="NEGOCIACION_ASISTIDA">Negociacion Asistida (gestion previa)</option>
</select>
```

---

## 🔗 Cómo se integran actualmente

### Flujo 1: Derivación a GCC

**Archivo**: `src/shared/hooks/useGccDerivacion.ts` (línea 75-82)

```typescript
const mecanismoFinal =
  payload.mecanismoSeleccionado === 'NEGOCIACION_ASISTIDA'
    ? 'MEDIACION'  // ⚠️ Se convierte a MEDIACION
    : payload.mecanismoSeleccionado;

// Luego se envía a RPC:
const { data: procesoData, error: rpcError } = await supabase.rpc(
  'gcc_crear_proceso',
  {
    p_tipo_mecanismo: mecanismoFinal,
    // ... otros parámetros
  }
);
```

**Problema**: NEGOCIACION_ASISTIDA siempre se convierte a MEDIACION. No hay diferenciación real.

### Flujo 2: Generación de Actas

**Archivo**: `src/features/mediacion/CentroMediacionGCC.tsx` (línea 693-699)

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

**✅ Aquí SÍ se diferencia**

---

## 🛠️ Cómo extender cada mecanismo

### Patrón de Extensión

Para que cada mecanismo tenga comportamiento único, necesitas:

1. **Lógica diferenciada en el hook** (validación, flujo)
2. **Componente UI específico** (formulario, campos extra)
3. **Acta/plantilla diferenciada** 
4. **Permisos/RLS específicos**

---

## 📝 Ejemplo: Extender ARBITRAJE_PEDAGOGICO

### Paso 1: Crear Hook Específico

**Archivo nuevo**: `src/shared/hooks/useGccArbitraje.ts`

```typescript
export function useGccArbitraje() {
  const handleArbitrajeCompleto = async (mediacionId: string, payload: {
    decision: string;
    justificacion: string;
    vinculante: boolean;
    notificadoApoderado: boolean;
  }) => {
    // Lógica específica para arbitraje
    // 1. Validar que sea Director quién toma decisión
    // 2. Registrar decisión como VINCULANTE
    // 3. Generar ACTA_ARBITRAJE especial
    // 4. Notificar a apoderados automáticamente
  };

  return { handleArbitrajeCompleto };
}
```

### Paso 2: Crear Componente UI

**Archivo nuevo**: `src/features/mediacion/components/GccArbitrajePanel.tsx`

```typescript
export const GccArbitrajePanel: React.FC<{
  mediacionId: string;
  casoSeleccionado: Expediente | null;
}> = ({ mediacionId, casoSeleccionado }) => {
  const [decision, setDecision] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [vinculante, setVinculante] = useState(true);

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
      <h3 className="text-lg font-bold text-red-900">
        Decisión de Arbitraje (VINCULANTE)
      </h3>
      
      {/* Campo de decisión */}
      <textarea
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
        placeholder="Decisión arbitral..."
        className="w-full p-3 border rounded-lg mt-4"
      />

      {/* Checkbox vinculante */}
      <label className="flex items-center mt-4">
        <input 
          type="checkbox"
          checked={vinculante}
          onChange={(e) => setVinculante(e.target.checked)}
          disabled
        />
        <span className="ml-2 font-bold text-red-800">
          Esta decisión es VINCULANTE para todas las partes
        </span>
      </label>

      {/* Validación de permisos */}
      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
        <p className="text-sm font-bold text-yellow-800">
          ⚠️ Solo Directores pueden ejecutar arbitraje
        </p>
      </div>
    </div>
  );
};
```

### Paso 3: Integrar en CentroMediacionGCC

**Archivo**: `src/features/mediacion/CentroMediacionGCC.tsx` (agregar en renderizado)

```typescript
// En el renderizado condicional por mecanismo:

{mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO' && (
  <GccArbitrajePanel
    mediacionId={selectedMediacionId}
    casoSeleccionado={casoSeleccionado}
  />
)}
```

### Paso 4: Crear Plantilla Acta Específica

**Archivo nuevo**: `src/features/documentos/templates/ActaArbitraje.ts`

```typescript
export function generateActaArbitraje(data: {
  mediacionId: string;
  decision: string;
  justificacion: string;
  participantes: string[];
}) {
  return `
    ACTA DE ARBITRAJE PEDAGÓGICO

    PARA CONSTANCIA DE LO ANTERIOR y en cumplimiento de los Circular 782 del MINEDUC,
    se deja CONSTANCIA que la autoridad ha emitido la siguiente decisión:

    DECISIÓN ARBITRAL (VINCULANTE):
    ${data.decision}

    JUSTIFICACIÓN:
    ${data.justificacion}

    Esta decisión es de cumplimiento obligatorio para todas las partes.
  `;
}
```

---

## 🎯 Diferenciación actual vs propuesta

### Actual (sin diferenciación)

```
NEGOCIACION → MEDIACION  
CONCILIACION → MEDIACION
ARBITRAJE → MEDIACION  (con diferente acta)
```

**Problema**: Lógica casi igual para todos

### Propuesta (con diferenciación)

```
┌─────────────────────────────────────────────────┐
│ NEGOCIACION_ASISTIDA (gestión previa)          │
│ - Las partes negocian directo                   │
│ - Facilitador presente pero no propone           │
│ - Sin acta formal                               │
│ - Plazo: flexible                               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ MEDIACION (formal - Circular 782)               │
│ - Facilitador neutral asiste                    │
│ - Propone soluciones si se requiere             │
│ - ACTA_MEDIACION                                │
│ - Plazo: 5 días hábiles (o plazo fatal)        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ CONCILIACION (formal - Circular 782)            │
│ - Facilitador propone soluciones                │
│ - Mayor intervención que mediación              │
│ - ACTA_CONCILIACION                             │
│ - Plazo: 5 días hábiles (o plazo fatal)        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ ARBITRAJE_PEDAGOGICO (decisivo - Circular 782) │
│ - Director emite decisión VINCULANTE            │
│ - No se negocia, se decide                      │
│ - ACTA_ARBITRAJE                                │
│ - Plazo: 5 días hábiles (o plazo fatal)        │
│ - Notificación obligatoria de apoderados        │
└─────────────────────────────────────────────────┘
```

---

## 📊 Tabla de Diferencias Clave

| Aspecto | Negociación | Mediación | Conciliación | Arbitraje |
|---------|-------------|-----------|--------------|-----------|
| **Rol Facilitador** | Presente, neutral | Asiste, neutral | Propone soluciones | Decide |
| **Acuerdo** | De partes | Asistido | Con propuesta | Vinculante |
| **Acta Requerida** | No formal | Sí | Sí | Sí (especial) |
| **Plazo** | Flexible | 5 días hábiles | 5 días hábiles | 5 días hábiles |
| **Permisos** | Facilitadores | Facilitadores | Facilitadores | Director/Rector |
| **Recurso/Apelación** | Sí | Sí | Sí | No |
| **Vinculante** | No obligatoria | Obligatoria | Obligatoria | Obligatoria |
| **RLS Policy** | `role = 'facilitador'` | `role = 'facilitador'` | `role = 'facilitador'` | `role = 'director'` |

---

## 🚀 Próximos Pasos para Implementar

### Sprint 1: Diferenciación Básica

1. ✅ Extender `useGccDerivacion` para NO convertir NEGOCIACION a MEDIACION
2. ✅ Crear componentes específicos por mecanismo
3. ✅ Implementar RLS policies por mecanismo
4. ✅ Generar actas diferenciadas

### Sprint 2: Flujos Específicos

1. Crear hooks especializados:
   - `useGccNegociacion` - gestión previa sin acta
   - `useGccMediacion` - mediación estándar
   - `useGccConciliacion` - con propuestas de mediador
   - `useGccArbitraje` - decisión vinculante (solo director)

2. Crear componentes UI:
   - `GccNegociacionPanel`
   - `GccMediacionPanel`
   - `GccConciliacionPanel`
   - `GccArbitrajePanel`

### Sprint 3: Validaciones Avanzadas

1. Validar permisos por rol (director solo arbitraje)
2. Implementar workflow: Negociación → Mediación → Conciliación → Arbitraje
3. Restricciones de cambio de mecanismo según estado

---

## 💾 Archivos Clave Actuales

| Archivo | Rol | Líneas |
|---------|-----|--------|
| `useGccForm.ts` | Define tipos de mecanismo | 14 |
| `useGccDerivacion.ts` | Procesa derivación | 75-82 |
| `CentroMediacionGCC.tsx` | UI principal | 50-699 |
| `DerivacionForm.tsx` | Selector mecanismo | 220-225 |
| `GccCierreModal.tsx` | Genera actas | 360+ |

---

## 🔄 Ejemplo: Acceso a Mecanismo en Componentes

```typescript
// En cualquier componente GCC:

const { mecanismoSeleccionado } = gccState;

// Para lógica específica:
if (mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO') {
  // Solo para arbitraje
  validarPermisosDirector();
  mostrarAdvertenciaVinculante();
}

if (mecanismoSeleccionado === 'NEGOCIACION_ASISTIDA') {
  // Para negociación
  ocultarFormularioAcueerdos();
  mostrarTimerNegociacion();
}
```

---

## 📚 Referencias Circulares

- **Circular 781**: Negociación de convivencia escolar (gestión previa)
- **Circular 782**: Mediación, Conciliación, Arbitraje (procesos formales)

