import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright E2E tests
 * Sets up test environment and mocks
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');

  // Start a browser instance to prepare test data if needed
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Pre-warm the application
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Set up any global test data or mocks here
    console.log('✅ Test environment ready');
  } catch (error) {
    console.warn('⚠️  Could not pre-warm application:', error.message);
  } finally {
    await browser.close();
  }
}

export default globalSetup;