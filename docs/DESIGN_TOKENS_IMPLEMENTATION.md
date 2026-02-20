# 🛠️ IMPLEMENTACIÓN - Design Tokens System & Enterprise Patterns

## PARTE 1: Design Tokens Implementation

### Estructura de Carpetas (New)

```
src/shared/design/
├── tokens.ts              ← Sistema de tokens centralizados
├── colors.ts              ← Paleta de colores
├── spacing.ts             ← Escala de espaciado
├── typography.ts          ← Tipografía semántica
├── classes.ts             ← Composable CSS classes
├── index.ts               ← Export centralizado
└── tokens.test.ts         ← Tests de consistencia
```

---

## PARTE 2: Code Templates (Ready to Copy-Paste)

### Template 1: Design Tokens System

**Archivo: `src/shared/design/colors.ts`**

```typescript
/**
 * Design Tokens - Paleta de Colores Centralizada
 * Single Source of Truth para todos los colores del sistema
 * 
 * REGLA DE ORO: Cambiar aquí = cambio global automático
 * NO hardcodear colores en componentes
 */

export const COLOR_PALETTE = {
  // SEMANTIC: Status & Intent
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',  // ← BRAND PRIMARY
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  emerald: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',  // ← SUCCESS
    700: '#15803d',
    800: '#166534',
    900: '#134e4a',
  },

  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',  // ← WARNING
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',  // ← CRITICAL
    700: '#be123c',
    800: '#9d174d',
    900: '#831843',
  },

  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',  // ← ERROR
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',  // ← SECONDARY
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
} as const;

/**
 * Aliases Semánticos - Usos recomendados
 */
export const SEMANTIC_COLORS = {
  background: COLOR_PALETTE.slate[50],
  surface: COLOR_PALETTE.slate[50],
  text: {
    primary: COLOR_PALETTE.slate[900],
    secondary: COLOR_PALETTE.slate[600],
    tertiary: COLOR_PALETTE.slate[400],
    inverted: COLOR_PALETTE.slate[50],
  },
  border: {
    light: COLOR_PALETTE.slate[200],
    medium: COLOR_PALETTE.slate[300],
    dark: COLOR_PALETTE.slate[400],
  },
  state: {
    success: COLOR_PALETTE.emerald[600],
    warning: COLOR_PALETTE.amber[600],
    error: COLOR_PALETTE.red[600],
    critical: COLOR_PALETTE.rose[600],
    info: COLOR_PALETTE.primary[600],
  },
  feedback: {
    successBg: COLOR_PALETTE.emerald[50],
    successBorder: COLOR_PALETTE.emerald[200],
    successText: COLOR_PALETTE.emerald[800],
    
    warningBg: COLOR_PALETTE.amber[50],
    warningBorder: COLOR_PALETTE.amber[200],
    warningText: COLOR_PALETTE.amber[800],
    
    errorBg: COLOR_PALETTE.red[50],
    errorBorder: COLOR_PALETTE.red[200],
    errorText: COLOR_PALETTE.red[800],
    
    infoBg: COLOR_PALETTE.primary[50],
    infoBorder: COLOR_PALETTE.primary[200],
    infoText: COLOR_PALETTE.primary[800],
  },
} as const;

/**
 * Colores específicos para GCC (Gestión Colaborativa de Conflictos)
 */
export const GCC_MECHANISM_COLORS = {
  NEGOCIACION_ASISTIDA: {
    bg: COLOR_PALETTE.primary[50],
    border: COLOR_PALETTE.primary[200],
    text: COLOR_PALETTE.primary[700],
    icon: COLOR_PALETTE.primary[600],
    name: 'Negociación',
  },
  MEDIACION: {
    bg: COLOR_PALETTE.emerald[50],
    border: COLOR_PALETTE.emerald[200],
    text: COLOR_PALETTE.emerald[700],
    icon: COLOR_PALETTE.emerald[600],
    name: 'Mediación',
  },
  CONCILIACION: {
    bg: COLOR_PALETTE.purple[50],
    border: COLOR_PALETTE.purple[200],
    text: COLOR_PALETTE.purple[700],
    icon: COLOR_PALETTE.purple[600],
    name: 'Conciliación',
  },
  ARBITRAJE_PEDAGOGICO: {
    bg: COLOR_PALETTE.amber[50],
    border: COLOR_PALETTE.amber[200],
    text: COLOR_PALETTE.amber[700],
    icon: COLOR_PALETTE.amber[600],
    name: 'Arbitraje Pedagógico',
  },
} as const;

/**
 * Type-safe color access
 */
export type ColorToken = typeof COLOR_PALETTE;
export type SemanticColor = typeof SEMANTIC_COLORS;
export type MechanismColor = typeof GCC_MECHANISM_COLORS;
```

---

**Archivo: `src/shared/design/spacing.ts`**

```typescript
/**
 * Espaciado Semántico - Escala 8px base
 * 
 * Tailwind default: 1 unit = 0.25rem = 4px
 * Nuestra escala: xs=8, sm=16, md=24, lg=32, xl=48
 */

export const SPACING = {
  // Escala base (multiples de 8px)
  xs: 8,    // 0.5rem → Tailwind: p-2
  sm: 16,   // 1rem   → Tailwind: p-4
  md: 24,   // 1.5rem → Tailwind: p-6
  lg: 32,   // 2rem   → Tailwind: p-8
  xl: 48,   // 3rem   → Tailwind: p-12
  '2xl': 64, // 4rem   → Tailwind: p-16
} as const;

/**
 * Mapeo a clases Tailwind (para usar en className)
 */
export const SPACING_CLASSES = {
  // Padding
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12',
  '2xl': 'p-16',

  // Con responsive
  smMd: 'p-4 md:p-6',
  mdLg: 'p-6 md:p-8',

  // Padding X/Y asimétrico
  xy: {
    xSmYSm: 'px-4 py-2',  // 16px x, 8px y (label inside button)
    xSmYMd: 'px-4 py-4',  // 16px x, 16px y (normal padding)
    xMdYSm: 'px-6 py-2',  // 24px x, 8px y (wide button)
  },

  // Gap (en flexbox/grid)
  gap: {
    xs: 'gap-2',     // 8px
    sm: 'gap-4',     // 16px
    md: 'gap-6',     // 24px
    lg: 'gap-8',     // 32px
  },

  // Space-y/space-x (en layout vertical/horizontal)
  spaceY: {
    xs: 'space-y-2',   // 8px
    sm: 'space-y-4',   // 16px
    md: 'space-y-6',   // 24px
    lg: 'space-y-8',   // 32px
  },
} as const;

/**
 * Presets de Layout
 * Usar estos en lugar de valores manuales
 */
export const LAYOUT_PRESETS = {
  // Container
  containerTight: 'px-4 py-6',      // 16px horizontal, 24px vertical
  containerNormal: 'p-6',             // 24px all sides
  containerRelaxed: 'p-8 md:p-12',   // 32px/48px responsive

  // Sections
  sectionDefault: 'space-y-6',        // 24px between sections
  sectionCompact: 'space-y-4',        // 16px between sections

  // Grid
  gridDefault: 'grid grid-cols-12 gap-6',  // 24px gaps
  gridCompact: 'grid grid-cols-12 gap-4',  // 16px gaps

  // Cards en grid
  cardGrid: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6',
} as const;

/**
 * ❌ PROHIBIDO - Nunca usar estos valores
 */
export const SPACING_FORBIDDEN = [
  'p-1', 'p-3', 'p-5', 'p-7', 'p-9', 'p-10', 'p-11',
  'px-1', 'px-3', 'px-5', 'px-7', 'px-9',
  'py-1', 'py-3', 'py-5', 'py-7', 'py-9', 'py-10',
  'gap-0.5', 'gap-1', 'gap-2.5', 'gap-3.5', 'gap-5',
  'space-y-1', 'space-y-3', 'space-y-5', 'space-y-7',
  'space-x-1', 'space-x-3', 'space-x-5',
  'text-[9px]', 'text-[10px]', 'text-[11px]', 'text-[12px]',
  'text-[13px]', 'text-[14px]', 'text-[15px]',
];

export type SpacingToken = typeof SPACING;
```

---

**Archivo: `src/shared/design/typography.ts`**

```typescript
/**
 * Tipografía Semántica - Escala de tamaños coherente
 * 
 * Base: 16px = 1rem (body)
 * Ratio: 1.125 (major third scale)
 */

export const TYPOGRAPHY = {
  // Sistema semántico (uso recomendado)
  caption: {
    size: '12px',      // text-xs
    weight: 400,       // font-normal
    lineHeight: '16px',
    tracking: '0',
    usage: 'Etiquetas, badges, ayuda',
  },

  label: {
    size: '13px',      // custom
    weight: 500,       // font-medium
    lineHeight: '18px',
    tracking: '0.25px',
    usage: 'Labels de formularios, pequeñas',
  },

  body: {
    size: '14px',      // text-sm
    weight: 400,       // font-normal
    lineHeight: '21px',
    tracking: '0',
    usage: 'Texto principal, párrafos',
  },

  bodyStrong: {
    size: '14px',
    weight: 600,       // font-semibold
    lineHeight: '21px',
    tracking: '0',
    usage: 'Énfasis en body, resaltados',
  },

  subtitle: {
    size: '16px',      // text-base
    weight: 500,       // font-medium
    lineHeight: '24px',
    tracking: '0.5px',
    usage: 'Subtítulos, elementos secundarios',
  },

  heading3: {
    size: '18px',      // custom
    weight: 600,       // font-semibold
    lineHeight: '28px',
    tracking: '0',
    usage: 'Títulos de secciones, h3',
  },

  heading2: {
    size: '24px',      // text-2xl
    weight: 700,       // font-bold
    lineHeight: '32px',
    tracking: '0',
    usage: 'Títulos principales, h2',
  },

  heading1: {
    size: '32px',      // text-4xl
    weight: 700,       // font-bold
    lineHeight: '40px',
    tracking: '-0.5px',
    usage: 'Títulos página, h1',
  },
} as const;

/**
 * Mapeo a clases Tailwind
 */
export const TYPOGRAPHY_CLASSES = {
  caption: 'text-xs font-normal',
  label: 'text-xs font-medium',      // Usar custom 13px o text-xs
  body: 'text-sm font-normal',
  bodyStrong: 'text-sm font-semibold',
  subtitle: 'text-base font-medium',
  heading3: 'text-lg font-semibold',  // Usar lg (18px) o custom
  heading2: 'text-2xl font-bold',
  heading1: 'text-4xl font-bold',
} as const;

/**
 * ❌ PROHIBIDO
 */
export const TYPOGRAPHY_FORBIDDEN = [
  'text-[9px]',   // Demasiado pequeño
  'text-[10px]',  // Muy angosto
  'text-[11px]',  // Poco legible
  'text-[12px]',  // Usar text-xs (12px)
  'text-[13px]',  // Custom, no en escala
  'text-[15px]',  // Custom, no en escala
  'font-light',   // 300, no usamos
  'font-thin',    // 100, no usamos
];

export type TypographyToken = typeof TYPOGRAPHY;
```

---

**Archivo: `src/shared/design/classes.ts`**

```typescript
/**
 * Composable Classes - Patrones reutilizables
 * 
 * Objetivo: DRY principle para Tailwind
 * Cambiar un estilo = cambiar en UN lugar
 */

import { SPACING_CLASSES } from './spacing';
import { SEMANTIC_COLORS } from './colors';

/**
 * Componentes Base
 */
export const COMPONENT_CLASSES = {
  // === BUTTONS ===
  buttonBase: `
    inline-flex items-center justify-center
    px-4 py-2
    rounded-lg
    font-medium
    text-sm
    transition-all duration-200
    cursor-pointer
  `,

  buttonPrimary: `
    bg-blue-600 text-white
    hover:bg-blue-700
    active:bg-blue-800
    disabled:bg-slate-300 disabled:text-slate-500
  `,

  buttonSecondary: `
    bg-slate-100 text-slate-900
    hover:bg-slate-200
    active:bg-slate-300
    disabled:bg-slate-100 disabled:text-slate-400
  `,

  buttonDanger: `
    bg-red-600 text-white
    hover:bg-red-700
    active:bg-red-800
    disabled:bg-slate-300 disabled:text-slate-500
  `,

  // === INPUTS ===
  inputBase: `
    w-full
    px-3 py-2
    border border-slate-300
    rounded-lg
    font-normal text-sm
    placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-all duration-200
    disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
  `,

  inputError: `
    border-red-300
    focus:ring-red-500
  `,

  inputSuccess: `
    border-emerald-300
    focus:ring-emerald-500
  `,

  // === CARDS ===
  cardBase: `
    bg-white
    border border-slate-200
    rounded-xl
    p-4 md:p-6
    shadow-sm
    hover:shadow-md
    transition-shadow duration-200
  `,

  cardCompact: `
    bg-white
    border border-slate-200
    rounded-lg
    p-3
    shadow-sm
  `,

  // === SECTIONS ===
  sectionBase: `
    bg-white
    border border-slate-200
    rounded-2xl
    p-4 md:p-6
    shadow-sm
  `,

  sectionWithHeader: `
    bg-white
    border border-slate-200
    rounded-2xl
    overflow-hidden
    shadow-sm
  `,

  // === BADGES ===
  badgeBase: `
    inline-flex items-center gap-1
    px-2 py-1
    rounded-full
    font-semibold text-xs
  `,

  badgeSuccess: `
    bg-emerald-50 text-emerald-700 border border-emerald-200
  `,

  badgeWarning: `
    bg-amber-50 text-amber-700 border border-amber-200
  `,

  badgeError: `
    bg-red-50 text-red-700 border border-red-200
  `,

  badgeInfo: `
    bg-blue-50 text-blue-700 border border-blue-200
  `,

  // === TABLES ===
  tableBase: `
    w-full
    text-sm
  `,

  tableHeader: `
    text-xs font-black uppercase tracking-widest
    text-slate-600 bg-slate-50/50
    border-b border-slate-100
  `,

  tableCell: `
    px-4 py-4
    text-slate-900
  `,

  tableRow: `
    hover:bg-blue-50/40
    transition-colors duration-150
    border-b border-slate-50
  `,

  // === MODALS ===
  modalOverlay: `
    fixed inset-0
    bg-black/50
    z-40
    flex items-center justify-center
    p-4
  `,

  modalContent: `
    bg-white
    rounded-2xl
    shadow-xl
    max-w-lg w-full
    max-h-[90vh]
    overflow-y-auto
    z-50
  `,

  // === ALERTS ===
  alertBase: `
    border-l-4
    rounded-lg
    p-4
    flex items-start gap-3
  `,

  alertSuccess: `
    bg-emerald-50 border-emerald-500 text-emerald-900
  `,

  alertError: `
    bg-red-50 border-red-500 text-red-900
  `,

  alertWarning: `
    bg-amber-50 border-amber-500 text-amber-900
  `,

  alertInfo: `
    bg-blue-50 border-blue-500 text-blue-900
  `,
} as const;

/**
 * Combinations - Pares comúnmente usados
 */
export const COMBINATIONS = {
  // Encabezado con padding
  headerWithPadding: `text-lg font-bold text-slate-900 mb-4`,

  // Descripción bajo encabezado
  description: `text-sm text-slate-500 mb-6`,

  // Contenedor de formulario
  formContainer: `space-y-4`,

  // Fila de botones
  buttonRow: `flex gap-3 justify-end`,

  // Grid de cards flexible
  cardGrid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6`,

  // Flex entre items
  spaceBetween: `flex items-center justify-between`,

  // Centering por vertical/horizontal
  centerBoth: `flex items-center justify-center`,
  centerHorizontal: `flex justify-center`,
  centerVertical: `flex items-center`,
} as const;

export type ComponentClass = typeof COMPONENT_CLASSES;
export type CombinationClass = typeof COMBINATIONS;
```

---

**Archivo: `src/shared/design/index.ts`**

```typescript
// Export centralizado - Single import point
export * from './colors';
export * from './spacing';
export * from './typography';
export * from './classes';

// Re-exports de convenience
export {
  COLOR_PALETTE,
  SEMANTIC_COLORS,
  GCC_MECHANISM_COLORS,
} from './colors';

export {
  SPACING,
  SPACING_CLASSES,
  LAYOUT_PRESETS,
} from './spacing';

export {
  TYPOGRAPHY,
  TYPOGRAPHY_CLASSES,
} from './typography';

export {
  COMPONENT_CLASSES,
  COMBINATIONS,
} from './classes';
```

---

## PARTE 3: Refactorización Ejemplos

### Ejemplo 1: GccDashboard.tsx (ANTES → DESPUÉS)

**ANTES (❌ Hardcoded)**
```tsx
const MECANISMO_CONFIG = [
  {
    type: 'NEGOCIACION_ASISTIDA',
    name: 'Negociación Asistida',
    icon: <Users className="w-4 h-4" />,
    bgClass: 'bg-blue-50 border-blue-200 text-blue-700'  // ← Hardcoded!
  },
  {
    type: 'MEDIACION',
    name: 'Mediación',
    icon: <MessageSquare className="w-4 h-4" />,
    bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700'  // ← Hardcoded!
  },
];
```

**DESPUÉS (✅ Token-based)**
```tsx
import { GCC_MECHANISM_COLORS } from '@/shared/design';

const MECANISMO_CONFIG = [
  {
    type: 'NEGOCIACION_ASISTIDA' as const,
    name: 'Negociación Asistida',
    icon: <Users className="w-4 h-4" />,
    color: GCC_MECHANISM_COLORS.NEGOCIACION_ASISTIDA,  // ← Token!
  },
  {
    type: 'MEDIACION' as const,
    name: 'Mediación',
    icon: <MessageSquare className="w-4 h-4" />,
    color: GCC_MECHANISM_COLORS.MEDIACION,  // ← Token!
  },
];

// En el render:
{config.map((mech) => (
  <div
    key={mech.type}
    className={`
      bg-${mech.color.bg}
      border border-${mech.color.border}
      text-${mech.color.text}
      rounded-xl p-4 transition-all
    `}
  >
    {mech.icon}
    <span>{mech.name}</span>
  </div>
))}
```

---

### Ejemplo 2: Toast.tsx (ANTES → DESPUÉS)

**ANTES (❌ 4 colores hardcoded)**
```tsx
const styles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};
```

**DESPUÉS (✅ Token-based)**
```tsx
import { SEMANTIC_COLORS } from '@/shared/design';

const getToastStyles = (type: Toast['type']) => {
  const feedback = SEMANTIC_COLORS.feedback;
  
  const styles: Record<Toast['type'], string> = {
    success: `${feedback.successBg} border-${feedback.successBorder} text-${feedback.successText}`,
    error: `${feedback.errorBg} border-${feedback.errorBorder} text-${feedback.errorText}`,
    warning: `${feedback.warningBg} border-${feedback.warningBorder} text-${feedback.warningText}`,
    info: `${feedback.infoBg} border-${feedback.infoBorder} text-${feedback.infoText}`,
  };
  
  return styles[type];
};
```

---

### Ejemplo 3: Table.tsx (Agregando Loading State)

**ANTES (❌ Sin skeleton)**
```tsx
return (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      {/* ... header */}
      <tbody className="divide-y divide-slate-50">
        {data.map((item, rowIdx) => (
          <tr key={rowIdx}>
            {/* ... cells */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

**DESPUÉS (✅ Con skeleton loading)**
```tsx
import { Skeleton } from '@/shared/components/ui/Skeleton';

if (isLoading) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={COMPONENT_CLASSES.tableHeader}>
            {columns.map((col, idx) => (
              <th key={idx} className={COMPONENT_CLASSES.tableCell}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {[...Array(5)].map((_, rowIdx) => (
            <tr key={rowIdx} className={COMPONENT_CLASSES.tableRow}>
              {columns.map((_, colIdx) => (
                <td key={colIdx} className={COMPONENT_CLASSES.tableCell}>
                  <Skeleton className="h-5 w-3/4" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

return (
  // ... tabla normal
);
```

---

## PARTE 4: Skill Transfer & Documentation

### Documento: `DESIGN_SYSTEM_GUIDE.md`

```markdown
# 🎨 Design System Guide - Para Developers

## Regla de Oro #1: Nunca hardcodear colores

### ✅ CORRECTO
\`\`\`tsx
import { GCC_MECHANISM_COLORS } from '@/shared/design';

<div className={`bg-${color.bg} text-${color.text}`} />
\`\`\`

### ❌ INCORRECTO
\`\`\`tsx
<div className="bg-blue-50 text-blue-700" />
\`\`\`

---

## Regla de Oro #2: Espaciado solo en escala 8px

### ✅ CORRECTO
\`\`\`tsx
import { SPACING_CLASSES } from '@/shared/design';

<div className="p-4 md:p-6 gap-4" />  // 16px, 24px, 16px gaps
\`\`\`

### ❌ INCORRECTO
\`\`\`tsx
<div className="p-3 gap-0.5" />  // 12px (custom), 2px (weird)
\`\`\`

---

## Regla de Oro #3: Usar CSS classes composables

### ✅ CORRECTO
\`\`\`tsx
import { COMPONENT_CLASSES } from '@/shared/design';

<button className={`${COMPONENT_CLASSES.buttonBase} ${COMPONENT_CLASSES.buttonPrimary}`}>
  Guardar
</button>
\`\`\`

### ❌ INCORRECTO
\`\`\`tsx
<button className="inline-flex items-center ... px-4 py-2 rounded-lg ...">
  Guardar
</button>
\`\`\`

---

## Testing Patterns

### Verificar consistencia de colores
\`\`\`ts
import { GCC_MECHANISM_COLORS, SEMANTIC_COLORS } from '@/shared/design';

test('GCC colors are defined', () => {
  expect(GCC_MECHANISM_COLORS.MEDIACION).toBeDefined();
  expect(GCC_MECHANISM_COLORS.MEDIACION.bg).toMatch(/^#/);
});
\`\`\`

## Checklist antes de commit

- [ ] No hay hardcoded colors (#xxxxx)
- [ ] No hay custom spacing (p-3, p-5, gap-0.5)
- [ ] No hay text-[9px] o text-[10px]
- [ ] Todos los componentes usan COMPONENT_CLASSES
- [ ] Imports from @/shared/design
```

---

## PARTE 5: Aplicación en CentroMediacionGCC (Ejemplo Real)

**Antes (Incompleto):**
```tsx
{showDashboardMetrics && (
  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
    <GccDashboard />
  </div>
)}
```

**Después (Completo con estados):**
```tsx
import { COMPONENT_CLASSES, SPACING_CLASSES } from '@/shared/design';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/shared/components/ui/EmptyState';

{showDashboardMetrics && (
  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
    {isLoadingMetrics ? (
      // LOADING STATE
      <div className={COMPONENT_CLASSES.sectionBase}>
        <div className={SPACING_CLASSES.md}>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>
    ) : metrics.length === 0 ? (
      // EMPTY STATE
      <EmptyState
        icon="📊"
        title="No hay métricas disponibles"
        description="Comienza a registrar mediaciones para ver tendencias"
      />
    ) : (
      // NORMAL STATE
      <GccDashboard metrics={metrics} />
    )}
  </div>
)}
```

---

**Estado:** Ready to implement  
**Tiempo estimado:** 3-4 semanas  
**Impacto:** Enterprise-grade design system
