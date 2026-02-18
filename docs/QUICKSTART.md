# Quick Start (5 minutos)

Objetivo: levantar el proyecto local, autenticarte y entender el flujo multi-tenant vigente.

## 1) Setup base

```bash
git clone <repo-url> gestionconvivencia-main
cd gestionconvivencia-main
npm install
```

Crear `.env.local`:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
# opcional
VITE_DEFAULT_TENANT_ID=<uuid-establecimiento>
```

## 2) Superadmin (dev/staging)

```bash
node scripts/setup-superadmin.js
```

Revisa detalles en `docs/SETUP_MULTITENANT.md`.

## 3) Ejecutar app

```bash
npm run dev
```

Ruta local: `http://localhost:5173`.

## 4) Multi-tenant actual (importante)

- Provider activo en app: `TenantProvider` desde `src/shared/context/TenantContext.tsx`.
- `useTenant()` se importa desde `@/shared/context/TenantContext` o `@/shared/context`.
- El patrón vigente para datos no es `queryWithTenant()`.
- Usa:
  - `createTenantClient({ tenantId })` desde `src/shared/lib/tenantClient.ts`, o
  - hooks de `src/shared/hooks/useTenantClient.ts`.

Ejemplo rápido con hook:

```tsx
import { useTenantClient } from '@/shared/hooks/useTenantClient';

const { client } = useTenantClient();
const { data, error } = await client?.from('expedientes').select('*');
```

Ejemplo con cliente explícito:

```tsx
import { createTenantClient } from '@/shared/lib/tenantClient';
import { useTenant } from '@/shared/context/TenantContext';

const { tenantId } = useTenant();
const client = createTenantClient({ tenantId });
const { data, error } = await client?.from('estudiantes').select('*');
```

## 5) Errores comunes

- `useTenant debe ser usado dentro de un TenantProvider`:
  - El componente está fuera del árbol envuelto por `TenantProvider` en `src/App.tsx`.
- Datos de otro colegio:
  - falta filtrar por tenant; usa `useTenantClient` o `createTenantClient`.
- Error de auth/RLS:
  - verifica que el usuario tenga perfil en `public.perfiles` con `establecimiento_id`.

## 6) Lecturas recomendadas

- `docs/README.md`
- `docs/QUICK_REFERENCE.md`
- `docs/SETUP_MULTITENANT.md`
- `docs/MULTI_TENANCY.md`
- `docs/DOCUMENTATION_SYSTEMATIZATION.md`
