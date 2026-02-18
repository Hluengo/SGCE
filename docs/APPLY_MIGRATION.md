# Aplicar migraciones Supabase (runbook)

Last reviewed: 2026-02-17  
Status: active

## Opción A: CLI (recomendada)

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
```

Esto aplica migraciones pendientes del directorio `supabase/migrations/`.

## Opción B: SQL Editor (manual)

1. Ir a Supabase Dashboard -> SQL Editor.
2. Ejecutar migraciones pendientes en orden.
3. No re-ejecutar scripts ya aplicados en producción.

### Migraciones relevantes recientes

- `supabase/migrations/014_rls_recursion_hotfix.sql`
- `supabase/migrations/015_superadmin_config_studio.sql`
- `supabase/migrations/016_create_superadmin.sql`
- `supabase/migrations/017_tenant_management_columns.sql`
- `supabase/migrations/018_add_expediente_actor_b.sql`
- `supabase/migrations/019_fix_expedientes_auditoria_null_auth.sql`
- `supabase/migrations/023_fix_hitos_expediente_rls.sql`
- `supabase/migrations/024_fix_operational_tables_superadmin_rls.sql`
- `supabase/migrations/021_strict_evidencias_url_storage_guard.sql`
- `supabase/migrations/022_harden_evidencias_url_storage_normalization.sql`

Script operacional relacionado:
- `supabase/sql/020_evidencias_url_storage_cleanup.sql`

## Verificación post-aplicación

### 1) RLS y funciones críticas

```sql
select proname
from pg_proc
where proname in (
  'is_platform_superadmin',
  'can_access_tenant',
  'run_rls_policy_checks',
  'normalize_evidencia_url_storage',
  'enforce_evidencias_url_storage_strict'
);

select * from public.run_rls_policy_checks();
```

### 2) Checklist de tenant management (017)

```sql
-- ejecutar completo:
-- supabase/sql/017_post_migration_checklist.sql
```

### 3) Checklist de evidencias (022)

```sql
-- ejecutar completo:
-- supabase/sql/022_backend_debug_checklist.sql
```

### 4) Checklist operacional superadmin y smoke multi-tenant (023/024/025)

```sql
-- ejecutar en este orden:
-- supabase/sql/023_superadmin_manageability_checklist.sql
-- supabase/sql/024_operational_smoke_test_multitenant.sql
-- supabase/sql/026_seed_tenant_b_for_strict_smoke.sql    -- solo si falta contexto en tenant B
-- supabase/sql/025_operational_smoke_test_multitenant_strict.sql
```

Guía compacta:
- `docs/POST_MIGRATION_CHECKLIST_024_025.md`

## Errores comunes

1. `function ... already exists`
- La migración debería usar `create or replace` o guardas `if exists/if not exists`.

2. `relation ... does not exist`
- Dependencia de orden: falta aplicar una migración previa.

3. `policy ... already exists`
- Faltan `drop policy if exists` previos o la migración se re-ejecutó parcialmente.

4. `permission denied`
- Revisa rol/credenciales usadas para ejecutar SQL.

## Recomendación operativa

- En producción, aplicar primero en staging y ejecutar checklists SQL antes de promover.
- Guardar evidencia de validación (resultado de checks y fecha) por release.
