# 📅 CALENDARIO NORMATIVO - Guía Visual

**Estado**: ✅ IMPLEMENTADO Y COMPILADO EXITOSAMENTE

---

## 🎨 Interface Visual Mejorada

### Vista General del Calendario

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┓
┃ 📅 CALENDARIO NORMATIVO                    ◀ FEBRERO 2026 ▶     ┃🔔 URGENCIAS┃
┃ ⏰ Cálculo basado en días hábiles           ┃   PARA HOY    ┃
┃    (feriados de Chile desde BD)            ┃               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━┫
┃ LEYENDA:                                   ┃ No se registran┃
┃ ● PLAZO FATAL  ● DESCARGOS ● GCC          ┃ vencimientos  ┃
┃ 🔴 FERIADO     ⬜ FIN DE SEMANA           ┃ legales para  ┃
┃                                            ┃ hoy.          ┃
┃ [✓] Expulsiones  [✓] Reconsideración       ┃               ┃
┃ [✓] Mediaciones  ✓ 3 feriados cargados    ┃               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━┫
┃                    CUADRÍCULA DEL CALENDARIO                      ┃ 📅 FERIADOS ┃
┃                                            ┃  DE FEBRERO   ┃
┃  Dom   Lun   Mar   Mié   Jue   Vie   Sáb  ┃               ┃
┃──────────────────────────────────────────┃ • Asalto      ┃
┃      1     2     3     4     5     6      ┃   Palacio 21  ┃
┃                                            ┃   Irrenunciable
┃  7     8     9    10    11    12⬜  13⬜  ┃               ┃
┃                                            ┃               ┃
┃  14   15⬜  16⬜  17●   18    19    20    ┃               ┃
┃             EVENTO    EVENTO              ┃ ⚠️ ALERTA    ┃
┃                                            ┃ PREVENTIVA   ┃
┃  21🔴  22⬜  23⬜  24    25    26    27   ┃               ┃
┃ Asalto Pal.                               ┃ Faltan 48h    ┃
┃                                            ┃ para Cierre   ┃
┃  28   29                                   ┃ Descargos de: ┃
┃                                            ┃ • Juan P.     ┃
┃                                            ┃ • María R.    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━┛
```

---

## 📋 Secciones Principales

### 1. Encabezado
```
📅 CALENDARIO NORMATIVO
⏰ Cálculo basado en días hábiles (feriados de Chile desde BD)

[◀] FEBRERO 2026 [▶]
```

### 2. Leyenda y Filtros
```
┌─────────────────────────────────────────────────────────────────┐
│ ● PLAZO FATAL  ● DESCARGOS  ● HITO INTERNO  🔴 FERIADO ⬜ F.S. │
│                                                                  │
│ [☑] Expulsiones  [☑] Reconsideración  [☑] Mediaciones         │
│                                                                  │
│                                    ✓ 12 feriados cargados      │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Cuadrícula del Calendario

#### Día Hábil Normal:
```
┌──────────────┐
│  18 L        │
│              │
│ • Evento 1   │
│ • Evento 2   │
│              │
│ (blanco)     │
└──────────────┘
```

#### Día Hoy (en azul):
```
┌──────────────┐
│  17 L ●      │
│ (ring azul)  │
│ • Evento 1   │
│              │
│ (azul 50%)   │
└──────────────┘
```

#### Fin de Semana (gris):
```
┌──────────────┐
│  22 F.S.     │
│              │
│  (vacío)     │
│              │
│ (gris 100)   │
└──────────────┘
```

#### Feriado (ROJO):
```
┌──────────────┐
│  21 🚨       │
│              │
│"Asalto del   │
│ Palacio"     │
│              │
│ (rojo 50%)   │
└──────────────┘
```

---

## 🎯 Panel Lateral - Secciones

### Sección 1: Urgencias para Hoy
```
┌─────────────────────────────┐
│🔔 URGENCIAS PARA HOY        │
│                             │
│ No se registran vencimientos│
│ legales para la fecha actual│
│                             │
│         ✓ (checkmark)       │
└─────────────────────────────┘
```

O si hay urgencias:
```
┌─────────────────────────────┐
│🔔 URGENCIAS PARA HOY        │
│                             │
│ ┌───────────────────────┐   │
│ │ FATAL      EXP-001    │   │
│ │ Cierre Aula Segura    │   │
│ │ Juan Pérez            │   │
│ │ → Ir al expediente    │   │
│ └───────────────────────┘   │
│                             │
│ ┌───────────────────────┐   │
│ │ DESCARGOS  EXP-002    │   │
│ │ Cierre Descargos      │   │
│ │ María Rodríguez       │   │
│ │ → Ir al expediente    │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

### Sección 2: Feriados del Mes ✨ NUEVA
```
┌─────────────────────────────┐
│📅 FERIADOS DE FEBRERO 2026  │
│                             │
│ ┌─────────────────────────┐ │
│ │ Asalto Palacio    21    │ │
│ │ 🏷️ Irrenunciable       │ │
│ └─────────────────────────┘ │
│                             │
│ Cargando... [○]             │
│                             │
└─────────────────────────────┘
```

### Sección 3: Alerta Preventiva
```
┌─────────────────────────────┐
│⚠️ ALERTA PREVENTIVA         │
│                             │
│ Faltan 48h para Cierre      │
│ Descargos                   │
│ NNA: Juan Pérez             │
│                             │
│ Faltan 48h para Cierre      │
│ Descargos                   │
│ NNA: María Rodríguez        │
└─────────────────────────────┘
```

### Sección 4: Nota Legal
```
┌─────────────────────────────┐
│ℹ️  * Los plazos de 5 días   │
│   para notificación SIE y   │
│   15 días para             │
│   Reconsideración son       │
│   fatales. El              │
│   incumplimiento genera     │
│   riesgo de multa          │
│   administrativa.          │
└─────────────────────────────┘
```

---

## 🔄 Estados de Carga

### Mientras carga feriados:
```
┌─────────────────────────────┐
│ [○]                         │
│ Cargando feriados...        │
│                             │
└─────────────────────────────┘

Plus:    ⏳ Cargando feriados... (en header)
```

### Mientras carga eventos del calendario:
```
┌──────────────────────────────────────┐
│                                      │
│          [○]                         │
│  Calculando plazos legales con      │
│  feriados...                         │
│                                      │
└──────────────────────────────────────┘
```

### Estados finales:
```
✓ 12 feriados cargados      (verde - exitoso)
⏳ Cargando feriados...      (azul - en progreso)
⚠️ Sin feriados en BD        (ámbar - alerta)
```

---

## 🎨 Paleta de Colores

| Elemento | Color | Uso |
|---|---|---|
| Plazo Fatal | `red-50` / `red-700` | Vencimientos críticos |
| Descargos | `amber-50` / `amber-700` | Hitos de audición |
| Evento normal | `blue-50` / `blue-700` | Otros eventos |
| GCC/Mediación | `emerald-50` / `emerald-700` | Acuerdos formativos |
| Feriado | `red-50` / `red-300` (borde) | Días no hábiles |
| Fin de semana | `slate-100` / `slate-200` (borde) | Sáb/Dom |
| Hoy | `blue-50` / `blue-500` (ring) | Día actual |
| Success | `emerald-400` / `emerald-600` | Confirmaciones |
| Warning | `amber-100` / `amber-600` | Alertas |
| Info | `blue-100` / `blue-600` | Información |

---

## ✨ Interactividad

### Clickeable:
- ✓ Cada evento en el calendario → Abre expediente
- ✓ Cada urgencia en panel → Abre expediente
- ✓ Checkboxes de filtros → Muestra/oculta tipos
- ✓ Controles mes (◀ ▶) → Navega entre meses

### Hover Effects:
```
Evento en calendario:
  Normal   → Escala normal + borde normal
  Hover    → Escala 100% + fondo más oscuro
  Click    → Escala 95% (activo)

Tarjeta urgencia:
  Normal   → Borde gris normal
  Hover    → Borde rojo + fondo rojo 10%

Día feriado:
  Normal   → Fondo rojo claro
  Hover    → Fondo rojo más oscuro

Día normal:
  Normal   → Blanco
  Hover    → Gris semi transparente
```

### Tooltips:
```
Pasar mouse sobre evento   → Muestra: "Título - NNA"
Pasar mouse sobre feriado  → Muestra: "Asalto Palacio"
```

---

## 📱 Responsive Design

### Desktop (lg):
```
┌─────────────────────────────────────────┬─────────────┐
│         Calendario (flex-1)             │ Panel Lado  │
│                                         │   (w-96)    │
│         Cuadrícula 7 columnas           │             │
│         Eventos en cada día             │ • Urgencias │
│                                         │ • Feriados  │
│                                         │ • Alertas   │
└─────────────────────────────────────────┴─────────────┘
```

### Mobile (md y menor):
```
┌──────────────────────────────────────┐
│    Calendario (full width)           │
│                                      │
│    Cuadrícula adaptada               │
│    Eventos reducidos en tamaño       │
│                                      │
├──────────────────────────────────────┤
│    Panel Lateral (full width)        │
│                                      │
│    • Urgencias                       │
│    • Feriados                        │
│    • Alertas                         │
│                                      │
└──────────────────────────────────────┘
```

---

## 🚀 Ejemplo de Flujo de Usuario

### Escenario: Director necesita ver cuándo vence un proceso de expulsión

**Paso 1:** Abre Calendario Normativo
```
"Calculando plazos legales con feriados..." [○]
Mientras se cargan los feriados de la BD
```

**Paso 2:** Feriados cargados, ve el calendario
```
✓ 12 feriados cargados  (badge verde)

Panel muestra:
📅 FERIADOS DE FEBRERO 2026
• Asalto Palacio      21
  Irrenunciable ✓
```

**Paso 3:** Busca expediente en el calendario
```
Ve el día rojo "21" con label "Asalto Palacio"
Los cálculos automáticamente excluyen esta fecha
```

**Paso 4:** Lee plazos calculados
```
Vencimiento Legal - Juan Pérez → 3 de marzo
(no 2 de marzo, porque 21 feb es feriado)
```

**Paso 5:** Haz clic para abrir expediente
```
→ Se abre vista detallada del expediente
→ Muestra plazo real considerando feriado
```

---

## 📊 Casos de Uso

### Caso 1: Expulsión con Feriado en Medio
```
Inicio:   17 feb (lun)
Tipo:     EXPULSIÓN (10 días hábiles)
Feriado:  21 feb (viernes) - Asalto Palacio
Resultado: 2 marzo (no 27 feb)
```

### Caso 2: Proceso que toca fin de semana
```
Inicio:   19 feb (miércoles)
Tipo:     DESCARGOS (3 días hábiles)
Fin semana: 22-23 feb
Resultado: 24 feb (lunes después del fin de semana)
```

### Caso 3: Múltiples feriados
```
Inicio:   15 feb (sábado) = 16 feb (lun, primer día)
Tipo:     RECONSIDERACIÓN (45 días hábiles)
Feriados: 21 feb + futuros
Resultado: Calculado automáticamente por SQL RPC
```

---

## ✅ Validación

- ✓ Visual design coherente y legible
- ✓ Estados claros (cargando, normal, error)
- ✓ Colores accesibles (WCAG AA mínimo)
- ✓ Responsive en móvil
- ✓ Performance optimizado
- ✓ Interactivo y responsive

---

*Guía visual completa - Calendario Normativo versión 2026*
