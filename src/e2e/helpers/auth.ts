import type { Page } from '@playwright/test';

const E2E_MOCK_AUTH_STORAGE_KEY = 'sgce:e2e-auth-user';
const DEFAULT_E2E_EMAIL = process.env.PLAYWRIGHT_E2E_EMAIL || 'e2e.superadmin@sgce.local';

type MockUsuario = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'SUPERADMIN';
  permisos: string[];
  establecimientoId: string;
  tenantIds: string[];
  activo: boolean;
};

const createMockUsuario = (email: string): MockUsuario => ({
  id: `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  email: email.trim().toLowerCase(),
  nombre: 'Super',
  apellido: 'Admin E2E',
  rol: 'SUPERADMIN',
  permisos: [],
  establecimientoId: '',
  tenantIds: [],
  activo: true,
});

async function seedMockAuthSession(page: Page, email: string): Promise<void> {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';
  const mockUsuario = createMockUsuario(email);
  await page.goto(`${baseUrl}/auth`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ key, user }) => {
      localStorage.setItem(key, JSON.stringify(user));
    },
    { key: E2E_MOCK_AUTH_STORAGE_KEY, user: mockUsuario }
  );
}

export async function ensureAuthenticated(page: Page, nextPath = '/mediacion'): Promise<void> {
  await seedMockAuthSession(page, DEFAULT_E2E_EMAIL);
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';
  await page.goto(`${baseUrl}${nextPath}`);
  await page.waitForLoadState('networkidle');

  if (!new URL(page.url()).pathname.startsWith('/auth')) {
    return;
  }

  // Si el mock auth no estuviera habilitado en el servidor actual,
  // dejamos un error explícito para evitar fallas silenciosas por credenciales reales.
  throw new Error(
    'E2E mock auth no se aplico. Verifica que VITE_E2E_MOCK_AUTH=true este activo en el servidor Playwright.'
  );
}

export async function ensureSignedOut(page: Page): Promise<void> {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';
  await page.goto(`${baseUrl}/auth`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((key) => localStorage.removeItem(key), E2E_MOCK_AUTH_STORAGE_KEY);
  await page.waitForLoadState('networkidle');
}
