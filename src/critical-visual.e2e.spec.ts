import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '@/e2e/helpers/auth';

const CRITICAL_ROUTES = [
  { name: 'dashboard', path: '/' },
  { name: 'expedientes', path: '/expedientes' },
  { name: 'mediacion-gcc', path: '/mediacion' },
  { name: 'evidencias', path: '/evidencias' },
  { name: 'admin-config', path: '/admin' },
];

const ROUTE_READY_TEXT: Record<(typeof CRITICAL_ROUTES)[number]['name'], RegExp> = {
  dashboard: /Panel de Gestión Normativa|Dashboard|Gestión Normativa/i,
  expedientes: /Gestión de Expedientes/i,
  'mediacion-gcc': /Mecanismos GCC Adoptados|Gestión Colaborativa|GCC|Mediación/i,
  evidencias: /Evidencias|Gestión de Evidencias/i,
  'admin-config': /Panel Integral Multi-Tenant|Superadministracion|Superadministración/i,
};

test.describe('@visual Critical Screens', () => {
  test.setTimeout(90000);

  for (const route of CRITICAL_ROUTES) {
    test(`snapshot ${route.name}`, async ({ page }) => {
      await page.addInitScript(() => {
        const fixedNow = new Date('2026-02-23T12:00:00.000Z').valueOf();
        Date.now = () => fixedNow;
        Math.random = () => 0.123456789;
      });
      await page.route('**/realtime/v1/**', (routeRequest) => routeRequest.abort());
      await ensureAuthenticated(page, route.path);
      await page.goto(route.path);
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.getByText(/Módulo:/i).first()).toBeVisible({ timeout: 30000 });
      await expect(page.getByRole('heading', { name: /Gestion y Cumplimiento Escolar/i })).toHaveCount(0);
      await expect(page.getByText(ROUTE_READY_TEXT[route.name]).first()).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(900);

      const dynamicMasks = [
        page.locator('text=/Actualizado|hace\\s+-?\\d+[smh]/i'),
        page.locator('text=/Cargando|Procesando/i'),
        page.locator('[role="status"]'),
        page.locator('.animate-pulse'),
        page.locator('[data-testid="toast-root"]'),
        page.locator('[aria-live="polite"]'),
        page.locator('time'),
        page.locator('[class*="realtime"], [class*="timestamp"], [class*="clock"], [class*="fecha"], [class*="time"]'),
      ];

      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        mask: dynamicMasks,
        maxDiffPixelRatio: 0.04,
        timeout: 15000,
      });
    });
  }
});
