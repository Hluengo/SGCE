# Post-Migration Checklist 024/025

Last reviewed: 2026-02-17  
Status: active

## Objetivo

Validar en forma rápida que:
- Las políticas RLS operacionales de `024` funcionan.
- El smoke test estricto `025` pasa.
- La UI no mezcla datos entre tenants al crear desde modales.

## Scripts oficiales

1. `supabase/migrations/023_fix_hitos_expediente_rls.sql`
2. `supabase/migrations/024_fix_operational_tables_superadmin_rls.sql`
3. `supabase/sql/023_superadmin_manageability_checklist.sql`
4. `supabase/sql/024_operational_smoke_test_multitenant.sql`
5. `supabase/sql/025_operational_smoke_test_multitenant_strict.sql`
6. `supabase/sql/026_seed_tenant_b_for_strict_smoke.sql` (solo si falta contexto en tenant B)

## Flujo recomendado

1. Aplicar migraciones `023` y `024`.
2. Ejecutar `023_superadmin_manageability_checklist.sql`.
3. Ejecutar `024_operational_smoke_test_multitenant.sql`.
4. Si `025` falla por contexto tenant B, ejecutar `026_seed_tenant_b_for_strict_smoke.sql`.
5. Ejecutar `025_operational_smoke_test_multitenant_strict.sql`.

## Prueba funcional UI rápida (manual)

Prerequisito: superusuario autenticado.

### Tenant A

1. Ir a Dashboard del tenant A.
2. Crear desde modal:
- `Nuevo Reporte de Patio`
- `Registrar Derivación`
- `Nueva Intervención`
- `Registrar Acción de apoyo`
3. Validar que aparecen en sus listados:
- `Registros de Patio`
- `Bitácora Psicosocial` (derivaciones + intervenciones)
- `Seguimiento de Apoyo`

### Tenant B

1. Cambiar tenant en sidebar al tenant B.
2. Repetir creación en los 4 modales.
3. Validar listados del tenant B.
4. Volver a tenant A y confirmar que no aparecen los registros recién creados en tenant B.

## SQL de verificación rápida post-UI

```sql
-- Reemplaza :tenant_a y :tenant_b por UUID reales.
with data as (
  select 'reportes_patio' as table_name, establecimiento_id::text as tenant_id, count(*)::int as rows
  from public.reportes_patio
  where establecimiento_id in (:tenant_a, :tenant_b)
  group by 1,2
  union all
  select 'derivaciones_externas', establecimiento_id::text, count(*)::int
  from public.derivaciones_externas
  where establecimiento_id in (:tenant_a, :tenant_b)
  group by 1,2
  union all
  select 'bitacora_psicosocial', establecimiento_id::text, count(*)::int
  from public.bitacora_psicosocial
  where establecimiento_id in (:tenant_a, :tenant_b)
  group by 1,2
  union all
  select 'medidas_apoyo', establecimiento_id::text, count(*)::int
  from public.medidas_apoyo
  where establecimiento_id in (:tenant_a, :tenant_b)
  group by 1,2
)
select * from data order by table_name, tenant_id;
```

Resultado esperado:
- Cada tabla con filas en ambos tenants si se probó creación en ambos.
- Sin dependencia cruzada de `establecimiento_id`.

## Criterio de cierre

- `023`, `024`, `025` sin `FAIL`.
- Prueba UI manual completada en tenant A y B.
- Validación SQL por `establecimiento_id` coherente.
