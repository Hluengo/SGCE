# E2E Testing Guide - Playwright

Guía completa para tests end-to-end con Playwright en el módulo GCC.

---

## Tabla de Contenidos

1. [Setup](#setup)
2. [Comandos](#comandos)
3. [Escribir Tests](#escribir-tests)
4. [Patterns](#patterns)
5. [Debugging](#debugging)
6. [CI/CD Integration](#cicd-integration)
7. [Performance Profiling](#performance-profiling)
8. [Best Practices](#best-practices)

---

## Setup

### Instalación

```bash
npm install --save-dev @playwright/test
```

### Configuración Inicial

```bash
npx playwright install
npx playwright install-deps
```

### Navegadores Soportados

- ✅ Chromium
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome
- ✅ Mobile Safari

---

## Comandos

### Ejecutar Todos los E2E Tests

```bash
npm run test:e2e
```

**Output esperado:**
```
Running 30+ tests...
✓ GCC Mediación - User Journeys (15 tests)
✓ GCC Mediación - Advanced Scenarios (18 tests)
...
Test Files: 2 passed (2)
Tests: 33 passed (33)
Duration: ~45s
```

### Ejecutar Tests Específicos

```bash
# Un archivo en particular
npm run test:e2e -- GCC.e2e.spec.ts

# Patrón de nombre
npm run test:e2e -- --grep "Derivación"

# Solo mobile
npm run test:e2e -- --project=Mobile\ Chrome

# Solo Chromium
npm run test:e2e -- --project=chromium
```

### Debug Mode

```bash
# Abre Playwright Inspector y pausa en cada paso
npm run test:e2e:debug

# Modo --trace para ver grabación
npm run test:e2e -- --trace on
```

### UI Mode (Recomendado para desarrollo)

```bash
npm run test:e2e:ui
```

Abre interfaz interactiva donde:
- ✅ Ver/pausar tests
- ✅ Ir a paso anterior/siguiente
- ✅ Ver logs de cada paso
- ✅ Screenshot en cada interacción

### Ver Report

```bash
npm run test:e2e:report
```

Abre reporte HTML con:
- ✅ Resumen de tests
- ✅ Screenshots
- ✅ Videos (si fallaron)
- ✅ Traces

---

## Escribir Tests

### Estructura Básica

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Mi Suite de Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Setup: navegar a página, login, etc
    await page.goto('/mediacion');
    await page.waitForLoadState('networkidle');
  });

  test('Mi primer test', async () => {
    // AAA Pattern:
    
    // Arrange (preparar)
    const button = page.locator('button', { hasText: /click/i });
    
    // Act (actuar)
    await button.click();
    
    // Assert (verificar)
    await expect(page).toHaveTitle(/resultado/i);
  });

  test.afterEach(async () => {
    // Cleanup
  });
});
```

### Localizadores (Selectores)

**Preferencia (en orden):**

1. ✅ **Roles** - más resiliente a cambios de UI
```typescript
page.locator('[role="button"]')
page.locator('[role="table"]')
page.locator('[role="alert"]')
```

2. ✅ **Accesibilidad** - ARIA labels
```typescript
page.locator('button', { hasText: /agregar/i })
page.getByLabel('Descripción')
page.getByPlaceholder('Ingrese datos')
```

3. ⚠️ **CSS selectores** - frágil
```typescript
page.locator('.btn-primary')  // Puede cambiar
```

4. ❌ **XPath** - muy frágil
```typescript
page.locator('//div[@id="foo"]//button')  // NO USAR
```

**Ejemplos:**

```typescript
// Por texto (case-insensitive)
page.locator('button', { hasText: /guardar/i })

// Por atributo
page.locator('input[type="email"]')

// Combinado
page.locator('button', { hasText: /eliminar/i }).first()

// Dentro de elemento
const form = page.locator('form').first();
form.locator('input[type="text"]')
```

### Esperas (Waits)

```typescript
// Esperar a elemento visible
await page.locator('button').waitFor({ state: 'visible' });
await expect(button).toBeVisible();

// Esperar a que cargue la página
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');

// Esperar a navegación
await page.waitForNavigation();

// Esperar a URL
await page.waitForURL('**/mediacion/**');

// Esperar a elemento (timeout)
await page.locator('button').isVisible({ timeout: 5000 });
```

### Interacciones (Acciones)

```typescript
// Clicks
await button.click();
await button.click({ position: { x: 10, y: 10 } });
await button.dblClick();
await button.rightClick();

// Fill (input, textarea)
await input.fill('nuevo valor');
await input.clear();

// Type (carácter por carácter)
await input.type('texto');

// Select (dropdown)
await select.selectOption('valor');
await select.selectOption({ label: 'Etiqueta' });

// Keyboard
await page.keyboard.press('Tab');
await page.keyboard.press('Enter');
await page.keyboard.type('texto');

// Mouse hover
await element.hover();

// Drag and drop
await source.dragTo(target);
```

### Assertions (Verificaciones)

```typescript
// Visibilidad
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Habilitado/Deshabilitado
await expect(button).toBeEnabled();
await expect(button).toBeDisabled();

// Contenido
await expect(element).toContainText('texto esperado');
await expect(element).toHaveText('texto exacto');
await expect(page).toHaveTitle(/título/i);

// Valor de input
await expect(input).toHaveValue('valor');
await expect(input).toHaveAttribute('placeholder', 'ingrese...');

// Conteo
const buttons = page.locator('button');
await expect(buttons).toHaveCount(3);

// Estado
await expect(checkbox).toBeChecked();
await expect(input).toBeFocused();

// Propiedades CSS
await expect(element).toHaveCSS('color', 'rgb(0, 0, 0)');
```

---

## Patterns

### Pattern 1: Page Object Model

```typescript
// pages/MediacionPage.ts
export class MediacionPage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/mediacion');
    await this.page.waitForLoadState('networkidle');
  }

  async clickDerivateButton() {
    const button = this.page.locator('button', { hasText: /derivar/i });
    await button.click();
  }

  async fillMotivo(motivo: string) {
    const input = this.page.locator('input, textarea', { hasText: /motivo/i });
    await input.fill(motivo);
  }

  async submitForm() {
    const button = this.page.locator('button', { hasText: /guardar|crear/i });
    await button.click();
  }

  async expectSuccessMessage() {
    const message = this.page.locator('text=/éxito|completada/i');
    await expect(message).toBeVisible({ timeout: 5000 });
  }
}

// tests/mediacion.e2e.spec.ts
import { MediacionPage } from '../pages/MediacionPage';

test('should create derivation', async ({ page }) => {
  const mediacionPage = new MediacionPage(page);
  
  await mediacionPage.goto();
  await mediacionPage.clickDerivateButton();
  await mediacionPage.fillMotivo('Test motivo');
  await mediacionPage.submitForm();
  await mediacionPage.expectSuccessMessage();
});
```

### Pattern 2: Fixtures (Datos predefinidos)

```typescript
// fixtures/test-data.ts
export const testData = {
  mediacion: {
    motivo: 'Conflicto estudiantil para mediación',
    objetivos: ['Restauración', 'Convivencia'],
    fechaMediacion: '2025-03-01'
  },
  compromiso: {
    descripcion: 'Asistir a todas las clases',
    fecha: '2025-03-15',
    responsable: 'Estudiante'
  }
};

// test.e2e.spec.ts
import { testData } from '../fixtures/test-data';

test('should add compromise', async ({ page }) => {
  const input = page.locator('input[placeholder*="descripción"]');
  await input.fill(testData.compromiso.descripcion);
});
```

### Pattern 3: Retry Logic

```typescript
// utils/retry.ts
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 500
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

// test.e2e.spec.ts
test('should handle network errors', async ({ page }) => {
  const result = await retry(
    () => page.locator('button').click(),
    3,
    500
  );
});
```

---

## Debugging

### Console Output

```typescript
// Imprimir en consola
await page.evaluate(() => console.log('Debug info'));

// Ver todo el DOM
const html = await page.content();
console.log(html);

// Screenshot
await page.screenshot({ path: 'debug.png' });

// Video (configurado en playwright.config.ts)
// Automático si test falla
```

### Playwright Inspector

```bash
# Abre el inspector (pausar y step-through)
PWDEBUG=1 npm run test:e2e

# O usar modo debug
npm run test:e2e:debug
```

### Logger Custom

```typescript
test('con logging detallado', async ({ page }) => {
  console.log('1. Navegando...');
  await page.goto('/mediacion');
  
  console.log('2. Esperando contenido...');
  await page.waitForLoadState('networkidle');
  
  console.log('3. Localizando elemento...');
  const button = page.locator('button').first();
  
  console.log('4. Haciendo click...');
  await button.click();
  
  console.log('5. Verificando resultado...');
  const message = page.locator('text=/éxito/i');
  await expect(message).toBeVisible();
  console.log('✅ Test completado');
});
```

### Trace Viewer

```bash
# Generar traces (configurado en config)
npm run test:e2e -- --trace on

# Ver traces
npm run test:e2e:report
# Luego seleccionar un test fallido, click en "Trace"
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e:run
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-push

echo "🧪 Ejecutando E2E tests..."
npm run test:e2e:run

if [ $? -ne 0 ]; then
  echo "❌ E2E tests fallaron"
  exit 1
fi

echo "✅ E2E tests pasaron"
```

---

## Performance Profiling

### Medir Performance

```typescript
test('medir tiempo de carga', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/mediacion', { waitUntil: 'networkidle' });
  
  const loadTime = Date.now() - startTime;
  console.log(`Tiempo de carga: ${loadTime}ms`);
  expect(loadTime).toBeLessThan(3000);
});
```

### Lighthouse Integration

```typescript
test('verificar performance score', async ({ page }) => {
  await page.goto('/mediacion');
  
  // Evaluar performance
  const score = await page.evaluate(() => {
    // Usar web vitals o similar
    return (performance as any).timing.loadEventEnd - 
           (performance as any).timing.navigationStart;
  });
  
  console.log(`Performance score: ${score}ms`);
  expect(score).toBeLessThan(2000);
});
```

---

## Best Practices

### ✅ DO's

```typescript
// 1. Usar roles y accesibilidad
await page.getByRole('button', { name: /guardar/i }).click();

// 2. Esperar correctamente
await expect(element).toBeVisible({ timeout: 5000 });

// 3. Usar Page Object Model
const mediacionPage = new MediacionPage(page);
await mediacionPage.derivate();

// 4. Tests independientes
// Cada test no depende de otro

// 5. Nombres descriptivos
test('should successfully create mediation derivation with valid data', async () => {
  // ...
});

// 6. Setup y teardown
test.beforeEach(async ({ page }) => {
  // Setup
});

test.afterEach(async ({ page }) => {
  // Cleanup
});
```

### ❌ DON'Ts

```typescript
// 1. NO usar sleep (esperas duras)
await page.waitForTimeout(2000);  // ❌ NO

// 2. NO usar XPath complejos
page.locator('//div[@id="foo"]/button')  // ❌ NO

// 3. NO hardcodear timings
{ timeout: 30000 }  // ❌ Demasiado

// 4. NO depender de orden de tests
test.sequential();  // ❌ Evitar

// 5. NO tests muy largos
// ✅ Mantener < 2 minutos cada test

// 6. NO ignorar errores
await expect(element).toBeVisible();  // ❌ Sin lógica
```

---

## Cobertura de Tests E2E

### Áreas a Testear

| Área | Tests |
|---|---|
| Derivación | 3 |
| Compromisos | 5 |
| Acta | 3 |
| Cierre | 3 |
| Errores | 5 |
| Performance | 3 |
| Accesibilidad | 3 |
| Responsive | 3 |
| **Total** | **28+** |

### Flujos Críticos

- ✅ Derivación → Compromisos → Acta → Cierre
- ✅ Error: Derivación sin datos
- ✅ Multi-usuario simultáneo
- ✅ Timeout y reintento

---

## Troubleshooting

### Test falla: Element not found

```typescript
// Problema: No espera correctamente
const button = page.locator('button').click();  // ❌

// Solución: Esperar primero
const button = page.locator('button');
await expect(button).toBeVisible({ timeout: 5000 });
await button.click();  // ✅
```

### Test es flakey (a veces falla)

```typescript
// Problema: Race condition
await page.locator('button').click();
await page.locator('text=/resultado/i');  // ❌ Puede no estar listo

// Solución: Esperar explícitamente
await page.locator('button').click();
await expect(page.locator('text=/resultado/i')).toBeVisible({ timeout: 5000 });  // ✅
```

### Timeout esperando elemento

```typescript
// Aumentar timeout para elementos lentos
await expect(element).toBeVisible({ timeout: 10000 });

// O usar retry pattern
for (let i = 0; i < 3; i++) {
  try {
    await element.click();
    break;
  } catch {
    await page.reload();
  }
}
```

---

## Recursos

- [Playwright Docs](https://playwright.dev)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Debugging](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

**Última actualización:** 18 de febrero de 2026
**Versión:** 1.0.0
