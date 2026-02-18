# Plan Integral de Mejora: Modulo Mediacion GCC (v1.1 Aprobable)

**Version**: 1.1  
**Fecha**: 18 de febrero de 2026  
**Proyecto**: Gestion de Convivencia Escolar  
**Normativa base (fuentes primarias)**: Circular Ndeg 781, Circular Ndeg 782, Ley 20.529, Ley 20.370, Ley 21.430

---

## 1. Decision Arquitectonica

Este plan corrige el diseno previo y establece un enfoque implementable, auditable y compatible con la arquitectura actual (React + Supabase + RLS multi-tenant).

### 1.1 Principios no negociables

1. `pausa_legal` no es `cerrado`.
2. Todas las tablas operativas GCC son tenant-aware (`establecimiento_id`).
3. Toda decision de estado deja traza auditable.
4. Migracion segura en 3 etapas: `expand -> backfill/dual-write -> contract`.
5. Fuentes regulatorias validas: solo oficiales (DO, BCN, Supereduc).

---

## 2. Correcciones Criticas del Modelo

### 2.1 Estados del expediente (corregido)

Se elimina la ambiguedad de `CERRADO_GCC` como estado de derivacion.

**Estado propuesto en expediente**:
- `apertura`
- `investigacion`
- `resolucion`
- `pausa_legal`
- `cerrado`

**Regla**:
- Al activar GCC: `estado_legal = pausa_legal`
- Al cerrar GCC con acuerdo o termino formal: se evalua cierre de expediente (`cerrado`) o retorno a flujo disciplinario.

### 2.2 Estados de gestion GCC (separados)

En `mediaciones_gcc`:
- `abierta`
- `en_proceso`
- `acuerdo_parcial`
- `acuerdo_total`
- `sin_acuerdo`
- `cerrada`

Se evita mezclar estado del expediente con estado del mecanismo GCC.

---

## 3. Arquitectura de Datos (v1.1)

## 3.1 Tablas

### `mediaciones_gcc`
- `id uuid pk`
- `establecimiento_id uuid not null`
- `expediente_id uuid not null`
- `tipo_mecanismo text check (MEDIACION|CONCILIACION|ARBITRAJE_PEDAGOGICO)`
- `estado_proceso text not null`
- `efecto_suspensivo_activo boolean not null default true`
- `fecha_inicio timestamptz not null`
- `fecha_limite_habil date not null`
- `fecha_cierre timestamptz null`
- `resultado_final text null`
- `motivo_derivacion text null`
- `facilitador_id uuid null`
- `created_by uuid not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `participantes_gcc`
- `id uuid pk`
- `establecimiento_id uuid not null`
- `mediacion_id uuid not null`
- `tipo_participante text`
- `sujeto_id uuid null`
- `nombre_completo text not null`
- `rol_en_conflicto text not null`
- `consentimiento_registrado boolean not null default false`
- `created_at timestamptz not null default now()`

### `hitos_gcc`
- `id uuid pk`
- `establecimiento_id uuid not null`
- `mediacion_id uuid not null`
- `tipo_hito text not null`
- `descripcion text null`
- `fecha_hito timestamptz not null default now()`
- `registrado_por uuid not null`

### `actas_gcc`
- `id uuid pk`
- `establecimiento_id uuid not null`
- `mediacion_id uuid not null`
- `tipo_acta text not null`
- `contenido_json jsonb not null`
- `url_documento text null`
- `firmado_por_partes boolean not null default false`
- `fecha_emision date not null`

### `compromisos_gcc`
- `id uuid pk`
- `establecimiento_id uuid not null`
- `mediacion_id uuid not null`
- `descripcion text not null`
- `responsable_id uuid null`
- `fecha_compromiso date not null`
- `cumplimiento_verificado boolean not null default false`
- `fecha_verificacion date null`

## 3.2 Indices minimos

- `mediaciones_gcc (establecimiento_id, expediente_id, created_at desc)`
- `mediaciones_gcc (establecimiento_id, estado_proceso, fecha_limite_habil)`
- `hitos_gcc (establecimiento_id, mediacion_id, fecha_hito desc)`
- `actas_gcc (establecimiento_id, mediacion_id, fecha_emision desc)`
- `compromisos_gcc (establecimiento_id, mediacion_id, cumplimiento_verificado)`

## 3.3 RLS

Politicas por tabla:
- `using`: `establecimiento_id = current_establecimiento_id() OR is_platform_superadmin()`
- `with check`: misma condicion
- Escritura restringida por rol funcional (`admin`, `convivencia`, `director`, segun matriz).

---

## 4. Reglas de Negocio

1. Derivar a GCC crea `mediaciones_gcc` y setea expediente en `pausa_legal`.
2. Mientras exista mediacion activa (`abierta|en_proceso`), no se avanza etapa disciplinaria.
3. `sin_acuerdo` reactiva flujo disciplinario en etapa previa controlada.
4. `acuerdo_total` permite cierre formativo (segun politica interna y trazabilidad).
5. Todas las transiciones escriben en `logs_auditoria` y `hitos_gcc`.

---

## 5. Plazos (Circular 782)

- Etapa GCC: `5 dias habiles` (unico para cualquier mecanismo).
- Infracciones relevantes: horizonte total `2 meses` (incluye GCC + reconsideracion).
- Procedimiento abreviado (Aula Segura): `10 dias habiles`.
- Faltas leves: `24 horas`.

### 5.1 Alertas operativas (corregidas)

Para GCC (5 dias):
- T-2 habil: alerta preventiva
- T-1 habil: alerta alta
- Vencido: alerta critica + bloqueo de cierre inconsistente

### 5.2 Politica visual de alertas (frontend)

- `verde`: plazo en rango (mas de 2 dias habiles restantes)
- `ambar`: T-2 habil
- `rojo`: T-1 habil
- `rojo intenso`: vencido (estado critico)
- Mensajes:
  - `Preventiva`: "Caso GCC con plazo proximo"
  - `Alta`: "Caso GCC vence manana"
  - `Critica`: "Caso GCC vencido - requiere accion inmediata"

---

## 6. Migracion Tecnica Segura

## 6.1 Etapa A - Expand

- Crear tablas nuevas GCC v1.1.
- Crear indices, constraints y RLS.
- Agregar columna de estado `pausa_legal` en dominio de expediente (si aplica por enum).
- No romper lecturas existentes.

**Entregable**: `supabase/migrations/029_gcc_expand.sql`

## 6.2 Etapa B - Backfill + Dual-write

- Migrar datos desde `mediaciones_gcc` actual.
- Adaptador temporal de escritura dual (legacy + nueva) para evitar downtime.
- Script de verificacion de conteos y consistencia por tenant.

**Entregables**:
- `supabase/migrations/030_gcc_backfill_dualwrite.sql`
- `supabase/sql/030_gcc_backfill_validation.sql`

## 6.3 Etapa C - Contract

- Cortar lecturas legacy.
- Eliminar dependencias viejas.
- Mantener vista de compatibilidad si frontend antiguo depende de campos legacy.

**Entregable**: `supabase/migrations/031_gcc_contract.sql`

---

## 7. Plan de Implementacion por Sprints

## Sprint 1 - Base regulatoria y datos

- Infraestructura SQL + RLS + indices.
- Estados expediente/GCC alineados.
- API/queries base.

**DoD**:
- Migraciones aplican clean en entorno nuevo y existente.
- Smoke multitenant PASS.
- Sin regresion en expediente detalle.

## Sprint 2 - Flujo funcional GCC

- Derivar a GCC desde expediente.
- Banner/estado `Pausa Legal` en expediente y dashboard.
- Timeline/hitos GCC.
- Reanudar flujo disciplinario segun resultado GCC.

**DoD**:
- Se puede derivar, pausar, cerrar GCC y retomar flujo sin inconsistencias.
- Un solo registro historico por accion (sin duplicados).

## Sprint 3 - Documentos, compromisos y UX

- Actas GCC y compromisos.
- Alertas de plazo.
- Ajustes responsive y accesibilidad.
- Templates de actas:
  - `ACTA_MEDIACION`
  - `ACTA_CONCILIACION`
  - `ACTA_ARBITRAJE`
  - `CONSTANCIA_SIN_ACUERDO`

**DoD**:
- Actas exportables.
- Alertas funcionales por dias habiles.
- Validacion WCAG AA basica.
- Cada acta guarda: `contenido_json`, `tipo_acta`, `version_template`, `url_documento`, `firmado_por_partes`.

## Sprint 4 - Metricas y cierre

- Dashboard GCC: activos, tiempo medio, tasa acuerdos, vencimientos.
- Endurecimiento de observabilidad y auditoria.
- KPI obligatorios:
  - `casos_activos_gcc`
  - `tiempo_promedio_resolucion_habil`
  - `% acuerdo_total`
  - `% acuerdo_parcial`
  - `% sin_acuerdo`
  - `casos_vencidos_abiertos`

**DoD**:
- KPI coherentes con base real.
- Reporte final de validacion funcional + tecnica.
- Filtros por `tenant`, rango de fechas y tipo de mecanismo.

---

## 8. Matriz de Permisos

- `admin`: full GCC tenant
- `convivencia`: crear/editar/cerrar GCC
- `director`: visibilidad total + cierre condicionado
- `docente`: lectura de casos asignados (sin cierre)
- `superadmin plataforma`: acceso transversal controlado

---

## 9. Testing y Calidad

## 9.1 Pruebas SQL

- Integridad referencial.
- RLS por tenant.
- No mezcla de registros entre tenants.
- Backfill consistente.

## 9.2 Pruebas UI/Flujo

- Derivar a GCC desde expediente.
- Visualizar `Pausa Legal` en expediente y dashboard.
- Registrar hitos y acuerdos.
- Reanudar proceso disciplinario si `sin_acuerdo`.

## 9.3 Pruebas de regresion

- Carga de historial sin duplicados.
- Evidencias sin errores de firma innecesarios.
- Navegacion expediente por folio/uuid estable.

---

## 10. Riesgos y Mitigacion

1. **Riesgo**: inconsistencia estado expediente vs GCC.  
   **Mitigacion**: maquina de estados + constraints + tests de transicion.

2. **Riesgo**: fallas RLS en storage/tablas nuevas.  
   **Mitigacion**: scripts diagnostico + pruebas por rol + prefijo tenant uniforme.

3. **Riesgo**: deuda tecnica por dual-write.  
   **Mitigacion**: fecha de retiro definida en Sprint 4.

---

## 11. Fuentes Normativas Validas (obligatorias)

1. Diario Oficial (texto publicado de circulares).
2. BCN LeyChile (norma consolidada).
3. Sitio oficial Superintendencia de Educacion.

No se usan redes sociales o fuentes terciarias como base de decision normativa.

---

## 12. Proximos Pasos Operativos

1. Aprobar este v1.1 con producto + legal.
2. Ejecutar Sprint 1 (SQL + RLS + estados).
3. Correr checklist post-migracion y smoke strict.
4. Activar Sprint 2 con QA funcional UI.

---

## 13. Vista Frontend Esperada

### 13.1 Expediente (detalle)

- Banner superior cuando `estado_legal = pausa_legal`:
  - titulo: `PAUSA LEGAL (GCC ACTIVO)`
  - texto normativo breve
  - fecha inicio GCC + fecha limite + dias habiles restantes
- Acciones visibles:
  - `Ir a Gestion GCC`
  - `Reanudar Procedimiento` (solo si corresponde por reglas de cierre GCC)

### 13.2 Centro de Mediacion GCC

- Header con selector de mecanismo (`MEDIACION`, `CONCILIACION`, `ARBITRAJE_PEDAGOGICO`).
- Columna izquierda: participantes + consentimiento.
- Columna central: cronologia/hitos + acuerdos/compromisos.
- Columna derecha: tarjeta de plazo (semaforo verde/ambar/rojo/critico) + estado proceso.
- Acciones principales:
  - `Guardar hito`
  - `Generar acta`
  - `Cerrar GCC con acuerdo`
  - `Cerrar GCC sin acuerdo`

### 13.3 Dashboard de Seguimiento

- Tarjeta de estado:
  - `En Seguimiento GCC` para casos activos
  - `En Pausa Legal` para expediente suspendido por GCC
- Widgets KPI:
  - Activos, vencidos, tiempos promedio, tasa de acuerdos
- Tabla de casos con orden por criticidad de plazo.
