import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: ['**/critical-visual.e2e.spec.ts', '**/responsive-qa.e2e.spec.ts'],
  globalSetup: './src/e2e/global-setup.ts',
  reporter: 'html',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3002',
    storageState: './playwright/.auth/e2e-mock-auth.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Galaxy S24',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Pixel 8',
      use: {
        browserName: 'chromium',
        viewport: { width: 393, height: 837 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Samsung Tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 800, height: 1280 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'iPhone 15-16',
      use: {
        browserName: 'webkit',
        viewport: { width: 393, height: 852 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'iPhone SE',
      use: {
        browserName: 'webkit',
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'iPad mini',
      use: {
        browserName: 'webkit',
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3002 --host 127.0.0.1 --strictPort',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      ...process.env,
      VITE_E2E_MOCK_AUTH: 'true',
    },
  },
});
