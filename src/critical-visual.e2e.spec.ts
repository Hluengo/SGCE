import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '@/e2e/helpers/auth';

const CRITICAL_ROUTES = [
  { name: 'dashboard', path: '/' },
  { name: 'expedientes', path: '/expedientes' },
  { name: 'mediacion-gcc', path: '/mediacion' },
  { name: 'evidencias', path: '/evidencias' },
  { name: 'admin-config', path: '/admin' },
];

test.describe('@visual Critical Screens', () => {
  for (const route of CRITICAL_ROUTES) {
    test(`snapshot ${route.name}`, async ({ page }) => {
      await ensureAuthenticated(page, route.path);
      await page.waitForLoadState('networkidle');

      const dynamicMasks = [
        page.locator('text=/Actualizado|hace\\s+\\d+[smh]/i'),
        page.locator('text=/Cargando|Procesando/i'),
      ];

      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        mask: dynamicMasks,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
