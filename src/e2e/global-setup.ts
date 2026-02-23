import { chromium, type FullConfig } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = path.resolve(CURRENT_DIR, '../../playwright/.auth');
const STORAGE_STATE_PATH = path.resolve(STORAGE_DIR, 'e2e-mock-auth.json');
const DEFAULT_TENANT_ID = process.env.PLAYWRIGHT_E2E_TENANT_ID || 'd645e547-054f-4ce4-bff7-7a18ca61db50';
const E2E_EMAIL = (process.env.PLAYWRIGHT_E2E_EMAIL || 'superadmin.e2e@sgce.local').toLowerCase();

async function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0]?.use?.baseURL ?? config.use?.baseURL ?? 'http://localhost:3002');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ email, tenantId }) => {
    const mockUsuario = {
      id: crypto.randomUUID(),
      email,
      nombre: 'Super',
      apellido: 'Admin E2E',
      rol: 'SUPERADMIN',
      permisos: [
        'expedientes:crear', 'expedientes:leer', 'expedientes:editar', 'expedientes:eliminar', 'expedientes:archivar', 'expedientes:asignar',
        'documentos:subir', 'documentos:eliminar',
        'reportes:generar', 'reportes:exportar',
        'usuarios:gestionar', 'usuarios:roles:gestionar',
        'configuracion:editar', 'configuracion:tenant:editar',
        'bitacora:ver', 'bitacora:exportar',
        'archivo:sostenedor:ver', 'sie:ver',
        'tenants:gestionar', 'dashboard:analitica:ver', 'monitorizacion:ver', 'mantenimiento:ejecutar', 'backend:configurar',
        'system:manage',
      ],
      establecimientoId: tenantId,
      tenantIds: [tenantId],
      activo: true,
    };

    localStorage.setItem('sgce:e2e-auth-user', JSON.stringify(mockUsuario));
    localStorage.setItem('tenant_id', tenantId);
  }, { email: E2E_EMAIL, tenantId: DEFAULT_TENANT_ID });

  mkdirSync(STORAGE_DIR, { recursive: true });
  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}

export default globalSetup;
