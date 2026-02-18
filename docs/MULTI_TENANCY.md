# Estrategia de Multi-Tenancy - Gestión de Convivencia Escolar

## Resumen Ejecutivo

Este documento describe la implementación del patrón **Shared Database, Shared Schema** con `establecimiento_id` como columna de aislamiento para el sistema de gestión de convivencia escolar. Este enfoque permite que múltiples establecimientos educativos compartan la misma base de datos mientras mantienen sus datos completamente aislados.

---

## Arquitectura de Aislamiento

### 1. Estructura de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                     BASE DE DATOS                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TABLA: establecimientos (Tenants)                 │   │
│  │  - id (UUID, PK)                                    │   │
│  │  - nombre                                           │   │
│  │  - rbd (identificador único)                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  OTRAS TABLAS (con FK a establecimientos)         │   │
│  │  - estudiantes                                       │   │
│  │  - expedientes                                       │   │
│  │  - evidencias                                        │   │
│  │  - bitacora_psicosocial                             │   │
│  │  - medidas_apoyo                                    │   │
│  │  - incidentes                                        │   │
│  │  - logs_auditoria                                   │   │
│  │  - cursos_inspector                                 │   │
│  │  - perfiles                                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Estrategia de Aislamiento

| Aspecto | Implementación |
|---------|----------------|
| **Patrón** | Shared Database, Shared Schema |
| **Identificador de Tenant** | `establecimiento_id` (UUID) |
| **Tabla de Tenants** | `establecimientos` |
| **Aislamiento en DB** | Row Level Security (RLS) |
| **Aislamiento en App** | Filtros automáticos en cliente |

---

## Componentes Implementados

### Backend (Supabase/PostgreSQL)

#### Migración: `010_multi_tenant_isolation.sql`

Proporciona:

1. **Funciones Helper de Tenant**
   - [`get_current_establecimiento_id()`](supabase/migrations/010_multi_tenant_isolation.sql:23): Obtiene el establecimiento del usuario actual
   - [`get_current_user_rol()`](supabase/migrations/010_multi_tenant_isolation.sql:46): Obtiene el rol del usuario actual
   - [`user_has_access_to_establecimiento(p_establecimiento_id)`](supabase/migrations/010_multi_tenant_isolation.sql:64): Verifica acceso a un establecimiento
   - [`can_user_access_row(p_establecimiento_id)`](supabase/migrations/010_multi_tenant_isolation.sql:89): Función auxiliar para políticas RLS
   - [`get_establishment_from_header()`](supabase/migrations/010_multi_tenant_isolation.sql:214): Resuelve tenant desde header HTTP

2. **Políticas RLS por Tabla**

   Cada tabla tiene una política que filtra automáticamente por `establecimiento_id`:

   ```sql
   -- Ejemplo: Expedientes
   CREATE POLICY expedientes_isolation ON expedientes
   FOR ALL USING (public.can_user_access_row(establecimiento_id));
   ```

   Tablas con políticas:
   - [`establecimientos`](supabase/migrations/010_multi_tenant_isolation.sql:140)
   - [`perfiles`](supabase/migrations/010_multi_tenant_isolation.sql:152)
   - [`estudiantes`](supabase/migrations/010_multi_tenant_isolation.sql:158)
   - [`expedientes`](supabase/migrations/010_multi_tenant_isolation.sql:163)
   - [`evidencias`](supabase/migrations/010_multi_tenant_isolation.sql:168)
   - [`bitacora_psicosocial`](supabase/migrations/010_multi_tenant_isolation.sql:173)
   - [`medidas_apoyo`](supabase/migrations/010_multi_tenant_isolation.sql:178)
   - [`incidentes`](supabase/migrations/010_multi_tenant_isolation.sql:183)
   - [`logs_auditoria`](supabase/migrations/010_multi_tenant_isolation.sql:188)
   - [`cursos_inspector`](supabase/migrations/010_multi_tenant_isolation.sql:193)

3. **Trigger de Auditoría**
   - [`audit_trigger()`](supabase/migrations/010_multi_tenant_isolation.sql:250): Registra automáticamente operaciones DML en `logs_auditoria`

#### Migración: `011_superadmin_real_data.sql`

Proporciona:

1. **Superadmin persistente real**
   - Extensión del perfil (`apellido`, `activo`, `permisos`, `tenant_ids`, `updated_at`)
   - Rol de plataforma `superadmin` para `rol_usuario`

2. **Tablas de administración**
   - `tenant_feature_flags`: funcionalidades por tenant/colegio
   - `platform_settings`: configuración global del backend/plataforma
   - `superadmin_audit_logs`: auditoría detallada de acciones de superadmin

3. **Funciones RPC seguras**
   - `is_platform_superadmin()`
   - `log_superadmin_action(...)`
   - `get_superadmin_dashboard_metrics()`

4. **RLS granular de superadmin**
   - Solo perfiles de plataforma (`superadmin`, `sostenedor`, `admin`) pueden administrar globalmente.
   - Auditoría restringida a superadmin y registrable vía RPC.

---

### Frontend (React/TypeScript)

#### 1. TenantContext ([`src/shared/context/TenantContext.tsx`](src/shared/context/TenantContext.tsx:1))

Proveedor de contexto que resuelve el tenant desde múltiples fuentes:

```tsx
// Prioridad de resolución:
// 1. Subdominio (ej: mi-colegio.gestionconvivencia.cl)
// 2. Perfil del usuario autenticado
// 3. localStorage
// 4. Variable de entorno VITE_DEFAULT_TENANT_ID
// 5. Fallback a demo
```

**API del Contexto:**

```tsx
interface TenantContextType {
  tenantId: string | null;
  establecimiento: Establecimiento | null;
  isLoading: boolean;
  error: string | null;
  setTenantId: (id: string | null) => void;
  canAccessEstablecimiento: (establecimientoId: string) => boolean;
  establecimientosDisponibles: Establecimiento[];
}
```

#### 2. TenantClient ([`src/shared/lib/tenantClient.ts`](src/shared/lib/tenantClient.ts:1))

Cliente de Supabase con filtro automático:

```tsx
// Añade automáticamente .eq('establecimiento_id', tenantId) 
// a todas las consultas de tablas que lo requieren
const client = createTenantClient({ tenantId: 'uuid-del-establecimiento' });

// SELECT automático
await client.from('expedientes').select('*');

// INSERT automático con establecimiento_id
await client.insert('estudiantes', { nombre: 'Juan' });
```

#### 3. Hooks de Tenant ([`src/shared/hooks/useTenantClient.ts`](src/shared/hooks/useTenantClient.ts:1))

- [`useTenantClient()`](src/shared/hooks/useTenantClient.ts:41): Cliente con filtro automático
- [`useTenantAccess()`](src/shared/hooks/useTenantClient.ts:113): Verifica acceso a un recurso
- [`useTenantQuery()`](src/shared/hooks/useTenantClient.ts:142): Query simple con filtro
- [`useTenantSwitcher()`](src/shared/hooks/useTenantClient.ts:194): Cambio manual de tenant (para admins)

---

## Resolución de Tenant

### Métodos de Detección

| Método | Prioridad | Descripción |
|--------|-----------|-------------|
| **Subdominio** | 1 | `mi-colegio.gestionconvivencia.cl` → busca por RBD |
| **Header HTTP** | 2 | `x-establishment-id` para APIs |
| **Sesión de Usuario** | 3 | Del perfil del usuario en `perfiles.establecimiento_id` |
| **localStorage** | 4 | `tenant_id` guardado manualmente |
| **Variable de Entorno** | 5 | `VITE_DEFAULT_TENANT_ID` |
| **Fallback Demo** | 6 | Modo desarrollo sin configuración |

### Configuración por Subdominio

Cada establecimiento se identifica por su RBD en el subdominio:

```
mi-colegio-123.gestionconvivencia.cl
        ↓
   RBD = MI-COLEGIO-123
        ↓
  lookup en establecimientos.rbd
```

---

## Uso en Componentes

### Ejemplo 1: Consulta con Filtro Automático

```tsx
import { useTenantClient } from '@/shared/hooks';

function ExpedientesList() {
  const { client, tenantId } = useTenantClient();

  useEffect(() => {
    async function fetchExpedientes() {
      // El filtro por establecimiento_id se aplica automáticamente
      const { data } = await client?.from('expedientes')
        .select('*, estudiantes(nombre_completo, curso)')
        .order('fecha_inicio', { ascending: false });
    }
    fetchExpedientes();
  }, [client]);

  // ...
}
```

### Ejemplo 2: Verificación de Acceso

```tsx
import { useTenantAccess } from '@/shared/hooks';

function ExpedienteDetalle({ id }) {
  const { checkAccess } = useTenantAccess('expedientes', id);
  
  useEffect(() => {
    checkAccess().then(hasAccess => {
      if (!hasAccess) {
        // Redireccionar o mostrar error
      }
    });
  }, [id]);
  
  // ...
}
```

### Ejemplo 3: Cambio de Tenant (Admin)

```tsx
import { useTenantSwitcher } from '@/shared/hooks';

function TenantSwitcher() {
  const { switchTenant, establecimientosDisponibles, currentTenantId } = useTenantSwitcher();
  
  return (
    <select 
      value={currentTenantId || ''}
      onChange={(e) => switchTenant(e.target.value)}
    >
      {establecimientosDisponibles.map(est => (
        <option key={est.id} value={est.id}>
          {est.nombre}
        </option>
      ))}
    </select>
  );
}
```

---

## Seguridad

### Row Level Security (RLS)

Las políticas RLS garantizan que:

1. **Usuarios regulares**: Solo ven datos de su establecimiento
2. **Admins/Sostenedores**: Pueden ver todos los establecimientos
3. **Sin sesión**: No pueden acceder a ningún dato

```sql
-- Función que verifica acceso
CREATE FUNCTION public.can_user_access_row(p_establecimiento_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE AS $$
BEGIN
  -- Si no hay usuario, denegar
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Admin/sostenedor puede ver todo
  IF public.get_current_user_rol() IN ('admin', 'sostenedor') THEN
    RETURN true;
  END IF;
  
  -- Verificar que el establecimiento coincide
  RETURN public.get_current_establecimiento_id() = p_establecimiento_id;
END;
$$;
```

### Header para APIs

Las Edge Functions de Supabase pueden recibir el tenant via header:

```typescript
// En Edge Function
const establishmentId = req.headers.get('x-establishment-id');
// o usar la función RPC
const establishmentId = supabase.rpc('get_establishment_from_header');
```

---

## Configuración de Desarrollo

### Variables de Entorno

```env
# Archivo .env.local

# URL de Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Tenant demo para desarrollo
VITE_DEFAULT_TENANT_ID=demo-establecimiento
```

### Notas

- En desarrollo local (`localhost`), el sistema usa modo demo
- Los datos de demo se aíslan en `demo-establecimiento`
- Los filtros de tenant no se aplican en tablas globales (`establecimientos`, `feriados_chile`)

---

## Migración desde Sistema Actual

El sistema actual ya tiene `establecimiento_id` en las tablas. La migración `010`:

1. ✅ Añade funciones helper de tenant
2. ✅ Crea políticas RLS más restrictivas
3. ✅ Mantiene compatibilidad con datos existentes
4. ✅ No requiere cambios en la estructura de tablas

### Pasos para Migrar

1. **Ejecutar migración**:
   ```bash
   supabase db push
   # o
   supabase migrations up
   ```

2. **Verificar funcionamiento**:
   - Iniciar sesión con usuario de un establecimiento
   - Confirmar que solo ve datos de su establecimiento
   - Probar con usuario admin que vea múltiples establecimientos

3. **Actualizar componentes** (opcional):
   - Migrar gradualmente de `supabase` a `useTenantClient()`
   - O depender exclusivamente de RLS (ya funciona)

---

## Limitaciones y Consideraciones

### Limitaciones

1. **Rendimiento**: Queries con filtro adicional pueden ser más lentas sin índice compuesto
2. **Migración gradual**: Los datos existentes deben tener `establecimiento_id` válido
3. **Super-admin**: Requiere rol `admin` o `sostenedor` en `perfiles`

### Recomendaciones

1. **Índices Compuestos**: Crear índices en `(establecimiento_id, campo_comun)` para mejorar rendimiento
2. **Validación en App**: No confiar solo en RLS para datos muy sensibles
3. **Auditoría**: Revisar `logs_auditoria` regularmente forense de seguridad

---

## Referencias

- [Documentación de RLS en Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Patrones de Multi-Tenancy](https://docs.microsoft.com/en-us/azure/azure-sql/database/multi-tenant-data-architecture)
- [Best Practices para SaaS](https://www.mongodb.com/blog/post/multi-tenant-data-architecture)
