# Quick Reference (estado actual)

Fecha de revisión: 2026-02-17

## Comandos útiles

```bash
npm install
npm run dev
npm run build
node scripts/setup-superadmin.js
```

## Multi-tenant: APIs vigentes

### Contexto

- Provider principal: `src/shared/context/TenantContext.tsx`
- Hook: `useTenant()`

```tsx
import { useTenant } from '@/shared/context/TenantContext';

const { tenantId, establecimiento, setTenantId } = useTenant();
```

### Cliente tenant-aware

Archivo: `src/shared/lib/tenantClient.ts`

Funciones disponibles:
- `createTenantClient({ tenantId })`
- `requiresTenantFilter(tableName)`
- `getTenantHeaders(tenantId)`
- `sanitizeResponse(data, tenantId)`
- `verifyTenantAccess(table, recordId, tenantId)`

```tsx
import { createTenantClient } from '@/shared/lib/tenantClient';
import { useTenant } from '@/shared/context/TenantContext';

const { tenantId } = useTenant();
const client = createTenantClient({ tenantId });
const { data } = await client?.from('expedientes').select('*');
```

### Hooks de acceso por tenant

Archivo: `src/shared/hooks/useTenantClient.ts`

- `useTenantClient()`
- `useTenantAccess(table, recordId)`
- `useTenantQuery(table, options)`
- `useTenantSwitcher()`

## App routing actual

Archivo: `src/App.tsx`

- `TenantProvider` envuelve la app completa.
- Protección de rutas principal: `RequireAuth` y `RequirePermission`.
- `TenantRouteGuard` existe en código, pero no es el wrapper principal de rutas en el estado actual.

## Migraciones relevantes recientes

Directorio: `supabase/migrations/`

- `017_tenant_management_columns.sql`
- `018_add_expediente_actor_b.sql`
- `019_fix_expedientes_auditoria_null_auth.sql`
- `023_fix_hitos_expediente_rls.sql`
- `024_fix_operational_tables_superadmin_rls.sql`
- `021_strict_evidencias_url_storage_guard.sql`
- `022_harden_evidencias_url_storage_normalization.sql`

## Checklists SQL operacionales (oficiales)

- `supabase/sql/023_superadmin_manageability_checklist.sql`
- `supabase/sql/024_operational_smoke_test_multitenant.sql`
- `supabase/sql/025_operational_smoke_test_multitenant_strict.sql`
- `supabase/sql/026_seed_tenant_b_for_strict_smoke.sql` (support cuando falta contexto tenant B)

## Enlaces clave

- Setup técnico: `docs/SETUP_MULTITENANT.md`
- Arquitectura multi-tenant: `docs/MULTI_TENANCY.md`
- Post-migración 024/025: `docs/POST_MIGRATION_CHECKLIST_024_025.md`
- Guía Config Studio: `docs/CONFIG_STUDIO_FIELDS.md`
- Auditoría documental: `docs/DOCUMENTATION_SYSTEMATIZATION.md`
