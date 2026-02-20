# 📊 Flujo de Mecanismos GCC - Arquitectura Visual

## 1️⃣ Arquitectura General de los 4 Mecanismos

```
                         DERIVACIÓN A GCC
                              │
                 ┌────────────┼────────────┐
                 │            │            │
           SELECCIONAR    GUARDAR      DETERMINAR
           MECANISMO      MOTIVO        PLAZO
                 │            │            │
                 └────────────┼────────────┘
                              ↓
          ┌──────────────────────────────────┐
          │   GccDerivacionForm (línea 122)  │
          │   - Selector mecanismo            │
          │   - Motivo y objetivos            │
          │   - Mediador asignado             │
          └──────────────────────────────────┘
                              ↓
              ┌───────────────────────────────┐
              │  useGccDerivacion             │
              │  (handleDerivacionCompleta)   │
              │  línea 56 en useGccDerivacion │
              └───────────────────────────────┘
                              ↓
         ┌────────────────────────────────────┐
         │     RPC: gcc_crear_proceso         │
         │     (p_tipo_mecanismo)             │
         │     línea 85 en useGccDerivacion   │
         └────────────────────────────────────┘
                              ↓
            ┌────────────────────────────────┐
            │   Almacenado en BD             │
            │   mediaciones_gcc_v2           │
            │   tipo_mecanismo: string       │
            └────────────────────────────────┘
                              ↓
        ┌──────────────────────────────────────┐
        │      GccSalaMediacion (línea 889)    │
        │      Renderiza según mecanismo       │
        └──────────────────────────────────────┘
                              ↓
          ┌────────────────────────────────────┐
          │  Resultados & Cierre               │
          │  (GccCierreModal)                  │
          │  - Acuerdos                        │
          │  - Compromisos                     │
          │  - Acta específica por mecanismo   │
          └────────────────────────────────────┘
```

---

## 2️⃣ Selector de Mecanismo en UI

**Línea 217-226 en CentroMediacionGCC.tsx**

```
┌─────────────────────────────────────────────┐
│         SELECCIONA MECANISMO                │
├─────────────────────────────────────────────┤
│  [∨] ┌──────────────────────────────────┐  │
│      │  Mediacion (formal)              │  │ ← Estándar
│      │  Conciliacion (formal)           │  │ ← Con propuestas
│      │  Arbitraje Pedagogico (formal)   │  │ ← Decisivo
│      │  Negociacion Asistida (gest...)  │  │ ← Sin acta
│      └──────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 3️⃣ Transformación: NEGOCIACION → MEDIACION

**Línea 75-82 en useGccDerivacion.ts**

```typescript
// ⚠️ PROBLEMA ACTUAL:
const mecanismoFinal =
  payload.mecanismoSeleccionado === 'NEGOCIACION_ASISTIDA'
    ? 'MEDIACION'  // Se convierte automáticamente
    : payload.mecanismoSeleccionado;

// Resultado: 
// NEGOCIACION_ASISTIDA → siempre se guarda como MEDIACION
// No hay diferenciación en BD
```

**Flujo Visual:**

```
Usuario selecciona:              Se guarda en BD:
┌──────────────────────┐        ┌─────────────────┐
│ NEGOCIACION_ASISTIDA │──────→ │  MEDIACION      │
└──────────────────────┘        └─────────────────┘
                                (Pérdida de info)
```

---

## 4️⃣ Diferenciación por Mecanismo en Actas

**Línea 693-699 en CentroMediacionGCC.tsx**

```typescript
// ✅ AQUÍ SÍ HAY DIFERENCIACIÓN:
const tipoActa = 
  mecanismoSeleccionado === 'MEDIACION'
    ? 'ACTA_MEDIACION'
    : mecanismoSeleccionado === 'CONCILIACION'
      ? 'ACTA_CONCILIACION'
      : mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO'
        ? 'ACTA_ARBITRAJE'
        : 'ACTA_MEDIACION';
```

**Flujo Visual:**

```
Mecanismo Guardado              Acta Generada
┌─────────────────┐            ┌──────────────────┐
│ MEDIACION       │───────────→│ ACTA_MEDIACION   │
│ CONCILIACION    │───────────→│ ACTA_CONCILIACION│
│ ARBITRAJE_PEDAG │───────────→│ ACTA_ARBITRAJE   │
└─────────────────┘            └──────────────────┘
```

---

## 5️⃣ Estado Central del Formulario

**useGccForm.ts - Línea 26-35**

```typescript
export interface GccFormState {
  // ...
  statusGCC: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  mecanismoSeleccionado: MecanismoGCC;  // ← Se guarda aquí
  facilitador: string;
  // ...
}

// Acceso desde componentes:
const { mecanismoSeleccionado } = gccState;
```

---

## 6️⃣ Renderizado Condicional Según Mecanismo

**Patrón disponible pero SIN USAR actualmente:**

```typescript
// En GccSalaMediacion o CentroMediacionGCC puedes hacer:

if (mecanismoSeleccionado === 'NEGOCIACION_ASISTIDA') {
  return <GccNegociacionPanel />;  // No existe aún
}

if (mecanismoSeleccionado === 'MEDIACION') {
  return <GccMediacionPanel />;  // No existe aún
}

if (mecanismoSeleccionado === 'CONCILIACION') {
  return <GccConciliacionPanel />;  // No existe aún
}

if (mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO') {
  return <GccArbitrajePanel />;  // No existe aún
}
```

---

## 7️⃣ Flujo ACTUAL vs PROPUESTO

### ACTUAL (sin diferenciación real):

```
SELECT
  ↓
DERIVACION_FORM
  ├─ Elige mecanismo (4 opciones)
  └─ NEGOCIACION → se convierte a MEDIACION
  ↓
ALMACENA (tipo_mecanismo)
  ├─ MEDIACION
  ├─ CONCILIACION
  ├─ ARBITRAJE_PEDAGOGICO
  └─ NEGOCIACION (raro, casi nunca ocurre)
  ↓
GCCALAMEDACION
  ├─ formulario estándar (igual para todos)
  └─ Sin lógica diferenciada
  ↓
CIERRE
  └─ Genera acta diferenciada por mecanismo
```

### PROPUESTO (con diferenciación):

```
SELECT
  ↓
DERIVACION_FORM
  ├─ Elige mecanismo (4 opciones)
  └─ Se mantiene el original
  ↓
ALMACENA (tipo_mecanismo)
  ├─ NEGOCIACION → Panel interactivo
  ├─ MEDIACION → Panel de asistencia
  ├─ CONCILIACION → Panel con propuestas
  └─ ARBITRAJE_PEDAGOGICO → Panel decisiones
  ↓
GCC [PANEL ESPECÍFICO POR MECANISMO]
  ├─ GccNegociacionPanel (pasos, timer)
  ├─ GccMediacionPanel (facilitador asiste)
  ├─ GccConciliacionPanel (propuestas mediador)
  └─ GccArbitrajePanel (solo Director, vinculante)
  ↓
CIERRE
  └─ Acta + permisos + notificaciones específicas
```

---

## 8️⃣ Tabla: Dónde se Usa Cada Mecanismo

| Variable | Ubicación | Línea | Uso |
|----------|-----------|-------|-----|
| `mecanismoSeleccionado` | `gccState` | Hook | Estado central |
| `tipo_mecanismo` | `mediaciones_gcc_v2` | DB | Almacenado |
| `MEDIACION` | `useGccDerivacion.ts` | 79 | Conversión NEGOCIACION |
| `mecanismoLabel` | `CentroMediacionGCC.tsx` | 50 | UI labels |
| Selector | `DerivacionForm` | 220 | UI para elegir |
| `tipoActa` | `CentroMediacionGCC.tsx` | 693 | Generación acta |
| `mecanismoLabel` | `useGccDerivacion.ts` | 40 | Toast messages |

---

## 9️⃣ Validaciones Necesarias por Mecanismo

```
┌─────────────────────────────────────────────────┐
│ NEGOCIACION_ASISTIDA                            │
├─────────────────────────────────────────────────┤
│ ✓ Las partes presentes                          │
│ ✓ Facilitador neutral presente                  │
│ ✓ Sin acta obligatoria (solo registro)          │
│ ✓ Permiso: facilitador                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ MEDIACION                                       │
├─────────────────────────────────────────────────┤
│ ✓ Acta firmada requerida                        │
│ ✓ Facilitador neutral mediador                  │
│ ✓ Plazo: 5 días hábiles máximo                  │
│ ✓ Permiso: facilitador                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ CONCILIACION                                    │
├─────────────────────────────────────────────────┤
│ ✓ Facilitador propone soluciones                │
│ ✓ Acta firmada requerida                        │
│ ✓ Plazo: 5 días hábiles máximo                  │
│ ✓ Permiso: facilitador                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ARBITRAJE_PEDAGOGICO                            │
├─────────────────────────────────────────────────┤
│ ✓ Solo Director/Rector puede ejecutar           │
│ ✓ DECISIÓN VINCULANTE (no negociable)          │
│ ✓ Acta especial firmada + sellada               │
│ ✓ Notificación obligatoria apoderados           │
│ ✓ Plazo: 5 días hábiles máximo                  │
│ ✓ Permiso: director/rector + auth check         │
└─────────────────────────────────────────────────┘
```

---

## 🔟 Llamada a Función RPC

**Línea 85 en useGccDerivacion.ts:**

```typescript
const { data: procesoData, error: rpcError } = await supabase.rpc(
  'gcc_crear_proceso',  // Función RPC en Supabase
  {
    p_expediente_id: expediente.dbId,
    p_establecimiento_id: tenantId,
    p_tipo_mecanismo: mecanismoFinal,  // ← AQUÍ se pasa el mecanismo
    p_fecha_limite: fechaLimite.toISOString().slice(0, 10),
    p_motivo_derivacion: [payload.motivo, ...payload.objetivos].join(' | '),
    p_facilitador_id: usuario.id,
    p_usuario_creador: usuario.id
  }
);
```

**En BD (supabase/migrations):**

```sql
-- La RPC es responsable de insertar en mediaciones_gcc_v2
INSERT INTO mediaciones_gcc_v2 (
  expediente_id,
  establecimiento_id,
  tipo_mecanismo,  -- ← Se almacena aquí
  estado_proceso,
  fecha_inicio,
  facilitador_id
) VALUES (...)
```

---

## Conclusión: Puntos de Integración

| Punto | Estado | Necesita Mejora |
|-------|--------|-----------------|
| **Definición tipos** | ✅ Bien definidos | ✗ Si, agregar metadatos |
| **Selector UI** | ✅ 4 opciones disponibles | ✗ Agregar descripción contextual |
| **Transporte datos** | ⚠️ NEGOCIACION se convierte | ✅ ARREGLAR: mantener original |
| **Almacenamiento** | ✅ Se guarda en BD | ✗ Agregar `tipo_mecanismo` a RLS |
| **Lógica diferenciada** | ❌ No existe | ✅ CREAR: Componentes por mecanismo |
| **Validaciones** | ⚠️ Solo en formulario derivación | ✅ CREAR: Validaciones por mecanismo |
| **Permisos/RLS** | ✅ Básicos | ✅ MEJORAR: Arbitraje solo director |
| **Actas generadas** | ✅ Diferenciadas | ✗ Agregar contenido específico |
| **E2E tests** | ⚠️ Solo mediación | ✅ CREAR: Tests por mecanismo |

