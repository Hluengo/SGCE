# Estructura de Base de Datos Supabase - Gestión de Convivencia Escolar

Tu base de datos tiene **20 tablas** y **1 vista** organizadas en las siguientes categorías:

---

## 📋 TABLAS CORE (Núcleo del Sistema)

| Tabla | Propósito |
|-------|-----------|
| `establecimientos` | Colegios/establecimientos educativos del sistema multi-tenant |
| `perfiles` | Usuarios vinculados a establecimientos con roles específicos |
| `estudiantes` | Registro de estudiantes con RUT único, curso, y flags de alertas (PIE, NEE) |

---

## 📁 TABLAS DE EXPEDIENTES Y FALTAS

| Tabla | Propósito |
|-------|-----------|
| `expedientes` | Casos de convivencia escolar con folio único, tipo de falta, estado legal y etapa del proceso |
| `hitos_expediente` | Hitos/tareas obligatorios dentro de un expediente (especialmente para procesos de expulsión) |
| `evidencias` | Archivos subidos a Storage asociados a expedientes |
| `incidentes` | Registros de incidentes reportados (reportados por inspectores) |

---

## 👥 TABLAS DE SEGUIMIENTO ESTUDIANTIL

| Tabla | Propósito |
|-------|-----------|
| `bitacora_psicosocial` | Notas confidenciales de la dupla psicosocial por estudiante |
| `medidas_apoyo` | Acciones de apoyo pedagógico o psicosocial hacia estudiantes |

---

## 🔄 TABLAS DE PROCESOS ESPECÍFICOS

| Tabla | Propósito |
|-------|-----------|
| `derivaciones_externas` | Derivaciones a instituciones externas (OPD, COSAM, Tribunal, Salud) |
| `bitacora_salida` | Registro de salidas de estudiantes durante la jornada |
| `reportes_patio` | Reportes de incidentes en patio/recreo |
| `mediaciones_gcc` | Procesos de mediación del Programa de Gestión de Convivencia (GCC) |
| `compromisos_mediacion` | Acuerdos/commitments generados en las mediaciones |

---

## 📚 TABLAS DE GESTIÓN DOCUMENTAL

| Tabla | Propósito |
|-------|-----------|
| `carpetas_documentales` | Estructura de carpetas para el archivo documental |
| `documentos_institucionales` | Metadatos de documentos institucionales |

---

## ⚙️ TABLAS DE CONFIGURACIÓN Y ADMINISTRACIÓN

| Tabla | Propósito |
|-------|-----------|
| `cursos_inspector` | Relación inspector-curso para permisos de visualización |
| `feriados_chile` | Feriados legales de Chile para cálculo de plazos hábiles |
| `logs_auditoria` | Log de todas las acciones en el sistema |

---

## 🛠️ TABLAS DE SUPERADMIN (Multi-Tenant)

| Tabla | Propósito |
|-------|-----------|
| `admin_changesets` | Cambios de configuración por tenant |
| `admin_change_events` | Historial de eventos de cambios |
| `storage_bucket_registry` | Registro de buckets de Storage |
| `edge_function_registry` | Registro de Edge Functions |
| `tenant_feature_flags` | Feature flags por establecimiento |
| `platform_settings` | Configuración global de la plataforma |
| `superadmin_audit_logs` | Auditoría de acciones del superadmin |

---

## 👁️ VISTAS DEFINIDAS

| Vista | Propósito |
|-------|-----------|
| `expedientes_auditoria` | Vista que registra cuando un usuario visualiza un expediente |

---

## 🔐 SISTEMA DE ROLES

El sistema usa el enum `rol_usuario` con los roles: **admin**, **director**, **convivencia**, **dupla**, **inspector**, **sostenedor**

---

## 📊 ENUMS DEFINIDOS

- `tipo_falta`: leve, relevante, expulsion
- `estado_legal`: apertura, investigacion, resolucion, cerrado
- `etapa_proceso`: INICIO, NOTIFICADO, DESCARGOS, INVESTIGACION, RESOLUCION_PENDIENTE, RECONSIDERACION, CERRADO_SANCION, CERRADO_GCC
- `nivel_privacidad`: baja, media, alta
- `apoyo_tipo`: PEDAGOGICO, PSICOSOCIAL
- `derivacion_estado`: PENDIENTE, RESPONDIDO
- `mediacion_estado`: ABIERTA, EN_PROCESO, CERRADA_EXITOSA, CERRADA_SIN_ACUERDO
- `patio_gravedad`: LEVE, RELEVANTE, GRAVE

---

## 🤖 ARQUITECTURA DE IA DEL PROYECTO

### Asistente Legal (Legal Assistant)

| Componente | Detalle |
|------------|----------|
| **Archivo** | `src/features/legal/LegalAssistant.tsx` |
| **Proveedor** | Google Gemini AI |
| **API** | `gemini-3-flash-preview` |
| **Variable de entorno** | `VITE_GEMINI_API_KEY` |
| **Propósito** | Asesoramiento en normativa de convivencia escolar (Circulares 781 y 782) |

### Características del Asistente Legal

1. **Contexto del caso**: El asistente recibe información del expediente seleccionado (estudiante, etapa, gravedad, si es proceso de expulsión)
2. **System Instruction**: Configurado para actuar como Senior Legal Counsel experto en normativa chilena de educación
3. **Reglas de operación**:
   - Cita la importancia de la gradualidad de medidas
   - Recordar hito obligatorio de consulta al Consejo de Profesores para expulsiones
   - Mantener tono profesional y preventivo
   - Solo dar consejos dentro de la normativa chilena

### Configuración esperada (`.env.local`)

```bash
# No documentar valores reales en repositorio
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

> Seguridad: si alguna clave real quedó expuesta en documentación o commits anteriores, debe rotarse inmediatamente en el proveedor correspondiente.

---

## 🔗 CARACTERÍSTICAS PRINCIPALES

1. **Multi-Tenancy**: Todas las tablas (excepto admin) tienen `establecimiento_id` con RLS activo
2. **Auditoría**: Trigger automático en expedientes que registra cambios en `logs_auditoria`
3. **Aislamiento por rol**: Políticas RLS específicas por rol de usuario
4. **Cálculo de plazos**: Tabla de feriados chilenos para cómputo de plazos hábiles
