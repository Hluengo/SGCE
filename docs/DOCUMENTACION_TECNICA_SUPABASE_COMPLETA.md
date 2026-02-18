# Documentación Técnica Completa - Base de Datos Supabase

## Sistema de Gestión de Convivencia Escolar (SGCE)

**Versión del documento:** 1.0  
**Fecha de generación:** 2026-02-18  
**Proyecto:** SGCE - Gestión de Convivencia Escolar  
**Cumplimiento normativo:** Circulares 781 y 782 de la Superintendencia de Educación

---

## 1. Resumen Ejecutivo

La base de datos de Supabase para el Sistema de Gestión de Convivencia Escolar (SGCE) implementa una arquitectura **multi-tenant** que permite el aislamiento de datos entre diferentes establecimientos educativos. El sistema cuenta con **más de 35 tablas**, **múltiples enum types**, **funciones de seguridad**, **triggers automatizados** y **políticas RLS** para garantizar la seguridad y el cumplimiento normativo.

### Características Principales Identificadas

- **Multi-Tenancy**: Aislamiento de datos por establecimiento educativo mediante columna `establecimiento_id`
- **Sistema de Roles**: 7 roles de usuario (admin, director, convivencia, dupla, inspector, sostenedor, superadmin)
- **Auditoría**: Registro automático de todas las acciones en `logs_auditoria`
- **Cumplimiento Normativo**: Estructura diseñada para cumplir con Circulares 781 y 782
- **Gestión de Expedientes**: Workflow completo para procesos disciplinarios incluyendo GCC (Gestión de Convivencia)

---

## 2. Enum Types Definidos

El sistema utiliza múltiples tipos enumerados para garantizar la consistencia de datos.

### 2.1 Enum de Roles de Usuario

```sql
CREATE TYPE rol_usuario AS ENUM (
  'admin',
  'director',
  'convivencia',
  'dupla',
  'inspector',
  'sostenedor',
  'superadmin'
);
```

**Propósito:** Define los roles de usuario en el sistema con diferentes niveles de acceso y permisos.

### 2.2 Enum de Tipo de Falta

```sql
CREATE TYPE tipo_falta AS ENUM (
  'leve',
  'relevante',
  'expulsion'
);
```

**Propósito:** Clasifica las faltas según su gravedad para determinar el proceso disciplinario correspondiente.

### 2.3 Enum de Estado Legal

```sql
CREATE TYPE estado_legal AS ENUM (
  'apertura',
  'investigacion',
  'resolucion',
  'cerrado',
  'pausa_legal'
);
```

**Propósito:** Representa el estado legal del proceso disciplinario según la normativa vigente.

### 2.4 Enum de Etapa del Proceso

```sql
CREATE TYPE etapa_proceso AS ENUM (
  'INICIO',
  'NOTIFICADO',
  'DESCARGOS',
  'INVESTIGACION',
  'RESOLUCION_PENDIENTE',
  'RECONSIDERACION',
  'CERRADO_SANCION',
  'CERRADO_GCC'
);
```

**Propósito:** Define las etapas del proceso disciplinario desde la apertura hasta el cierre.

### 2.5 Enum de Nivel de Privacidad

```sql
CREATE TYPE nivel_privacidad AS ENUM (
  'baja',
  'media',
  'alta'
);
```

**Propósito:** Controla la visibilidad de información sensible especialmente en la bitácora psicosocial.

### 2.6 Enum de Tipo de Evidencia

```sql
CREATE TYPE evidencia_tipo AS ENUM (
  'IMG',
  'VIDEO',
  'AUDIO',
  'PDF'
);
```

**Propósito:** Clasifica los tipos de archivos que pueden ser adjuntos como evidencias.

### 2.7 Enum de Fuente de Evidencia

```sql
CREATE TYPE evidencia_fuente AS ENUM (
  'ESCUELA',
  'APODERADO',
  'SIE'
);
```

**Propósito:** Identifica el origen de la evidencia documental.

### 2.8 Enum de Tipo de Apoyo

```sql
CREATE TYPE apoyo_tipo AS ENUM (
  'PEDAGOGICO',
  'PSICOSOCIAL'
);
```

**Propósito:** Clasifica las medidas de apoyo según su naturaleza.

### 2.9 Enum de Estado de Apoyo

```sql
CREATE TYPE apoyo_estado AS ENUM (
  'REALIZADA',
  'PENDIENTE'
);
```

**Propósito:** Seguimiento del estado de las medidas de apoyo.

### 2.10 Enum de Tipo de Intervención

```sql
CREATE TYPE intervencion_tipo AS ENUM (
  'ENTREVISTA',
  'OBSERVACION',
  'VISITA',
  'DERIVACION'
);
```

**Propósito:** Tipos de intervenciones realizadas por la dupla psicosocial.

### 2.11 Enum de Institución de Derivación

```sql
CREATE TYPE derivacion_institucion AS ENUM (
  'OPD',
  'COSAM',
  'TRIBUNAL',
  'SALUD'
);
```

**Propósito:** Instituciones externas receptoras de derivaciones.

### 2.12 Enum de Estado de Derivación

```sql
CREATE TYPE derivacion_estado AS ENUM (
  'PENDIENTE',
  'RESPONDIDO'
);
```

**Propósito:** Seguimiento del estado de las derivaciones externas.

### 2.13 Enum de Estado de Mediación

```sql
CREATE TYPE mediacion_estado AS ENUM (
  'ABIERTA',
  'EN_PROCESO',
  'CERRADA_EXITOSA',
  'CERRADA_SIN_ACUERDO'
);
```

**Propósito:** Estados del proceso de mediación GCC.

### 2.14 Enum de Gravedad de Patio

```sql
CREATE TYPE patio_gravedad AS ENUM (
  'LEVE',
  'RELEVANTE',
  'GRAVE'
);
```

**Propósito:** Clasificación de gravedad de los incidentes reportados en patio.

### 2.15 Enum de Estado de Admin Changeset

```sql
CREATE TYPE admin_changeset_status AS ENUM (
  'draft',
  'validated',
  'applied',
  'failed',
  'reverted'
);
```

**Propósito:** Estados del proceso de cambios de configuración del superadmin.

### 2.16 Enum de Alcance Admin

```sql
CREATE TYPE admin_scope AS ENUM (
  'global',
  'tenant'
);
```

**Propósito:** Define el alcance de los cambios de configuración (global o por tenant).

---

## 3. Tablas del Sistema

### 3.1 Tablas Core (Núcleo del Sistema)

#### 3.1.1 Tabla: establecimientos

**Propósito:** Almacena la información de los establecimientos educativos (tenants).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| nombre | text | NO | - | Nombre del establecimiento |
| rbd | text | SI | NULL | Rol Base de Datos (identificador MINEDUC) |
| activo | boolean | NO | true | Estado del establecimiento |
| direccion | text | SI | NULL | Dirección física |
| telefono | text | SI | NULL | Teléfono de contacto |
| email | text | SI | NULL | Correo institucional |
| niveles_educativos | text[] | SI | NULL | Niveles ofrecidos (básica, media) |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Relaciones:**
- FK a `perfiles.establecimiento_id`
- FK a `estudiantes.establecimiento_id`
- FK a `expedientes.establecimiento_id`

**Índices:**
- Primary key sobre `id`

---

#### 3.1.2 Tabla: perfiles

**Propósito:** Almacena los perfiles de usuario vinculados a establecimientos con roles específicos.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | - | FK a auth.users(id) |
| nombre | text | NO | - | Nombre completo del usuario |
| rol | rol_usuario | NO | - | Rol del usuario en el sistema |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| tenant_ids | uuid[] | SI | NULL | Lista de establecimientos accesibles |
| activo | boolean | NO | true | Estado del perfil |
| permisos | jsonb | SI | NULL | Permisos específicos del usuario |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `id` → `auth.users(id)` ON DELETE CASCADE
- `establecimiento_id` → `establecimientos(id)`

**Relaciones:**
- Referenciada por múltiples tablas como `creado_por`
- Relación con `auth.users` para autenticación

**Índices:**
- Primary key sobre `id`
- Índice en `establecimiento_id`
- Índice en `rol`

---

#### 3.1.3 Tabla: estudiantes

**Propósito:** Registro de estudiantes con información académica y flags de alertas.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| rut | text | NO | - | RUN único del estudiante |
| nombre_completo | text | NO | - | Nombre completo |
| curso | text | NO | - | Curso actual |
| programa_pie | boolean | NO | false | Participa en Programa PIE |
| alerta_nee | boolean | NO | false | Tiene Necesidades Educativas Especiales |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`

**Restricciones:**
- `rut` es UNIQUE

**Relaciones:**
- FK desde `expedientes.estudiante_id`
- FK desde `medidas_apoyo.estudiante_id`
- FK desde `bitacora_psicosocial.estudiante_id`
- FK desde `derivaciones_externas.estudiante_id`

**Índices:**
- Primary key sobre `id`
- Unique index sobre `rut`
- Índice en `establecimiento_id`

---

#### 3.1.4 Tabla: expedientes

**Propósito:** Casos de convivencia escolar con folio único, tipo de falta, estado legal y etapa del proceso.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| estudiante_id | uuid | NO | - | FK al estudiante involucrado |
| estudiante_b_id | uuid | SI | NULL | FK a segundo estudiante (si aplica) |
| folio | text | NO | - | Folio único del expediente |
| tipo_falta | tipo_falta | NO | - | Tipo de falta (leve, relevante, expulsion) |
| estado_legal | estado_legal | NO | 'apertura' | Estado legal del proceso |
| etapa_proceso | etapa_proceso | NO | 'INICIO' | Etapa actual del proceso |
| fecha_inicio | date | NO | - | Fecha de apertura del caso |
| plazo_fatal | timestamptz | SI | NULL | Fecha límite para resolver |
| acciones_previas | boolean | NO | false | Indica si hubo acciones previas |
| es_proceso_expulsion | boolean | NO | false | Es proceso de expulsión |
| descripcion_hechos | text | SI | NULL | Descripción de los hechos |
| fecha_incidente | date | SI | NULL | Fecha del incidente |
| hora_incidente | time | SI | NULL | Hora del incidente |
| lugar_incidente | text | SI | NULL | Lugar del incidente |
| creado_por | uuid | NO | - | FK al perfil que creó el caso |
| created_at | timestamptz | NO | now() | Fecha de creación |
| interaction_type | text | NO | 'creacion' | Tipo de interacción |
| additional_data | jsonb | NO | '{}'::jsonb | Datos adicionales |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `estudiante_id` → `estudiantes(id)` ON DELETE RESTRICT
- `estudiante_b_id` → `estudiantes(id)` ON DELETE SET NULL
- `creado_por` → `perfiles(id)`

**Restricciones:**
- `folio` es UNIQUE
- CHECK: fecha_cierre >= fecha_inicio (para mediaciones)

**Relaciones:**
- FK desde `evidencias.expediente_id`
- FK desde `hitos_expediente.expediente_id`
- FK desde `mediaciones_gcc.expediente_id`
- FK desde `incidentes.expediente_id`

**Índices:**
- Primary key sobre `id`
- Unique index sobre `folio`
- Índice en `establecimiento_id`
- Índice en `estudiante_id`
- Índice en `estado_legal`
- Índice en `etapa_proceso`

---

#### 3.1.5 Tabla: evidencias

**Propósito:** Archivos subidos a Storage asociados a expedientes como pruebas.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| expediente_id | uuid | NO | - | FK al expediente |
| url_storage | text | NO | - | URL del archivo en Supabase Storage |
| tipo_archivo | text | NO | - | Tipo MIME del archivo |
| tipo | evidencia_tipo | SI | NULL | Tipo de evidencia (IMG, VIDEO, etc.) |
| hash_integridad | text | SI | NULL | Hash SHA-256 para verificación |
| nombre | text | SI | NULL | Nombre original del archivo |
| fecha | date | SI | NULL | Fecha de la evidencia |
| hora | time | SI | NULL | Hora de la evidencia |
| autor | text | SI | NULL | Autor de la evidencia |
| descripcion | text | SI | NULL | Descripción del contenido |
| fuente | evidencia_fuente | SI | NULL | Origen de la evidencia |
| seleccionado | boolean | NO | false | Marcado para inclusión en resolución |
| subido_por | uuid | NO | - | FK al perfil que subió el archivo |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `expediente_id` → `expedientes(id)` ON DELETE CASCADE
- `subido_por` → `perfiles(id)`

**Relaciones:**
- Relacionada con `expedientes`

**Índices:**
- Primary key sobre `id`
- Índice en `expediente_id`
- Índice en `establecimiento_id`

---

#### 3.1.6 Tabla: hitos_expediente

**Propósito:** Hitos/tareas obligatorios dentro de un expediente, especialmente para procesos de expulsión.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| expediente_id | uuid | NO | - | FK al expediente |
| titulo | text | NO | - | Título del hito |
| descripcion | text | NO | - | Descripción detallada |
| fecha_cumplimiento | date | SI | NULL | Fecha límite para completar |
| completado | boolean | NO | false | Estado de completitud |
| requiere_evidencia | boolean | NO | true | Requiere evidencia para completar |
| evidencia_url | text | SI | NULL | URL de evidencia de cumplimiento |
| es_obligatorio_expulsion | boolean | NO | false | Es obligatorio en proceso de expulsión |
| orden | integer | NO | 0 | Orden de visualización |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Clave Foránea:**
- `expediente_id` → `expedientes(id)` ON DELETE CASCADE

**Relaciones:**
- Relacionada con `expedientes`

**Índices:**
- Primary key sobre `id`
- Índice en `expediente_id`

---

#### 3.1.7 Tabla: bitacora_psicosocial

**Propósito:** Notas confidenciales de la dupla psicosocial por estudiante.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| estudiante_id | uuid | NO | - | FK al estudiante |
| profesional_id | uuid | NO | - | FK al profesional que registra |
| notas_confidenciales | text | NO | - | Contenido de la nota |
| nivel_privacidad | nivel_privacidad | NO | 'alta' | Nivel de privacidad |
| es_vulneracion | boolean | NO | false | Indica posible situación de vulneración |
| tipo | intervencion_tipo | SI | NULL | Tipo de intervención |
| participantes | text | SI | NULL | Participantes en la intervención |
| resumen | text | SI | NULL | Resumen de la intervención |
| privado | boolean | NO | true | Visibilidad privada |
| autor | text | SI | NULL | Autor del registro |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `estudiante_id` → `estudiantes(id)` ON DELETE CASCADE
- `profesional_id` → `perfiles(id)`

**Relaciones:**
- Relacionada con `estudiantes`

**Índices:**
- Primary key sobre `id`
- Índice en `estudiante_id`
- Índice en `establecimiento_id`

---

#### 3.1.8 Tabla: medidas_apoyo

**Propósito:** Acciones de apoyo pedagógico o psicosocial hacia estudiantes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| estudiante_id | uuid | NO | - | FK al estudiante |
| tipo_accion | text | NO | - | Descripción de la acción |
| tipo | apoyo_tipo | SI | NULL | Tipo de apoyo (pedagógico/psicosocial) |
| objetivo | text | NO | - | Objetivo de la medida |
| fecha_ejecucion | date | NO | - | Fecha de ejecución |
| responsable | text | SI | NULL | Responsable de la medida |
| resultados | text | SI | NULL | Resultados obtenidos |
| estado | apoyo_estado | NO | 'PENDIENTE' | Estado de la medida |
| evidencia_url | text | SI | NULL | URL de evidencia |
| accion | text | SI | NULL | Acción específica a realizar |
| acta_url | text | SI | NULL | URL del acta de la medida |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `estudiante_id` → `estudiantes(id)` ON DELETE CASCADE

**Relaciones:**
- Relacionada con `estudiantes`

**Índices:**
- Primary key sobre `id`
- Índice en `estudiante_id`
- Índice en `establecimiento_id`

---

#### 3.1.9 Tabla: incidentes

**Propósito:** Registros de incidentes reportados (por inspectores u otros).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| estudiante_id | uuid | SI | NULL | FK al estudiante involucrado |
| expediente_id | uuid | SI | NULL | FK al expediente asociado |
| descripcion | text | NO | - | Descripción del incidente |
| fecha_incidente | timestamptz | NO | now() | Fecha y hora del incidente |
| creado_por | uuid | NO | - | FK al perfil que reporta |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `estudiante_id` → `estudiantes(id)` ON DELETE SET NULL
- `expediente_id` → `expedientes(id)` ON DELETE SET NULL
- `creado_por` → `perfiles(id)`

**Relaciones:**
- Puede relacionarse con `expedientes`

**Índices:**
- Primary key sobre `id`
- Índice en `expediente_id`
- Índice en `estudiante_id`
- Índice en `establecimiento_id`

---

#### 3.1.10 Tabla: logs_auditoria

**Propósito:** Registro de todas las acciones realizadas en el sistema para auditoría.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| usuario_id | uuid | NO | - | FK al usuario que realiza la acción |
| accion | text | NO | - | Tipo de acción (INSERT, UPDATE, etc.) |
| tabla_afectada | text | NO | - | Nombre de la tabla afectada |
| registro_id | uuid | SI | NULL | ID del registro afectado |
| detalle | jsonb | SI | NULL | Detalles adicionales de la acción |
| created_at | timestamptz | NO | now() | Fecha de la acción |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `usuario_id` → `perfiles(id)`

**Relaciones:**
- Registra acciones de todas las tablas

**Índices:**
- Primary key sobre `id`
- Índice en `registro_id, created_at DESC` (recomendado)
- Índice en `establecimiento_id`
- Índice en `usuario_id`

---

### 3.2 Tablas de Procesos Específicos

#### 3.2.1 Tabla: derivaciones_externas

**Propósito:** Derivaciones a instituciones externas (OPD, COSAM, Tribunal, Salud).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| estudiante_id | uuid | SI | NULL | FK al estudiante |
| nna_nombre | text | SI | NULL | Nombre del niño/ña si no está registrado |
| institucion | derivacion_institucion | NO | - | Institución receptora |
| fecha_envio | date | NO | - | Fecha de envío de la derivación |
| estado | derivacion_estado | NO | 'PENDIENTE' | Estado de la derivación |
| numero_oficio | text | SI | NULL | Número de oficio de derivación |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `estudiante_id` → `estudiantes(id)` ON DELETE SET NULL

**Relaciones:**
- Relacionada con `estudiantes`

**Índices:**
- Primary key sobre `id`
- Índice en `estudiante_id`
- Índice en `establecimiento_id`
- Índice en `estado`

---

#### 3.2.2 Tabla: bitacora_salida

**Propósito:** Registro de salidas de estudiantes durante la jornada escolar.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| estudiante_id | uuid | SI | NULL | FK al estudiante |
| nna_nombre | text | NO | - | Nombre del estudiante |
| fecha | date | NO | current_date | Fecha de la salida |
| hora | time | NO | - | Hora de la salida |
| motivo | text | NO | - | Motivo de la salida |
| retirado_por | text | NO | - | Nombre de quien retira |
| rut | text | SI | NULL | RUT de quien retira |
| firma | boolean | NO | false | Indica si hay firma de recibido |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `estudiante_id` → `estudiantes(id)` ON DELETE SET NULL

**Relaciones:**
- Relacionada con `estudiantes`

**Índices:**
- Primary key sobre `id`
- Índice en `estudiante_id`
- Índice en `establecimiento_id`
- Índice en `fecha`

---

#### 3.2.3 Tabla: reportes_patio

**Propósito:** Reportes de incidentes en patio/recreo.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| informante | text | NO | - | Nombre de quien reporta |
| estudiante | text | SI | NULL | Nombre del estudiante involucrado |
| estudiante_id | uuid | SI | NULL | FK al estudiante |
| lugar | text | SI | NULL | Lugar específico del incidente |
| descripcion | text | NO | - | Descripción del incidente |
| gravedad_percibida | patio_gravedad | NO | 'LEVE' | Gravedad percibida |
| curso | text | SI | NULL | Curso del estudiante |
| estado | text | SI | NULL | Estado del reporte |
| expediente_id | uuid | SI | NULL | FK al expediente creado |
| fecha_incidente | timestamptz | NO | now() | Fecha del incidente |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `estudiante_id` → `estudiantes(id)` ON DELETE SET NULL
- `expediente_id` → `expedientes(id)` ON DELETE SET NULL

**Relaciones:**
- Puede crear un `expediente`

**Índices:**
- Primary key sobre `id`
- Índice en `establecimiento_id`
- Índice en `estudiante_id`
- Índice en `expediente_id`
- Índice en `estado`
- Índice compuesto en `(estado, fecha_incidente DESC)`

---

### 3.3 Tablas de Gestión de Convivencia (GCC)

#### 3.3.1 Tabla: mediaciones_gcc_v2

**Propósito:** Procesos de mediación del Programa de Gestión de Convivencia (GCC).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| expediente_id | uuid | NO | - | FK al expediente asociado |
| tipo_mecanismo | text | NO | - | MEDIACION, CONCILIACION, ARBITRAJE_PEDAGOGICO |
| estado_proceso | text | NO | - | Estado del proceso |
| efecto_suspensivo_activo | boolean | NO | true | Suspensión de plazos activa |
| fecha_inicio | timestamptz | NO | now() | Fecha de inicio |
| fecha_limite_habil | date | NO | - | Fecha límite en días hábiles |
| fecha_cierre | timestamptz | SI | NULL | Fecha de cierre |
| resultado_final | text | SI | NULL | Resultado final |
| motivo_derivacion | text | SI | NULL | Motivo de derivación a GCC |
| facilitador_id | uuid | SI | NULL | FK al facilitador |
| created_by | uuid | NO | - | FK al creador |
| created_at | timestamptz | NO | now() | Fecha de creación |
| updated_at | timestamptz | NO | now() | Fecha de última actualización |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `expediente_id` → `expedientes(id)` ON DELETE CASCADE
- `facilitador_id` → `perfiles(id)` ON DELETE SET NULL
- `created_by` → `perfiles(id)` ON DELETE RESTRICT

**Restricciones:**
- CHECK: fecha_cierre IS NULL OR fecha_cierre >= fecha_inicio

**Relaciones:**
- Relacionada con `expedientes`
- FK con `participantes_gcc_v2`, `hitos_gcc_v2`, `actas_gcc_v2`, `compromisos_gcc_v2`

**Índices:**
- Primary key sobre `id`
- Índice compuesto en `(establecimiento_id, expediente_id, created_at DESC)`
- Índice compuesto en `(establecimiento_id, estado_proceso, fecha_limite_habil)`

---

#### 3.3.2 Tabla: participantes_gcc_v2

**Propósito:** Participantes en los procesos de mediación GCC.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| mediacion_id | uuid | NO | - | FK a la mediación |
| tipo_participante | text | NO | - | ESTUDIANTE, APODERADO, DOCENTE, etc. |
| sujeto_id | uuid | SI | NULL | ID del sujeto (estudiante, perfil, etc.) |
| nombre_completo | text | NO | - | Nombre del participante |
| rol_en_conflicto | text | NO | - | PARTE_A, PARTE_B, VICTIMA, TESTIGO, etc. |
| consentimiento_registrado | boolean | NO | false | Consentimiento informado registrado |
| observaciones | text | SI | NULL | Observaciones adicionales |
| created_at | timestamptz | NO | now() | Fecha de creación |
| updated_at | timestamptz | NO | now() | Fecha de última actualización |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `mediacion_id` → `mediaciones_gcc_v2(id)` ON DELETE CASCADE

**Restricciones:**
- CHECK en `tipo_participante`
- CHECK en `rol_en_conflicto`

**Relaciones:**
- Relacionada con `mediaciones_gcc_v2`

**Índices:**
- Primary key sobre `id`
- Índice compuesto en `(establecimiento_id, mediacion_id)`

---

#### 3.3.3 Tabla: hitos_gcc_v2

**Propósito:** Hitos/momentos clave en el proceso de mediación GCC.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| mediacion_id | uuid | NO | - | FK a la mediación |
| tipo_hito | text | NO | - | INICIO, REUNION, ACERCAMIENTO, etc. |
| descripcion | text | SI | NULL | Descripción del hito |
| fecha_hito | timestamptz | NO | now() | Fecha del hito |
| registrado_por | uuid | NO | - | FK al perfil que registra |
| datos_adicionales | jsonb | NO | '{}'::jsonb | Datos adicionales en formato JSON |
| created_at | timestamptz | NO | now() | Fecha de creación |
| updated_at | timestamptz | NO | now() | Fecha de última actualización |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `mediacion_id` → `mediaciones_gcc_v2(id)` ON DELETE CASCADE
- `registrado_por` → `perfiles(id)` ON DELETE RESTRICT

**Restricciones:**
- CHECK en `tipo_hito`

**Relaciones:**
- Relacionada con `mediaciones_gcc_v2`

**Índices:**
- Primary key sobre `id`
- Índice compuesto en `(establecimiento_id, mediacion_id, fecha_hito DESC)`

---

#### 3.3.4 Tabla: actas_gcc_v2

**Propósito:** Actas y documentos generados en el proceso de mediación GCC.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| mediacion_id | uuid | NO | - | FK a la mediación |
| tipo_acta | text | NO | - | ACUERDO, CONSTANCIA, ACTA_MEDIACION, etc. |
| contenido_json | jsonb | NO | '{}'::jsonb | Contenido del acta en JSON |
| url_documento | text | SI | NULL | URL del documento escaneado/firmado |
| firmado_por_partes | boolean | NO | false | Firmado por las partes |
| fecha_emision | date | NO | current_date | Fecha de emisión |
| observaciones | text | SI | NULL | Observaciones adicionales |
| created_at | timestamptz | NO | now() | Fecha de creación |
| updated_at | timestamptz | NO | now() | Fecha de última actualización |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `mediacion_id` → `mediaciones_gcc_v2(id)` ON DELETE CASCADE

**Restricciones:**
- CHECK en `tipo_acta`

**Relaciones:**
- Relacionada con `mediaciones_gcc_v2`

**Índices:**
- Primary key sobre `id`
- Índice en `mediacion_id`

---

#### 3.3.5 Tabla: compromisos_gcc_v2

**Propósito:** Acuerdos/compromisos generados en las mediaciones GCC.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| mediacion_id | uuid | NO | - | FK a la mediación |
| descripcion | text | NO | - | Descripción del compromiso |
| responsable_id | uuid | SI | NULL | FK al responsable |
| tipo_responsable | text | SI | NULL | Tipo de responsable |
| fecha_compromiso | date | NO | current_date | Fecha compromiso |
| cumplimiento_verificado | boolean | NO | false | Verificación de cumplimiento |
| evidencia_cumplimiento_url | text | SI | NULL | URL de evidencia |
| fecha_verificacion | date | SI | NULL | Fecha de verificación |
| resultado_evaluacion | text | SI | NULL | Resultado de la evaluación |
| created_at | timestamptz | NO | now() | Fecha de creación |
| updated_at | timestamptz | NO | now() | Fecha de última actualización |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `mediacion_id` → `mediaciones_gcc_v2(id)` ON DELETE CASCADE
- `responsable_id` → `perfiles(id)` ON DELETE SET NULL

**Relaciones:**
- Relacionada con `mediaciones_gcc_v2`

**Índices:**
- Primary key sobre `id`
- Índice en `mediacion_id`

---

### 3.4 Tablas de Gestión Documental

#### 3.4.1 Tabla: carpetas_documentales

**Propósito:** Estructura de carpetas para el archivo documental.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| nombre | text | NO | - | Nombre de la carpeta |
| parent_id | uuid | SI | NULL | FK a carpeta padre |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Clave Foránea:**
- `establecimiento_id` → `establecimientos(id)`
- `parent_id` → `carpetas_documentales(id)` ON DELETE SET NULL

**Relaciones:**
- Estructura jerárquica (autorreferenciada)

**Índices:**
- Primary key sobre `id`
- Índice en `establecimiento_id`

---

#### 3.4.2 Tabla: documentos_institucionales

**Propósito:** Metadatos de documentos institucionales.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| carpeta_id | uuid | SI | NULL | FK a la carpeta |
| nombre | text | NO | - | Nombre del documento |
| tipo | text | SI | NULL | Tipo de documento |
| url_storage | text | SI | NULL | URL en Storage |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `carpeta_id` → `carpetas_documentales(id)` ON DELETE SET NULL

**Relaciones:**
- Relacionada con `carpetas_documentales`

**Índices:**
- Primary key sobre `id`
- Índice en `establecimiento_id`

---

### 3.5 Tablas de Configuración y Administración

#### 3.5.1 Tabla: cursos_inspector

**Propósito:** Relación inspector-curso para permisos de visualización.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| establecimiento_id | uuid | NO | - | FK al establecimiento |
| inspector_id | uuid | NO | - | FK al perfil del inspector |
| curso | text | NO | - | Curso asignado |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `establecimiento_id` → `establecimientos(id)`
- `inspector_id` → `perfiles(id)`

**Restricciones:**
- UNIQUE en `(inspector_id, curso)`

**Relaciones:**
- Relacionada con `perfiles`

**Índices:**
- Primary key sobre `id`
- Índice unique en `(inspector_id, curso)`

---

#### 3.5.2 Tabla: feriados_chile

**Propósito:** Feriados legales de Chile para cálculo de plazos hábiles.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| fecha | date | NO | - | Fecha del feriado |
| descripcion | text | NO | - | Descripción del feriado |
| es_irrenunciable | boolean | NO | false | Es feriado irrenunciable |

**Clave Primaria:** `fecha`

**Relaciones:**
- Tabla de referencia (sin FK)

**Índices:**
- Primary key sobre `fecha`

---

### 3.6 Tablas de Superadmin (Multi-Tenant)

#### 3.6.1 Tabla: admin_changesets

**Propósito:** Cambios de configuración por tenant.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| scope | admin_scope | NO | 'global' | Alcance (global/tenant) |
| tenant_id | uuid | SI | NULL | FK al establecimiento |
| module | text | NO | - | Módulo afectado |
| title | text | NO | - | Título del cambio |
| summary | text | SI | NULL | Resumen del cambio |
| desired_state | jsonb | NO | '{}'::jsonb | Estado deseado |
| generated_sql | text[] | NO | '{}'::text[] | SQL generado |
| rollback_sql | text[] | NO | '{}'::text[] | SQL de rollback |
| validation_report | jsonb | NO | '{}'::jsonb | Reporte de validación |
| status | admin_changeset_status | NO | 'draft' | Estado del changeset |
| created_by | uuid | NO | - | FK al creador |
| applied_by | uuid | SI | NULL | FK quien aplicó |
| reverted_by | uuid | SI | NULL | FK quien revertió |
| error_text | text | SI | NULL | Mensaje de error |
| created_at | timestamptz | NO | now() | Fecha de creación |
| applied_at | timestamptz | SI | NULL | Fecha de aplicación |
| reverted_at | timestamptz | SI | NULL | Fecha de reversión |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `tenant_id` → `establecimientos(id)` ON DELETE SET NULL
- `created_by` → `perfiles(id)` ON DELETE RESTRICT
- `applied_by` → `perfiles(id)` ON DELETE SET NULL
- `reverted_by` → `perfiles(id)` ON DELETE SET NULL

**Relaciones:**
- Relacionada con `admin_change_events`

**Índices:**
- Primary key sobre `id`
- Índice en `created_at DESC`
- Índice en `status`
- Índice compuesto en `(scope, tenant_id)`

---

#### 3.6.2 Tabla: admin_change_events

**Propósito:** Historial de eventos de cambios.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| changeset_id | uuid | NO | - | FK al changeset |
| event_type | text | NO | - | Tipo de evento |
| payload | jsonb | NO | '{}'::jsonb | Datos del evento |
| created_by | uuid | SI | NULL | FK al creador |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `changeset_id` → `admin_changesets(id)` ON DELETE CASCADE
- `created_by` → `perfiles(id)` ON DELETE SET NULL

**Relaciones:**
- Relacionada con `admin_changesets`

**Índices:**
- Primary key sobre `id`
- Índice en `changeset_id, created_at DESC`

---

#### 3.6.3 Tabla: storage_bucket_registry

**Propósito:** Registro de buckets de Storage.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| scope | admin_scope | NO | 'global' | Alcance (global/tenant) |
| tenant_id | uuid | SI | NULL | FK al establecimiento |
| bucket_name | text | NO | - | Nombre del bucket |
| is_public | boolean | NO | false | Es bucket público |
| file_size_limit_mb | integer | NO | 20 | Límite de tamaño |
| allowed_mime_types | text[] | NO | '{}'::text[] | Tipos MIME permitidos |
| policy_json | jsonb | NO | '{}'::jsonb | Configuración de políticas |
| updated_by | uuid | SI | NULL | FK al actualizador |
| created_at | timestamptz | NO | now() | Fecha de creación |
| updated_at | timestamptz | NO | now() | Fecha de actualización |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `tenant_id` → `establecimientos(id)` ON DELETE CASCADE
- `updated_by` → `perfiles(id)` ON DELETE SET NULL

**Restricciones:**
- UNIQUE en `(scope, tenant_id, bucket_name)`

**Relaciones:**
- Relacionada con `establecimientos`

**Índices:**
- Primary key sobre `id`
- Índice unique en `(scope, tenant_id, bucket_name)`

---

#### 3.6.4 Tabla: edge_function_registry

**Propósito:** Registro de Edge Functions.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| scope | admin_scope | NO | 'global' | Alcance (global/tenant) |
| tenant_id | uuid | SI | NULL | FK al establecimiento |
| function_name | text | NO | - | Nombre de la función |
| env_json | jsonb | NO | '{}'::jsonb | Variables de entorno |
| enabled | boolean | NO | true | Función habilitada |
| updated_by | uuid | SI | NULL | FK al actualizador |
| created_at | timestamptz | NO | now() | Fecha de creación |
| updated_at | timestamptz | NO | now() | Fecha de actualización |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `tenant_id` → `establecimientos(id)` ON DELETE CASCADE
- `updated_by` → `perfiles(id)` ON DELETE SET NULL

**Restricciones:**
- UNIQUE en `(scope, tenant_id, function_name)`

**Relaciones:**
- Relacionada con `establecimientos`

**Índices:**
- Primary key sobre `id`

---

#### 3.6.5 Tabla: tenant_feature_flags

**Propósito:** Feature flags por establecimiento.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| tenant_id | uuid | NO | - | FK al establecimiento |
| feature_key | text | NO | - | Clave del feature |
| enabled | boolean | NO | false | Feature habilitado |
| created_at | timestamptz | NO | now() | Fecha de creación |

**Clave Primaria:** `id`

**Clave Foránea:**
- `tenant_id` → `establecimientos(id)` ON DELETE CASCADE

**Restricciones:**
- UNIQUE en `(tenant_id, feature_key)`

**Relaciones:**
- Relacionada con `establecimientos`

**Índices:**
- Primary key sobre `id`
- Índice unique en `(tenant_id, feature_key)`

---

#### 3.6.6 Tabla: platform_settings

**Propósito:** Configuración global de la plataforma.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| setting_key | text | NO | - | Clave de configuración |
| setting_value | jsonb | SI | NULL | Valor de configuración |
| description | text | SI | NULL | Descripción |
| created_at | timestamptz | NO | now() | Fecha de creación |
| updated_at | timestamptz | NO | now() | Fecha de actualización |

**Clave Primaria:** `id`

**Restricciones:**
- UNIQUE en `setting_key`

**Relaciones:**
- Tabla de configuración global

**Índices:**
- Primary key sobre `id`
- Índice unique en `setting_key`

---

#### 3.6.7 Tabla: superadmin_audit_logs

**Propósito:** Auditoría de acciones del superadmin.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Identificador único |
| actor_user_id | uuid | SI | NULL | FK al usuario que realiza la acción |
| tenant_id | uuid | SI | NULL | FK al establecimiento |
| action | text | NO | - | Acción realizada |
| payload | jsonb | SI | NULL | Datos de la acción |
| created_at | timestamptz | NO | now() | Fecha de la acción |

**Clave Primaria:** `id`

**Claves Foráneas:**
- `actor_user_id` → `perfiles(id)` ON DELETE SET NULL
- `tenant_id` → `establecimientos(id)` ON DELETE SET NULL

**Relaciones:**
- Relacionada con `perfiles` y `establecimientos`

**Índices:**
- Primary key sobre `id`
- Índice en `actor_user_id`
- Índice en `tenant_id`

---

## 4. Vistas Definidas

### 4.1 Vista: expedientes_auditoria

**Propósito:** Vista que registra cuando un usuario visualiza un expediente para auditoría.

**Definición:** Esta vista está diseñada para registrar eventos de lectura de expedientes en el log de auditoría. Se implementa mediante una función que registra automáticamente la visualización en `logs_auditoria`.

**Uso:** Utilizada para cumplir con requisitos de auditoría y trazabilidad de acceso a información sensible de expedientes disciplinarios.

---

## 5. Funciones Almacenadas

### 5.1 Funciones de Seguridad y RLS

#### 5.1.1 get_current_establecimiento_id()

```sql
CREATE OR REPLACE FUNCTION public.get_current_establecimiento_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.establecimiento_id
  FROM public.perfiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;
```

**Propósito:** Obtiene el establecimiento_id del usuario actual desde su perfil.

**Características:**
- Tipo: `STABLE`
- Seguridad: `SECURITY DEFINER` (evita recursión infinita en RLS)
- Search path: `public`

---

#### 5.1.2 get_current_user_rol_text()

```sql
CREATE OR REPLACE FUNCTION public.get_current_user_rol_text()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(p.rol::text)
  FROM public.perfiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;
```

**Propósito:** Obtiene el rol del usuario actual como texto en minúsculas.

**Características:**
- Tipo: `STABLE`
- Seguridad: `SECURITY DEFINER`

---

#### 5.1.3 is_platform_superadmin()

```sql
CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfiles p
    WHERE p.id = auth.uid()
      AND lower(p.rol::text) IN ('superadmin', 'sostenedor', 'admin')
      AND coalesce(p.activo, true) = true
  );
$$;
```

**Propósito:** Verifica si el usuario actual es superadmin, sostenedor o admin.

**Retorna:** `true` si el usuario tiene acceso de superadmin.

**Características:**
- Tipo: `STABLE`
- Seguridad: `SECURITY DEFINER`

---

#### 5.1.4 can_access_tenant()

```sql
CREATE OR REPLACE FUNCTION public.can_access_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_platform_superadmin()
    OR EXISTS (
      SELECT 1
      FROM public.perfiles p
      WHERE p.id = auth.uid()
        AND coalesce(p.activo, true) = true
        AND (
          p.establecimiento_id = p_tenant_id
          OR p_tenant_id = ANY(coalesce(p.tenant_ids, '{}'::uuid[]))
        )
    );
$$;
```

**Propósito:** Verifica si el usuario tiene acceso a un tenant específico.

**Parámetros:**
- `p_tenant_id`: UUID del establecimiento a verificar

**Retorna:** `true` si el usuario tiene acceso.

**Características:**
- Tipo: `STABLE`
- Seguridad: `SECURITY DEFINER`
- Considera `tenant_ids` para usuarios con acceso a múltiples establecimientos

---

#### 5.1.5 user_has_access_to_establecimiento()

```sql
CREATE OR REPLACE FUNCTION public.user_has_access_to_establecimiento(p_establecimiento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_access_tenant(p_establecimiento_id);
$$;
```

**Propósito:** Wrapper para verificar acceso a un establecimiento.

---

#### 5.1.6 can_user_access_row()

```sql
CREATE OR REPLACE FUNCTION public.can_user_access_row(p_establecimiento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_access_tenant(p_establecimiento_id);
$$;
```

**Propósito:** Función auxiliar para usar en políticas RLS.

---

### 5.2 Funciones de Helper

#### 5.2.1 set_updated_at_timestamp()

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
```

**Propósito:** Trigger automático para actualizar `updated_at` en tablas.

**Uso:** Asociado a tablas GCC (mediaciones, participantes, hitos, actas, compromisos).

---

#### 5.2.2 set_establecimiento_from_estudiante()

```sql
CREATE OR REPLACE FUNCTION public.set_establecimiento_from_estudiante()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.estudiante_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT e.establecimiento_id INTO NEW.establecimiento_id
  FROM estudiantes e
  WHERE e.id = NEW.estudiante_id;
  RETURN NEW;
END;
$$;
```

**Propósito:** Establece automáticamente el establecimiento_id basándose en el estudiante asociado.

---

#### 5.2.3 set_establecimiento_from_expediente()

```sql
CREATE OR REPLACE FUNCTION public.set_establecimiento_from_expediente()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expediente_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT e.establecimiento_id INTO NEW.establecimiento_id
  FROM expedientes e
  WHERE e.id = NEW.expediente_id;
  RETURN NEW;
END;
$$;
```

**Propósito:** Establece automáticamente el establecimiento_id basándose en el expediente asociado.

---

## 6. Triggers Definidos

### 6.1 Triggers de Actualización Automática

| Trigger | Tabla | Evento | Función | Propósito |
|---------|-------|--------|---------|-----------|
| trg_mediaciones_gcc_v2_updated_at | mediaciones_gcc_v2 | UPDATE | set_updated_at_timestamp() | Actualiza updated_at |
| trg_participantes_gcc_v2_updated_at | participantes_gcc_v2 | UPDATE | set_updated_at_timestamp() | Actualiza updated_at |
| trg_hitos_gcc_v2_updated_at | hitos_gcc_v2 | UPDATE | set_updated_at_timestamp() | Actualiza updated_at |
| trg_actas_gcc_v2_updated_at | actas_gcc_v2 | UPDATE | set_updated_at_timestamp() | Actualiza updated_at |
| trg_compromisos_gcc_v2_updated_at | compromisos_gcc_v2 | UPDATE | set_updated_at_timestamp() | Actualiza updated_at |

### 6.2 Triggers de Aislamiento de Tenant

Los triggers de establecimiento_id automáticamente propagan el establecimiento desde entidades relacionadas (estudiante, expediente) a tablas dependientes.

---

## 7. Políticas de Row Level Security (RLS)

### 7.1 Resumen de Políticas Activas

Las políticas RLS implementan el sistema de aislamiento multi-tenant donde cada usuario solo puede acceder a datos de su establecimiento, excepto usuarios con rol superadmin que pueden acceder a todos los establecimientos.

#### 7.1.1 Esquema General de Políticas

**Patrón común:**
```sql
CREATE POLICY nombre_policy ON tabla
FOR operation
USING (is_platform_superadmin() OR condición_tenant)
WITH CHECK (is_platform_superadmin() OR condición_tenant);
```

### 7.2 Políticas por Tabla

#### Tabla: establecimientos

| Política | Operación | Condición |
|----------|-----------|-----------|
| public_read_establecimientos | SELECT | true (todos pueden leer) |
| admin_write_establecimientos | ALL | rol IN ('admin', 'sostenedor') |

#### Tabla: perfiles

| Política | Operación | Condición |
|----------|-----------|-----------|
| perfiles_self_read | SELECT | is_platform_superadmin() OR id = auth.uid() |
| perfiles_read_directivos | SELECT | is_platform_superadmin() OR (establecimiento_id = current AND rol IN admin/director/convivencia) |
| perfiles_insert_admin | INSERT | is_platform_superadmin() OR (establecimiento_id = current AND rol = admin) |
| perfiles_update_admin | UPDATE | is_platform_superadmin() OR (establecimiento_id = current AND rol = admin) |
| perfiles_delete_admin | DELETE | is_platform_superadmin() OR (establecimiento_id = current AND rol = admin) |

#### Tabla: estudiantes

| Política | Operación | Condición |
|----------|-----------|-----------|
| estudiantes_read | SELECT | is_platform_superadmin() OR establecimiento_id = current |
| estudiantes_write_equipo | INSERT | is_platform_superadmin() OR (establecimiento_id = current AND rol IN admin/director/convivencia/dupla) |
| estudiantes_update_equipo | UPDATE | is_platform_superadmin() OR (establecimiento_id = current AND rol IN admin/director/convivencia/dupla) |

#### Tabla: expedientes

| Política | Operación | Condición |
|----------|-----------|-----------|
| expedientes_read | SELECT | is_platform_superadmin() OR (establecimiento_id = current AND ...) |
| expedientes_insert_equipo | INSERT | is_platform_superadmin() OR (establecimiento_id = current AND rol IN admin/director/convivencia) |
| expedientes_update_directivos | UPDATE | is_platform_superadmin() OR (establecimiento_id = current AND rol IN admin/director/convivencia) |
| expedientes_update_inspector | UPDATE | is_platform_superadmin() OR (establecimiento_id = current AND rol = inspector AND ...) |

#### Tabla: evidencias

| Política | Operación | Condición |
|----------|-----------|-----------|
| evidencias_isolation | ALL | is_platform_superadmin() OR can_user_access_row(establecimiento_id) |

#### Tabla: hitos_expediente

| Política | Operación | Condición |
|----------|-----------|-----------|
| hitos_expediente_isolation | ALL | is_platform_superadmin() OR can_user_access_row(establecimiento_id) |

#### Tablas Operativas (reportes_patio, derivaciones_externas, etc.)

Las tablas operativas siguen el patrón:
```sql
CREATE POLICY nombre ON tabla
FOR ALL
USING (is_platform_superadmin() OR can_access_tenant(establecimiento_id));
```

---

## 8. Relaciones entre Tablas

### 8.1 Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ESQUEMA DE RELACIONES                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │ establecimientos │ (TENANT)
                              │ (establecimientos)│
                              └────────┬─────────┘
                                       │
           ┌───────────────┬───────────┼───────────┬───────────────┐
           │               │           │           │               │
           ▼               ▼           ▼           ▼               ▼
    ┌────────────┐  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐
    │  perfiles  │  │estudiantes│ │  medios  │ │  admin_   │ │  otros   │
    └─────┬──────┘  └─────┬─────┘ └──────────┘ │  tables   │ └──────────┘
          │               │                     └───────────┘
          │               │
    ┌─────┴──────┐  ┌─────┴─────┐
    │ Expedientes│  │ Expediente│
    │            │  │   B       │
    └─────┬──────┘  └──────────┘
          │
    ┌─────┴──────┬───────────────┬───────────────┐
    │            │               │               │
    ▼            ▼               ▼               ▼
┌────────┐  ┌────────┐  ┌───────────┐  ┌──────────┐
│evidenc.│  │  hitos │  │incidentes │  │mediaciones│
└────────┘  └────────┘  └───────────┘  │  _gcc_v2  │
                                        └─────┬──────┘
                                              │
        ┌──────────────────┬──────────────────┼──────────────────┐
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
┌───────────────┐  ┌────────────┐  ┌─────────────┐  ┌─────────────┐
│participantes_ │  │  hitos_    │  │  actas_     │  │compromisos_ │
│   gcc_v2      │  │  gcc_v2    │  │  gcc_v2     │  │  gcc_v2     │
└───────────────┘  └────────────┘  └─────────────┘  └─────────────┘

LEYENDA:
- Las flechas indican relaciones FK
- tablas_hijas son dependientes de tablas_padre
- Todas las tablas (excepto admin) tienen FK a establecimientos
```

### 8.2 Resumen de Dependencias

#### Tablas Maestras (sin FK a otras tablas del sistema)
- `establecimientos` - Tabla maestra de tenants
- `feriados_chile` - Tabla de referencia

#### Tablas Dependientes de Establecimientos
- `perfiles`
- `estudiantes`
- `expedientes`
- `evidencias`
- `bitacora_psicosocial`
- `medidas_apoyo`
- `incidentes`
- `logs_auditoria`
- `derivaciones_externas`
- `bitacora_salida`
- `reportes_patio`
- `mediaciones_gcc_v2`
- `participantes_gcc_v2`
- `hitos_gcc_v2`
- `actas_gcc_v2`
- `compromisos_gcc_v2`
- `carpetas_documentales`
- `documentos_institucionales`
- `cursos_inspector`
- `superadmin_audit_logs`
- `admin_changesets` (FK a establecimientos opcional)
- `admin_change_events`
- `storage_bucket_registry`
- `edge_function_registry`
- `tenant_feature_flags`

#### Cadenas de Dependencia
1. **Establecimientos → Perfiles → Expedientes → Evidencias**
2. **Establecimientos → Estudiantes → Expedientes → Hitos_expediente**
3. **Establecimientos → Expedientes → Mediación GCC → Participantes/Hitos/Actas/Compromisos**
4. **Establecimientos → Estudiantes → Medidas_apoyo**
5. **Establecimientos → Estudiantes → Bitácora_psicosocial**

---

## 9. Índices Existentes

### 9.1 Índices por Tabla

#### Tabla: establecimientos
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |

#### Tabla: perfiles
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | establecimiento_id | Filtrado por tenant |
| Índice | rol | Filtrado por rol |

#### Tabla: estudiantes
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Unique | rut | RUN único por estudiante |
| Índice | establecimiento_id | Filtrado por tenant |

#### Tabla: expedientes
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Unique | folio | Folio único por expediente |
| Índice | establecimiento_id | Filtrado por tenant |
| Índice | estudiante_id | Búsqueda por estudiante |
| Índice | estado_legal | Filtrado por estado |
| Índice | etapa_proceso | Filtrado por etapa |

#### Tabla: evidencias
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | expediente_id | Evidencias por expediente |
| Índice | establecimiento_id | Filtrado por tenant |

#### Tabla: hitos_expediente
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | expediente_id | Hitos por expediente |

#### Tabla: bitacora_psicosocial
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | estudiante_id | Registros por estudiante |
| Índice | establecimiento_id | Filtrado por tenant |

#### Tabla: medidas_apoyo
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | estudiante_id | Medidas por estudiante |
| Índice | establecimiento_id | Filtrado por tenant |

#### Tabla: incidentes
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | expediente_id | Incidentes por expediente |
| Índice | estudiante_id | Incidentes por estudiante |
| Índice | establecimiento_id | Filtrado por tenant |

#### Tabla: logs_auditoria
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | registro_id, created_at DESC | Auditoría por registro (recomendado) |
| Índice | establecimiento_id | Filtrado por tenant |
| Índice | usuario_id | Auditoría por usuario |

#### Tabla: derivaciones_externas
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | estudiante_id | Derivaciones por estudiante |
| Índice | establecimiento_id | Filtrado por tenant |
| Índice | estado | Filtrado por estado |

#### Tabla: reportes_patio
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | establecimiento_id | Filtrado por tenant |
| Índice | estudiante_id | Reportes por estudiante |
| Índice | expediente_id | Reportes vinculados a expediente |
| Índice | estado | Filtrado por estado |
| Índice compuesto | (estado, fecha_incidente DESC) | Reportes por estado y fecha |

#### Tabla: mediaciones_gcc_v2
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice compuesto | (establecimiento_id, expediente_id, created_at DESC) | Búsqueda por tenant y expediente |
| Índice compuesto | (establecimiento_id, estado_proceso, fecha_limite_habil) | Seguimiento de plazos |

#### Tabla: participantes_gcc_v2
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice compuesto | (establecimiento_id, mediacion_id) | Participantes por mediación |

#### Tabla: hitos_gcc_v2
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice compuesto | (establecimiento_id, mediacion_id, fecha_hito DESC) | Hitos por mediación ordenados |

#### Tabla: actas_gcc_v2
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | mediacion_id | Actas por mediación |

#### Tabla: compromisos_gcc_v2
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | mediacion_id | Compromisos por mediación |

#### Tabla: cursos_inspector
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Unique | (inspector_id, curso) | Relación única inspector-curso |

#### Tabla: admin_changesets
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice | created_at DESC | Ordenar por fecha |
| Índice | status | Filtrar por estado |
| Índice compuesto | (scope, tenant_id) | Cambios por alcance |

#### Tabla: admin_change_events
| Índice | Columnas | Propósito |
|--------|----------|-----------|
| Primary key | id | Identificador único |
| Índice compuesto | (changeset_id, created_at DESC) | Eventos por changeset |

### 9.2 Índices Recomendados (Faltantes)

Basado en el análisis de auditoría, se recomiendan los siguientes índices adicionales:

```sql
-- Índices de auditoría
CREATE INDEX idx_logs_auditoria_registro_id ON logs_auditoria(registro_id, created_at DESC);

-- Índices de rendimiento para entidades relacionadas
CREATE INDEX idx_hitos_expediente_fecha ON hitos_expediente(expediente_id, created_at DESC);
CREATE INDEX idx_evidencias_fecha ON evidencias(expediente_id, created_at DESC);
CREATE INDEX idx_medidas_apoyo_fecha ON medidas_apoyo(estudiante_id, created_at DESC);

-- Índices únicos por tabla para tenant_id (evitar bug de índice duplicado)
CREATE INDEX idx_estudiantes_establecimiento_id ON estudiantes(establecimiento_id);
CREATE INDEX idx_expedientes_establecimiento_id ON expedientes(establecimiento_id);
CREATE INDEX idx_evidencias_establecimiento_id ON evidencias(establecimiento_id);
CREATE INDEX idx_incidentes_establecimiento_id ON incidentes(establecimiento_id);
CREATE INDEX idx_bitacora_psicosocial_establecimiento_id ON bitacora_psicosocial(establecimiento_id);
CREATE INDEX idx_medidas_apoyo_establecimiento_id ON medidas_apoyo(establecimiento_id);
CREATE INDEX idx_derivaciones_externas_establecimiento_id ON derivaciones_externas(establecimiento_id);
CREATE INDEX idx_bitacora_salida_establecimiento_id ON bitacora_salida(establecimiento_id);
CREATE INDEX idx_reportes_patio_establecimiento_id ON reportes_patio(establecimiento_id);
CREATE INDEX idx_mediaciones_gcc_establecimiento_id ON mediaciones_gcc_v2(establecimiento_id);
CREATE INDEX idx_carpetas_documentales_establecimiento_id ON carpetas_documentales(establecimiento_id);
CREATE INDEX idx_documentos_institucionales_establecimiento_id ON documentos_institucionales(establecimiento_id);
```

---

## 10. Migraciones del Sistema

### 10.1 Lista de Migraciones

| # | Archivo | Propósito |
|---|---------|-----------|
| 001 | 001_init.sql | Esquema base, tablas core, enums |
| 002 | 002_plazos_habiles.sql | Tabla feriados_chile |
| 003 | 003_frontend_alignment.sql | Nuevos enums, tablas operativas |
| 004 | 004_rls_public_read_auth_write.sql | Políticas RLS iniciales |
| 005 | 005_cleanup_legacy_policies.sql | Limpieza de políticas legacy |
| 006 | 006_normalize_remaining_policies.sql | Normalización de políticas |
| 007 | 007_add_curso_to_expedientes.sql | Campo curso en expedientes |
| 007b | 007_mejorar_reportes_patio.sql | Mejoras en reportes_patio |
| 008 | 008_agregar_estudiante_id_reportes.sql | FK estudiante en reportes |
| 009 | 009_add_curso_to_reportes_patio.sql | Campo curso en reportes |
| 010 | 010_multi_tenant_isolation.sql | Aislamiento multi-tenant |
| 011 | 011_fix_superadmin_rls.sql | Fix RLS superadmin |
| 011b | 011_superadmin_real_data.sql | Datos de superadmin |
| 012 | 012_add_missing_rls_policies.sql | Políticas RLS faltantes |
| 013 | 013_bootstrap_superadmin_and_rls_checks.sql | Bootstrap superadmin |
| 014 | 014_rls_recursion_hotfix.sql | Fix recursión RLS |
| 015 | 015_superadmin_config_studio.sql | Tablas admin |
| 016 | 016_create_superadmin.sql | Crear usuario superadmin |
| 017 | 017_tenant_management_columns.sql | Columnas de tenant |
| 018 | 018_add_expediente_actor_b.sql | Segundo estudiante |
| 019 | 019_fix_expedientes_auditoria_null_auth.sql | Fix auditoría |
| 021 | 021_strict_evidencias_url_storage_guard.sql | Seguridad evidencias |
| 022 | 022_harden_evidencias_url_storage_normalization.sql | Normalización URL |
| 023 | 023_fix_hitos_expediente_rls.sql | Fix RLS hitos |
| 024 | 024_fix_operational_tables_superadmin_rls.sql | Fix tablas operativas |
| 028 | 028_fix_storage_superadmin_insert_policies.sql | Fix políticas storage |
| 029 | 029_gcc_expand.sql | Tablas GCC v2 |
| 030 | 030_gcc_backfill_dualwrite.sql | Backfill GCC |
| 031 | 031_gcc_contract.sql | Contrato GCC |
| 032 | 032_tenant_branding.sql | Branding por tenant |
| 033 | 033_setup_branding_storage.sql | Storage para branding |
| 034 | 034_add_interaction_type_to_expedientes.sql | Tipo de interacción |
| 035 | 035_add_additional_data_to_expedientes.sql | Datos adicionales |
| 036 | 036_audit_fix_complete.sql | Fix completo de auditoría |
| 037 | 037_final_corrections_complete.sql | Correcciones finales |
| 039 | 039_superadmin_rls_bypass.sql | Bypass RLS superadmin |
| 040 | 040_superadmin_bypass_fixed.sql | Fix bypass superadmin |
| 041 | 041_gcc_superadmin_bypass.sql | Bypass GCC superadmin |

---

## 11. Problemas y Limitaciones Conocidas

### 11.1 Problemas de Índices

**Bug de índices duplicados en migración 012:**
La migración 012 intenta crear el índice `idx_establecimiento_id` para múltiples tablas, pero PostgreSQL solo permite un índice con el mismo nombre. Esto resultó en que solo la primera tabla (estudiantes) tenga el índice de tenant.

**Solución:** Crear índices con nombres únicos por tabla.

### 11.2 Problemas de Migraciones

**Migraciones 034 y 035:**
Pueden haber fallado en algunos ambientes debido a que la tabla `expedientes` no existía en el contexto esperado.

### 11.3 Problemas de Roles

**Rol 'superadmin' no existe inicialmente:**
El enum `rol_usuario` en la migración 001 no incluye 'superadmin'. Este rol fue agregado posteriormente en las políticas RLS pero el enum no se actualizó correctamente.

**Solución:** Ejecutar `ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'superadmin';`

### 11.4 Problemas de Credenciales

**Credenciales débiles hardcodeadas:**
Las migraciones y scripts contienen credenciales por defecto (`admin@admin.cl` / `123456`) que deben ser cambiadas en producción.

---

## 12. Recomendaciones de Mantenimiento

### 12.1 Monitoreo

1. **Verificar estado de RLS:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Verificar políticas activas:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

3. **Verificar índices de tenant:**
   ```sql
   SELECT indexname, tablename 
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND indexname LIKE '%establecimiento_id%';
   ```

### 12.2 Respaldo

- Realizar respaldos regulares de la base de datos
- Mantener historial de migraciones aplicadas
- Documentar cualquier cambio manual en la estructura

### 12.3 Seguridad

1. **Rotar credenciales:** Cambiar las credenciales por defecto inmediatamente
2. **Validar JWT en Edge Functions:** Asegurar que todas las funciones validen tokens
3. **Revisar políticas RLS:** Auditar periódicamente las políticas activas

---

## 13. Referencias

- **Carpeta de migraciones:** `supabase/migrations/`
- **Carpeta de scripts SQL:** `supabase/sql/`
- **Edge Functions:** `supabase/functions/`
- **Documentación relacionada:**
  - `docs/SUPABASE_TABLAS.md`
  - `docs/SUPABASE_SYSTEM_AUDIT_2026-02-17.md`
  - `docs/AUDITORIA_SUPABASE_COMPLETA_2026-02-18_FINAL.md`

---

*Documento generado automáticamente el 2026-02-18*
