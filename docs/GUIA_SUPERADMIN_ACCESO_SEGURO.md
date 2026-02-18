# GUÍA SEGURA: ACCESO COMO SUPERADMIN
**Documento Confidencial**  
**Fecha:** 2026-02-18

---

## ⚠️ ADVERTENCIA CRÍTICA DE SEGURIDAD

**NUNCA solicites ni almacenes contraseñas de superadmin en:**
- Email
- Slack / Teams / WhatsApp
- Archivos de texto
- Documentos compartidos
- Control de versiones (Git)

**Las credenciales de superadmin solo deben ser:**
- Generadas automáticamente por Supabase
- Comunicadas por tu administrador de infraestructura
- Guardadas en un gestor de contraseñas encriptado (1Password, LastPass, Bitwarden)
- Accedidas solo cuando sea absolutamente necesario

---

## 1. OPCIÓN SEGURA RECOMENDADA: Usardashboard de Supabase

### Paso 1: Acceder al Dashboard

1. Ve a: **https://app.supabase.com**
2. Inicia sesión con tu cuenta de Supabase
3. Selecciona el proyecto **SGCE**

### Paso 2: Verificar o Crear SuperAdmin

1. Ve a: **Authentication → Users**
2. Busca usuario con email terminado en `superadmin` o con rol `platform_admin`
3. **Si existe:**
   - Haz click en el usuario
   - Click en "Reset password"
   - Cierra la sesión y usa el link de reset
4. **Si NO existe:**
   - Click en "Invite user"
   - Email: `superadmin@[tu-dominio].com` (ej: `superadmin@sgce.edu`)
   - Género: Indeterminado
   - Click "Send invite"
   - El usuario recibirá email con link temporal (24 horas)

### Paso 3: Verificar Permisos en Base de Datos

Abre el **SQL Editor** (en el dashboard) y ejecuta:

```sql
-- Ver si el usuario tiene rol de superadmin
SELECT id, email, is_platform_admin FROM public.tenant_profiles
WHERE email = 'superadmin@[tu-dominio].com'
LIMIT 1;
```

Si no aparece, ejecutar:

```sql
-- Crear perfil como superadmin
INSERT INTO public.tenant_profiles (
  id, 
  email, 
  full_name, 
  is_platform_admin,
  created_at,
  updated_at
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'superadmin@[tu-dominio].com'),
  'superadmin@[tu-dominio].com',
  'Super Administrador',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
  SET is_platform_admin = true;
```

---

## 2. OPCIÓN ALTERNATIVA: API Keys de Servicio

Si necesitas acceso programático (scripts, integraciones), usar **API Keys** en lugar de credenciales de usuario:

### Paso 1: Generar API Key

1. Dashboard → **Settings → API**
2. Sección **Project API Keys**
3. Copiar:
   - `anon key` (para cliente)
   - `service_role key` (para servidor)

### Paso 2: Usar en Scripts

```javascript
// Node.js / JavaScript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'eyJhbGc... (service_role key)' // Usar key de servicio
)

// Ahora puedes hacer operaciones como superadmin
const { data, error } = await supabase
  .from('tenants')
  .select('*')  // Sin restricción RLS
```

```python
# Python
from supabase import create_client, Client

url = "https://your-project.supabase.co"
key = "eyJhbGc... (service_role key)"

supabase: Client = create_client(url, key)

# Operación como superadmin
response = supabase.table('tenants').select('*').execute()
```

**⚠️ CRÍTICO:** Nunca expongas `service_role key` en:
- Código frontend público
- Repositorios Git
- Variables de entorno sin encrytar

---

## 3. OPCIÓN: Acceso Temporal para Auditoría

Si necesitas acceso solo por unas horas para resolver un problema:

### Paso 1: Crear Usuario Temporal

```sql
-- En SQL Editor (es administrador)
-- Crear usuario con fecha de expiración

-- Opción manual: Crear user en auth.users
INSERT INTO auth.users (
  email,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user
)
VALUES (
  'audit-temp@sgce.local',
  now(),
  '{"name":"Auditor Temporal"}',
  now(),
  now(),
  false
)
RETURNING id;

-- Luego copiar el ID (uuid) y crear profil:
-- INSERT INTO public.tenant_profiles ...
```

### Paso 2: Comunicar Credenciales Temporales

- **Por:** Teléfono (no email)
- **Duración:** 2-4 horas máximo
- **Password:** Género automáticamente
- **Acción después:** Eliminar usuario temporal

```sql
DELETE FROM public.tenant_profiles 
WHERE email = 'audit-temp@sgce.local';

DELETE FROM auth.users 
WHERE email = 'audit-temp@sgce.local';
```

---

## 4. ACCESO A TRAVÉS DE GOOGLE/GitHub (SSO)

Si tienes integrado SSO, acceso es más seguro:

1. **Google Sign-In:**
   - Tu cuenta de Google (puedes usar 2FA de Gmail)
   - Supabase autentica contra Google
   - No hay contraseña que comprometer

2. **GitHub:**
   - Tu cuenta de GitHub (puedes usar 2FA de GitHub)
   - Supabase autentica contra GitHub
   - No hay contraseña que comprometer

---

## 5. PROCEDIMIENTO PARA CAMBIAR CONTRASEÑA

### Si Olvidas tu Contraseña de Superadmin:

1. En la página de login → "Olvidé mi contraseña"
2. Ingresa tu email
3. Recibirás link de reset seguro
4. Crea nueva contraseña fuerte:
   - **Mínimo 12 caracteres**
   - **Combina:** Mayúsculas, minúsculas, números, símbolos
   - **Ejemplo:** `@Jg9kL#dP2mN$xQwE`

### Para Cambiar Contraseña Estando Logeado:

1. Dashboard → **Settings → Account**
2. Sección "Change password"
3. Ingresa contraseña actual
4. Ingresa contraseña nueva (2x)
5. Click "Save"

---

## 6. ACTIVAR 2FA (Muy Recomendado)

### Paso 1: Ir a Autenticación

1. Dashboard → **Settings → Account → Security**
2. Sección "Two-Factor Authentication"

### Paso 2: Escanear QR

1. Descarga app de autenticación:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - 1Password
2. Click en "Setup authenticator app"
3. Escanea código QR con tu teléfono
4. Guarda los "recovery codes" en lugar seguro

### Paso 3: Confirmar

1. Ingresa código de 6 dígitos de tu app
2. Click "Verify"

**Ahora** cada login requiere:
- Email + Contraseña
- + Código de 6 dígitos del teléfono

---

## 7. SEGURIDAD: CHECKLIST

- [ ] ¿Es el único usuario con `is_platform_admin = true`?
- [ ] ¿Tiene 2FA (autenticación de dos factores) habilitada?
- [ ] ¿Su contraseña tiene 12+ caracteres con símbolos?
- [ ] ¿Está guardada en gestor de contraseñas encriptado?
- [ ] ¿Ha sido accedida solo cuando es necesario?
- [ ] ¿Hay log de auditoría de accesos superadmin?

---

## 8. MONITOREO: Auditar Accesos Superadmin

```sql
-- Ver últimos accesos de superadmin
SELECT 
  id,
  email,
  last_sign_in_at,
  created_at
FROM auth.users u
JOIN public.tenant_profiles tp ON u.id = tp.id
WHERE tp.is_platform_admin = true
ORDER BY last_sign_in_at DESC
LIMIT 10;

-- Ver cambios realizados por superadmin (si existe audit_logs)
SELECT 
  id,
  user_id,
  action,
  table_name,
  created_at
FROM public.audit_logs
WHERE user_id IN (
  SELECT id FROM auth.users u
  JOIN public.tenant_profiles tp ON u.id = tp.id
  WHERE tp.is_platform_admin = true
)
ORDER BY created_at DESC
LIMIT 50;
```

---

## 9. EN CASO DE COMPROMISO DE CREDENCIALES

**Si crees que tu contraseña de superadmin fue comprometida:**

1. **INMEDIATO:**
   - Cambiar contraseña desde Dashboard
   - Revisar último login (`last_sign_in_at`)
   - Activar 2FA si aún no está activo

2. **EN 24 HORAS:**
   - Revisar audit logs de cambios
   - Revisar cambios en políticas RLS
   - Revisar cambios en cualquier tabla crítica

3. **NOTIFICAR:**
   - A tu equipo de seguridad
   - A Supabase (support@supabase.io) si hay actividad sospechosa
   - Considerar cambio de contraseña a otros usuarios admin

---

## 10. CONCLUSIÓN: Respuesta a tu Pregunta Original

### ¿Dónde está el email y contraseña del superadmin?

**Respuesta:** No tengo credenciales porque:

1. **Nunca se almacenan en texto plano** - Es una vulnerabilidad crítica
2. **Se generan bajo demanda** - A través del dashboard de Supabase
3. **Supabase es el único que las gestiona** - Encriptadas en su servidor

### ¿Cómo acceder?

**Sigue los pasos 1-2 de esta guía:**
1. Ve a Supabase Dashboard
2. Authentication → Users
3. Crea o resetea usuario superadmin
4. Recibirás email con link temporal
5. Establece tu propia contraseña fuerte

### ¿Y para el futuro?

- Usa **2FA** (autenticación de dos factores)
- Guarda en **gestor de contraseñas** (1Password, etc.)
- Revisa **audit logs** regularmente
- Cambia contraseña **cada 90 días** (recomendación de seguridad)

---

**Documento preparado por:** GitHub Copilot  
**Clasificación:** CONFIDENCIAL  
**Distribución:** Solo al propietario/administrador del proyecto
