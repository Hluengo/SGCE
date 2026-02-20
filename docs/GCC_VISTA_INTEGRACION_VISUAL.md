# GCC en la Interfaz: Estructura Visual y Componentes Faltantes

## 1. ESTADO ACTUAL: Dónde está el GCC en la UI

### 1.1 Flujo Actual en CentroMediacionGCC.tsx

```
┌─────────────────────────────────────────────────────────┐
│         CENTRO DE MEDIACIÓN GCC (Menú Principal)        │
│                                                           │
│  Ruta: /mediacion                                       │
│  Navegación: Sidebar > "Mediacion GCC"                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    VISTA PRINCIPAL                       │
│                                                           │
│  ┌──────────────────┐        ┌──────────────────┐       │
│  │  GccDashboard    │        │  GccCasosPanel   │       │
│  │  (Métricas)      │        │  (Lista Casos)   │       │
│  └──────────────────┘        └──────────────────┘       │
│                                                           │
│  ┌────────────────────────────────────────────┐         │
│  │   SELECCIONAR CASO → Abre DerivacionForm   │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│           DerivacionForm (A NIVEL PRINCIPAL)             │
│           ⚠️ AQUÍ ES DONDE ESTÁ EL GCC SELECTOR         │
│                                                           │
│  MECANISMO GCC (selector):                              │
│  ├─ Mediacion           ←── Se selecciona pero no      │
│  ├─ Conciliacion             ve diferenciado            │
│  ├─ Arbitraje Pedagogico                               │
│  └─ Negociacion Asistida                                │
│                                                           │
│  + Motivo de Derivación (textarea)                      │
│  + Objetivos (array)                                    │
│  + Mediador Asignado (select)                           │
│  + Fecha Mediación (date)                               │
│                                                           │
│  [Cancelar]  [Derivar al Centro GCC]                  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│         GccSalaMediacion (Panel Genérico)               │
│         ⚠️ PROBLEMA AQUÍ: MISMO PANEL PARA TODOS        │
│                                                           │
│  ┌─────────────────────────────────────────┐            │
│  │  VISTA ÚNICA (Genérica)                  │            │
│  │                                           │            │
│  │  • Facilitador: [select]                 │            │
│  │  • Estado: (PROCESO/LOGRADO/NO_ACUERDO) │            │
│  │  • Compromisos Reparatorios: [array]     │            │
│  │  • Resultado Mediación: [textarea]       │            │
│  │                                           │            │
│  │  [Preview Acta]  [Destrabador]           │            │
│  │  [Cierre Exitoso]                        │            │
│  └─────────────────────────────────────────┘            │
│                                                           │
│  ❌ NO HAY DIFERENCIACIÓN POR MECANISMO                 │
│  ❌ NO HAY COMPONENTES ESPECÍFICOS                      │
│  ❌ NO HAY VALIDACIONES DIFERENTES                      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│        GccCierreModal (Cierre del Expediente)            │
│        Se muestra igual para todos los mecanismos        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. PROBLEMA IDENTIFICADO

### Línea en el código donde se selecciona mecanismo:
📍 **[CentroMediacionGCC.tsx](CentroMediacionGCC.tsx#L217-L226)**

```typescript
<select
  value={mecanismo}
  onChange={(e) => onMecanismoChange(e.target.value as MecanismoGCC)}
  className="..."
>
  <option value="MEDIACION">Mediacion (formal)</option>
  <option value="CONCILIACION">Conciliacion (formal)</option>
  <option value="ARBITRAJE_PEDAGOGICO">Arbitraje Pedagogico (formal)</option>
  <option value="NEGOCIACION_ASISTIDA">Negociacion Asistida (gestion previa)</option>
</select>
```

✅ **El selector funciona**, pero:
- Se selecciona el mecanismo en DerivacionForm
- **Se guarda en BD** (convertido a MEDIACION en useGccDerivacion:79)
- Luego se muestra **GccSalaMediacion genérica** (no cambia según mecanismo)
- El tipo de mecanismo se "pierde" en la vista

---

## 3. CÓMO DEBERÍA VERSE (ARQUITECTURA PROPUESTA)

### 3.1 Flujo Mejorado

```
┌─────────────────────────────────────────────────────────┐
│         CENTRO DE MEDIACIÓN GCC (Menú Principal)        │
│                                                           │
│  Ruta: /mediacion                                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  VISTA PRINCIPAL (Con indicador de mecanismo)            │
│                                                           │
│  Filtro por Mecanismo:                                  │
│  [Todos] [Mediación] [Conciliación] [Arbitraje] [Neg.]  │
│                                                           │
│  ┌──────────────────────────────────────────┐           │
│  │  Caso 1 - NEGOCIACION_ASISTIDA           │ [Abierto] │
│  │  Caso 2 - MEDIACION                      │ [Proceso] │
│  │  Caso 3 - CONCILIACION                   │ [Logrado] │
│  │  Caso 4 - ARBITRAJE_PEDAGOGICO           │ [Proceso] │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│         DerivacionForm (MOSTRAR MECANISMO SELECCIONADO)  │
│                                                           │
│  🔓 NEGOCIACION ASISTIDA - Gestión Previa               │
│  (Icono diferenciado + color único)                     │
│                                                           │
│  • Motivo: ...                                          │
│  • Plazo: 10 días hábiles                               │
│  • Sin mediador (Las partes negocian directamente)       │
└─────────────────────────────────────────────────────────┘
                           ↓
        ┌────────────────────────────────────────┐
        │  ENRUTAMIENTO DINÁMICO                 │
        │  según mecanismo seleccionado:         │
        └────────────────────────────────────────┘
        /         |          |         \
       ↓          ↓          ↓          ↓
    NEGOC    MEDIACION  CONCILIACION  ARBITRAJE
    
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│GccNegoc  │ │GccMed    │ │GccConc   │ │GccArb    │
│Panel     │ │Panel     │ │Panel     │ │Panel     │
│          │ │          │ │          │ │          │
│Partes    │ │Mediador  │ │Mediador  │ │Director  │
│directas  │ │+Acuerdo  │ │+Propuesta│ │+Resol.   │
│5 días    │ │5 días    │ │5 días    │ │5 días    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
     ↓            ↓            ↓            ↓
   [Acta]      [Acta]       [Acta]       [Acta]
   (con         (con         (con         (con
   Firma      Firma med.  Firma med.   Firma dir.)
   S1,S2)    + Acuerdo)  +Propuesta)
```

---

## 4. COMPONENTES QUE FALTAN (Por Mecanismo)

### 4.1 NEGOCIACION_ASISTIDA

**Archivo sugerido:** `GccNegociacionPanel.tsx`

```tsx
interface GccNegociacionPanelProps {
  caso: Expediente;
  mecanismo: 'NEGOCIACION_ASISTIDA';
  
  // Las PARTES negocian directamente
  estudiante1: string;
  estudiante2: string;
  
  // Timeline: 10 días hábiles (gestión previa, no formal)
  horaInicio?: string;
  
  // Sin mediador formal
  // Pero puede haber facilitador institucional para contención
  facilitadorApoyo?: string;
  
  // Resultado: Acta de Acuerdo o No Acuerdo
  acuerdoAlcanzado: boolean;
  detallesAcuerdo?: string;
}

// VISTA ESPECÍFICA:
// ┌─────────────────────────────────┐
// │ NEGOCIACIÓN ASISTIDA (10 días)  │
// │                                  │
// │ Partes Directas:                │
// │ 📋 [Estudiante 1] ←→ [Est. 2]  │
// │ (sin mediador principal)        │
// │                                  │
// │ Facilitador de Apoyo (opcional):│
// │ [select mediador institucional] │
// │                                  │
// │ ¿Lograron acuerdo?             │
// │ ⭕ Sí  ⭕ No                    │
// │                                  │
// │ [Registrar Resultado]           │
// └─────────────────────────────────┘
```

**Línea de código donde se distingue:** El mecanismo viene en props
- Validar que NO haya mediador formal (es gestión previa)
- Plazo máximo: 10 días
- Acta sin firma de mediador

---

### 4.2 MEDIACION (Formal)

**Archivo sugerido:** `GccMediacionPanel.tsx`

```tsx
interface GccMediacionPanelProps {
  caso: Expediente;
  mecanismo: 'MEDIACION';
  
  // MEDIADOR OBLIGATORIO
  mediador: string;
  
  // Timeline: 5 días hábiles (formal)
  fechaMediacion: string;
  horaInicio: string;
  horaCierre: string;
  
  // Rol del mediador: FACILITA acuerdo
  // (No propone, solo ayuda a las partes a llegar a acuerdo)
  
  // Resultado
  acuerdoAlcanzado: boolean;
  detallesAcuerdo: string;
  firmaMediador: string; // Mediador firma el acta
}

// VISTA ESPECÍFICA:
// ┌──────────────────────────────────┐
// │ MEDIACIÓN (5 días hábiles)       │
// │                                   │
// │ 👤 Mediador Asignado:            │
// │    [select mediador profesional] │
// │    vs                             │
// │ 📋 Partes: [Est. 1] ←→ [Est. 2] │
// │                                   │
// │ Fecha Sesión: [date input]       │
// │ Hora: [time input] a [time]      │
// │                                   │
// │ ACUERDO ALCANZADO:               │
// │ ⭕ Sí  ⭕ No                     │
// │                                   │
// │ Detalles: [textarea]             │
// │                                   │
// │ Firmas: ✅ [Est1]  ✅ [Est2]    │
// │         ✅ [Mediador]             │
// │                                   │
// │ [Generar Acta de Mediación]      │
// └──────────────────────────────────┘
```

**Diferencias del código:**
- Validar que mediador esté presente (dato obligatorio)
- Validar que haya hora de inicio y cierre
- Acta incluye firma del mediador
- Plazo: 5 días hábiles (cumple Circular 782)

---

### 4.3 CONCILIACION (Formal)

**Archivo sugerido:** `GccConciliacionPanel.tsx`

```tsx
interface GccConciliacionPanelProps {
  caso: Expediente;
  mecanismo: 'CONCILIACION';
  
  // CONCILIADOR OBLIGATORIO
  conciliador: string;
  
  // Timeline: 5 días hábiles (formal)
  fechaConciliacion: string;
  
  // ROL DEL CONCILIADOR: 
  // A diferencia de mediación, el conciliador SÍ PROPONE SOLUCIONES
  propuestaConciliador?: string; // ← CAMPO DIFERENCIANTE
  
  // Aceptación
  propuestaAceptada: boolean;
  firmasConciliador: string;
}

// VISTA ESPECÍFICA:
// ┌──────────────────────────────────┐
// │ CONCILIACIÓN (5 días hábiles)    │
// │                                   │
// │ ⚖️  Conciliador Asignado:        │
// │    [select conciliador]           │
// │    vs                             │
// │ 📋 Partes: [Est. 1] ← ↔ → [Est.2]│
// │                                   │
// │ PROPUESTA DEL CONCILIADOR:       │
// │ ┌──────────────────────────────┐ │
// │ │[PROPONE SOLUCIÓN ESPECÍFICA] │ │
// │ │                              │ │
// │ │[textarea - propuesta]        │ │
// │ └──────────────────────────────┘ │
// │                                   │
// │ Respuesta de Partes:             │
// │ ⭕ Aceptan  ⭕ Rechazan         │
// │                                   │
// │ Firmas: ✅ [Est1]  ✅ [Est2]    │
// │         ✅ [Conciliador]         │
// │                                   │
// │ [Generar Acta de Conciliación]   │
// └──────────────────────────────────┘
```

**Diferencias del código:**
- Campo `propuestaConciliador` (no existe en Mediación)
- Validar que la propuesta sea completada antes de finalizar
- Acta incluye propuesta específica y aceptación

---

### 4.4 ARBITRAJE_PEDAGOGICO (Formal)

**Archivo sugerido:** `GccArbitrajePanel.tsx`

```tsx
interface GccArbitrajeArgs {
  caso: Expediente;
  mecanismo: 'ARBITRAJE_PEDAGOGICO';
  
  // ARBITRO: DEBE SER DIRECTOR
  arbitro: string; // ← Validar que sea director (rol)
  
  // Timeline: 5 días hábiles (formal)
  fechaArbitraje: string;
  
  // ROL DEL ARBITRO:
  // NO mediaría, NO propone. DECIDE VINCULANTEMENTE
  resolucionArbitro?: string; // ← CAMPO DIFERENCIANTE
  
  // Vinculancia
  esVinculante: boolean; // = true siempre
  firmasArbitro: string;
}

// VISTA ESPECÍFICA:
// ┌──────────────────────────────────┐
// │ ARBITRAJE PEDAGÓGICO (5 días)    │
// │ ⚠️  DECISIÓN VINCULANTE          │
// │                                   │
// │ 👨‍⚖️  Árbitro (Director):         │
// │    [display: DIRECTOR VALIDADO]  │
// │    vs                             │
// │ 📋 Partes: [Est. 1] ←I→ [Est. 2] │
// │       (I = árbitro decide)        │
// │                                   │
// │ RESOLUCIÓN DEL ÁRBITRO:          │
// │ ┌──────────────────────────────┐ │
// │ │[DECISIÓN VINCUL. DEL ÁRBITRO]│ │
// │ │                              │ │
// │ │[textarea - resolución]       │ │
// │ │                              │ │
// │ │⚠️  Esta decisión es FINAL     │ │
// │ │    y VINCULANTE para ambas   │ │
// │ └──────────────────────────────┘ │
// │                                   │
// │ Partes informadas: ✅ ✅         │
// │ Firma del Árbitro: ✅ [Director] │
// │                                   │
// │ ⚠️  DECISIÓN INAPELABLE         │
// │                                   │
// │ [Generar Acta de Arbitraje]      │
// └──────────────────────────────────┘
```

**Diferencias del código:**
- Validar `useAuth()` que usuario sea DIRECTOR
- Campo `resolucionArbitro` obligatorio
- Validación de que sea "vinculante" (no hay recurso después)
- Cambiar icono a ⚖️ para simbolizar autoridad

---

## 5. FLUJO DINÁMICO DE ENRUTAMIENTO (EN CÓDIGO)

### Ubicar en: `CentroMediacionGCC.tsx` alrededor de línea 600

```typescript
// Renderizar panel específico según mecanismo seleccionado
const renderGccPanel = () => {
  if (!casoSeleccionado) return null;
  
  switch(mecanismo) {
    case 'NEGOCIACION_ASISTIDA':
      return (
        <GccNegociacionPanel
          caso={casoSeleccionado}
          {...negociacionProps}
        />
      );
      
    case 'MEDIACION':
      return (
        <GccMediacionPanel
          caso={casoSeleccionado}
          {...mediacionProps}
        />
      );
      
    case 'CONCILIACION':
      return (
        <GccConciliacionPanel
          caso={casoSeleccionado}
          {...conciliacionProps}
        />
      );
      
    case 'ARBITRAJE_PEDAGOGICO':
      return (
        <GccArbitrajePanel
          caso={casoSeleccionado}
          {...arbitrajeProps}
        />
      );
      
    default:
      return <GccSalaMediacion {...genericProps} />; // Fallback
  }
};

// En el JSX:
return (
  <div>
    <DerivacionForm /* ... */ />
    {renderGccPanel()} {/* ← AQUÍ SE RENDERIZA EL PANEL CORRECTO */}
    <GccCierreModal /* ... */ />
  </div>
);
```

---

## 6. INDICADORES VISUALES POR MECANISMO

### Colores, iconos y estilos diferenciados

```
NEGOCIACION_ASISTIDA:
├─ Color: Verde 🟢 (gestión previa, menos formal)
├─ Icono: 🔓 (puertas abiertas - Las partes hablan)
├─ Badge: "GESTIÓN PREVIA" (10 días)
└─ Énfasis: "Partes negocian directamente"

MEDIACION:
├─ Color: Azul 🔵 (formal, facilitación)
├─ Icono: 👥 (Mediador + Partes)
├─ Badge: "FORMAL" (5 días)
└─ Énfasis: "Mediador facilita acuerdo"

CONCILIACION:
├─ Color: Púrpura 🟣 (formal, con propuesta)
├─ Icono: 💡 (Conciliador propone)
├─ Badge: "FORMAL" (5 días)
└─ Énfasis: "Conciliador propone soluciones"

ARBITRAJE_PEDAGOGICO:
├─ Color: Rojo 🔴 (formal, decisión vinculante)
├─ Icono: ⚖️ (Árbitro decide)
├─ Badge: "VINCULANTE" (5 días)
└─ Énfasis: "Decisión FINAL del Árbitro"
```

### Ejemplo de badge en CSS:

```tsx
const mechanismoColors = {
  NEGOCIACION_ASISTIDA: 'bg-green-100 text-green-800 border-green-300',
  MEDIACION: 'bg-blue-100 text-blue-800 border-blue-300',
  CONCILIACION: 'bg-purple-100 text-purple-800 border-purple-300',
  ARBITRAJE_PEDAGOGICO: 'bg-red-100 text-red-800 border-red-300'
};

<span className={`px-3 py-1 rounded-full border text-xs font-bold 
                  ${mechanismoColors[mecanismo]}`}>
  {mecanismoLabel[mecanismo]}
</span>
```

---

## 7. DATOS DIFERENCIADOS POR MECANISMO EN BD

### Campos que deberían diferenciarse en tabla `gcc_procesos`

```sql
CREATE TABLE gcc_procesos (
  -- Común a todos
  id UUID PRIMARY KEY,
  expediente_id UUID NOT NULL,
  mecanismo 'NEGOCIACION_ASISTIDA' | 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO',
  
  -- NEGOCIACION_ASISTIDA (10 días)
  fecha_negociacion_inicio DATE,
  facilitador_apoyo VARCHAR, -- Opcional
  
  -- MEDIACION (5 días)
  mediador_id UUID,
  fecha_mediacion DATE,
  hora_inicio TIME,
  hora_cierre TIME,
  
  -- CONCILIACION (5 días)  
  conciliador_id UUID,
  fecha_conciliacion DATE,
  propuesta_conciliador TEXT, -- ← Campo específico
  
  -- ARBITRAJE_PEDAGOGICO (5 días)
  arbitro_id UUID,
  fecha_arbitraje DATE,
  resolucion_arbitro TEXT, -- ← Campo específico
  es_vinculante BOOLEAN DEFAULT true,
  
  -- Común a todos
  estado 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO',
  acta_generada BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 8. RUTA DE IMPLEMENTACIÓN RECOMENDADA

### Fase 1: Crear componentes específicos (4 horas)
1. ✅ Crear `GccNegociacionPanel.tsx` (80 LOC)
2. ✅ Crear `GccMediacionPanel.tsx` (120 LOC)
3. ✅ Crear `GccConciliacionPanel.tsx` (140 LOC)
4. ✅ Crear `GccArbitrajePanel.tsx` (120 LOC)

### Fase 2: Integrar enrutamiento dinámico (2 horas)
5. ✅ Agregar `renderGccPanel()` en CentroMediacionGCC.tsx
6. ✅ Importar los 4 componentes nuevos
7. ✅ Pasar props específicas a cada panel

### Fase 3: Agregar indicadores visuales (1 hora)
8. ✅ Agregar badges y colores por mecanismo
9. ✅ Actualizar iconos en DerivacionForm
10. ✅ Mostrar "mecanismo seleccionado" en header

### Fase 4: Validaciones y tests (2 horas)
11. ✅ Validar roleDirector para ARBITRAJE
12. ✅ Tests unitarios para cada panel
13. ✅ Tests de enrutamiento dinámico

**Tiempo total: 9 horas**

---

## 9. RESUMEN: QUÉ FALTA HOY

| Elemento | Estado | Ubicación |
|----------|--------|-----------|
| Selector de Mecanismo | ✅ Funciona | DerivacionForm:217 |
| Panel Negociación | ❌ No existe | *Crear* |
| Panel Mediación | ❌ No existe | *Crear* |
| Panel Conciliación | ❌ No existe | *Crear* |
| Panel Arbitraje | ❌ No existe | *Crear* |
| Enrutamiento dinámico | ❌ No existe | *Agregar en CentroMediacionGCC* |
| Indicadores visuales | ⚠️ Parcial | DerivacionForm solo |
| Badges por mecanismo | ❌ No existe | *Agregar* |
| Almacenamiento BD | ✅ Genérico | gcc_procesos tabla |

---

## 10. CÓDIGO: CÓMO DEBERÍA VERSE EN USO

### Usuario selecciona "CONCILIACION":

```
1. [Abre DerivacionForm]
   "Mecanismo GCC: [Conciliación (formal)]" ← Color púrpura
   
2. [Rellena datos y clickea "Derivar al Centro GCC"]
   
3. [Aparece GccConciliacionPanel específico]
   - Mostrar: Conciliador asignado
   - Mostrar: Fecha conciliación (5 días hábiles)
   - Campo: "PROPUESTA DEL CONCILIADOR" ← ÚNICO de este panel
   - - Respuesta: Aceptan/Rechazan
   - Generar acta con propuesta incluida
   
4. [Usuario ve claramente que es CONCILIACIÓN, no MEDIACIÓN]
```

### Usuario selecciona "ARBITRAJE_PEDAGOGICO":

```
1. [Abre DerivacionForm]
   [VALIDACIÓN] Si usuario NO es DIRECTOR:
   → Error: "Solo directores pueden usar Arbitraje"
   → Disable el selector de Arbitraje
   
2. [Si es director, selecciona ARBITRAJE]
   "Mecanismo GCC: [Arbitraje Pedagógico ⚖️]" ← Color rojo
   
3. [Aparece GccArbitrajePanel]
   - Mostrar: Árbitro (Director) validado
   - Mostrar: "DECISIÓN VINCULANTE" (badge rojo)
   - Campo: "RESOLUCIÓN DEL ÁRBITRO" ← Donde director decide
   - Acta generada = Final e inapelable
```

---

## 11. PRÓXIMOS PASOS

**Si el usuario confirma que quiere implementar esto:**

1. ✅ Crear 4 archivos de componentes específicos
2. ✅ Integrar en CentroMediacionGCC.tsx (enrutamiento dinámico)
3. ✅ Agregar validaciones (role para arbitraje)
4. ✅ Agregar tests
5. ✅ Actualizar imports/exports

**Tiempo estimado: 9 horas de trabajo**
