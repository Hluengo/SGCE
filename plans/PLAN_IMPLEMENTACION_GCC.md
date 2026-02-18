# Plan de Implementación - Optimización del Módulo GCC

## Sistema de Gestión de Convivencia Escolar (SGCE)

**Versión:** 1.0  
**Fecha:** 2026-02-18  
**Documento:** Plan de Implementación para Optimización del Módulo GCC

---

## 1. Resumen Ejecutivo

Este documento presenta el plan de implementación para las mejoras propuestas al módulo de Gestión Colaborativa de Conflictos (GCC) del Sistema de Gestión de Convivencia Escolar. El plan se estructura en 4 fases distribuidas en 6 sprints, con un enfoque incremental que permite validar cada etapa antes de avanzar a la siguiente.

La optimización propuesta tiene como objetivos principales: reducir en un 80% las intervenciones del usuario para completar procesos de mediación, implementar generación automática de documentos para garantizar cumplimiento normativo, y establecer un flujo unificado que elimine la navegación entre múltiples vistas.

---

## 2. Dependencias y Prerrequisitos

### 2.1 Dependencias Técnicas

| Dependencia | Versión Mínima | Propósito |
|------------|----------------|-----------|
| Node.js | 18.x | Runtime de desarrollo |
| React | 18.x | Biblioteca de UI |
| Supabase | 2.x | Backend y base de datos |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.x | Estilos |

### 2.2 Prerrequisitos Funcionales

- Módulo GCC actual funcional (existente)
- Tablas GCC en Supabase (mediaciones_gcc_v2, participantes_gcc_v2, hitos_gcc_v2, actas_gcc_v2, compromisos_gcc_v2)
- Sistema de autenticación con roles (admin, director, convivencia)
- Hooks de contexto de tenant y usuario

### 2.3 Supuestos

- El equipo de desarrollo tiene experiencia con React y Supabase
- Existe acceso a la base de datos de Supabase para crear funciones RPC
- Los flujos de expediente están funcionando correctamente

---

## 3. Estructura de Fases y Sprints

### Vista General del Roadmap

| Fase | Sprint | Duración | Entregables Principales |
|------|--------|----------|------------------------|
| Fase 1: Fundamentos | Sprint 1 | 1 semana | Funciones RPC core |
| Fase 1: Fundamentos | Sprint 2 | 1 semana | Hooks reutilizables |
| Fase 2: Consolidación | Sprint 3 | 1 semana | Flujo de cierre unificado |
| Fase 2: Consolidación | Sprint 4 | 1 semana | Generación automática de documentos |
| Fase 3: Automatización | Sprint 5 | 1 semana | Notificaciones y recordatorios |
| Fase 4: Optimización | Sprint 6 | 1 semana | Métricas y refinamiento |

---

## 4. Detalle por Fase

### FASE 1: FUNDAMENTOS

#### Sprint 1: Funciones RPC Core

**Objetivo:** Implementar las funciones RPC que automatizan operaciones complejas en la base de datos.

**Duración:** 1 semana (5 días hábiles)

**Historia de Usuario 1.1: Crear Proceso GCC Automatizado**

Como usuario con rol de encargado de convivencia, quiero poder crear un proceso GCC con una sola acción, para evitar tener que realizar múltiples pasos manuales.

**Criterios de Aceptación:**

- [ ] La función gcc_crear_proceso() crea el registro en mediaciones_gcc_v2
- [ ] La función crea automáticamente el hito inicial de tipo INICIO
- [ ] La función actualiza el expediente asociado a estado CERRADO_GCC
- [ ] La función calcula automáticamente la fecha límite (5 días hábiles)
- [ ] La función retorna el ID de la mediación creada o mensaje de error
- [ ] La transacción es atómica (si falla algo, no se crea nada)

**Tareas Técnicas:**

1.1.1 Crear función gcc_calcular_fecha_limite() en Supabase
- Input: fecha_inicio, dias_habiles
- Output: fecha límite calculada
- Considerar tabla de feriados de Chile

1.1.2 Crear función gcc_crear_proceso()
- Input: expediente_id, tipo_mecanismo, facilitador_id, usuario_id
- Output: mediacion_id o error
- Transacción atómica

1.1.3 Crear función gcc_validar_expediente()
- Verificar que expediente existe
- Verificar que está en etapa válida para GCC
- Verificar que no tiene mediación activa

1.1.4 Tests unitarios de funciones RPC

**Historia de Usuario 1.2: Registrar Resultado de GCC**

Como facilitador, quiero poder registrar el resultado de una mediación y automáticamente actualizar todos los registros relacionados, para simplificar el proceso de cierre.

**Criterios de Aceptación:**

- [ ] La función gcc_registrar_resultado() actualiza el estado de la mediación
- [ ] La función crea el hito de cierre correspondiente
- [ ] La función genera automáticamente el tipo de acta según el resultado
- [ ] La función actualiza el expediente origen según corresponda
- [ ] La función es transaccional

**Tareas Técnicas:**

1.2.1 Crear función gcc_registrar_resultado()
- Input: mediacion_id, resultado, detalle_resultado, usuario_id
- Lógica según tipo de resultado (acuerdo_total, acuerdo_parcial, sin_acuerdo)
- Crear hito y acta automáticamente

1.2.2 Definir plantillas de contenido JSON para actas
- Acta de acuerdo total
- Acta de acuerdo parcial
- Constancia sin acuerdo

1.2.3 Tests de integración

**Historia de Usuario 1.3: Gestión de Participantes**

Como facilitador, quiero poder agregar y gestionar participantes con sus consentimientos, para mantener el registro compliant con la normativa.

**Criterios de Aceptación:**

- [ ] Función para agregar participante con validación de datos
- [ ] Función para actualizar consentimiento
- [ ] Validación de que no hay participantes duplicados

**Tareas Técnicas:**

1.3.1 Crear función gcc_agregar_participante()
1.3.2 Crear función gcc_actualizar_consentimiento()
1.3.3 Crear función gcc_obtener_participantes()

**Historia de Usuario 1.4: Gestión de Compromisos**

Como facilitador, quiero poder registrar y hacer seguimiento a los compromisos adquiridos en la mediación, para garantizar el cumplimiento de los acuerdos.

**Criterios de Aceptación:**

- [ ] Función para agregar compromisos desde el resultado
- [ ] Función para marcar cumplimiento/no cumplimiento
- [ ] Función para agregar evidencia de cumplimiento

**Tareas Técnicas:**

1.4.1 Crear función gcc_agregar_compromisos_desde_resultado()
1.4.2 Crear función gcc_verificar_cumplimiento()
1.4.3 Crear función gcc_agregar_evidencia_cumplimiento()

**Definition of Done - Sprint 1:**

- Todas las funciones RPC creadas y documentadas
- Tests unitarios pasando (>80% coverage)
- Funciones probadas en Supabase SQL Editor
- Documentación de API de funciones actualizada

---

#### Sprint 2: Hooks Reutilizables

**Objetivo:** Crear abstracciones de código que simplifiquen el desarrollo del frontend.

**Duración:** 1 semana (5 días hábiles)

**Historia de Usuario 2.1: Hook useProcesoGCC**

Como desarrollador, quiero un hook que encapsule toda la lógica del proceso GCC, para poder reutilizarlo en diferentes componentes sin duplicar código.

**Criterios de Aceptación:**

- [ ] Hook useProcesoGCC proporciona estado y acciones para gestión de mediación
- [ ] Hook maneja carga de datos automáticamente
- [ ] Hook proporciona métodos para todas las operaciones CRUD
- [ ] Hook maneja errores de forma centralizada

**Tareas Técnicas:**

2.1.1 Crear hook useProcesoGCC
- Estados: loading, error, data
- Métodos: crearProceso, actualizarEstado, cerrarProceso, obtenerDatos

2.1.2 Crear archivo de tipos TypeScript para el hook
- Tipos para mediaciones, participantes, hitos, compromisos
- Tipos para resultados y estados

2.1.3 Documentar uso del hook

**Historia de Usuario 2.2: Hook useParticipantes**

Como desarrollador, quiero un hook específico para gestionar participantes, para reutilizarlo en formularios de registro y edición.

**Tareas Técnicas:**

2.2.1 Crear hook useParticipantes
- Métodos: agregar, actualizar, eliminar, obtenerConsentimiento

2.2.2 Integrar con funciones RPC de participantes

**Historia de Usuario 2.3: Hook useDocumentosGCC**

Como desarrollador, quiero un hook para generación de documentos, para centralizar la lógica de renderizado de plantillas.

**Tareas Técnicas:**

2.3.1 Crear hook useDocumentosGCC
- Métodos: generarActa, generarConstancia, obtenerPlantilla

2.3.2 Definir funciones de renderizado de plantillas

**Historia de Usuario 2.4: Hook useGccMetrics**

Como usuario, quiero ver métricas del módulo GCC en el dashboard, para monitorear el estado de los procesos.

**Tareas Técnicas:**

2.4.1 Revisar hook existente useGccMetrics
2.4.2 Mejorar según nuevas necesidades de métricas
2.4.3 Agregar métricas de seguimiento

**Definition of Done - Sprint 2:**

- Todos los hooks creados y documentados
- Tipos TypeScript definidos
- Ejemplos de uso documentados
- Hooks integrados en el código existente (refactoring)

---

### FASE 2: CONSOLIDACIÓN

#### Sprint 3: Flujo de Cierre Unificado

**Objetivo:** Consolidar el proceso de cierre de mediación en un flujo guiado unificado.

**Duración:** 1 semana (5 días hábiles)

**Historia de Usuario 3.1: Flujo Guiado de Cierre**

Como facilitador, quiero un flujo guiado que me lleve paso a paso por el proceso de cierre, para no perder ninguna acción necesaria.

**Criterios de Aceptación:**

- [ ] Componente de flujo paso a paso con 4 etapas visibles
- [ ] Indicador de progreso claro
- [ ] Validación antes de avanzar a siguiente paso
- [ ] Posibilidad de volver a pasos anteriores
- [ ] Resumen antes de confirmación final

**Pasos del Flujo:**

1. Registrar Resultado (acuerdo total/parcial/sin acuerdo)
2. Registrar Compromisos (si aplica)
3. Revisar Acta/Constancia (generación automática)
4. Confirmar Cierre

**Tareas Técnicas:**

3.1.1 Crear componente GCCFlujoCierre
- Estados: resultado, compromisos, documento, confirmacion
- Navegación entre pasos
- Validaciones por paso

3.1.2 Crear componentes para cada paso
- ResultadoStep
- CompromisosStep
- DocumentoStep
- ConfirmacionStep

3.1.3 Integrar con funciones RPC del Sprint 1

3.1.4 Tests de компонента (Storybook)

**Historia de Usuario 3.2: Panel de Seguimiento de Compromisos**

Como encargado de convivencia, quiero poder hacer seguimiento a los compromisos de todas las mediaciones, para garantizar el cumplimiento de los acuerdos.

**Criterios de Aceptación:**

- [ ] Vista consolidada de todos los compromisos pendientes
- [ ] Filtros por estado (pendiente, cumplido, no cumplido)
- [ ] Filtros por fecha (vencidos, próximos a vencer)
- [ ] Acción rápida para marcar cumplimiento

**Tareas Técnicas:**

3.2.1 Crear componente PanelSeguimientoCompromisos
3.2.2 Crear función de consulta de compromisos con filtros
3.2.3 Crear acción rápida de verificación

**Historia de Usuario 3.3: Mejora de Experiencia en CentroMediacionGCC**

Como usuario, quiero una experiencia mejorada en el centro de mediación, con acceso rápido a las funciones más comunes.

**Criterios de Aceptación:**

- [ ] Acceso rápido a mediaciones activas
- [ ] Acciones comunes visibles sin necesidad de navegar
- [ ] Feedback visual claro de estados

**Tareas Técnicas:**

3.3.1 Refactorizar componente CentroMediacionGCC
3.3.2 Integrar nuevos hooks
3.3.3 Mejorar UI/UX según feedback de usuarios

**Definition of Done - Sprint 3:**

- Flujo de cierre funcionando end-to-end
- Panel de seguimiento de compromisos operativo
- Centro de mediación refactorizado
- Tests de integración pasando

---

#### Sprint 4: Generación Automática de Documentos

**Objetivo:** Implementar generación automática de documentos para cumplir con requisitos normativos.

**Duración:** 1 semana (5 días hábiles)

**Historia de Usuario 4.1: Plantillas de Documentos**

Como sistema, quiero generar documentos automáticamente basados en plantillas predefinidas, para garantizar que incluyan todos los elementos requeridos por la normativa.

**Tareas Técnicas:**

4.1.1 Definir plantilla Acta de Acuerdo Total
- Encabezado institucional
- Datos del expediente
- Datos del proceso GCC
- Partes participantes
- Términos del acuerdo
- Compromisos
- Firmas

4.1.2 Definir plantilla Acta de Acuerdo Parcial
4.1.3 Definir plantilla Constancia Sin Acuerdo
4.1.4 Definir plantilla de Compromisos

4.1.5 Crear sistema de renderizado de plantillas
- Reemplazo de variables
- Formateo de fechas
- Inclusión de datos dinámicos

**Historia de Usuario 4.2: Generación PDF**

Como usuario, quiero poder exportar los documentos generados a formato PDF, para poder firmarlos y archivarlos.

**Tareas Técnicas:**

4.2.1 Implementar generación de PDF en frontend
- Usar biblioteca jsPDF o similar
- Renderizar plantilla a PDF

4.2.2 Integrar con Supabase Storage
- Guardar PDFs generados
- Obtener URL de descarga

4.2.3 Agregar botón de descarga en UI

**Historia de Usuario 4.3: Registro de Documentos**

Como sistema, quiero mantener un registro de todos los documentos generados, para garantizar trazabilidad.

**Tareas Técnicas:**

4.3.1 Mejorar tabla actas_gcc_v2 para almacenar contenido completo
4.3.2 Crear función de búsqueda de documentos
4.3.3 Agregar historial de documentos por mediación

**Definition of Done - Sprint 4:**

- Todas las plantillas definidas y funcionando
- Generación de PDFs operativa
- Documentos almacenados en Supabase
- Trazabilidad completa de documentos

---

### FASE 3: AUTOMATIZACIÓN

#### Sprint 5: Notificaciones y Recordatorios

**Objetivo:** Implementar sistema de notificaciones automáticas para cumplimiento normativo.

**Duración:** 1 semana (5 días hábiles)

**Historia de Usuario 5.1: Notificaciones de Plazo**

Como sistema, quiero notificar cuando un proceso GCC se acerca a su fecha límite, para que los usuarios puedan actuar a tiempo.

**Criterios de Aceptación:**

- [ ] Verificación diaria de plazos próximos a vencer
- [ ] Notificación visual en dashboard
- [ ] Notificación por email (si está configurado)

**Tareas Técnicas:**

5.1.1 Crear función de verificación de plazos
- Consultar mediaciones con fecha_limite - 2 días
- Consultar mediaciones con fecha_limite vencida

5.1.2 Crear tabla de notificaciones
- Tipo: GCC_VENCE_PRONTO, GCC_VENCIDO
- Estado: NO_LEIDA, LEIDA, ARCHIVADA

5.1.3 Crear función de envío de notificaciones in-app

5.1.4 (Opcional) Integrar con sistema de emails

**Historia de Usuario 5.2: Recordatorios de Seguimiento**

Como sistema, quiero enviar recordatorios cuando se acerca la fecha de verificación de compromisos, para asegurar que se haga el seguimiento.

**Tareas Técnicas:**

5.2.1 Crear función de verificación de compromisos
5.2.2 Crear notificaciones de compromisos próximos
5.2.3 Crear alertas de compromisos vencidos

**Historia de Usuario 5.3: Panel de Notificaciones**

Como usuario, quiero ver todas las notificaciones relacionadas con GCC en un solo lugar, para mantenerme informado.

**Tareas Técnicas:**

5.3.1 Crear componente de panel de notificaciones
5.3.2 Crear función de marcado como leído
5.3.3 Agregar al dashboard

**Definition of Done - Sprint 5:**

- Notificaciones de plazo funcionando
- Notificaciones de compromisos funcionando
- Panel de notificaciones operativo
- Email (si está configurado)

---

### FASE 4: OPTIMIZACIÓN

#### Sprint 6: Métricas y Refinamiento

**Objetivo:** Implementar métricas avanzadas y realizar refinamientos finales.

**Duración:** 1 semana (5 días hábiles)

**Historia de Usuario 6.1: Dashboard de Métricas GCC**

Como administrador, quiero ver métricas detalladas del módulo GCC, para evaluar su efectividad y planificar mejoras.

**Métricas a Implementar:**

- Total de mediaciones por estado
- Tasa de éxito (acuerdos vs sin acuerdo)
- Tiempo promedio de resolución
- Compromisos cumplidos vs no cumplidos
- Comparativa mensual/trimestral

**Tareas Técnicas:**

6.1.1 Crear función de cálculo de métricas
6.1.2 Crear componente de visualización
6.1.3 Agregar al dashboard existente

**Historia de Usuario 6.2: Optimización de Rendimiento**

Como usuario, quiero que el módulo GCC responda rápidamente, incluso con muchos registros.

**Tareas Técnicas:**

6.2.1 Implementar paginación
6.2.2 Agregar cacheo de datos frecuentes
6.2.3 Optimizar consultas a base de datos
6.2.4 Agregar loading states apropiados

**Historia de Usuario 6.3: Testing y Bug Fixes**

Como usuario, quiero que el módulo GCC funcione sin errores, para poder confiar en él para procesos importantes.

**Tareas Técnicas:**

6.3.1 Tests end-to-end del flujo completo
6.3.2 Bug fixing basado en testing
6.3.3 Revisión de seguridad

**Historia de Usuario 6.4: Documentación Final**

Como equipo, queremos documentación completa del módulo optimizado, para facilitar mantenimiento futuro.

**Tareas Técnicas:**

6.4.1 Documentar APIs de funciones RPC
6.4.2 Documentar hooks creados
6.4.3 Documentar componentes
6.4.4 Crear guía de usuario

**Definition of Done - Sprint 6:**

- Dashboard de métricas operativo
- Rendimiento optimizado
- Todos los tests pasando
- Documentación completa

---

## 5. Matriz de Responsabilidades

| Rol | Responsabilidades |
|-----|------------------|
| Tech Lead | Arquitectura, code review, decisiones técnicas |
| Frontend Developer | Componentes React, hooks, UI |
| Backend Developer | Funciones RPC, base de datos |
| QA Engineer | Testing, validación de criterios |
| Product Owner | Priorización, validación de negocio |

---

## 6. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|-------------|
| Retrasos en funciones RPC | Media | Alto | Comenzar con RPC desde Sprint 1 |
| Dificultades con generación PDF | Baja | Medio | Usar biblioteca probada (jsPDF) |
| Cambios en requisitos normativos | Baja | Alto | Revisión temprana con legal |
| Problemas de rendimiento | Media | Medio | Testing de carga en Sprint 6 |

---

## 7. Métricas de Éxito

### Métricas Técnicas

- Coverage de tests: > 80%
- Tiempo de carga inicial: < 2 segundos
- Tiempo de respuesta de RPC: < 500ms

### Métricas Funcionales

- Reducción de pasos para cerrar mediación: 80%
- Tiempo promedio de cierre de mediación: < 5 minutos
- Tasa de documentos generados automáticamente: 100%

### Métricas de Usuario

- NPS del módulo GCC: > 7/10
- Tasa de uso del flujo guiado: > 90%

---

## 8. Timeline Visual

```
SEMANA:    1    2    3    4    5    6
           │    │    │    │    │    │
FASE 1     ████████
  Sprint 1 │████│    │    │    │    │
  Sprint 2 │    ████│    │    │    │
           │    │    │    │    │    │
FASE 2          ████████
  Sprint 3 │    │████│    │    │    │
  Sprint 4 │    │    ████│    │    │
           │    │    │    │    │    │
FASE 3           ████████
  Sprint 5 │    │    │████│    │    │
           │    │    │    │    │    │
FASE 4                ████████
  Sprint 6 │    │    │    ████│    │
           │    │    │    │    │    │
LANZAMIENTO           ▼
                      │
                 Entrega final
```

---

## 9. Definición de Done - Proyecto Completo

- [ ] Todas las funciones RPC desplegadas y funcionando
- [ ] Todos los hooks implementados y documentados
- [ ] Flujo de cierre unificado operativo
- [ ] Generación automática de documentos funcionando
- [ ] Sistema de notificaciones implementado
- [ ] Dashboard de métricas operativo
- [ ] Tests pasando (>80% coverage)
- [ ] Documentación completa
- [ ] Validación de usuario final exitosa

---

*Documento generado el 18 de febrero de 2026*
