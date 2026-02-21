import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '../e2e/helpers/auth';

test.describe('Performance - Search and Navigation', () => {
  test('should perform search in less than 1 second', async ({ page }) => {
    await ensureAuthenticated(page, '/mediacion');

    await page.waitForSelector('[data-testid="search-input"]');

    const startTime = Date.now();

    await page.fill('[data-testid="search-input"]', 'test case');
    await page.press('[data-testid="search-input"]', 'Enter');

    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 2000 });

    const searchTime = Date.now() - startTime;
    expect(searchTime).toBeLessThan(1000);

    console.log(`Search time: ${searchTime}ms`);
  });

  test('should navigate between pages smoothly', async ({ page }) => {
    await ensureAuthenticated(page);

    const navigationTimes: number[] = [];

    // Navigate to different sections
    const routes = ['/mediacion', '/mediacion/gcc', '/admin/config'];

    for (const route of routes) {
      const startTime = Date.now();

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const navTime = Date.now() - startTime;
      navigationTimes.push(navTime);

      expect(navTime).toBeLessThan(3000);
      console.log(`Navigation to ${route}: ${navTime}ms`);
    }

    const avgNavTime = navigationTimes.reduce((a, b) => a + b) / navigationTimes.length;
    expect(avgNavTime).toBeLessThan(2000);

    console.log(`Average navigation time: ${avgNavTime}ms`);
  });

  test('should handle rapid interactions without lag', async ({ page }) => {
    await ensureAuthenticated(page, '/mediacion/gcc');

    await page.waitForSelector('[data-testid="gcc-interface"]');

    // Simulate rapid clicking (debounce test)
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="add-commitment-btn"]');
      await page.waitForTimeout(50); // Small delay to simulate user behavior
    }

    // Should not cause performance issues or crashes
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(2000);

    console.log(`Rapid interaction test completed in ${totalTime}ms`);
  });

  test('should maintain performance under memory pressure', async ({ page }) => {
    await ensureAuthenticated(page, '/mediacion');

    // Load multiple pages to simulate memory usage
    const pages = ['/mediacion', '/mediacion/gcc', '/admin/config'];

    for (const route of pages) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    // Go back and measure if performance degraded
    const startTime = Date.now();
    await page.goto('/mediacion');
    await page.waitForLoadState('networkidle');

    const reloadTime = Date.now() - startTime;
    expect(reloadTime).toBeLessThan(2500);

    console.log(`Reload time after memory pressure: ${reloadTime}ms`);
  });
});