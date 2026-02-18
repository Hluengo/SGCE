# Supabase System Audit & Systematization

Date: 2026-02-17  
Scope: `supabase/migrations`, `supabase/sql`, `supabase/functions`, env files (`.env.local`, `.env.example`), and Supabase-related frontend usage in `src/`.

## 1) Executive Summary

The Supabase layer is functionally advanced and already includes multi-tenant RLS, superadmin governance, smoke tests, and operational checklists.  
Main risks are not conceptual gaps; they are consistency and hardening gaps.

Critical findings:
- Exposed secret material and unsafe credential patterns.
- A legacy migration with syntax issues that can break clean bootstrap.
- Index migration bug that silently leaves tenant columns unindexed in multiple tables.
- Documentation drift versus actual schema and code usage.
- Some frontend paths still bypass tenant-aware client patterns.

## 2) Inventory (Current Repo)

## 2.1 Migrations

- `001_init.sql`
- `002_plazos_habiles.sql`
- `003_frontend_alignment.sql`
- `004_rls_public_read_auth_write.sql`
- `005_cleanup_legacy_policies.sql`
- `006_normalize_remaining_policies.sql`
- `007_add_curso_to_expedientes.sql`
- `007_mejorar_reportes_patio.sql`
- `008_agregar_estudiante_id_reportes.sql`
- `009_add_curso_to_reportes_patio.sql`
- `010_multi_tenant_isolation.sql`
- `011_fix_superadmin_rls.sql`
- `011_superadmin_real_data.sql`
- `012_add_missing_rls_policies.sql`
- `013_bootstrap_superadmin_and_rls_checks.sql`
- `014_rls_recursion_hotfix.sql`
- `015_superadmin_config_studio.sql`
- `016_create_superadmin.sql`
- `017_tenant_management_columns.sql`
- `018_add_expediente_actor_b.sql`
- `019_fix_expedientes_auditoria_null_auth.sql`
- `021_strict_evidencias_url_storage_guard.sql`
- `022_harden_evidencias_url_storage_normalization.sql`
- `023_fix_hitos_expediente_rls.sql`
- `024_fix_operational_tables_superadmin_rls.sql`

## 2.2 SQL Operational Scripts

- `017_post_migration_checklist.sql`
- `019_post_fix_checklist.sql`
- `020_evidencias_url_storage_cleanup.sql`
- `022_backend_debug_checklist.sql`
- `023_superadmin_manageability_checklist.sql`
- `024_operational_smoke_test_multitenant.sql`
- `025_operational_smoke_test_multitenant_strict.sql`
- `026_seed_tenant_b_for_strict_smoke.sql`

## 2.3 Edge Functions

- `supabase/functions/setup-superadmin/index.ts`

## 2.4 Superadmin Helper Scripts

- `scripts/setup-superadmin.js`

## 2.5 Environment / Auth Surface

- `.env.local`
- `.env.example`

## 3) Schema Systematization

Source of truth inferred from migrations.

## 3.1 Core Academic / Case Tables

| Table | Key Columns (types) | Purpose |
|---|---|---|
| `establecimientos` | `id uuid`, `nombre text`, `rbd text`, `activo boolean`, `direccion text`, `telefono text`, `email text`, `niveles_educativos text[]` | Tenant master (schools). |
| `perfiles` | `id uuid -> auth.users`, `rol rol_usuario`, `establecimiento_id uuid`, `tenant_ids uuid[]`, `activo boolean`, `permisos jsonb` | User profile + tenant authorization model. |
| `estudiantes` | `id uuid`, `establecimiento_id uuid`, `rut text unique`, `curso text` | Student registry per tenant. |
| `expedientes` | `id uuid`, `establecimiento_id uuid`, `estudiante_id uuid`, `estudiante_b_id uuid`, `folio text unique`, `tipo_falta`, `estado_legal`, `etapa_proceso`, `descripcion_hechos` | Normative case lifecycle. |
| `hitos_expediente` | `id uuid`, `expediente_id uuid`, `titulo`, `completado boolean` | Case milestones/timeline. |
| `evidencias` | `id uuid`, `establecimiento_id uuid`, `expediente_id uuid`, `url_storage text`, `tipo_archivo`, `tipo evidencia_tipo` | Indexed evidence metadata + storage reference. |
| `logs_auditoria` | `id uuid`, `establecimiento_id uuid`, `usuario_id uuid`, `accion`, `tabla_afectada`, `registro_id`, `detalle jsonb` | Audit log. |

## 3.2 Operational Tables

| Table | Key Columns (types) | Purpose |
|---|---|---|
| `reportes_patio` | `establecimiento_id`, `estudiante_id`, `estudiante_nombre`, `curso`, `gravedad_percibida`, `estado`, `expediente_id` | Courtyard incident reporting. |
| `derivaciones_externas` | `establecimiento_id`, `estudiante_id`, `institucion`, `estado`, `numero_oficio` | External referral workflow. |
| `bitacora_psicosocial` | `establecimiento_id`, `estudiante_id`, `profesional_id`, `tipo`, `resumen`, `privado` | Psychosocial interventions. |
| `medidas_apoyo` | `establecimiento_id`, `estudiante_id`, `tipo_accion`, `tipo`, `objetivo`, `estado`, `accion` | Support actions and follow-up. |
| `incidentes` | `establecimiento_id`, `estudiante_id`, `expediente_id` | Incident records linked to cases. |
| `bitacora_salida` | `establecimiento_id`, `estudiante_id`, `fecha`, `motivo` | Exit log. |
| `mediaciones_gcc` | `establecimiento_id`, `expediente_id`, `estado` | Mediation process. |
| `compromisos_mediacion` | `mediacion_id`, `descripcion`, `cumplido` | Mediation commitments. |
| `carpetas_documentales` | `establecimiento_id`, `nombre` | Document folder registry. |
| `documentos_institucionales` | `establecimiento_id`, `carpeta_id`, `url_storage` | Institutional documents metadata. |
| `cursos_inspector` | `establecimiento_id`, `inspector_id`, `curso` | Course-level inspector assignment. |
| `feriados_chile` | `fecha`, `descripcion`, `es_irrenunciable` | Business-day calculations. |

## 3.3 Superadmin / Control Plane Tables

| Table | Key Columns | Purpose |
|---|---|---|
| `tenant_feature_flags` | `tenant_id`, `feature_key`, `enabled` | Tenant-level feature toggles. |
| `platform_settings` | `setting_key`, `setting_value jsonb` | Global platform settings. |
| `superadmin_audit_logs` | `actor_user_id`, `tenant_id`, `action`, `payload` | Superadmin action traceability. |
| `admin_changesets` | `scope`, `tenant_id`, `generated_sql[]`, `rollback_sql[]`, `status` | Config Studio change requests. |
| `admin_change_events` | `changeset_id`, `event_type`, `payload` | Changeset event stream. |
| `storage_bucket_registry` | `scope`, `tenant_id`, `bucket_name`, `policy_json` | Storage governance metadata. |
| `edge_function_registry` | `scope`, `tenant_id`, `function_name`, `env_json` | Edge function governance metadata. |

## 3.4 View

- `expedientes_auditoria` (calls `log_expediente_view` during read).

## 4) RLS / Authorization Review

Current direction is correct:
- Legacy open policies were progressively replaced.
- `014` introduces helper functions with `SECURITY DEFINER` to avoid recursive RLS checks.
- `023` and `024` align critical operational tables to `can_access_tenant(...)`.

Coverage quality:
- Strong in tables used by dashboard operations (`reportes_patio`, `derivaciones_externas`, `bitacora_psicosocial`, `medidas_apoyo`, `hitos_expediente`).
- Superadmin control-plane tables have explicit restrictive RLS.
- Potentially inconsistent behavior remains if environments were bootstrapped from old migrations only (see findings section).

## 5) Index & Query Fitness Review

Good:
- Core indexes exist for `reportes_patio` state/date/expediente and several superadmin tables.
- Recent smoke results indicate operational writes are functioning.

Gaps:
- `012_add_missing_rls_policies.sql` attempts tenant indexes with the same index name `idx_establecimiento_id` across many tables, so only one can exist in schema `public`.
- High-frequency query paths would benefit from explicit composite indexes, especially:
  - `logs_auditoria(registro_id, created_at desc)`
  - `hitos_expediente(expediente_id, created_at desc)`
  - `evidencias(expediente_id, created_at desc)`
  - `medidas_apoyo(estudiante_id, created_at desc)`

## 6) Findings, Impact, and Concrete Fixes

## F1 (Critical): Sensitive credentials pattern and leaked key usage

Evidence:
- `.env.local` contains `VITE_SUPABASE_SERVICE_ROLE_KEY`.
- `supabase/functions/setup-superadmin/index.ts` hardcodes `admin@admin.cl` / `123456`.
- `scripts/setup-superadmin.js` uses same fixed weak credentials.
- `supabase/migrations/016_create_superadmin.sql` documents same weak credentials.

Impact:
- High risk of privilege escalation and full data compromise.
- Service role keys should never be exposed in frontend runtime (`VITE_*`).

Fix:
1. Rotate Supabase keys and any exposed AI/API keys immediately.
2. Remove `VITE_SUPABASE_SERVICE_ROLE_KEY` from frontend env files.
3. Replace fixed credentials with one-time secure bootstrap flow.
4. Enforce strong password + forced reset on first login.
5. Add secret scanning in CI.

## F2 (Critical): Edge function auth is not actually validated

Evidence:
- `supabase/functions/setup-superadmin/index.ts` only checks `Authorization` header presence, not token validity/role.

Impact:
- Potential unauthorized superadmin provisioning if endpoint is reachable.

Fix:
1. Verify JWT using Supabase auth context before action.
2. Require caller to be existing `superadmin`.
3. Remove hardcoded credentials from function source.
4. Optionally disable this function in production and keep bootstrap server-side only.

## F3 (High): `010_multi_tenant_isolation.sql` contains syntax/compatibility defects

Evidence:
- `as $ ... $;` function body delimiter in `supabase/migrations/010_multi_tenant_isolation.sql`.
- `current_setting('request.headers', true)->>'x-establishment-id'` is invalid without JSON cast.

Impact:
- Fresh database bootstrap can fail.
- Team cannot rely on deterministic `supabase db push` for clean environments.

Fix:
1. Create a repair migration that supersedes `010` behavior.
2. Keep `014` helpers as canonical and mark `010` as legacy in docs.
3. Add CI migration dry-run against empty DB.

## F4 (High): Broken index migration pattern in `012`

Evidence:
- `supabase/migrations/012_add_missing_rls_policies.sql` reuses index name `idx_establecimiento_id` across many tables.

Impact:
- Many tenant-filtered tables may be unindexed on `establecimiento_id`.
- Query latency increases under growth.

Fix:
1. New migration creating per-table index names, e.g. `idx_estudiantes_establecimiento_id`.
2. Validate with `pg_indexes` checklist after applying.

## F5 (High): Non-idempotent FK addition in `008`

Evidence:
- `supabase/migrations/008_agregar_estudiante_id_reportes.sql` uses `ADD CONSTRAINT reportes_patio_estudiante_id_fkey` without guard.

Impact:
- Re-running migration or replaying in partially provisioned environments can fail.

Fix:
1. Wrap constraint creation in `DO $$ ... IF NOT EXISTS ... $$`.
2. Add migration test for rerun safety in staging.

## F6 (High): Superadmin bootstrap script has logic defects

Evidence:
- `scripts/setup-superadmin.js` tries to read `perfiles.email` when `perfiles` does not define `email`.
- On "already exists", `user.id` can be undefined and script exits.

Impact:
- Operational bootstrap failures during incident response.

Fix:
1. Resolve user by querying `auth.users` admin API by email.
2. Upsert profile by known auth user id.
3. Remove fixed credential default values.

## F7 (Medium): Source-of-truth drift between frontend data access and tenant client strategy

Evidence:
- Several modules query `supabase.from(...)` directly instead of tenant-aware wrapper.
- Existing incidents of cross-tenant visual leakage were already observed in patio/bitácora flows.

Impact:
- Inconsistent behavior; RLS protects DB rows but UI can still show stale tenant state when app state is not reset.

Fix:
1. Standardize on `useTenantClient()`/tenant-aware service layer for all tenant tables.
2. Add lint rule or codemod guard for direct `.from('tenant_table')`.
3. Add tenant-switch integration tests.

## F8 (Medium): Smoke script `024` is not pure and contains invalid block delimiters

Evidence:
- `supabase/sql/024_operational_smoke_test_multitenant.sql` includes `alter table` statements and multiple `do $ ... end $;`.

Impact:
- Script can fail by parser differences and is risky for operational use.

Fix:
1. Convert all blocks to `$$` delimiter consistently.
2. Remove schema-mutation from smoke tests; keep tests data-only.
3. Keep DDL in migrations only.

## F9 (Medium): Documentation drift

Evidence:
- `docs/SUPABASE_TABLAS.md` states 20 tables; migrations define substantially more.
- Legacy docs still describe patterns no longer canonical.

Impact:
- Onboarding and incident resolution become error-prone.

Fix:
1. Make this audit file the canonical Supabase map.
2. Update `docs/README.md` + `docs/APPLY_MIGRATION.md` links and deprecate stale docs.
3. Add “Last verified against migrations on <date>” banner to Supabase docs.

## F10 (Low/Medium): Migration naming/versioning consistency risk

Evidence:
- Duplicate numeric prefixes (`007_*`, `011_*`) and manual migration style (`016` guide-like behavior).

Impact:
- Confusing release traceability and troubleshooting.

Fix:
1. Move to monotonic migration naming convention.
2. Keep manual operations out of migrations; place in runbooks/scripts.

## 7) Security Validation Matrix (What to Keep)

Strong components already in place:
- `014` anti-recursion security-definer helper functions.
- `023` corrected RLS for `hitos_expediente`.
- `024` tenant-access policy alignment for operational tables.
- `021` + `022` strict normalization and guarding for `evidencias.url_storage`.
- `023/024/025` checklists + smoke scripts create useful operational control points.

## 8) Recommended Priority Plan

Phase 0 (Immediate, same day):
1. Rotate leaked/exposed keys and remove `service_role` from any `VITE_*` path.
2. Disable or harden `setup-superadmin` edge function.
3. Remove/replace weak hardcoded credentials in code and docs.

Phase 1 (This week):
1. Add migration `027_fix_tenant_indexes.sql` for per-table tenant indexes.
2. Add migration `028_fix_legacy_bootstrap_compat.sql` to neutralize `010` defects.
3. Patch `scripts/setup-superadmin.js` idempotent flow.

Phase 2 (Next sprint):
1. Refactor frontend data access to enforce tenant-aware client usage everywhere.
2. Convert `024` smoke to pure DML tests, keep strict version as CI gate.
3. Add migration dry-run CI for clean DB bootstrap and rerun safety checks.

## 9) Final Assessment

Status on 2026-02-17:
- Functional maturity: High.
- Security posture: Medium (due to credential handling and bootstrap surfaces).
- Migration reliability: Medium (legacy syntax/idempotency issues).
- Documentation coherence: Medium (improving, but still drift in some docs).

With the Phase 0 and Phase 1 actions, the stack can move to robust/production-hardening level with low residual risk.
