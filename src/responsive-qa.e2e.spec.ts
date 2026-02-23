import { expect, test } from '@playwright/test';
import { ensureAuthenticated } from '@/e2e/helpers/auth';

const CRITICAL_ROUTES = [
  { name: 'dashboard', path: '/' },
  { name: 'expedientes', path: '/expedientes' },
  { name: 'mediacion', path: '/mediacion' },
  { name: 'evidencias', path: '/evidencias' },
  { name: 'admin', path: '/admin' },
  { name: 'calendario', path: '/calendario' },
  { name: 'apoyo', path: '/apoyo' },
  { name: 'patio', path: '/patio' },
  { name: 'bitacora', path: '/bitacora' },
  { name: 'archivo', path: '/archivo' },
  { name: 'auditoria', path: '/auditoria' },
  { name: 'admin-colegios', path: '/admin/colegios' },
];

test.describe('@responsive QA', () => {
  for (const route of CRITICAL_ROUTES) {
    test(`route ${route.name} has no horizontal overflow and valid touch controls`, async ({ page }) => {
      await ensureAuthenticated(page, route.path);
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const audit = await page.evaluate(() => {
        const viewportWidth = window.innerWidth;
        const htmlWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body?.scrollWidth ?? 0;
        const maxWidth = Math.max(viewportWidth, htmlWidth, bodyWidth);
        const overflowPx = Math.max(0, Math.round((maxWidth - viewportWidth) * 100) / 100);

        const selectors = [
          'button',
          'input[type="button"]',
          'input[type="submit"]',
          'input[type="reset"]',
          'select'
        ].join(',');

        const offenders: Array<{ tag: string; label: string; width: number; height: number }> = [];
        const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors));

        for (const element of elements) {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          const disabled = element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
          const hidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
          const notVisible = rect.width <= 0 || rect.height <= 0;

          if (disabled || hidden || notVisible) continue;

          if (rect.width < 44 || rect.height < 44) {
            offenders.push({
              tag: element.tagName.toLowerCase(),
              label:
                element.getAttribute('aria-label') ||
                element.textContent?.trim().slice(0, 40) ||
                element.id ||
                '(sin etiqueta)',
              width: Math.round(rect.width * 10) / 10,
              height: Math.round(rect.height * 10) / 10,
            });
          }
        }

        return { overflowPx, offenders: offenders.slice(0, 10), totalOffenders: offenders.length };
      });

      expect(audit.overflowPx, `Overflow horizontal en ${route.path}: ${audit.overflowPx}px`).toBeLessThanOrEqual(1);
      expect(
        audit.totalOffenders,
        `Touch targets <44px en ${route.path}: ${JSON.stringify(audit.offenders)}`
      ).toBe(0);
    });
  }
});
