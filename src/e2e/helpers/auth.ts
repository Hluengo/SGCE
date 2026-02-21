import type { Page } from '@playwright/test';

export const E2E_AUTH = {
  email: process.env.PLAYWRIGHT_E2E_EMAIL || 'superadmin.e2e@sgce.local',
  password: process.env.PLAYWRIGHT_E2E_PASSWORD || 'E2EAdmin123',
};

export async function ensureAuthenticated(page: Page, nextPath = '/mediacion'): Promise<void> {
  await page.goto(nextPath);
  await page.waitForLoadState('networkidle');

  if (!new URL(page.url()).pathname.startsWith('/auth')) {
    return;
  }

  await page.goto(`/auth?next=${encodeURIComponent(nextPath)}`);
  await page.waitForLoadState('networkidle');

  await page.getByLabel(/correo institucional/i).fill(E2E_AUTH.email);
  await page.getByLabel(/contrasena/i).fill(E2E_AUTH.password);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await page.waitForLoadState('networkidle');
}

