# 🚀 QUICK REFERENCE - Design System + Refactoring Commands

## PARTE 1: Design System Quick Start

### The 3-Token Rule

```tsx
// Rule 1: Colors come from tokens
import { GCC_MECHANISM_COLORS } from '@/shared/design';
const color = GCC_MECHANISM_COLORS.MEDIACION;
<div className={`bg-${color.bg} border-${color.border}`} />

// Rule 2: Spacing ALWAYS in 8px scale
className="p-4 gap-4 space-y-6"  // 16px, 16px, 24px ✅
className="p-3 gap-0.5"           // 12px, 2px ❌

// Rule 3: Use composable classes
import { COMPONENT_CLASSES } from '@/shared/design';
className={`${COMPONENT_CLASSES.buttonBase} ${COMPONENT_CLASSES.buttonPrimary}`}
```

---

## PARTE 2: Forbidden Standards (Anti-Patterns)

### 🚫 NEVER DO THIS

```tsx
// ❌ Hardcoded colors
className="bg-blue-50 text-blue-700"        // Use tokens!
style={{ color: '#2563eb' }}                // Use tokens!

// ❌ Custom spacing (not 8px aligned)
className="p-3"       // 12px - use p-4 (16px) instead
className="gap-0.5"   // 2px - use gap-2 (8px) or gap-4
className="space-y-3" // 12px - use space-y-4 (16px)

// ❌ Custom font sizes
className="text-[9px]"   // Create semantic token instead
className="text-[10px]"  // Use text-xs (12px)
className="text-[13px]"  // Use text-sm (14px)

// ❌ Asymmetric padding
className="px-4 py-3"   // 16x12 (weird!)
className="px-6 py-2"   // Avoid unless intentional

// ❌ Inline styles for responsive
style={{ paddingLeft: isSmall ? '8px' : '16px' }}  // Use Tailwind responsive
```

---

## PARTE 3: Figma to Code Mapping

### Colors
```
Design System Color  →  Token Path                    →  Usage
────────────────────────────────────────────────────────────────────
Primary Blue         →  GCC_MECHANISM_COLORS.MEDIACION →  Mediación
Success Green        →  SEMANTIC_COLORS.state.success  →  Confirmaciones
Error Red            →  SEMANTIC_COLORS.state.error    →  Errores
Neutral Gray         →  COLOR_PALETTE.slate[600]       →  Texto secundario
```

### Spacing
```
Figma Spacing  →  Tailwind Class  →  Pixel Value  →  Use Case
──────────────────────────────────────────────────────────────────
8px            →  p-2, gap-2      →  8px          →  Dense, icon margins
16px           →  p-4, gap-4      →  16px         →  Normal (default)
24px           →  p-6, gap-6      →  24px         →  Relaxed, sections
32px           →  p-8, gap-8      →  32px         →  Spacious, headers
48px           →  p-12, gap-12    →  48px         →  Very spacious
```

### Typography
```
Design  →  Tailwind Class    →  Token              →  Usage
────────────────────────────────────────────────────────────────────
9px     →  ❌ DON'T USE       →  TYPOGRAPHY.caption →  Tiny labels
12px    →  text-xs           →  TYPOGRAPHY.caption →  Captions
14px    →  text-sm           →  TYPOGRAPHY.body    →  Body text
16px    →  text-base         →  TYPOGRAPHY.subtitle→  Subtitles
18px    →  text-lg           →  TYPOGRAPHY.heading3→ Heading 3
24px    →  text-2xl          →  TYPOGRAPHY.heading2→ Heading 2
32px    →  text-4xl          →  TYPOGRAPHY.heading1→ Heading 1
```

---

## PARTE 4: Component Patterns

### Button Patterns
```tsx
import { COMPONENT_CLASSES } from '@/shared/design';

// Primary CTA
<button className={`${COMPONENT_CLASSES.buttonBase} ${COMPONENT_CLASSES.buttonPrimary}`}>
  Guardar
</button>

// Secondary
<button className={`${COMPONENT_CLASSES.buttonBase} ${COMPONENT_CLASSES.buttonSecondary}`}>
  Cancelar
</button>

// Destructive (delete, etc)
<button className={`${COMPONENT_CLASSES.buttonBase} ${COMPONENT_CLASSES.buttonDanger}`}>
  Eliminar
</button>
```

### Card Patterns
```tsx
// Basic card
<div className={COMPONENT_CLASSES.cardBase}>
  Contenido
</div>

// Section with header
<div className={COMPONENT_CLASSES.sectionBase}>
  <h3>Título</h3>
  <p>Contenido</p>
</div>
```

### Form Patterns
```tsx
// Input
<input className={COMPONENT_CLASSES.inputBase} placeholder="Buscar..." />

// Input with validation error
<input className={`${COMPONENT_CLASSES.inputBase} ${COMPONENT_CLASSES.inputError}`} />

// Checkbox/Radio + Label
<label className="flex items-center gap-3 cursor-pointer">
  <input type="checkbox" />
  <span>Opción</span>
</label>
```

### Alert Patterns
```tsx
// Success alert
<div className={`${COMPONENT_CLASSES.alertBase} ${COMPONENT_CLASSES.alertSuccess}`}>
  <CheckCircle className="w-5 h-5" />
  <span>Cambios guardados correctamente</span>
</div>

// Error alert
<div className={`${COMPONENT_CLASSES.alertBase} ${COMPONENT_CLASSES.alertError}`}>
  <AlertCircle className="w-5 h-5" />
  <span>Error: No se pudo guardar</span>
</div>
```

---

## PARTE 5: State Management Patterns

### Loading State
```tsx
import { Skeleton } from '@/shared/components/ui/Skeleton';

{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-6 w-full" />
    <Skeleton className="h-6 w-5/6" />
  </div>
) : (
  <YourContent />
)}
```

### Empty State
```tsx
import { EmptyState } from '@/shared/components/ui/EmptyState';

{items.length === 0 ? (
  <EmptyState
    icon="📋"
    title="No hay expedientes"
    description="Crea uno nuevo para empezar"
    action={{ label: 'Crear', onClick: handleCreate }}
  />
) : (
  <ItemList items={items} />
)}
```

### Error State
```tsx
{error ? (
  <div className={`${COMPONENT_CLASSES.alertBase} ${COMPONENT_CLASSES.alertError}`}>
    <AlertCircle className="w-5 h-5" />
    <div>
      <strong>Error</strong>
      <p>{error.message}</p>
      <button onClick={retry}>Reintentar</button>
    </div>
  </div>
) : (
  <Content />
)}
```

### Success State (Transition)
```tsx
// Smooth transition with toast
const handleSave = async () => {
  setIsSaving(true);
  try {
    await saveData();
    addToast('Guardado correctamente', 'success');
    // Data updates appear smoothly
  } catch (err) {
    addToast('Error: ' + err.message, 'error');
  } finally {
    setIsSaving(false);
  }
};
```

---

## PARTE 6: GCC-Specific Patterns

### Mechanism Card
```tsx
import { GCC_MECHANISM_COLORS } from '@/shared/design';

{mechanisms.map((mech) => {
  const color = GCC_MECHANISM_COLORS[mech.type];
  return (
    <div key={mech.type} className={`
      rounded-xl border p-4
      bg-${color.bg}
      border-${color.border}
      text-${color.text}
    `}>
      {/* Card content */}
    </div>
  );
})}
```

### GCC Status Badge
```tsx
<span className={`
  inline-flex items-center gap-1
  px-2 py-1 rounded-full
  text-xs font-semibold
  ${statusColor.badge}
`}>
  {statusIcon}
  {statusLabel}
</span>
```

---

## PARTE 7: Refactoring Checklist

When refactoring a component:

```
Pre-Refactor:
☐ Write failing tests for new behavior
☐ Backup original file (git diff)
☐ Identify all hardcoded colors/spacing

During:
☐ Replace colors with tokens
☐ Normalize spacing to 8px scale
☐ Add loading state skeleton
☐ Add empty state UI
☐ Add error state UI
☐ Keep all tests green

Post-Refactor:
☐ Run npm test -- --run
☐ Run npm run build
☐ Visual regression test (manual)
☐ Accessibility audit (axe)
☐ Cross-browser check
☐ Mobile responsive verify
☐ Document changes in PR
☐ Request review from architect
```

---

## PARTE 8: File Organization

```
After Refactoring Complete:

src/
├── shared/
│   ├── design/                 ← CENTRALIZED SYSTEM
│   │   ├── tokens.ts
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   ├── classes.ts
│   │   └── index.ts
│   ├── components/
│   │   └── ui/
│   │       ├── Skeleton.tsx    ← REUSABLE STATES
│   │       ├── Spinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoadingState.tsx
│   │       └── Toast/
│   └── hooks/
│       └── useDesignTokens.ts  ← TOKEN ACCESS
│
└── features/
    ├── mediacion/
    │   └── components/
    │       ├── GccDashboard.tsx    ✅ REFACTORED
    │       └── ...
    └── expedientes/
        └── components/
            ├── ExpedientesList.tsx  ✅ REFACTORED
            └── ...
```

---

## PARTE 9: Common Mistakes to Avoid

```tsx
// ❌ WRONG: Dynamic color classes
const color = isError ? 'red' : 'blue';
className={`bg-${color}-50`}  // Tailwind won't compile

// ✅ RIGHT: Static classes
const bgClass = isError 
  ? COMPONENT_CLASSES.inputError
  : COMPONENT_CLASSES.inputBase;
className={bgClass}

// ❌ WRONG: Deeply nested ternaries
className={isLoading ? 'opacity-50 pointer-events-none scale-95 transition-all duration-300' : ''}

// ✅ RIGHT: Use constants
const loadingClasses = isLoading 
  ? 'opacity-50 pointer-events-none scale-95 transition-all duration-300'
  : '';
className={loadingClasses}

// ❌ WRONG: Mix design systems
const color1 = 'bg-blue-50';  // Hardcoded
const color2 = COLOR_PALETTE.blue[50];  // Token
// Can't mix!

// ✅ RIGHT: All tokens
import { COLOR_PALETTE, GCC_MECHANISM_COLORS } from '@/shared/design';
// Use consistently
```

---

## PARTE 10: Testing Design System

### Unit Tests
```typescript
import { COLOR_PALETTE, SEMANTIC_COLORS, GCC_MECHANISM_COLORS } from '@/shared/design';

describe('Design Tokens', () => {
  test('All colors are defined', () => {
    expect(COLOR_PALETTE.primary[600]).toBeDefined();
    expect(COLOR_PALETTE.primary[600]).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test('GCC mechanism colors are distinct', () => {
    const colors = Object.values(GCC_MECHANISM_COLORS);
    const bgColors = colors.map(c => c.bg);
    expect(new Set(bgColors).size).toBe(bgColors.length);
  });

  test('No hardcoded colors in components', () => {
    // CI check: grep -r "bg-\|text-\|border-" src/features --include="*.tsx"
    // Should only find Tailwind utility names, not hex codes
  });
});
```

### Visual Regression
```bash
# Run chromatic snapshots
npm run chromatic -- --auto-accept-changes
```

---

## PARTE 11: Git Workflow

```bash
# Feature branch
git checkout -b refactor/gcc-design-tokens

# Make changes, keep tests green
npm test -- --run

# Commit explicitly
git add src/shared/design/
git commit -m "feat: Add design tokens system (single source of truth)"

git add src/features/mediacion/components/GccDashboard.tsx
git commit -m "refactor(gcc): Use color tokens instead of hardcodes"

# Push and create PR with template
```

---

## PARTE 12: Success Metrics

Track these during + after refactoring:

```
📊 METRICS TO MONITOR

Pre-Refactor Baseline:
- Test coverage: 65%
- Build time: 12s
- Components with hardcodes: 47
- Spacing inconsistency: 65%

Post-Refactor Target:
- Test coverage: 85%+
- Build time: <10s
- Components with hardcodes: 0
- Spacing inconsistency: <5%

Success Indicators:
✅ No test failures
✅ Build time same or faster
✅ Visual regression: 0 unexpected
✅ A11y: 0 errors
✅ Performance: same or better
```

---

**Quick Reference Version:** 1.0  
**Last Updated:** 19.02.2026  
**Status:** 🟢 Ready to use
