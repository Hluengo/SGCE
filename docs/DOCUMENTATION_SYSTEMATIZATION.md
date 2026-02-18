# Sistematizacion de Documentacion (Auditoria 2026-02-17)

## Resumen ejecutivo
- La carpeta `docs/` tiene cobertura amplia pero baja coherencia operativa: hay duplicidad alta, afirmaciones de estado no sincronizadas con el codigo actual y una ausencia de versionado documental por release.
- Se detectaron inconsistencias tecnicas relevantes entre documentacion y codigo productivo (API `queryWithTenant`, uso de `TenantRouteGuard`, alcance de migraciones, enlaces rotos).
- Existe al menos un riesgo de seguridad documental: inclusion de una clave API en texto plano.

## Alcance y metodo
- Se revisaron todos los archivos Markdown de `docs/`.
- Se contrasto contra codigo actual en:
  - `src/App.tsx`
  - `src/shared/lib/tenantClient.ts`
  - `src/shared/context/TenantContext.tsx`
  - `src/shared/context/TenantProvider.tsx`
  - `supabase/migrations/*`
- Se clasifico cada documento por: estado, utilidad, riesgo de desactualizacion y accion recomendada.

## Matriz de documentos
| Documento | Rol actual | Estado | Hallazgos clave | Accion recomendada |
|---|---|---|---|---|
| `docs/README.md` | Entrada principal de docs | Vigente (actualizado) | Reemplazado por índice canónico del proyecto | Mantener como punto de entrada |
| `docs/QUICKSTART.md` | Onboarding rapido | Desactualizado alto | Promueve `queryWithTenant()` que no existe en `tenantClient.ts` | Actualizar ejemplos a `createTenantClient()` + hooks actuales |
| `docs/QUICK_REFERENCE.md` | Referencia operativa | Desactualizado alto | API y rutas no alineadas; enlaces relativos incorrectos | Depurar API, corregir enlaces, reducir claims de "ready" |
| `docs/SETUP_MULTITENANT.md` | Setup tecnico | Parcialmente vigente | Cubre base conceptual, pero queda en stack 014-016 | Extender con 017-022 y flujo actual de tenant |
| `docs/MULTI_TENANCY.md` | Documento arquitectura | Parcialmente vigente | Buen marco conceptual; enlaces internos a rutas relativas fallan | Mantener como arquitectura y corregir links |
| `docs/APPLY_MIGRATION.md` | Runbook SQL | Parcialmente vigente | Tiene errores de texto y no incorpora cadena completa 018-022 | Normalizar y actualizar orden real de migraciones |
| `docs/SUPABASE_TABLAS.md` | Mapa BD | Desactualizado critico | Incluye clave API en claro; inventario no contempla cambios recientes | Redactar secreto, rotar clave, actualizar catalogo |
| `docs/CONFIG_STUDIO_FIELDS.md` | Guia funcional UI config | Vigente | Clara y util para usuario no tecnico | Mantener como referencia funcional principal |
| `docs/VALIDATION.md` | Estado global | Archived (etiquetado) | Mezcla "100% completo" con tareas pendientes y APIs no vigentes | Mantener solo como histórico |
| `docs/IMPLEMENTATION_COMPLETE.md` | Cierre tecnico | Archived (etiquetado) | Snapshot de una fase, no estado actual | Mantener solo como histórico |
| `docs/MULTI_TENANT_SUMMARY.md` | Resumen ejecutivo tecnico | Archived (etiquetado) | Duplica informacion de otros 4 documentos | Mantener solo como histórico |
| `docs/README_CHANGES.md` | Changelog narrativo | Archived (etiquetado) | Repite claims y APIs obsoletas | Mantener solo como histórico |
| `docs/MANIFEST.md` | Inventario de sesion | Archived (etiquetado) | Alto detalle de sesion, bajo valor operativo actual | Mantener solo como histórico |
| `docs/INDEX_FINAL.md` | Indice de una entrega | Archived (etiquetado) | No refleja estado vivo del repo | Mantener solo como histórico |
| `docs/EXECUTIVE_SUMMARY_2026.md` | Vision ejecutiva | Vigente contextual | Util para posicionamiento, no para operacion tecnica | Mantener en seccion estrategia |
| `docs/PROPUESTA_VALOR_2026.md` | Comercial/estrategia | Vigente contextual | Alineado a go-to-market | Mantener en estrategia |
| `docs/CUMPLIMIENTO_CIRCULARES_781_782.md` | Marco normativo | Vigente contextual | Alto valor de producto/compliance | Mantener y versionar por cambios regulatorios |
| `docs/AUTH_PAGE_UPDATES.md` | Cambios de UX/Auth | Parcialmente vigente | Documento de iniciativa puntual | Reubicar como caso de cambio historico |
| `docs/TENANT_ANALYSIS.md` | Analisis RLS inicial | Historico util | Buen contexto de origen, no estado final | Marcar como analisis base |
| `docs/CALENDARIO_NORMATIVO_IMPLEMENTACION.md` | Implementacion feature | Parcialmente vigente | Potencialmente valido, con claims absolutos de completitud | Mantener con etiqueta de version |
| `docs/CALENDARIO_NORMATIVO_CHECKLIST.md` | Checklist feature | Parcialmente vigente | Debe ligarse a criterios verificables | Mantener y agregar evidencia automatizada |
| `docs/CALENDARIO_NORMATIVO_VISUAL_GUIDE.md` | Guia UX feature | Vigente | Util para diseño/uso | Mantener |

## Inconsistencias verificadas (codigo vs docs)
1. API cliente tenant documentada no coincide con codigo.
- Docs insisten en `queryWithTenant()` (`docs/QUICKSTART.md:94`, `docs/QUICK_REFERENCE.md:126`, `docs/VALIDATION.md:78`).
- En codigo actual existen `createTenantClient`, `requiresTenantFilter`, `getTenantHeaders`, `sanitizeResponse` (`src/shared/lib/tenantClient.ts:53`, `src/shared/lib/tenantClient.ts:86`, `src/shared/lib/tenantClient.ts:180`, `src/shared/lib/tenantClient.ts:216`).

2. Arquitectura de provider/guard descrita de forma no canonica.
- Varias guias describen `TenantRouteGuard` como elemento central del arbol de rutas.
- `App.tsx` actual no envuelve rutas con `TenantRouteGuard`; usa `RequireAuth/RequirePermission` (`src/App.tsx`).

3. Doble implementacion de `TenantProvider` sin guia de canon.
- Existe provider en `TenantContext.tsx` y otro en `TenantProvider.tsx`.
- `App.tsx` usa `TenantProvider` desde `TenantContext.tsx` (`src/App.tsx:4`).
- La documentacion no define claramente cual es canonico y cual legacy.

4. Alcance de migraciones incompleto en docs operativas.
- Muchas guias cierran en 014-016.
- El repo ya incluye 017, 018, 019, 021 y 022 en `supabase/migrations/`.

5. Enlaces/documentacion navegable con errores de rutas.
- Ejemplo: `docs/QUICK_REFERENCE.md` referencia `./src/TENANT_EXAMPLES.tsx` y `./supabase/...` desde `docs/`, lo cual rompe navegacion relativa.

6. Riesgo de seguridad documental.
- `docs/SUPABASE_TABLAS.md` incluye un valor de `VITE_GEMINI_API_KEY` en claro.
- Accion urgente: retirar el valor del repo y rotar credencial.

## Huecos de informacion
- No existe un "single source of truth" tecnico-operativo actualizado a 2026-02-17.
- No hay mapa documental por audiencia con rutas canonicas vivas (dev, producto, legal, ops).
- Falta trazabilidad "release -> migraciones -> impacto frontend -> checklist de verificacion" para cambios recientes (018/019/021/022).
- No hay politica documental de vigencia (fecha de revision, owner, version, estado).
- Falta documentar explicitamente convenciones anti-multitenant leak para modulos operativos recientes (ej. reportes patio, resumen expediente, dashboard).

## Estructura documental recomendada
```txt
docs/
  README.md                          # Indice canonico vivo
  architecture/
    multi-tenancy.md                 # Modelo tecnico vigente
    auth-and-tenant-context.md       # TenantProvider canonico + flujo actual de App
  backend/
    migrations-runbook.md            # Orden real y estrategia de aplicacion
    supabase-schema.md               # Tablas/funciones/politicas vigentes
    rls-validation-checks.md         # Checks SQL y criterios de aceptacion
  frontend/
    tenant-data-access.md            # Patrones vigentes (createTenantClient/useTenantClient)
    config-studio-fields.md          # Guia funcional (migrar actual)
  product/
    compliance-781-782.md
    value-proposition-2026.md
  features/
    calendario-normativo.md
  release-notes/
    2026-02-multitenancy-phase.md
    2026-02-expediente-actor-b.md
    2026-02-evidencias-url-hardening.md
  archive/
    (documentos snapshot/historicos)
```

## Plan de normalizacion (priorizado)
1. Critico (hoy)
- Reemplazar `docs/README.md` por indice real.
- Eliminar secreto en `docs/SUPABASE_TABLAS.md` y rotar credencial.
- Agregar advertencia de obsolescencia en docs historicos con claims "100%".

2. Alto (48 horas)
- Unificar patron de acceso tenant en documentacion (`createTenantClient` + hooks vigentes).
- Actualizar runbooks de migracion para incluir 017/018/019/021/022 y scripts SQL asociados.
- Corregir enlaces relativos rotos en toda la carpeta.

3. Medio (1 semana)
- Consolidar documentos duplicados en un set canonico (maximo 8-10 docs vivos).
- Mover documentos snapshot a `docs/archive/`.
- Crear release notes por cambio relevante en vez de nuevos "summary/final/manifest".

4. Sostenimiento (continuo)
- Establecer metadatos obligatorios por archivo: `Owner`, `Last Reviewed`, `Source of Truth`, `Status`.
- Check CI simple para detectar enlaces rotos y palabras gatillo de obsolescencia.

## Plantilla de calidad documental sugerida
Cada documento vivo debe incluir:
- `Owner:` rol responsable
- `Last reviewed:` fecha absoluta
- `Status:` draft | active | deprecated | archived
- `Depends on:` rutas de codigo/migraciones fuente
- `Validation:` comando o SQL para verificar vigencia

## Recomendacion final
- Adoptar una politica de "documentacion viva minima": menos archivos, mas canon.
- Mantener documentos estrategicos separados de runbooks tecnicos.
- Tratar cualquier claim absoluto ("100%", "produccion") como invalido si no tiene fecha, evidencia y alcance explicito.
