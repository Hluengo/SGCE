# 🗺️ MATRIZ RÁPIDA DE REFERENCIA - SAMPLING RATES SGCE

**Una página para tener todo visible**

---

## 📊 TABLA CONSOLIDADA: COMPONENTES × TASAS DE MUESTREO

| # | COMPONENTE | UBICACIÓN | TASA ACTUAL | CATEGORÍA | ESTADO | ACCIÓN |
|---|---|---|---|---|---|---|
| **1** | useGccMetrics | `src/shared/hooks/` | 30s (polling) | 🔴 CRÍTICO | ⚠️ DEBE CAMBIAR | P1: 60s |
| **2** | gcc-notifications | `supabase/functions/` | Secuencial | 🔴 CRÍTICO | ⚠️ DEBE CAMBIAR | P2: Paralelo |
| **3** | TenantContext resolver | `src/shared/context/` | 3× ejecución | ⚠️ ALTO | ⚠️ MEJORAR | P3: Consolidar |
| **4** | BitacoraPsicosocial | `src/features/bitacora/` | Mock inicial | ⚠️ ALTO | ⚠️ MEJORAR | P4: Skeleton |
| **5** | ExpedientesList search | `src/features/expedientes/` | Sin debounce | ⚠️ ALTO | ⚠️ MEJORAR | P5: 300ms |
| **6** | useExpedientes | `src/shared/hooks/` | 60s (timestamp) | ✅ BUENO | ✅ OK | - |
| **7** | useDebounce | `src/shared/hooks/` | 500ms | ✅ BUENO | ✅ OK | - |
| **8** | useTenantBranding | `src/shared/hooks/` | On-load | ✅ BUENO | ✅ OK | - |
| **9** | Dashboard | `src/features/dashboard/` | Event-based | ✅ BUENO | ✅ OK | - |
| **10** | NotificationsPanel | `src/features/dashboard/` | Reactivo | ✅ BUENO | ✅ OK | - |
| **11** | ArchivoDocumental | `src/features/archivo/` | Skeleton | ✅ BUENO | ✅ OK | - |
| **12** | Realtime Indicators | `src/features/mediacion/` | <100ms | ✅ EXCELENTE | ✅ OK | - |
| **13** | Auth subscription | `src/shared/hooks/` | Event | ✅ EXCELENTE | ✅ OK | - |
| **14** | ConvivenciaContext | `src/shared/context/` | Event-based | ✅ EXCELENTE | ✅ OK | - |

---

## 🎯 IMPACTO RÁPIDO

### Antes vs Después (Cada Acción)

```
P1: POLLING 30s→60s
   ├─ Queries/hora: 120 → 60 (-50%)
   ├─ Data MB/hora: 2 → 1 (-50%)
   └─ Implementación: 5 minutos ⚡

P2: PARALELIZAR GCC-NOTIFICATIONS
   ├─ Tiempo ejecución: 50s → 6s (-88%)
   ├─ Timeout risk: 🔴 → ✅
   └─ Implementación: 90 minutos

P3: CONSOLIDAR TENANT RESOLVER
   ├─ Redundancias: 3 → 1 (-66%)
   ├─ Race conditions: Mitigadas
   └─ Implementación: 60 minutos

P4: SKELETON LOADERS BITÁCORA
   ├─ Flash visual: ❌ → ✅ Eliminado
   ├─ UX Score: +2 puntos
   └─ Implementación: 45 minutos

P5: DEBOUNCE SEARCH
   ├─ Re-renders/segundo: -60%
   ├─ UX responsiveness: ✅ Mejora
   └─ Implementación: 15 minutos
```

---

## ⏱️ TASAS DE MUESTREO RESUMIDAS

### Por Tipo

```
POLLING (automático cada X tiempo):
├─ useGccMetrics ..................... 30s ⚠️ (CAMBIAR A 60s)
└─ useExpedientes (timestamp) ........ 60s ✅

DEBOUNCE (espera silencio de X ms):
├─ useDebounce default ............... 500ms ✅
└─ ExpedientesList search ............ SIN DEBOUNCE ❌

EVENT-DRIVEN (inmediato):
├─ Auth subscription ................. Real-time ✅
├─ Realtime listeners ................ <100ms ✅
├─ ConvivenciaContext ................ Evento ✅
└─ NotificationsPanel ................ Reactivo ✅

ON-LOAD (carga única):
├─ TenantBranding .................... On-tenant-change ✅
├─ Expedientes initial ............... Single query ✅
└─ Bitácora initial .................. Mock ❌ (CAMBIAR)
```

---

## 🚨 SEVERIDAD Y URGENCIA

```
🔴 CRÍTICO (Fix en 1 semana):
├─ useGccMetrics (30s polling)
└─ gcc-notifications (timeout risk)

⚠️ ALTO (Fix en 2 semanas):
├─ TenantContext (redundancia)
├─ BitacoraPsicosocial (mock)
└─ ExpedientesList search (sin debounce)

🟢 BAJO (Monitoreo):
└─ Todo lo demás está ✅
```

---

## 📈 BENEFICIAR ESPERADO/REAL

| Métrica | Beneficio | Realista |
|---------|-----------|----------|
| **Reducción queries Supabase** | -50% | ✅ Sí (con P1+P2) |
| **Consumo datos móvil** | -50% | ✅ Sí (con P1) |
| **Velocidad gcc-notifications** | -88% | ✅ Sí (con P2) |
| **Flash visual eliminado** | 100% | ✅ Sí (con P4) |
| **UX responsiveness** | +15% | ✅ Sí (con P5) |
| **Overall score** | 7.2→8.8/10 | ✅ Sí (con todos) |

---

## 🛠️ TIEMPO DE IMPLEMENTACIÓN

```
┌─────────────────────────────────────┐
│ ESFUERZO TOTAL: ~5-6 horas          │
├─────────────────────────────────────┤
│                                     │
│ P1 (Polling):           5 min  ⚡   │
│ P2 (Parallelization):  90 min  🔧  │
│ P3 (Tenant resolve):   60 min  🔧  │
│ P4 (Skeletons):        45 min  🔧  │
│ P5 (Debounce):         15 min  ⚡   │
│ Testing & QA:          60 min  ✅  │
│                                     │
│ TOTAL:        ~275 minutos (~4.5h  │
└─────────────────────────────────────┘
```

---

## ✅ CHECKLIST RÁPIDO

### Está Correcto ✅
- [ ] Memoización agresiva
- [ ] Event-driven architecture
- [ ] Cleanup de listeners
- [ ] Freshness tracking
- [ ] Realtime indicators
- [ ] Performance < 3s TTI
- [ ] Latencias < 200ms

### Necesita Trabajo ⚠️
- [ ] Polling de 30s (cambiar a 60s)
- [ ] gcc-notifications secuencial
- [ ] TenantContext triple resolver
- [ ] BitacoraPsicosocial mock data
- [ ] ExpedientesList sin debounce

---

## 📞 CONTACTOS Y ESCALACIÓN

**Si encuentra un problema:**
1. Verificar en esta matriz
2. Consultar documento completo
3. De ser crítico: Contactar Tech Lead

**Documentos relacionados:**
- 📄 `ANALISIS_SAMPLING_RATES_COMPLETO.md` (Full analysis)
- 🔧 `GUIA_IMPLEMENTACION_SAMPLING_FIXES.md` (How-to)
- 👔 `RESUMEN_EJECUTIVO_SAMPLING.md` (Executive summary)

---

## 🎯 KPIs A MONITOREAR

```
MÉTRICAS EN TIEMPO REAL (Dashboard):

Queries Supabase
├─ Target < 60/hora ✅
└─ Red line: > 100/hora 🔴

Mobile Data
├─ Target < 1MB/hora ✅
└─ Red line: > 2MB/hora 🔴

gcc-notifications Time
├─ Target < 15s ✅
└─ Red line: > 40s 🔴

TTI (Time to Interactive)
├─ Target < 2s ✅
└─ Red line: > 5s 🔴
```

---

## 🚀 ROADMAP VISUAL

```
SEMANA 1
┌─────────────────────────────────────┐
│ Lunes       │ P1 (5 min) ⚡         │
│ Martes      │ P2 (90 min) 🔧       │
│ Miércoles   │ Testing (30 min) ✅  │
│ Viernes     │ Deploy staging        │
└─────────────────────────────────────┘

SEMANA 2
┌─────────────────────────────────────┐
│ Lunes-Martes │ P3 + P4 + P5 (2h) 🔧 │
│ Miércoles    │ QA exhaustivo (1h) ✅ │
│ Viernes      │ Deploy producción     │
└─────────────────────────────────────┘

SEMANA 3
┌─────────────────────────────────────┐
│ Monitoreo en vivo + estabilización  │
│ → LISTO PARA ESCALAR ✅            │
└─────────────────────────────────────┘
```

---

## 💡 TIPS PRÁCTICOS

### Para Devs Implementando P1
```bash
# Buscar dónde se usa
grep -r "useGccMetrics" src/ --include="*.tsx"

# Cambiar línea
OLD: const { pollingMs = 30000
NEW: const { pollingMs = 60000

# Test
npm run test useGccMetrics
```

### Para QA Validando
```bash
# Abrir DevTools → Network
# Filtrar "mediaciones_gcc_v2"
# Debería ver queries cada 60s (no 30s)

# Móvil: Check data consumption
# Debería ser ~50% menos
```

### Para Devops Monitoreando
```bash
# Supabase → Analytics
# Buscar "gcc_" queries
# Gráfico debería caer 50% post-deploy
```

---

## 🎓 APRENDIZAJES CLAVE

1. **Sampling rates importa:**
   - Pequeños cambios = gran impacto
   - 30s vs 60s = 2x queries

2. **Event > Polling:**
   - Siempre preferir event-driven
   - Polling es fallback

3. **Freshness vs Eficiencia:**
   - Balance es clave
   - 60s polling = datos aún "fresh"

4. **Mobile primero:**
   - Pensar en batería/datos
   - No todo debe ser real-time

5. **Monitoring es crítico:**
   - Medir antes y después
   - Validar beneficios

---

## 📋 PREGUNTAS PARA DECIDIR

**¿Estamos listos para implementar?**

- [ ] ¿Se entienden los 2 problemas críticos?
- [ ] ¿Se tiene 5-6 horas disponibles?
- [ ] ¿Se puede hacer testing post-deploy?
- [ ] ¿Se tiene monitor de Supabase activo?
- [ ] ¿Se puede rollback si es necesario?

**Si todos son SÍ → ADELANTE ✅**

---

**VERSIÓN:** 1.0  
**ÚLTIMA ACTUALIZACIÓN:** 20 de feb 2026  
**PRÓXIMA REVISIÓN:** 06 de mar 2026  
**ESTADO:** 🟢 APROBADO PARA IMPLEMENTAR
