import type { Page } from '@playwright/test';

export const E2E_AUTH = {
  email: process.env.PLAYWRIGHT_E2E_EMAIL || 'superadmin.e2e@sgce.local',
  password: process.env.PLAYWRIGHT_E2E_PASSWORD || 'E2EAdmin123',
};

export async function ensureAuthenticated(page: Page, nextPath = '/mediacion'): Promise<void> {
  await page.goto(nextPath);
  await page.waitForLoadState('domcontentloaded');

  const loginEmailField = page.getByLabel(/correo institucional/i);
  const loginPasswordField = page.getByLabel(/contrasena/i);
  const loginButton = page.getByRole('button', { name: /ingresar/i });

  const isAuthRoute = new URL(page.url()).pathname.startsWith('/auth');
  const hasInlineLoginForm = await loginEmailField.isVisible().catch(() => false);

  if (!isAuthRoute && !hasInlineLoginForm) {
    return;
  }

  if (isAuthRoute) {
    await page.goto(`/auth?next=${encodeURIComponent(nextPath)}`);
    await page.waitForLoadState('domcontentloaded');
  }

  await loginEmailField.fill(E2E_AUTH.email);
  await loginPasswordField.fill(E2E_AUTH.password);
  await loginButton.click();
  await page.waitForLoadState('domcontentloaded');
  await page.goto(nextPath);
  await page.waitForLoadState('domcontentloaded');
}

