import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '../e2e/helpers/auth';

test.describe('Performance - Dashboard', () => {
  test('should load dashboard in less than 3 seconds', async ({ page }) => {
    await ensureAuthenticated(page);

    const startTime = Date.now();
    await page.goto('/mediacion');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);

    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('should render GCC interface within 2 seconds', async ({ page }) => {
    await ensureAuthenticated(page, '/mediacion/gcc');

    const startTime = Date.now();
    await page.waitForSelector('[data-testid="gcc-interface"]', { timeout: 5000 });
    const renderTime = Date.now() - startTime;

    expect(renderTime).toBeLessThan(2000);
    console.log(`GCC interface render time: ${renderTime}ms`);
  });
});