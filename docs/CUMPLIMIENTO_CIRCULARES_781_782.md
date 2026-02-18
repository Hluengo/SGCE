# 📋 Cumplimiento de Circulares 781 y 782 - Mapa de Implementación

**Versión**: 1.0  
**Fecha**: 17 de febrero de 2026  
**Estado**: ✅ Implementado en UI y Preparado para Backend

---

## 🎯 Visión: Motor de Cumplimiento Normativo

El **Gestor Integral de Convivencia Escolar** no es una herramienta de gestión más, sino un **motor de cumplimiento normativo** que asegura que cada establecimiento educacional opera dentro del marco de:

- **Circular 781**: Reglamentos Internos (RICE) y Deberes de los Establecimientos
- **Circular 782**: Medidas Formativas y Disciplinarias aplicadas con "Justo y Racional Procedimiento"

---

## 📊 Mapeo de Funcionalidades por Circular

### Circular 781: Reglamentos Internos de Convivencia Escolar

#### A. Requisitos del RICE Implementados

| Requisito | Módulo | Estado | Descripción |
|-----------|--------|--------|-------------|
| **Tipificación de Faltas** | Catálogo de Faltas | ✅ | Sistema de clasificación con 4 niveles de severidad |
| **Medidas Disciplinarias Permitidas** | Medidas por Falta | ✅ | Vinculación automática falta → medida |
| **Derechos del Estudiante** | Portal del Alumno | 🔄 | Acceso a descargos y recursos |
| **Procedimiento Administrativo** | Workflow | ✅ | 4 niveles de proceso automático |
| **Roles y Responsabilidades** | RBAC | ✅ | Permisos granulares por rol |

#### B. Asistente de Adecuación del RICE

```
📅 Plazo Fatal: 30 de junio de 2026

Módulo: "Asistente Legal"
├─ Checklist de cumplimiento Circular 781
├─ Validator de redacción de normas
├─ Importador de RICE existentes
├─ Sugerencias de actualización automática
└─ Reporte de no conformidades
```

---

### Circular 782: Medidas Formativas y Disciplinarias

#### A. Garantía del "Justo y Racional Procedimiento"

El sistema asegura que **toda sanción cumpla con**:

| Principio | Implementación | Validación |
|-----------|-----------------|-----------|
| **Legalidad** | Falta tipificada en RICE | ✅ RLS en BD |
| **Tipicidad** | Acto debe estar descrito previamente | ✅ Catálogo Faltas |
| **Debido Proceso** | Derecho a conocer la acusación | ✅ Notificación Formal |
| **Defensa** | Derecho a descargos | ✅ Gestor de Descargos |
| **Proporcionalidad** | Sanción acorde a falta | ✅ Matriz Falta-Medida |
| **Apelación** | Recurso de reconsideración | ✅ Workflow |

#### B. Workflow de 4 Niveles

```
┌─────────────────────────────────────────────────────┐
│ NIVEL 1: FALTAS LEVES                               │
├─────────────────────────────────────────────────────┤
│ • Plazo: Máximo 24 horas                            │
│ • Responsable: Docente u Operativo                  │
│ • Medida: Amonestación, tarea, etc.                 │
│ • Registro: Anotación en libro de clases            │
│ • Apelación: Encargado de Convivencia               │
└─────────────────────────────────────────────────────┘
                        ▲
                        │
              Registra automáticamente
                        │

┌─────────────────────────────────────────────────────┐
│ NIVEL 2: INFRACCIONES RELEVANTES                    │
├─────────────────────────────────────────────────────┤
│ • Plazo: Máximo 2 meses (incluye mediación)         │
│ • Responsable: Encargado de Convivencia             │
│ • Proceso: Investigación formal                     │
│ • Medidas: Suspensión, acuerdos, planes             │
│ • Requisitos: Notificación, descargos, audiencia    │
└─────────────────────────────────────────────────────┘
                        ▲
                        │
              Escala si no se resuelve
                        │

┌─────────────────────────────────────────────────────┐
│ NIVEL 3: EXPULSIÓN (sin cancelación)                │
├─────────────────────────────────────────────────────┤
│ • Plazo: Máximo 1 mes desde inicio del proceso      │
│ • Responsable: Director + Consejo Directivo         │
│ • Requisito: Mediación GCC obligatoria              │
│ • Procedimiento: Audiencia formal registrada        │
│ • Derecho: Recurso ante Superintendencia            │
└─────────────────────────────────────────────────────┘
                        ▲
                        │
              Escala según severidad
                        │

┌─────────────────────────────────────────────────────┐
│ NIVEL 4: CANCELACIÓN DE MATRÍCULA                   │
├─────────────────────────────────────────────────────┤
│ • Plazo: Máximo 1 mes desde inicio                  │
│ • Responsable: Director + Sostenedor                │
│ • Requisito: GCC + mediación externa                │
│ • Procedimiento: Audiencia con representante legal  │
│ • Registro: Resolución fundada por escrito          │
│ • Apelación: Recurso de reconsideración + Juzgado   │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Módulos del Sistema por Circular

### Módulos Circular 781 (RICE)

#### 1. **Gestor centralizado de RICE**
```
Ubicación: Admin > Configuración > RICE
├─ Importar documento Word/PDF existente
├─ Editor visual de secciones
├─ Validador de conformidad circulares
├─ Versionamiento y changelog
├─ Descarga para firma de sostenedor
└─ Histórico de cambios
```

#### 2. **Catálogo de Faltas y Medidas**
```
Ubicación: Admin > Configuración > Faltas
├─ Crear/Editar tipificación de faltas (4 niveles)
├─ Asignar medidas permitidas por falta
├─ Definir plazo de resolución
├─ Vincular a principios formativos
└─ Importar desde secciones del RICE
```

#### 3. **Gestión de Roles y Permisos**
```
Ubicación: Admin > Usuarios
├─ Rol: Director (acceso total RICE)
├─ Rol: Encargado de Convivencia (investiga, sanciona)
├─ Rol: Docentes (reportan faltas)
├─ Rol: Operativos (registro de presencia)
├─ Rol: Administrativos (genera reportes)
└─ Rol: Sostenedor (autoriza RICE)
```

---

### Módulos Circular 782 (Medidas y Procedimientos)

#### 1. **Gestor de Investigaciones**
```
Ubicación: Dashboard > Convivencia > Investigaciones
├─ Crear caso (falta, estudiante, querellante)
├─ Carpeta de investigación digital
│  ├─ Actas de entrevistas
│  ├─ Medios de prueba (documentos, fotos, videos)
│  ├─ Registros de asistencia
│  └─ Citaciones y notificaciones
├─ Workflow automático de plazos
├─ Validación de procedimiento
└─ Generación de resolución
```

#### 2. **Gestión Colaborativa de Conflictos (GCC)**
```
Ubicación: Dashboard > Mediación > GCC
├─ Registro de mediaciones
├─ Acuerdos de mediación
├─ Seguimiento de compromisos
├─ Escalada a arbitraje pedagógico
├─ Registro de conciliaciones
└─ Informes de cumplimiento
```

#### 3. **Notificaciones Formales**
```
Ubicación: Dentro de cada investigación
├─ Generador de notificación formal
├─ Envío vía correo institucional
├─ Confirmación de lectura
├─ Archivación en carpeta digital
├─ Cronología de comunicaciones
└─ Firmas electrónicas
```

#### 4. **Gestor de Descargos y Recursos**
```
Ubicación: Portal de Defensa (acceso estudiante/apoderado)
├─ Plazo automático para presentar descargos
├─ Subida de documentos de defensa
├─ Historial de comunicaciones
├─ Recurso de reconsideración
├─ Seguimiento de estado
└─ Descarga de resoluciones
```

#### 5. **Registro en Libro de Clases**
```
Ubicación: Integración con sistema académico
├─ "Anotaciones de convivencia" por estudiante
├─ Sincronización automática de faltas leves
├─ Visible para docentes y directivos
├─ Exportable para reportes
└─ Auditoría de cambios
```

#### 6. **Planes de Acompañamiento Formativo**
```
Ubicación: Después de cada medida
├─ Crear plan de seguimiento
├─ Asignar responsables (psicólogo, tutor, etc.)
├─ Actividades reparatorias
├─ Hitos de reintegración
├─ Evaluación de progreso
└─ Cierre con reporte de reintegración
```

---

## 🔐 Mecanismos de Seguridad Normativa

### 1. **Validación de Tipicidad**
```typescript
// Antes de crear falta
if (!faltas.tipificadas.includes(tipoFalta)) {
  throw new Error("Falta no tipificada en RICE");
}
```

### 2. **Bloqueo de Sanciones Prohibidas**
```typescript
// Por ejemplo: no permitir expulsión por atrasos
const prohibidas = {
  'atrasos': ['expulsion', 'cancelacion'],
  'uniforme': ['expulsion'],
  'ausencia_menor_3_dias': ['suspension']
};

if (prohibidas[falta]?.includes(medida)) {
  throw new Error("Sanción no permitida para esta falta");
}
```

### 3. **Validación de Plazo de Resolución**
```typescript
// Faltas leves: máximo 24 horas
// Infracciones: máximo 2 meses
// Expulsión: máximo 1 mes

if (diasTranscurridos > plazoMaximo) {
  notificar_superintendencia("Procedimiento vencido");
}
```

### 4. **Auditoría de Acceso a Datos Sensibles**
```
Cualquier acceso a:
- Antecedentes de salud mental
- Registros de vulnerabilidad
- Reportes psicosociales

Se registra en logs_auditoria con:
- Usuario que accede
- Timestamp
- Dato accedido
- Purpose
```

---

## 📖 Cumplimiento Documentario

### Documentos Generados Automáticamente

| Documento | Módulo | Formato | Requisitos |
|-----------|--------|---------|-----------|
| **Notificación de Falta** | Investigación | PDF | Firma digital, fecha |
| **Resolución de Medida** | Investigación | PDF | Fundamento legal, plazo |
| **Acta de Descargos** | Portal Defensa | PDF | Reproducción fiel |
| **Acuerdo de Mediación** | GCC | PDF | Firmas de ambas partes |
| **Resolución de Expulsión** | Directivo | PDF | Considerandos jurídicos |
| **Reporte de Reintegración** | Acompañamiento | PDF | Avances, recomendaciones |

### Cumplimiento de Ley 21.430 (Garantías de la Niñez)

```
✅ Confidencialidad de datos de menores
   └─ Encriptación en base de datos

✅ Acceso limitado a información sensible
   └─ RLS por rol y establecimiento

✅ Audiencia del niño
   └─ Registro de su participación

✅ Protección de identidad de denunciantes
   └─ Mascara de datos en reportes públicos

✅ Derecho a apelación
   └─ Workflow de recursos automático
```

---

## 🚀 Roadmap de Implementación

### Fase 1: Ya Implementado ✅
- [x] Multi-tenancy seguro (cada colegio aislado)
- [x] RBAC con roles granulares
- [x] Validación de aislamiento de datos
- [x] Gestor de faltas básico
- [x] Workflow de niveles

### Fase 2: En Desarrollo 🔄
- [ ] Gestor de mediación e GCC
- [ ] Notificaciones formales automáticas
- [ ] Portal de defensa para estudiantes/apoderados
- [ ] Planes de acompañamiento formativo

### Fase 3: Próximas Semanas 📅
- [ ] Asistente Legal (validador RICE)
- [ ] Libro de clases integración
- [ ] Auditoría avanzada
- [ ] Reportes de cumplimiento normativo

---

## 📚 Referencias Normativas

### Circulares Oficiales
- **Circular 781**: https://www.supereduc.cl/circulares/circular-781-2024
- **Circular 782**: https://www.supereduc.cl/circulares/circular-782-2024
- **Ley 21.430**: Garantías de la Niñez (Julio 2022)

### Plazo de Cumplimiento
- **Para RICE**: 30 de junio de 2026
- **Para Procedimientos**: Vigentes desde enero 2025
- **Para Datos**: Confidencialidad año escolar 2026

---

## 💡 Diferenciales del Sistema

1. **Automatiza lo que la ley exige**: Plazos, notificaciones, descargos
2. **Previene declaratorias de nulidad**: Asegura tipicidad y procedimiento
3. **Defiende al establecimiento**: Documentación íntegra de cada paso
4. **Protege a los NNA**: Cumplimiento estricto de Ley 21.430
5. **Facilita la Superintendencia**: Reportes conformes a normativa

---

**Este documento es la base para el roadmap técnico de desarrollo. Compartir con Director Ejecutivo y Legal.**
