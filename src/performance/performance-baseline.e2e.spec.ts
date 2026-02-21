import { expect, test } from '@playwright/test';

test.describe('Performance Baseline', () => {
  test('collects navigation timing metrics on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const navigationTiming = await page.evaluate(() => {
      const entry = performance.getEntriesByType('navigation')[0];
      if (!entry) {
        return null;
      }

      const navigation = entry as PerformanceNavigationTiming;
      return {
        domContentLoadedMs:
          navigation.domContentLoadedEventEnd - navigation.startTime,
        loadEventMs: navigation.loadEventEnd - navigation.startTime,
      };
    });

    expect(navigationTiming).not.toBeNull();
    expect(navigationTiming!.domContentLoadedMs).toBeGreaterThan(0);
    expect(navigationTiming!.loadEventMs).toBeGreaterThan(0);
  });
});
