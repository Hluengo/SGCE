import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright E2E tests
 * Cleans up test environment and data
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');

  // Clean up any test data, mocks, or resources
  // This runs after all tests complete

  console.log('✅ Test environment cleaned up');
}

export default globalTeardown;