# Flujo de Acceso de Usuarios (Backend + Frontend)

Este documento resume el proceso completo para habilitar acceso a usuarios desde `SuperAdminPage.tsx`, incluyendo creación, actualización, desactivación y borrado seguro.

## 1) Crear usuario base en Auth (backend)

Primero el usuario debe existir en `auth.users` (Supabase Auth).

Opciones:
- Supabase Dashboard: `Authentication > Users > Add user`
- Backend con `service_role` (`admin.createUser`)

Notas:
- El `id` (`UUID`) de `auth.users` es la llave principal que luego usa `public.perfiles.id`.
- No inventar UUID manualmente.

## 2) Asignar acceso desde frontend (`/admin`)

En `SuperAdminPage.tsx`:
1. Buscar por email en bloque `Buscar por email (Auth)`.
2. Botón `Obtener UUID` llama RPC:
   - `public.superadmin_find_auth_user_by_email(p_email text)`
3. Completar:
   - `Tenant` (`establecimiento_id`)
   - `Rol`
   - `Permisos`
   - `Activo`
   - `Nombre` / `Apellido`
4. Botón `Guardar rol/permisos` llama RPC:
   - `public.superadmin_upsert_profile_access(...)`

## 3) Consistencia de tenant en perfiles

Regla implementada:
- `establecimiento_id` = tenant principal.
- `tenant_ids` debe incluir siempre `establecimiento_id`.

Esto se asegura en:
- `053_superadmin_upsert_sync_tenant_ids.sql`
- Constraint recomendado aplicado: `establecimiento_id = ANY(tenant_ids)`

## 4) Desactivar o borrar perfiles

### Baja lógica (recomendada)
RPC:
- `public.safe_deactivate_profile(p_profile_id uuid, p_reason text)`

Efecto:
- `activo = false`
- `permisos = []`
- rol reducido
- registro en `superadmin_audit_logs`

### Borrado físico (solo si no hay referencias)
RPC:
- `public.safe_delete_profile_if_unreferenced(p_profile_id uuid)`

Efecto:
- Borra solo si no hay FK activas (expedientes, evidencias, logs, etc.).
- Si tiene referencias devuelve:
  - `PROFILE_REFERENCED`
  - `reference_count`

## 5) Errores comunes y causa

- `FORBIDDEN_SUPERADMIN_REQUIRED`
  - JWT no trae rol superadmin o ejecución fuera de contexto permitido.

- `ESTABLECIMIENTO_REQUIRED`
  - El RPC de upsert requiere tenant obligatorio.

- `PROFILE_REFERENCED`
  - Intento de borrado físico con FK históricas.

- `AUDIT_ACTOR_NOT_RESOLVED`
  - No se pudo resolver actor para auditoría.

- `stack depth limit exceeded (54001)`
  - Recursión RLS corregida con hotfixes (`050`, `051`).

## 6) SQL aplicados en esta línea

- `047_circular_782_gcc_cierre_backend.sql`
- `048_superadmin_roles_permisos_management.sql`
- `049_fix_stack_depth_is_platform_superadmin.sql`
- `050_hotfix_stack_depth_superadmin_rls.sql`
- `051_emergency_break_rls_recursion_superadmin.sql`
- `052_superadmin_find_auth_user_by_email.sql`
- `053_superadmin_upsert_sync_tenant_ids.sql`
- `054_safe_profile_deactivate_and_delete.sql`
- `055_allow_admin_context_for_safe_profile_ops.sql`
- `056_fix_safe_profile_audit_actor_null.sql`

## 7) Operación recomendada para soporte

1. Crear usuario en Auth.
2. Ir a `/admin`.
3. Buscar email y obtener UUID.
4. Asignar tenant/rol/permisos.
5. Guardar.
6. Para retiro de acceso: usar `Desactivar perfil` (no borrado físico).

## 8) Guía rápida para administradores (no técnicos)

1. Entra a **Superadministración** y revisa las tarjetas KPI del encabezado.
2. Usa pestaña **Vista general** para:
   - seleccionar tenant,
   - ajustar configuraciones globales,
   - activar/desactivar feature flags.
3. Usa pestaña **Gestión de perfiles** para:
   - buscar perfiles por nombre/ID/rol,
   - filtrar por rol y estado,
   - navegar por páginas de resultados.
4. Para crear o actualizar acceso:
   - busca el usuario por email (botón **Obtener UUID**),
   - completa tenant, rol y permisos,
   - guarda con **Guardar rol/permisos**.
5. Para desactivar o borrar:
   - usa botones por fila (**Baja** o **Eliminar**),
   - confirma en el modal de seguridad.
6. Si aparece un toast rojo o estado de error:
   - revisa el mensaje,
   - corrige datos (UUID, permisos, tenant),
   - vuelve a intentar.

## 9) Arquitectura frontend (mantenimiento técnico)

Estructura actual de la pantalla `/admin`:

- `src/features/admin/SuperAdminPage.tsx`
  - Componente orquestador.
  - Maneja navegación por tabs y composición de paneles.
  - Mantiene la capa visual principal (theme vars y clases base).

- `src/features/admin/hooks/useSuperAdminData.ts`
  - Capa de datos y operaciones Supabase.
  - Responsabilidades:
    - carga inicial de tenants/perfiles/flags/settings/logs,
    - cálculo de KPIs,
    - acciones de guardado global,
    - gestión de perfil (upsert, búsqueda por email, baja, borrado seguro),
    - operación de feature flags y mantenimiento.

- `src/features/admin/components/SuperAdminLayoutPieces.tsx`
  - Piezas de layout/dashboard:
    - hero,
    - skeleton de carga,
    - banner de error,
    - tarjetas KPI,
    - tabs,
    - stack de toasts.

- `src/features/admin/components/SuperAdminOverviewPanels.tsx`
  - Paneles de vista general:
    - gestión de tenants y configuración global,
    - tenant seleccionado + flags + mantenimiento.

- `src/features/admin/components/SuperAdminProfilePanels.tsx`
  - Paneles de perfiles:
    - tabla filtrable/paginada con acciones por fila,
    - formulario de acceso/rol/permisos,
    - modal de confirmación de acciones críticas.

- `src/features/admin/types.ts`
  - Tipos compartidos y contratos de estado/acciones para todo el módulo admin.
  - Evita duplicación y facilita cambios de modelo.

### Convención recomendada para cambios futuros

1. Cambios de datos o RPC:
   - primero en `useSuperAdminData.ts`,
   - luego props/consumo en componentes.
2. Cambios visuales:
   - priorizar componentes en `components/`,
   - mantener `SuperAdminPage.tsx` como ensamblador.
3. Tipos nuevos:
   - declararlos en `types.ts`,
   - reusar imports en hook/componentes.
4. Validación mínima antes de merge:
   - `npx tsc --noEmit`
   - `npx -y react-doctor@latest . --verbose --diff`
