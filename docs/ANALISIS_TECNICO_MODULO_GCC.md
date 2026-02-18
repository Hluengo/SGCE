# Análisis Técnico Completo del Módulo GCC - Sistema de Gestión de Convivencia Escolar

## Resumen Ejecutivo

El presente documento constituye un análisis exhaustivo del módulo de Gestión Colaborativa de Conflictos (GCC) implementado en el Sistema de Gestión de Convivencia Escolar (SGCE), examinando su arquitectura técnica y funcional en profundidad. El análisis se fundamenta en las disposiciones establecidas en la Circular 782 de la Superintendencia de Educación de Chile, particularmente en lo relativo a los mecanismos de resolución pacífica de conflictos escolares, y su integración con los requerimientos complementarios de la Circular 781.

El módulo GCC representa un componente crítico del sistema, constituido como alternativa voluntaria a los procedimientos disciplinarios tradicionales conforme lo establece el artículo 8 de la Circular 782. Este mecanismo permite que, cuando las partes involucradas en un conflicto reachacen acuerdo mediante procesos de mediación, conciliación o arbitraje pedagógico, se apliquen medidas formativas en lugar de sanciones disciplinarias, privilegiando así el enfoque restaurativo sobre el punitivo.

El análisis examina la arquitectura actual de la base de datos, los flujos de trabajo implementados, las políticas de seguridad a nivel de fila (RLS), los componentes frontend y las integraciones con el resto del sistema de expedientes disciplinarios. Adicionalmente, se identifican redundancias operativas, cuellos de botella y oportunidades de optimización, proponiéndose una versión mejorada que mantiene el cumplimiento normativo mientras reduce la complejidad operativa y mejora la experiencia de usuario.

---

## 1. Marco Normativo: Circulares 781 y 782

### 1.1 Contexto y Vigencia

Las Circulares N°781 y N°782 fueron aprobadas el 23 de diciembre de 2025 por la Superintendencia de Educación de Chile, con publicación en el Diario Oficial el 10 de enero de 2026 y entrada en vigencia al inicio del año escolar 2026. El plazo fatal para la adecuación de los reglamentos internos vence el 30 de junio de 2026, aunque los procedimientos de la Circular 782 rigen de manera inmediata desde su entrada en vigencia.

La Circular 781 establece las directrices generales para la elaboración, contenido, difusión, implementación y cumplimiento de los Reglamentos Internos (RICE) de establecimientos educacionales, mientras que la Circular 782 desarrolla específicamente los procedimientos disciplinarios y el sistema de medidas formativas. Ambas circulares operan de forma integrada y complementaria, incorporando procedimientos con garantías similares al debido proceso constitucional.

### 1.2 Principios Rectores de la Disciplina Escolar

La Circular 782 establece seis principios fundamentales que deben regir todo el sistema de convivencia y disciplina escolar:

**Legalidad-Tipicidad**: Las medidas disciplinarias deben ajustarse estrictamente a la normativa educacional vigente. Las conductas constitutivas de falta y las medidas aplicables deben estar específicamente descritas en el reglamento interno, evitando cláusulas ambiguas o genéricas.

**Proporcionalidad**: Debe existir correspondencia adecuada entre las medidas disciplinarias, los hechos que las motivan y su incidencia en la buena convivencia educativa. Las medidas deben aplicarse bajo criterios de gradualidad y progresividad, agotando previamente las de menor intensidad.

**Justo y Racional Procedimiento**: Este principio exige la existencia de reglas claras y etapas definidas, con dos dimensiones complementarias: la dimensión procesal (formal) que requiere procedimientos preestablecidos, y la dimensión sustancial (material) que garantiza decisiones adecuadas, proporcionales y fundadas.

**No Discriminación e Inclusión**: La imposición de medidas disciplinarias no puede fundarse en motivos prohibidos como rendimiento académico, no pago de mensualidades, inasistencia, incumplimiento de uniforme, embarazo, maternidad o paternidad, entre otros.

**Autonomía**: Los establecimientos educacionales tienen autonomía para definir su proyecto educativo y normas internas, siempre dentro del marco jurídico establecido.

**Enfoque Formativo**: Constituye el eje articulador de toda la Circular 782, implicando un cambio de paradigma desde una disciplina punitiva hacia una disciplina restaurativa y educativa centrada en la reflexión, reparación y modificación de conductas.

### 1.3 Gestión Colaborativa de Conflictos (GCC)

La Gestión Colaborativa de Conflictos representa una innovación significativa introducida por la Circular 782, constituyendo un mecanismo alternativo voluntario para la resolución de conflictos escolares. Los mecanismos GCC incluyen:

- **Mediación**: Proceso voluntario donde un tercero neutral facilita la comunicación entre las partes para que lleguen a un acuerdo.
- **Conciliación**: Intervención activa del tercero que propone soluciones para que las partes las acepten o rechacen.
- **Arbitraje Pedagógico**: Resolución del conflicto por parte de un profesional con autoridad para decidir.

Estos mecanismos operan como alternativa voluntaria a los procedimientos disciplinarios tradicionales. Cuando las partes logran un acuerdo mediante GCC, se aplican medidas formativas en lugar de sanciones disciplinarias, y el procedimiento disciplinario se cierra sin aplicar sanción.

### 1.4 Procedimientos Disciplinarios y su Relación con GCC

La Circular 782 establece cuatro tipos de procedimientos disciplinarios graduados según la gravedad de las faltas:

**Procedimiento para Faltas Leves** (Plazo: 24 horas): Incluye comunicación verbal, derecho a ser oído, oportunidad de GCC, decisión y comunicación de la medida, y registro en libro de clases.

**Procedimiento General para Infracciones Relevantes** (Plazo: 2 meses): Incluye inicio y asignación de responsable, oportunidad de GCC (obligatoria), comunicación escrita, investigación, resolución fundada, y recurso de reconsideración.

**Procedimiento para Expulsión** (Plazo: 10 días): Requiere evaluación de GCC, comunicación formal, audiencia, y resolución del Director con visto bueno del sostenedor.

**Procedimiento para Cancelación de Matrícula** (Plazo: 15 días): Similar a expulsión pero con participación obligatoria del representante legal del estudiante y evaluación de medidas alternativas.

En todos los procedimientos de mayor gravedad, la etapa de GCC se evalúa dentro de los primeros 5 días hábiles, y si hay acuerdo, el procedimiento disciplinario se cierra sin aplicar sanción, registrándose en el libro de clases como "Conflicto resuelto mediante mediación/conciliación".

---

## 2. Arquitectura de la Base de Datos del Módulo GCC

### 2.1 Schema de Tablas GCC

El módulo GCC en la base de datos de Supabase está implementado mediante cinco tablas principales que conforman el schema de Gestión Colaborativa de Conflictos:

#### Tabla: mediaciones_gcc_v2

Esta constituye la tabla principal del módulo, almacenando los procesos de mediación activos. Sus columnas principales incluyen:

- **id**: UUID como clave primaria, generado automáticamente mediante uuid_generate_v4()
- **establecimiento_id**: UUID referenciando la tabla establecimientos, obligatorio y con restricción de integridad
- **expediente_id**: UUID referenciando la tabla expedientes, obligatorio con eliminación en cascada
- **tipo_mecanismo**: Texto con restricción CHECK que acepta únicamente 'MEDIACION', 'CONCILIACION', 'ARBITRAJE_PEDAGOGICO' y 'NEGOCIACION_ASISTIDA'
- **estado_proceso**: Texto con restricción CHECK para los estados del proceso
- **efecto_suspensivo_activo**: Booleano que indica si el proceso de mediación suspende los plazos del procedimiento disciplinario
- **fecha_inicio**: Timestamp con zona horaria indicando cuándo comenzó el proceso
- **fecha_limite_habil**: Fecha límite para resolver el conflicto, calculada en días hábiles
- **fecha_cierre**: Timestamp opcional que indica cuándo concluyó el proceso
- **resultado_final**: Texto opcional que almacena el resultado alcanzado
- **motivo_derivacion**: Texto opcional explicando por qué se derivó al caso a GCC
- **facilitador_id**: UUID opcional referenciando al perfil del facilitador
- **created_by**: UUID obligatorio referenciando al perfil que creó el registro
- **created_at** y **updated_at**: Timestamps automáticos para trazabilidad

La tabla incluye un CHECK que garantiza que fecha_cierre no pueda ser anterior a fecha_inicio, y está indexada por establecimiento_id, expediente_id y fecha de creación para optimizar consultas frecuentes.

#### Tabla: participantes_gcc_v2

Almacena la información de todos los participantes en los procesos de mediación:

- **id**: UUID clave primaria
- **establecimiento_id**: UUID obligatorio referenciando establecimientos
- **mediacion_id**: UUID obligatorio referenciando mediaciones_gcc_v2 con eliminación en cascada
- **tipo_participante**: Texto con CHECK ('ESTUDIANTE', 'APODERADO', 'DOCENTE', 'DIRECTIVO', 'FACILITADOR', 'OTRO')
- **sujeto_id**: UUID opcional referenciando al estudiante o perfil involucrado
- **nombre_completo**: Texto obligatorio con el nombre del participante
- **rol_en_conflicto**: Texto con CHECK ('PARTE_A', 'PARTE_B', 'VICTIMA', 'TESTIGO', 'FACILITADOR', 'OTRO')
- **consentimiento_registrado**: Booleano indicando si se obtuvo consentimiento informado
- **observaciones**: Texto opcional para notas adicionales
- **created_at** y **updated_at**: Timestamps automáticos

#### Tabla: hitos_gcc_v2

Registra los momentos clave y eventos significativos durante el proceso de mediación:

- **id**: UUID clave primaria
- **establecimiento_id**: UUID obligatorio
- **mediacion_id**: UUID obligatorio referenciando la mediación
- **tipo_hito**: Texto con CHECK ('INICIO', 'REUNION', 'ACERCAMIENTO', 'ACUERDO_PARCIAL', 'ACUERDO_FINAL', 'SIN_ACUERDO', 'CIERRE', 'SUSPENSION')
- **descripcion**: Texto opcional describiendo el hito
- **fecha_hito**: Timestamp con valor por defecto now()
- **registrado_por**: UUID obligatorio referenciando al perfil que registra
- **datos_adicionales**: JSONB con datos adicionales en formato clave-valor
- **created_at** y **updated_at**: Timestamps automáticos

#### Tabla: actas_gcc_v2

Almacena los documentos formales generados durante el proceso:

- **id**: UUID clave primaria
- **establecimiento_id**: UUID obligatorio
- **mediacion_id**: UUID obligatorio
- **tipo_acta**: Texto con CHECK ('ACUERDO', 'CONSTANCIA', 'ACTA_MEDIACION', 'ACTA_CONCILIACION', 'ACTA_ARBITRAJE')
- **contenido_json**: JSONB almacenando el contenido estructurado del acta
- **url_documento**: Texto opcional con la ubicación del documento escaneado o firmado
- **firmado_por_partes**: Booleano indicando si las partes han firmado
- **fecha_emision**: Fecha por defecto actual
- **observaciones**: Texto opcional
- **created_at** y **updated_at**: Timestamps automáticos

#### Tabla: compromisos_gcc_v2

Registra los acuerdos y compromisos adquiridos por las partes:

- **id**: UUID clave primaria
- **establecimiento_id**: UUID obligatorio
- **mediacion_id**: UUID obligatorio
- **descripcion**: Texto obligatorio detallando el compromiso
- **responsable_id**: UUID opcional referenciando al perfil responsable
- **tipo_responsable**: Texto opcional indicando el tipo de responsable
- **fecha_compromiso**: Fecha por defecto actual
- **cumplimiento_verificado**: Booleano indicando si se ha verificado el cumplimiento
- **evidencia_cumplimiento_url**: Texto opcional con URL de evidencia
- **fecha_verificacion**: Fecha opcional cuando se verificó el cumplimiento
- **resultado_evaluacion**: Texto opcional con el resultado de la evaluación
- **created_at** y **updated_at**: Timestamps automáticos

### 2.2 Integración con Tablas de Expedientes

El módulo GCC se integra con la tabla principal de expedientes mediante las siguientes relaciones:

**Campo estado_legal**: La tabla expedientes incluye el estado 'pausa_legal' que se activa cuando un caso es derivado a GCC, suspendiendo temporalmente el procedimiento disciplinario.

**Campo etapa_proceso**: La tabla expedientes incluye la etapa 'CERRADO_GCC' que indica que el caso fue resuelto mediante GCC y no requiere más acciones en el flujo disciplinario tradicional.

**Relación mediante expediente_id**: La tabla mediaciones_gcc_v2 mantiene una relación directa con expedientes mediante el campo expediente_id, permitiendo trazabilidad bidireccional entre el proceso disciplinario y el proceso de mediación.

### 2.3 Políticas de Seguridad a Nivel de Fila (RLS)

El módulo GCC implementa políticas RLS específicas para garantizar el aislamiento de datos entre establecimientos (multi-tenant). Las políticas actuales incluyen:

- **Políticas de aislamiento por establecimiento**: Todas las tablas GCC filtran automáticamente por establecimiento_id del usuario actual
- **Bypass para superadmin**: Las políticas incluyen excepciones para usuarios con rol superadmin que pueden acceder a datos de todos los establecimientos
- **Políticas por operación**: Se distinguen políticas para SELECT, INSERT, UPDATE y DELETE según el rol del usuario

Las políticas implementadas siguen el patrón de verificar mediante la función can_access_tenant() que el usuario tenga acceso legítimo al establecimiento relacionado con el registro.

---

## 3. Flujo Actual del Procedimiento de Mediación

### 3.1 Derivación a GCC desde Expedientes

El flujo actual comienza cuando un expediente en etapa de investigación, resolución pendiente o reconsideración es derivado al módulo GCC. Esta derivación puede realizarse desde dos puntos de entrada:

**Desde el detalle del expediente**: El usuario con rol correspondiente (director, encargado de convivencia) puede hacer clic en el botón "Derivar a Mediación GCC" disponible en la vista de detalle del expediente. Al seleccionar esta opción, el sistema crea automáticamente un registro en mediaciones_gcc_v2 con los datos del expediente asociado.

**Desde el Centro de Mediación GCC**: La vista principal del módulo muestra una lista de casos disponibles para GCC, filtrando aquellos expedientes que se encuentran en etapas compatibles (INVESTIGACION, RESOLUCION_PENDIENTE, RECONSIDERACION). El usuario selecciona un caso y procede a iniciar el proceso de mediación.

### 3.2 Estados del Proceso GCC

El flujo de mediación implementa tres estados principales que determinan las acciones disponibles:

**PROCESO (o.en_proceso)**: Estado inicial cuando se crea la mediación. En este estado, el facilitador puede registrar participantes, hitos, y trabajar hacia un acuerdo. El expediente asociado permanece en estado de "pausa legal" suspendiendo los plazos del procedimiento disciplinario.

**LOGRADO (o.acuerdo_total/acuerdo_parcial)**: Estado alcanzado cuando las partes llegan a un acuerdo. El sistema permite registrar el detalle del acuerdo, los compromisos adquiridos, y generar el acta correspondiente. El expediente asociado cambia a etapa CERRADO_GCC.

**NO_ACUERDO (o.sin_acuerdo)**: Estado alcanzado cuando las partes no logran consenso. El sistema permite cerrar el proceso sin acuerdo, y el expediente associated puede retornar al flujo disciplinario tradicional para continuar con la sanción correspondiente.

### 3.3 Etapas del Flujo Actual

El flujo actual de mediación en el componente CentroMediacionGCC sigue las siguientes etapas:

**Etapa 1 - Selección del Caso**: El usuario selecciona un expediente de la lista de casos disponibles para GCC. El sistema carga los datos del expediente y verifica si existe una mediación activa.

**Etapa 2 - Configuración del Proceso**: El usuario selecciona el mecanismo GCC a utilizar (mediación, conciliación, arbitraje pedagógico o negociación asistida) y define el plazo límite para el proceso.

**Etapa 3 - Registro de Participantes**: Se registran las partes involucradas en el conflicto, incluyendo estudiantes, apoderados, docentes u otros participantes. Para cada participante se define su rol en el conflicto (Parte A, Parte B, Víctima, Testigo, etc.).

**Etapa 4 - Desarrollo del Proceso**: Durante el desarrollo, el facilitador puede registrar hitos significativos (reuniones, acercamientos, acuerdos parciales), mantener actualizado el estado del proceso, y trabajar hacia un acuerdo.

**Etapa 5 - Registro de Resultados**: Una vez alcanzado un acuerdo o determinado que no hay acuerdo, el facilitador registra el resultado, incluyendo los compromisos acquiredos por las partes.

**Etapa 6 - Cierre del Proceso**: El proceso se cierra formalmente, actualizando el estado del expediente asociado según corresponda (CERRADO_GCC si hay acuerdo, o retornando al flujo disciplinario si no lo hay).

### 3.4 Componente Frontend CentroMediacionGCC

El componente principal CentroMediacionGCC.tsx implementa toda la interfaz de usuario del módulo, incluyendo:

- Panel de casos disponibles para GCC
- Panel de procesos GCC activos
- Formulario de derivación a GCC
- Formulario de registro de participantes
- Registro de hitos y evolucion del proceso
- Registro de compromisos adquiridos
- Formulario de resultados (acuerdo total, acuerdo parcial, sin acuerdo)
- Generación de documentos (actas, constancias)
- Funcionalidad para destrabar un caso desde GCC y retornarlo al flujo disciplinario

El componente utiliza Supabase como backend para todas las operaciones CRUD sobre las tablas GCC, con manejo de estados mediante React hooks y comunicación al servidor mediante la biblioteca @supabase/supabase-js.

---

## 4. Análisis Crítico: Problemas y Oportunidades de Mejora

### 4.1 Identificación de Redundancias Operativas

El análisis del flujo actual identifica las siguientes redundancias y puntos de fricción:

**Duplicación de Estados**: El sistema mantiene dos representaciones del estado del proceso GCC: el campo estado_proceso en mediaciones_gcc_v2 y el estado local statusGCC en el componente frontend. Esta duplicación puede generar inconsistencias cuando el estado local no se sincroniza correctamente con la base de datos.

**Múltiples Puntos de Entrada**: La derivación a GCC puede realizarse desde múltiples ubicaciones (detalle del expediente, centro de mediación), creando posibilidades de confusión y potencial inconsistencia en el proceso de creación de mediaciones.

**Formularios Repetitivos**: Los formularios de registro de participantes, hitos y compromisos comparten campos similares pero se presentan de forma separada, requiriendo múltiples intervenciones del usuario para completar un proceso que podría consolidarse.

**Verificación de Contexto Repetida**: A lo largo del código, se repite constantemente la verificación de contexto (supabase, tenantId, usuario?.id) antes de cada operación, indicando una oportunidad de crear abstracciones o hooks reutilizables.

### 4.2 Cuellos de Botella Identificados

**Carga de Datos**: El componente realiza múltiples consultas separadas para cargar mediaciones, participantes, hitos y compromisos, generando múltiples viajes de red que podrían consolidarse.

**Sin Mecanismo de Cacheo**: Cada visita al módulo o cambio de pestaña dispara consultas directas a la base de datos sin利用缓存机制, afectando el rendimiento en conexiones lentas.

**Validaciones Client-Side**: Las validaciones de datos se realizan principalmente en el cliente, sin funciones RPC que validen la integridad de los datos en el servidor antes de insertarlos.

### 4.3 Inconsistencias con la Normativa

**Plazos No Automatizados**: Aunque el sistema calcula una fecha_limite_habil, no existen notificaciones automáticas ni alertas cuando se acerca el vencimiento del plazo de mediación (5 días según la Circular 782).

**Consentimiento No Formalizado**: Aunque existe el campo consentimiento_registrado en participantes, no hay un proceso formal de registro de consentimiento informado conforme lo requiere la normativa.

**Falta de Plantillas de Documentos**: Los documentos generados (actas, constancias) se construyen manualmente sin plantillas predefinidas que garanticen la inclusión de todos los elementos requeridos por la normativa.

### 4.4 Puntos de Fricción para Usuarios

**Navegación Entre Vistas**: El usuario debe navegar entre múltiples vistas (expedientes, detalle de expediente, centro de mediación) para completar el flujo completo de una mediación.

**Ausencia de Vista Unificada**: No existe una vista que presente de manera consolidada toda la información del proceso de mediación con acceso directo a todas las funcionalidades.

**Mensajes de Error Genéricos**: Los mensajes de error provenientes de Supabase se muestran directamente al usuario sin contextualización, dificultando la comprensión de qué acción corrective debe tomar.

**Flujo de Cierre Complejo**: El cierre del proceso GCC requiere múltiples pasos (registrar resultado, generar acta, actualizar expediente) que podrían consolidarse en un flujo guiado unificado.

---

## 5. Propuesta de Flujo Optimizado

### 5.1 Principios de Diseño de la Optimización

La propuesta de optimización se fundamenta en los siguientes principios:

**Consolidación de Acciones**: Reducir el número de pasos requeridos para completar operaciones comunes mediante la consolidación de formularios y acciones relacionadas.

**Automatización de Procesos Manuales**: Implementar funciones RPC que automaticen validaciones, cálculos de fechas límites, y notificaciones que actualmente requieren intervención manual.

**Experiencia de Usuario Unificada**: Crear un flujo guiado que acompañe al usuario a través de todas las etapas del proceso de mediación sin requerir navegación entre múltiples vistas.

**Cumplimiento Normativo Garantizado**: Asegurar que todas las funcionalidades implementadas cumplan con los requisitos de la Circular 782, incluyendo plazos, consentimiento informado, y generación de documentos.

**Trazabilidad Completa**: Garantizar que todas las acciones queden registradas en la base de datos con información de auditoría completa.

### 5.2 Flujo Propuesto: Proceso Unificado de Mediación

El flujo optimizado propone un proceso guiado de cinco etapas consolidado:

#### Etapa 1: Inicio y Configuración

**Acciones consolidadas**:

1. Seleccionar expediente origen (con búsqueda integrada)
2. Seleccionar mecanismo GCC
3. Confirmar derivación (crea mediación + actualiza expediente automáticamente)
4. Registrar participantes iniciales (si aplica)

**Optimización**: El sistema ejecuta todas estas acciones en una sola transacción, mostrando feedback visual del progreso.

**Validaciones**:

- Verificar que el expediente esté en etapa válida para GCC
- Verificar que no exista una mediación activa para el expediente
- Confirmar que el usuario tiene permisos para derivar a GCC

#### Etapa 2: Desarrollo del Proceso

**Acciones consolidadas**:

1. Registrar/modificar participantes (agregar, editar, eliminar)
2. Registrar hitos del proceso (reuniones, acercamientos)
3. Agregar/modificar compromisos durante el desarrollo
4. Actualizar estado del proceso

**Optimización**: Panel lateral con toda la información del caso, permitiendo agregar participantes, hitos y compromisos desde una misma vista sin necesidad de cambiar de pantalla.

**Notificaciones Automáticas**:

- Al registrar un nuevo participante, solicitar confirmación de consentimiento
- Al registrar un compromiso, programar recordatorio para verificación de cumplimiento

#### Etapa 3: Acuerdo o Sin Acuerdo

**Acciones consolidadas**:

1. Registrar resultado (acuerdo total, acuerdo parcial, sin acuerdo)
2. Registrar compromisos del acuerdo (si aplica)
3. Generar acta automáticamente desde plantilla
4. Confirmar cierre

**Optimización**: El formulario de resultado guía al usuario secuencialmente por cada paso, generando el documento automáticamente al confirmar.

**Generación Automática de Documentos**:

- Acta de acuerdo (si hay acuerdo total o parcial)
- Constancia sin acuerdo (si no hay acuerdo)
- Actualización automática del expediente asociado

#### Etapa 4: Verificación de Cumplimiento (Opcional)

**Acciones consolidadas**:

1. Revisar compromisos pendientes
2. Marcar cumplimiento/no cumplimiento
3. Agregar evidencia de cumplimiento
4. Cerrar seguimiento

**Optimización**: Panel de seguimiento que consolida todos los compromisos con filtros por estado yrecordatorios automáticos.

#### Etapa 5: Cierre y Trazabilidad

**Acciones consolidadas**:

1. Confirmar cierre definitivo
2. Actualizar estado final del expediente
3. Registrar en log de auditoría
4. Notificar a partes (si está configurado)

### 5.3 Especificaciones Técnicas de la Optimización

#### Funciones RPC Propuestas

**gcc_crear_proceso**: Función RPC que crea una mediación completamente en una sola llamada, incluyendo la creación del registro principal, el registro del hito inicial, y la actualización del expediente asociado. Recibe como parámetros el ID del expediente, el tipo de mecanismo, y el ID del usuario que inicia el proceso. Retorna el ID de la mediación creada o un mensaje de error en caso de fallo.

**gcc_registrar_resultado**: Función RPC que procesa el resultado de una mediación, actualizando el estado de la mediación, creando el acta correspondiente según el resultado, actualizando el expediente asociado, y registrandolos compromisos si corresponde. Recibe el ID de la mediación, el resultado (acuerdo_total, acuerdo_parcial, sin_acuerdo), y un JSON con los detalles adicionales.

**gcc_actualizar_expediente_origen**: Función RPC que actualiza el estado del expediente asociado a una mediación según el resultado del proceso GCC. Cambia la etapa a CERRADO_GCC si hay acuerdo, o reactiva el procedimiento disciplinario si no hay acuerdo.

**gcc_calcular_fecha_limite**: Función RPC que calcula la fecha límite para un proceso GCC considerando los días hábiles del calendario de Chile (excluyendo feriados).

**gcc_notificar_vencimiento**: Función que se ejecuta mediante un trigger o tarea programada para verificar vencimiento de plazos y generar notificaciones.

#### Hooks Propuestos

**useProcesoGCC**: Hook personalizado que encapsula toda la lógica del proceso GCC, incluyendo carga de datos, actualizaciones de estado, y gestión de errores. Proporciona una interfaz unificada para todos los componentes que necesitan interactuar con el módulo GCC.

**useParticipantes**: Hook para gestión de participantes con métodos optimizados para agregar, modificar, eliminar y obtener consentimiento.

**useDocumentosGCC**: Hook específico para la generación de documentos, incluyendo funciones para renderizar plantillas, generar PDFs, y almacenar documentos en Supabase Storage.

### 5.4 Generación Automática de Actas

El sistema propuesto incluye generación automática de documentos mediante plantillas predefinidas:

**Plantilla de Acta de Acuerdo Total**:

- Encabezado con identificación del establecimiento
- Datos del expediente origen (folio, estudiante, fecha)
- Identificación del mecanismo GCC utilizado
- Datos de las partes participantes
- Descripción del acuerdo alcanzado
- Compromisos adquiridos por cada parte
- Plazos de cumplimiento
- Firmas de las partes y facilitador
- Fecha y lugar

**Plantilla de Constancia Sin Acuerdo**:

- Encabezado con identificación del establecimiento
- Datos del expediente origen
- Identificación del mecanismo GCC utilizado
- Datos de las partes participantes
- Constancia de que no se alcanzó acuerdo
- Motivo de la no convergencia (opcional)
- Firma del facilitador
- Fecha

**Plantilla de Compromisos**:

- Identificación del proceso GCC
- Datos del/de los estudiante(s) comprometido(s)
- Descripción de cada compromiso
- Plazo de cumplimiento
- Responsable de verificación
- Espacio para evidencia de cumplimiento

---

## 6. Comparativa: Flujo Actual vs. Flujo Propuesto

### 6.1 Tabla Comparativa de Acciones

| Aspecto | Flujo Actual | Flujo Propuesto | Mejora |
|---------|--------------|-----------------|--------|
| Pasos para iniciar mediación | 4-5 intervenciones separadas | 1 intervención consolidada | Reducción 80% |
| Navegación entre vistas | 3-4 cambios de vista | 0 (flujo unificado) | Eliminación total |
| Consultas a BD por carga inicial | 4 consultas separadas | 1 consulta consolidada | Reducción 75% |
| Tiempo estimado para resultado | ~15 minutos | ~5 minutos | Reducción 67% |
| Generación de documentos | Manual | Automática | Estandarización |
| Validaciones | Client-side | Server-side + Client | Robustez |
| Notificaciones de plazo | No existe | Automáticas | Cumplimiento normativo |

### 6.2 Diagrama de Flujo Propuesto

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUJO OPTIMIZADO DE MEDIACIÓN GCC                       │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   EXPEDIENTE │──────────────┐
    │   EN ETAPA   │               │
    │  COMPATIBLE  │               ▼
    └──────────────┘      ┌─────────────────────────────┐
                           │     ETAPA 1: INICIO       │
                           │  ┌───────────────────┐    │
                           │  │ 1. Seleccionar   │    │
                           │  │    Expediente     │    │
                           │  └───────────────────┘    │
                           │  ┌───────────────────┐    │
                           │  │ 2. Seleccionar   │    │
                           │  │    Mecanismo      │    │
                           │  └───────────────────┘    │
                           │  ┌───────────────────┐    │
                           │  │ 3. Confirmar     │    │
                           │  │    Derivación    │────┼──────► RPC: gcc_crear_proceso()
                           │  └───────────────────┘    │      (crea mediación + actualiza expediente)
                           │  ┌───────────────────┐    │
                           │  │ 4. Registrar      │    │
                           │  │    Participantes  │    │
                           │  └───────────────────┘    │
                           └─────────────────────────────┘
                                         │
                                         ▼
                           ┌─────────────────────────────┐
                           │   ETAPA 2: DESARROLLO      │
                           │  ┌───────────────────────┐  │
                           │  │ • Agregar/Editar      │  │
                           │  │   Participantes       │  │
                           │  ├───────────────────────┤  │
                           │  │ • Registrar Hitos     │  │
                           │  │   (reuniones, etc.)  │  │
                           │  ├───────────────────────┤  │
                           │  │ • Agregar Compromisos │  │
                           │  │   durante desarrollo  │  │
                           │  ├───────────────────────┤  │
                           │  │ • Actualizar Estado   │  │
                           │  │   (en proceso)       │  │
                           │  └───────────────────────┘  │
                           │         ▲                   │
                           │         │ NOTIFICACIONES    │
                           │         │ AUTOMÁTICAS       │
                           │         │ (plazos)          │
                           └─────────┼───────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
         ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
         │   ACUERDO       │ │   ACUERDO       │ │   SIN ACUERDO    │
         │   TOTAL         │ │   PARCIAL       │ │                  │
         └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                  │                   │                   │
                  ▼                   ▼                   ▼
    ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
    │  ETAPA 3: RESULTADO│ │  ETAPA 3: RESULTADO│ │  ETAPA 3: RESULTADO│
    │ ┌───────────────┐  │ │ ┌───────────────┐  │ │ ┌───────────────┐  │
    │ │1.Registrar    │  │ │ │1.Registrar    │  │ │ │1.Registrar    │  │
    │ │   Resultado   │  │ │ │   Resultado   │  │ │ │   Resultado   │  │
    │ └───────────────┘  │ │ └───────────────┘  │ │ └───────────────┘  │
    │ ┌───────────────┐  │ │ ┌───────────────┐  │ │ ┌───────────────┐  │
    │ │2.Generar Acta │  │ │ │2.Generar Acta │  │ │ │2.Generar      │  │
    │ │   de Acuerdo  │  │ │ │   Parcial     │  │ │ │   Constancia  │  │
    │ │   Automática  │  │ │ │   Automática  │  │ │ │   Automática  │  │
    │ └───────────────┘  │ │ └───────────────┘  │ │ └───────────────┘  │
    │ ┌───────────────┐  │ │ ┌───────────────┐  │ │ ┌───────────────┐  │
    │ │3.Registrar    │  │ │ │3.Registrar    │  │ │ │4.Actualizar   │  │
    │ │   Compromisos │  │ │ │   Compromisos │  │ │ │   Expediente  │  │
    │ │   del Acuerdo │  │ │ │   del Acuerdo │  │ │ │   (regresa a  │  │
    │ └───────────────┘  │ │ └───────────────┘  │ │ │   flujo       │  │
    │ ┌───────────────┐  │ │ └─────────────────┘  │ │ │   disciplinario│  │
    │ │4.Confirmar   │  │ │                     │ │ └───────────────┘  │
    │ │   Cierre      │──┼─┤                     │ └─────────────────────┘
    │ └───────────────┘  │ │
    └─────────────────────┘ │
                            │         ┌──────────────────────────────────────┐
                            └────────►│         ETAPA 4: SEGUIMIENTO       │
                                      │  ┌────────────────────────────────┐  │
                                      │  │ • Revisar Compromisos          │  │
                                      │  │ • Marcar Cumplimiento          │  │
                                      │  │ • Agregar Evidencia            │  │
                                      │  └────────────────────────────────┘  │
                                      └──────────────────────────────────────┘
                                                    │
                                                    ▼
                                      ┌─────────────────────────────┐
                                      │     ETAPA 5: CIERRE         │
                                      │ • Confirmar Cierre Definitivo│
                                      │ • Actualizar Expediente     │
                                      │ • Registro de Auditoría     │
                                      │ • Notificaciones (si config) │
                                      └─────────────────────────────┘

    ─────────────────────────────────────────────────────────────────────────
   Leyenda:
    ─────────────────────────────────────────────────────────────────────────
    ■ Caja con bordes redondeados = Vista/Paso
    ■ Caja con bordes cuadrados   = Acción del usuario
    ■ Flecha continua             = Flujo principal
    ■ Flecha punteada             = Flujo alternativo
    ─────────────────────────────────────────────────────────────────────────
```

---

## 7. Especificaciones de Base de Datos para la Optimización

### 7.1 Nuevas Funciones RPC Propuestas

```sql
-- Función para crear proceso GCC completo en una transacción
CREATE OR REPLACE FUNCTION public.gcc_crear_proceso(
    p_expediente_id uuid,
    p_tipo_mecanismo text,
    p_facilitador_id uuid,
    p_usuario_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mediacion_id uuid;
    v_establecimiento_id uuid;
    v_plazo_dias integer := 5; -- 5 días hábiles según Circular 782
BEGIN
    -- Obtener establecimiento del expediente
    SELECT establecimiento_id INTO v_establecimiento_id
    FROM public.expedientes
    WHERE id = p_expediente_id;

    -- Calcular fecha límite
    -- (simplificado, en producción usar función de días hábiles)
    SELECT CURRENT_DATE + v_plazo_dias INTO v_plazo_dias;

    -- Crear mediación
    INSERT INTO public.mediaciones_gcc_v2 (
        establecimiento_id,
        expediente_id,
        tipo_mecanismo,
        estado_proceso,
        efecto_suspensivo_activo,
        fecha_inicio,
        fecha_limite_habil,
        facilitador_id,
        created_by
    ) VALUES (
        v_establecimiento_id,
        p_expediente_id,
        p_tipo_mecanismo,
        'en_proceso',
        true,
        now(),
        v_plazo_dias,
        p_facilitador_id,
        p_usuario_id
    ) RETURNING id INTO v_mediacion_id;

    -- Crear hito inicial
    INSERT INTO public.hitos_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_hito,
        descripcion,
        registrado_por
    ) VALUES (
        v_establecimiento_id,
        v_mediacion_id,
        'INICIO',
        'Inicio del proceso de ' || p_tipo_mecanismo,
        p_usuario_id
    );

    -- Actualizar expediente
    UPDATE public.expedientes
    SET 
        etapa_proceso = 'CERRADO_GCC'::etapa_proceso,
        estado_legal = 'pausa_legal'::estado_legal
    WHERE id = p_expediente_id;

    RETURN v_mediacion_id;
END;
$$;

-- Función para registrar resultado de GCC
CREATE OR REPLACE FUNCTION public.gcc_registrar_resultado(
    p_mediacion_id uuid,
    p_resultado text, -- 'acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo'
    p_resultado_detalle text,
    p_usuario_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expediente_id uuid;
    v_establecimiento_id uuid;
    v_estado text;
BEGIN
    -- Obtener datos de la mediación
    SELECT expediente_id, establecimiento_id
    INTO v_expediente_id, v_establecimiento_id
    FROM public.mediaciones_gcc_v2
    WHERE id = p_mediacion_id;

    -- Determinar estado según resultado
    CASE p_resultado
        WHEN 'acuerdo_total' THEN
            v_estado := 'acuerdo_total';
        WHEN 'acuerdo_parcial' THEN
            v_estado := 'acuerdo_parcial';
        ELSE
            v_estado := 'sin_acuerdo';
    END CASE;

    -- Actualizar mediación
    UPDATE public.mediaciones_gcc_v2
    SET 
        estado_proceso = v_estado,
        resultado_final = p_resultado_detalle,
        fecha_cierre = now(),
        updated_at = now()
    WHERE id = p_mediacion_id;

    -- Crear hito de cierre
    INSERT INTO public.hitos_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_hito,
        descripcion,
        registrado_por
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        CASE p_resultado
            WHEN 'sin_acuerdo' THEN 'SIN_ACUERDO'
            ELSE 'ACUERDO_FINAL'
        END,
        'Resultado GCC: ' || p_resultado || ' - ' || p_resultado_detalle,
        p_usuario_id
    );

    -- Generar acta según resultado
    INSERT INTO public.actas_gcc_v2 (
        establecimiento_id,
        mediacion_id,
        tipo_acta,
        contenido_json,
        firmado_por_partes
    ) VALUES (
        v_establecimiento_id,
        p_mediacion_id,
        CASE p_resultado
            WHEN 'sin_acuerdo' THEN 'CONSTANCIA'
            ELSE 'ACUERDO'
        END,
        jsonb_build_object(
            'resultado', p_resultado,
            'detalle', p_resultado_detalle,
            'fecha_cierre', now()::date,
            'generado_automaticamente', true
        ),
        false
    );

    -- Actualizar expediente según resultado
    IF p_resultado = 'sin_acuerdo' THEN
        -- Reactivar expediente
        UPDATE public.expedientes
        SET 
            etapa_proceso = 'RESOLUCION_PENDIENTE'::etapa_proceso,
            estado_legal = 'investigacion'::estado_legal
        WHERE id = v_expediente_id;
    ELSE
        -- Mantener cerrado por GCC
        UPDATE public.expedientes
        SET etapa_proceso = 'CERRADO_GCC'::etapa_proceso
        WHERE id = v_expediente_id;
    END IF;

    RETURN true;
END;
$$;
```

### 7.2 Índices Adicionales Recomendados

```sql
-- Índice para búsquedas de mediaciones por estado
CREATE INDEX idx_mediaciones_gcc_v2_estado_fecha 
ON public.mediaciones_gcc_v2(estado_proceso, fecha_limite_habil);

-- Índice para búsquedas de compromisos pendientes
CREATE INDEX idx_compromisos_gcc_v2_pendientes 
ON public.compromisos_gcc_v2(cumplimiento_verificado, fecha_compromiso);

-- Índice para búsquedas de hitos por tipo
CREATE INDEX idx_hitos_gcc_v2_tipo_fecha 
ON public.hitos_gcc_v2(tipo_hito, fecha_hito DESC);
```

---

## 8. Conclusiones y Recomendaciones

### 8.1 Hallazgos Principales

El análisis exhaustivo del módulo GCC en el SGCE revela un sistema funcional que implementa los requisitos básicos establecidos por la Circular 782 de la Superintendencia de Educación. La arquitectura de base de datos con cinco tablas relacionadas proporciona la estructura necesaria para almacenar información completa de los procesos de mediación, incluyendo participantes, hitos, actas y compromisos.

Sin embargo, se identificaron oportunidades significativas de optimización que permitirían reducir la complejidad operativa, mejorar la experiencia de usuario, y fortalecer el cumplimiento normativo mediante la automatización de procesos actualmente manuales.

### 8.2 Prioridades de Implementación

**Prioridad Alta** (Implementar en Sprint actual):

1. Consolidación del flujo de cierre de mediación en un proceso guiado unificado
2. Implementación de generación automática de documentos (actas, constancias)
3. Creación de funciones RPC para operaciones complejas

**Prioridad Media** (Implementar en siguientes Sprints):

4. Sistema de notificaciones automáticas por vencimiento de plazos
5. Hooks reutilizables para simplificación del código frontend
6. Cacheo de datos del módulo GCC

**Prioridad Baja** (Mejoras futuras):

7. Portal de seguimiento para estudiantes y apoderados
8. Integración con sistema de notificaciones email/SMS
9. Panel de métricas avanzadas

### 8.3 Cumplimiento Normativo

El sistema propuesto mantiene y fortalece el cumplimiento de la Circular 782 al:

- Garantizar la oportunidad de GCC antes de procedimientos sancionatorios
- Mantener trazabilidad completa de todas las acciones
- Automatizar el registro de consentimiento informado
- Implementar cálculo automático de plazos hábiles
- Generar documentos estandarizados automáticamente
- Mantener el efecto suspensivo sobre el procedimiento disciplinario durante el proceso GCC

---

## Anexo: Glosario de Términos

**Circular 781**: Circular de la Superintendencia de Educación que establece directrices para Reglamentos Internos de establecimientos educacionales.

**Circular 782**: Circular de la Superintendencia de Educación que establece procedimientos para medidas formativas y disciplinarias, incluyendo GCC.

**GCC**: Gestión Colaborativa de Conflictos, mecanismo alternativo de resolución de conflictos escolares que incluye mediación, conciliación y arbitraje pedagógico.

**Etapa CERRADO_GCC**: Estado del expediente que indica que el caso fue resuelto mediante GCC.

**Estado pausa_legal**: Estado legal que indica que el procedimiento disciplinario está temporalmente suspendido mientras dura el proceso GCC.

**RLS**: Row Level Security, sistema de seguridad a nivel de fila en PostgreSQL/Supabase.

---

*Documento generado el 18 de febrero de 2026*
