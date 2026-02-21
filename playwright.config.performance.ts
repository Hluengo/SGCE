// Configuracion de Playwright para Performance Testing
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/performance',
  testMatch: '**/*.e2e.spec.ts',
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'performance',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

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
});
