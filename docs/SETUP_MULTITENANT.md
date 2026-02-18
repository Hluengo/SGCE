# Setup Multi-Tenant (guía vigente)

Last reviewed: 2026-02-17  
Status: active

## 1) Prerrequisitos

- Node.js 18+
- Proyecto Supabase operativo
- Variables en `.env.local`:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
# opcional para desarrollo
VITE_DEFAULT_TENANT_ID=<uuid-establecimiento>
```

## 2) Aplicar migraciones

### Opción recomendada (CLI)

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
```

### Opción manual (SQL Editor)

Ejecuta en orden los archivos de `supabase/migrations/` que aún no estén aplicados.

Relevantes de la fase actual:
- `014_rls_recursion_hotfix.sql`
- `015_superadmin_config_studio.sql`
- `016_create_superadmin.sql`
- `017_tenant_management_columns.sql`
- `018_add_expediente_actor_b.sql`
- `019_fix_expedientes_auditoria_null_auth.sql`
- `021_strict_evidencias_url_storage_guard.sql`
- `022_harden_evidencias_url_storage_normalization.sql`

Nota: `020_evidencias_url_storage_cleanup.sql` está en `supabase/sql/` (script operacional), no como migración numerada del directorio `migrations`.

## 3) Crear superadmin

### Script Node

```bash
node scripts/setup-superadmin.js
```

### Alternativa

Puedes usar la edge function `setup-superadmin` si tu entorno la tiene desplegada.

## 4) Verificación mínima backend

En SQL Editor:

```sql
-- Verifica helpers críticos
select proname
from pg_proc
where proname in (
  'is_platform_superadmin',
  'can_access_tenant',
  'run_rls_policy_checks'
);

-- Verifica RLS baseline
select * from public.run_rls_policy_checks();
```

Checks útiles adicionales:
- `supabase/sql/017_post_migration_checklist.sql`
- `supabase/sql/022_backend_debug_checklist.sql`

## 5) Patrón frontend vigente

### Contexto

- Provider activo: `TenantProvider` en `src/shared/context/TenantContext.tsx`
- Hook: `useTenant()`

### Acceso a datos

Usa:
- `createTenantClient({ tenantId })` (`src/shared/lib/tenantClient.ts`), o
- `useTenantClient()` (`src/shared/hooks/useTenantClient.ts`)

No usar como patrón principal documentación antigua basada en `queryWithTenant()`.

## 6) Estructura clave actual

```txt
src/shared/context/TenantContext.tsx
src/shared/hooks/useTenantClient.ts
src/shared/lib/tenantClient.ts
src/App.tsx
supabase/migrations/
supabase/sql/
```

## 7) Troubleshooting

### `useTenant debe ser usado dentro de un TenantProvider`
- El componente se está renderizando fuera del árbol envuelto por `TenantProvider` en `src/App.tsx`.

### Datos de otro colegio
- La query no está usando cliente/hook tenant-aware.

### Error RLS
- Verifica perfil en `public.perfiles` con `establecimiento_id`.
- Verifica políticas activas y helper functions.
