import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '../e2e/helpers/auth';

test.describe('Performance - GCC Mediation', () => {
  test('should add commitment in less than 500ms', async ({ page }) => {
    await ensureAuthenticated(page, '/mediacion/gcc');

    // Wait for GCC interface to be ready
    await page.waitForSelector('[data-testid="gcc-interface"]');

    // Click add commitment button
    await page.click('[data-testid="add-commitment-btn"]');

    const startTime = Date.now();

    // Fill commitment form
    await page.fill('[data-testid="commitment-description"]', 'Test commitment');
    await page.fill('[data-testid="commitment-date"]', '2026-12-31');
    await page.click('[data-testid="save-commitment-btn"]');

    // Wait for save operation
    await page.waitForSelector('[data-testid="commitment-saved"]', { timeout: 2000 });

    const operationTime = Date.now() - startTime;
    expect(operationTime).toBeLessThan(500);

    console.log(`Add commitment time: ${operationTime}ms`);
  });

  test('should handle multiple commitments without performance degradation', async ({ page }) => {
    await ensureAuthenticated(page, '/mediacion/gcc');

    await page.waitForSelector('[data-testid="gcc-interface"]');

    const times: number[] = [];

    // Add 5 commitments and measure each
    for (let i = 1; i <= 5; i++) {
      const startTime = Date.now();

      await page.click('[data-testid="add-commitment-btn"]');
      await page.fill('[data-testid="commitment-description"]', `Commitment ${i}`);
      await page.fill('[data-testid="commitment-date"]', '2026-12-31');
      await page.click('[data-testid="save-commitment-btn"]');
      await page.waitForSelector('[data-testid="commitment-saved"]');

      const time = Date.now() - startTime;
      times.push(time);
      console.log(`Commitment ${i} time: ${time}ms`);
    }

    // Check that performance doesn't degrade significantly
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const maxTime = Math.max(...times);

    expect(avgTime).toBeLessThan(600);
    expect(maxTime).toBeLessThan(1000);

    console.log(`Average time: ${avgTime}ms, Max time: ${maxTime}ms`);
  });

  test('should load mediation list efficiently', async ({ page }) => {
    await ensureAuthenticated(page, '/mediacion');

    const startTime = Date.now();
    await page.waitForSelector('[data-testid="mediation-list"]');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2500);

    // Check if list has items (even if empty, should render fast)
    const listItems = await page.locator('[data-testid="mediation-item"]').count();
    console.log(`Mediation list loaded in ${loadTime}ms with ${listItems} items`);
  });
});