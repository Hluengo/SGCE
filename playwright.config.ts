import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src',
  testMatch: '**/*.e2e.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video on failure */
    video: 'retain-on-failure',
    /* Security: Block external resources that could compromise tests */
    permissions: [],
    /* Security: Disable geolocation and other potentially sensitive APIs */
    geolocation: undefined,
    /* Security: Use clean browser context for each test */
    storageState: undefined,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Security-focused test project with stricter settings */
    {
      name: 'security',
      testMatch: '**/*security*.e2e.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        /* Additional security settings for security tests */
        bypassCSP: false, // Respect Content Security Policy
        ignoreHTTPSErrors: false, // Fail on HTTPS errors
        /* Record all network activity for security analysis */
        recordHar: {
          path: 'test-results/security/',
          mode: 'full',
          content: 'embed',
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev -- --port 3000 --host 127.0.0.1 --strictPort',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      VITE_E2E_MOCK_AUTH: 'true',
    },
  },

  /* Global test timeout */
  timeout: 30 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000,
  },

  /* Global setup and teardown */
  globalSetup: './src/e2e/global-setup.ts',
  globalTeardown: './src/e2e/global-teardown.ts',
});
