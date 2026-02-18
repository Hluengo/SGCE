# 403 Forbidden Error - Guía de Resolución

**Error**: `Failed to load resource: the server responded with a status of 403`  
**Causa**: Rechazo por política RLS en tabla `configuracion_branding`  

---

## 🔍 Paso 1: Verificar Autenticación en Browser

Abrir **F12 > Console** y ejecutar:

```javascript
// Revisar sesión activa
const { data: { session } } = await supabase.auth.getSession();

console.log('=== AUTH INFO ===');
console.log('User ID:', session?.user?.id);
console.log('Email:', session?.user?.email);
console.log('Role en metadata:', session?.user?.user_metadata?.role);
console.log('JWT headers:', session?.user);
console.log('Sesión válida:', !!session);
console.log('Sesión expira:', new Date(session?.expires_at * 1000));
```

**Esperado**:
```
User ID: abc-123-def-456
Email: superadmin@example.com
Role en metadata: SUPERADMIN
Sesión válida: true
```

**Si ves null o undefined**:
- ❌ Usuario no está autenticado
- ❌ Necesita login de nuevo
- ❌ O JWT expiró (logout y login)

---

## 🔍 Paso 2: Verificar JWT Token

En console:

```javascript
// Decodificar JWT manualmente
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Decodificar (sin verificar firma, solo para debug)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));

console.log('=== JWT PAYLOAD ===');
console.log('Role claim:', payload.role);
console.log('Email:', payload.email);
console.log('aud:', payload.aud);
console.log('sub:', payload.sub);
console.log('metadata:', payload['https://hasura.io/jwt/claims']);
```

**Esperado**:
```
Role claim: SUPERADMIN
Email: superadmin@example.com
aud: authenticated
sub: abc-123-def
```

---

## 🔍 Paso 3: Verificar Policies en Supabase

En **Supabase Dashboard > SQL Editor**, ejecutar:

```sql
-- Ver todas las policies de la tabla configuracion_branding
SELECT 
  policyname, 
  permissive, 
  qual as USING_clause, 
  req as WITH_CHECK_clause
FROM pg_policies 
WHERE tablename = 'configuracion_branding'
ORDER BY policyname;

-- Ver EXACTO si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'configuracion_branding';
-- Esperado: rowsecurity = true
```

**Resultado esperado**: 4 filas (read, insert, update, delete)

---

## 🔍 Paso 4: Validar Migrate 032 fue aplicada

```sql
-- Verificar estructura de tabla
\d configuracion_branding

-- Debería mostrar:
-- - id (uuid, primary key)
-- - establecimiento_id (uuid, FK a establecimientos)
-- - logo_url (text)
-- - ... otros campos
-- - RLS enabled: true
```

---

## 🔧 Solución Quick: Re-aplicar Migration

Si las policies NO existen o están incorrectas:

### Opción A: Via Supabase Dashboard

1. **SQL Editor > New Query**
2. **Copiar y pegar** toda la migración 032
3. **Click Run**
4. **Resultado**: "Query executed successfully"

### Opción B: Via Terminal (si tienes acceso)

```bash
# Aplicar solo migración 032
supabase db push --db-url="postgresql://..." < supabase/migrations/032_tenant_branding.sql
```

---

## 🐛 Si sigue fallando: Checklist Detallado

### Checklist 1: JWT Role es SUPERADMIN

```javascript
// En console del browser
const s = await supabase.auth.getSession();
const role = s.data.session?.user?.user_metadata?.role;

if (role === 'SUPERADMIN') {
  console.log('✅ Role correcto');
} else {
  console.log('❌ Role es:', role);
  console.log('❌ ERROR: Usuario no es SUPERADMIN');
}
```

**Si es ❌**: 
- Verificar que el usuario fue creado con `raw_app_meta_data = { role: 'SUPERADMIN' }`
- Ver migración 013 para verificar cómo se crea superadmin

### Checklist 2: Policies usan auth.uid()

```sql
-- En Supabase SQL Editor
-- Verificar que TODAS las policies tienen auth.uid() IS NOT NULL

SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'configuracion_branding' 
AND qual LIKE '%auth.uid()%';

-- Debería retornar 4 filas
```

**Si retorna 0 filas**:
- ❌ Las policies no usan auth.uid()
- ✅ Re-aplicar migración 032

### Checklist 3: auth.uid() retorna valor

```javascript
// En console, llamar a function pública que usa auth.uid()
const { data, error } = await supabase.rpc('get_tenant_branding', {
  p_establecimiento_id: 'uuid-del-colegio'
});

console.log('Data:', data);
console.log('Error:', error);
```

**Si error es null**:
- ✅ auth.uid() funciona
- ✅ Usuario está autenticado

### Checklist 4: Policies NOT restrictivas

```sql
-- Ver si hay policies restrictivas que bloquean
-- (rara vez, pero posible)

SELECT policyname, permissive 
FROM pg_policies 
WHERE tablename = 'configuracion_branding' 
AND permissive = false;

-- Si retorna filas: ❌ Hay policies permissive=false
-- que pueden estar bloqueando
```

---

## 🚀 Solución Nuclear (último recurso)

Si nada funciona, **deshabilitar RLS temporalmente**:

```sql
-- ⚠️ SOLO para debugging

-- 1. Deshabilitar RLS en tabla
ALTER TABLE public.configuracion_branding DISABLE ROW LEVEL SECURITY;

-- 2. Intentar guardar desde UI
-- Si funciona ahora: ✅ Problema es RLS
-- Si sigue fallando: ❌ Problema es otro (schema, permisos, etc)

-- 3. Ver qué error retorna
-- Si INSERT/UPDATE funciona sin RLS pero falla CON RLS:
--    → Las policies están rechazando
--    → Revisar policy conditions

-- 4. Re-habilitar RLS después de debugging
ALTER TABLE public.configuracion_branding ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Matriz de Diagnóstico

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| 403 en save, JWT tiene SUPERADMIN | Políticas incorrectas o no existen | Re-aplicar migración 032 |
| 403 en save, JWT NO tiene role | Usuario no es SUPERADMIN | Logout y login con admin |
| 403 en save, sin JWT | Usuario no autenticado | Logout y login |
| 401 error | Access token expiró | Logout y login |
| 400 bad request | Schema o data incorrecto | Revisar tipos de datos |

---

## 💊 Pasos de Resolución (en orden)

1. ✅ [Verificar Autenticación en Browser](#paso-1-verificar-autenticación-en-browser)
2. ✅ [Verificar JWT Token](#paso-2-verificar-jwt-token)
3. ✅ [Verificar Policies en Supabase](#paso-3-verificar-policies-en-supabase)
4. ✅ [Re-aplicar Migration 032](#solución-quick-re-aplicar-migration)
5. ✅ [Ejecutar Checklist](#si-sigue-fallando-checklist-detallado)
6. 🆘 [Deshabilitar RLS para debugging](#solución-nuclear-último-recurso)

---

## 📝 Logs Importantes

Cuando reportes el error, incluir:

```javascript
// Console output
Rol del usuario frontend: SUPERADMIN
JWT Role claim: SUPERADMIN
Auth UID presente: abc-123-def
Sesión válida: true
```

```sql
-- SQL output
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'configuracion_branding';
-- Resultado: 4
```

---

## ✅ Validación Final

Si todo funciona:

```javascript
// En console, ejecutar:
console.log('✅ 1. Autenticación: OK');

const config = await supabase
  .from('configuracion_branding')
  .select('*')
  .limit(1);

if (config.error) {
  console.log('❌ 2. RLS Select: FALLA -', config.error);
} else {
  console.log('✅ 2. RLS Select: OK');
}

const insert = await supabase
  .from('configuracion_branding')
  .insert({ establecimiento_id: 'test', nombre_publico: 'test' });

if (insert.error?.code === '42501' || insert.error?.code === '403') {
  console.log('❌ 3. RLS Insert: FALLA - Policy rejection');
} else if (insert.error) {
  console.log('❌ 3. RLS Insert: ERROR -', insert.error.message);
} else {
  console.log('✅ 3. RLS Insert: OK');
}
```

