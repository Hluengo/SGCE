# Config Studio: Guía de Campos

Este documento explica, en lenguaje funcional, qué se debe completar en cada sección del módulo **Config Studio Supabase**.

## 1) Campos Generales

### Alcance
- Qué pide: definir dónde se aplicará el cambio.
- Opciones:
  - `Global (todos)`: aplica a todos los colegios.
  - `Por colegio`: aplica solo al colegio activo.
- Cuándo usar:
  - Global para reglas de plataforma comunes.
  - Por colegio para personalización o aislamiento.

### Tenant Activo
- Qué pide: colegio objetivo si el alcance es `Por colegio`.
- Formato esperado: UUID del establecimiento.
- Ejemplo: `d645e547-054f-4ce4-bff7-7a18ca61db50`.

### Título
- Qué pide: nombre breve y claro del cambio.
- Recomendación: incluir objetivo + ámbito.
- Ejemplo: `Configuración base colegio Demo`.

### Resumen
- Qué pide: descripción breve de lo que se agregará o modificará.
- Ejemplo: `Crea tabla de configuración institucional y política RLS de aislamiento por establecimiento.`

---

## 2) Plantilla Colegio

Objetivo: crear/ajustar estructura de datos del colegio y su política de acceso por tenant.

### Modelo de datos

#### Tabla
- Qué pide: nombre de la tabla a crear/editar.
- Formato recomendado: `snake_case`.
- Ejemplo válido: `configuracion_colegio`.

#### Crear si no existe
- Qué pide: si debe crearse automáticamente cuando no exista.
- Tipo: boolean (`true/false`).

#### Habilitar RLS
- Qué pide: activar seguridad por filas para esa tabla.
- Tipo: boolean (`true/false`).

#### Columnas (JSON)
- Qué pide: definición de columnas en JSON.
- Campos soportados por columna:
  - `name` (obligatorio)
  - `type` (obligatorio)
  - `notNull` (opcional)
  - `unique` (opcional)
  - `defaultValue` (opcional)
  - `referencesTable` (opcional)
  - `referencesColumn` (opcional)
- Ejemplo válido:

```json
[
  { "name": "id", "type": "uuid primary key default uuid_generate_v4()", "notNull": true },
  { "name": "establecimiento_id", "type": "uuid", "notNull": true, "referencesTable": "establecimientos", "referencesColumn": "id" },
  { "name": "nombre_visible", "type": "text", "notNull": true },
  { "name": "contacto_email", "type": "text" },
  { "name": "anio_academico", "type": "integer", "notNull": true }
]
```

### Política RLS (acceso por colegio)

#### Tabla a proteger (RLS)
- Qué pide: nombre de la tabla a la que se aplicará la política.
- Ejemplo: `configuracion_colegio`.

#### Nombre de la política de acceso
- Qué pide: identificador único de la política.
- Formato recomendado: descriptivo + snake_case.
- Ejemplo: `configuracion_colegio_tenant_isolation`.

#### USING (expresión SQL)
- Qué pide: condición de lectura/acceso.
- Ejemplo recomendado:

```sql
public.can_user_access_row(establecimiento_id)
```

#### WITH CHECK (expresión SQL)
- Qué pide: condición para insertar/actualizar.
- Ejemplo recomendado:

```sql
public.can_user_access_row(establecimiento_id)
```

---

## 3) Plantilla Seguridad

Objetivo: endurecer autenticación, sesión y control de consumo API.

### Min password
- Qué pide: largo mínimo de contraseña.
- Regla UI: mínimo 8.
- Ejemplo: `12` o `14`.

### Timeout sesión
- Qué pide: minutos máximos de sesión.
- Regla UI: mínimo 30.
- Ejemplo: `240`.

### Rate limit/min
- Qué pide: tope de solicitudes por minuto.
- Regla UI: mayor a 0.
- Ejemplo: `80`, `120`.

### MFA obligatorio admins
- Qué pide: exigir doble factor para administradores.
- Tipo: boolean (`true/false`).

---

## 4) Plantilla Infraestructura

Objetivo: configurar archivos y funciones backend sin entrar al dashboard manual.

### Archivos (Storage)

#### Nombre del contenedor de archivos (bucket)
- Qué pide: nombre lógico del bucket.
- Formato recomendado: `snake-case` o `kebab-case` consistente.
- Ejemplo: `documentos-colegio`.

#### Tipos permitidos
- Qué pide: lista separada por comas de MIME types.
- Ejemplo: `image/png,application/pdf,image/jpeg`.

### Funciones Edge

#### Nombre de la función edge
- Qué pide: identificador de la función.
- Ejemplo: `sync-tenant-settings`.

#### Ruta HTTP de la función
- Qué pide: endpoint público o interno de invocación.
- Ejemplo: `/tenant/settings/sync`.

---

## 5) SQL Avanzado

Objetivo: revisión técnica previa a aplicar.

Muestra:
- Número de sentencias SQL a ejecutar.
- Número de sentencias de reversa (rollback).
- SQL generado completo para inspección.

Cuándo usar:
- Validar impacto técnico antes de guardar/aplicar.

---

## 6) Historial

Objetivo: operar cambios ya guardados.

Muestra:
- Selección de cambioset
- Título
- Alcance
- Estado (`borrador`, `validado`, `aplicado`, `fallido`, `revertido`)

Acciones:
- `Aplicar`: ejecuta el changeset seleccionado.
- `Revertir`: ejecuta rollback del changeset seleccionado.

---

## Glosario rápido
- **Alcance**: dónde se aplica el cambio (global o por colegio).
- **Borrador**: propuesta guardada, aún no aplicada.
- **RLS**: seguridad por filas (Row Level Security).
- **Changeset**: paquete de cambios SQL + rollback + metadatos.
