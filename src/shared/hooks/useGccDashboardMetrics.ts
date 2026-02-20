/**
 * useGccDashboardMetrics
 * Hook avanzado que extiende useGccMetrics con datos de mecanismos adoptados,
 * tendencias y comparaciones con períodos anteriores
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { isUuid } from '@/shared/utils/expedienteRef';
import { type GccMetrics, type GccMetricsBaseSource } from './useGccMetrics';

export type MecanismoGCC = 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO';
type EstadoProcesoGCC = 'abierta' | 'en_proceso' | 'acuerdo_total' | 'acuerdo_parcial' | 'sin_acuerdo' | 'cerrada';

export type MecanismStats = {
  mecanismo: MecanismoGCC;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number; // Comparación con período anterior (%)
};

export type GccDashboardMetrics = GccMetrics & {
  mecanismos: MecanismStats[];
  totalMecanismosAdoptados: number;
  mecanismoMasUsado: MecanismoGCC | null;
  tasaAdopcionMecanismos: number; // Porcentaje de casos que tienen mecanismo asignado
  comparacionPeriodoAnterior: {
    activos: number;
    vencidos: number;
    mecanismos: number;
  };
  registrosMecanismos: GccMechanismCaseRecord[];
};

export type GccMechanismCaseRecord = {
  casoId: string;
  mecanismo: MecanismoGCC;
  descripcion: string;
  clasificacion: string;
  estadoImplementacion: string;
  estadoProceso: string;
  createdAt: string;
};

type GccDashboardRpcPayload = {
  success?: boolean;
  base?: Partial<GccMetrics>;
  mecanismos?: Array<{
    mecanismo: MecanismoGCC;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    trendValue: number;
  }>;
  totalMecanismosAdoptados?: number;
  mecanismoMasUsado?: MecanismoGCC | null;
  tasaAdopcionMecanismos?: number;
  comparacionPeriodoAnterior?: {
    activos: number;
    vencidos: number;
    mecanismos: number;
  };
  registrosMecanismos?: Array<{
    casoId: string;
    mecanismo: MecanismoGCC;
    estadoProceso: string;
    createdAt: string;
  }>;
};

type GccRowExtended = {
  id: string;
  estado_proceso: string;
  fecha_limite_habil: string | null;
  tipo_mecanismo: string | null;
  created_at: string;
};

const INITIAL_DASHBOARD_METRICS: Omit<GccDashboardMetrics, keyof GccMetrics> = {
  mecanismos: [],
  totalMecanismosAdoptados: 0,
  mecanismoMasUsado: null,
  tasaAdopcionMecanismos: 0,
  comparacionPeriodoAnterior: {
    activos: 0,
    vencidos: 0,
    mecanismos: 0,
  },
  registrosMecanismos: [],
};

const INITIAL_BASE_METRICS: GccMetrics = {
  activos: 0,
  t2: 0,
  t1: 0,
  vencidos: 0,
  acuerdoTotalPct: 0,
  acuerdoParcialPct: 0,
  sinAcuerdoPct: 0,
};

const MECHANISM_META: Record<MecanismoGCC, { descripcion: string; clasificacion: string }> = {
  MEDIACION: {
    descripcion: 'Diálogo facilitado por tercero imparcial para acuerdos voluntarios y reparación.',
    clasificacion: 'Mecanismo restaurativo voluntario',
  },
  CONCILIACION: {
    descripcion: 'Proceso asistido con propuestas de solución y validación de las partes.',
    clasificacion: 'Autocompositivo asistido',
  },
  ARBITRAJE_PEDAGOGICO: {
    descripcion: 'Decisión fundada por autoridad pedagógica conforme al reglamento interno.',
    clasificacion: 'Heterocompositivo pedagógico',
  },
};

const PROCESS_STATUS_LABELS: Record<EstadoProcesoGCC, string> = {
  abierta: 'Pendiente de implementación',
  en_proceso: 'En implementación',
  acuerdo_total: 'Implementado',
  acuerdo_parcial: 'Implementación parcial',
  sin_acuerdo: 'Sin implementación',
  cerrada: 'Cierre administrativo',
};

export const GCC_PROCESS_STATUS_LABELS = PROCESS_STATUS_LABELS;

const BACKEND_MECANISMOS: ReadonlyArray<MecanismoGCC> = ['MEDIACION', 'CONCILIACION', 'ARBITRAJE_PEDAGOGICO'];

const isMecanismoGCC = (value: string | null): value is MecanismoGCC =>
  value !== null && BACKEND_MECANISMOS.includes(value as MecanismoGCC);

const isEstadoProcesoGCC = (value: string): value is EstadoProcesoGCC => value in PROCESS_STATUS_LABELS;

interface UseGccDashboardMetricsOptions {
  baseMetrics?: GccMetricsBaseSource;
}

interface UseGccDashboardMetricsResult {
  metrics: GccDashboardMetrics;
  isLoading: boolean;
  error?: string | null;
  refresh: () => Promise<void>;
  lastUpdatedAt: string | null;
}

export const useGccDashboardMetrics = (
  options: UseGccDashboardMetricsOptions = {}
): UseGccDashboardMetricsResult => {
  const { baseMetrics: externalBaseMetrics } = options;
  const { tenantId } = useTenant();
  const [internalBaseMetrics, setInternalBaseMetrics] = useState<GccMetrics>(INITIAL_BASE_METRICS);
  const [internalBaseLoading, setInternalBaseLoading] = useState(false);
  const [internalBaseError, setInternalBaseError] = useState<string | null>(null);
  const [internalLastUpdatedAt, setInternalLastUpdatedAt] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<Omit<GccDashboardMetrics, keyof GccMetrics>>(
    INITIAL_DASHBOARD_METRICS
  );
  const [isLoadingExtended, setIsLoadingExtended] = useState(false);
  const [extendedError, setExtendedError] = useState<string | null>(null);

  const refreshExtendedMetrics = useCallback(async () => {
    if (!supabase || !tenantId || !isUuid(tenantId)) return;
    
    setIsLoadingExtended(true);
    setExtendedError(null);
    if (!externalBaseMetrics) {
      setInternalBaseLoading(true);
      setInternalBaseError(null);
    }
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('gcc_dashboard_metrics_v2', {
        p_establecimiento_id: tenantId,
        p_limit_registros: 90,
      });

      const rpcPayload = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as GccDashboardRpcPayload | null;
      const rpcSuccess = !rpcError && rpcPayload && rpcPayload.success !== false;

      if (rpcSuccess) {
        if (!externalBaseMetrics && rpcPayload.base) {
          setInternalBaseMetrics({
            activos: Number(rpcPayload.base.activos ?? 0),
            t2: Number(rpcPayload.base.t2 ?? 0),
            t1: Number(rpcPayload.base.t1 ?? 0),
            vencidos: Number(rpcPayload.base.vencidos ?? 0),
            acuerdoTotalPct: Number(rpcPayload.base.acuerdoTotalPct ?? 0),
            acuerdoParcialPct: Number(rpcPayload.base.acuerdoParcialPct ?? 0),
            sinAcuerdoPct: Number(rpcPayload.base.sinAcuerdoPct ?? 0),
          });
          setInternalLastUpdatedAt(new Date().toISOString());
        }

        const rpcRecords = Array.isArray(rpcPayload.registrosMecanismos)
          ? rpcPayload.registrosMecanismos
          : [];

        setDashboardData({
          mecanismos: Array.isArray(rpcPayload.mecanismos) ? rpcPayload.mecanismos : [],
          totalMecanismosAdoptados: Number(rpcPayload.totalMecanismosAdoptados ?? 0),
          mecanismoMasUsado: rpcPayload.mecanismoMasUsado ?? null,
          tasaAdopcionMecanismos: Number(rpcPayload.tasaAdopcionMecanismos ?? 0),
          comparacionPeriodoAnterior: {
            activos: Number(rpcPayload.comparacionPeriodoAnterior?.activos ?? 0),
            vencidos: Number(rpcPayload.comparacionPeriodoAnterior?.vencidos ?? 0),
            mecanismos: Number(rpcPayload.comparacionPeriodoAnterior?.mecanismos ?? 0),
          },
          registrosMecanismos: rpcRecords
            .filter((row) => isMecanismoGCC(row.mecanismo))
            .map((row) => ({
              casoId: row.casoId,
              mecanismo: row.mecanismo,
              descripcion: MECHANISM_META[row.mecanismo].descripcion,
              clasificacion: MECHANISM_META[row.mecanismo].clasificacion,
              estadoImplementacion: isEstadoProcesoGCC(row.estadoProceso)
                ? PROCESS_STATUS_LABELS[row.estadoProceso]
                : 'Estado no clasificado',
              estadoProceso: row.estadoProceso,
              createdAt: row.createdAt,
            })),
        });

        return;
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Una sola lectura cubre métricas base + comparativas de 30/60 días.
      const { data, error } = await supabase
        .from('mediaciones_gcc_v2')
        .select('id, estado_proceso, fecha_limite_habil, tipo_mecanismo, created_at')
        .eq('establecimiento_id', tenantId)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        const allRows = data as GccRowExtended[];
        const currentRows = allRows.filter((row) => new Date(row.created_at) >= thirtyDaysAgo);
        const previousRows = allRows.filter((row) => {
          const createdAt = new Date(row.created_at);
          return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
        });

        if (!externalBaseMetrics) {
          const activeRows = allRows.filter((r) => ['abierta', 'en_proceso', 'acuerdo_parcial'].includes(r.estado_proceso));
          const daysUntil = (value: string | null): number | null => {
            if (!value) return null;
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return null;
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          };

          const t2 = activeRows.filter((r) => daysUntil(r.fecha_limite_habil) === 2).length;
          const t1 = activeRows.filter((r) => daysUntil(r.fecha_limite_habil) === 1).length;
          const vencidos = activeRows.filter((r) => {
            const diff = daysUntil(r.fecha_limite_habil);
            return diff !== null && diff < 0;
          }).length;

          const terminalRows = allRows.filter((r) => ['acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo', 'cerrada'].includes(r.estado_proceso));
          const totalTerminal = terminalRows.length || 1;
          const acuerdoTotal = terminalRows.filter((r) => r.estado_proceso === 'acuerdo_total').length;
          const acuerdoParcial = terminalRows.filter((r) => r.estado_proceso === 'acuerdo_parcial').length;
          const sinAcuerdo = terminalRows.filter((r) => r.estado_proceso === 'sin_acuerdo').length;

          setInternalBaseMetrics({
            activos: activeRows.length,
            t2,
            t1,
            vencidos,
            acuerdoTotalPct: Math.round((acuerdoTotal / totalTerminal) * 100),
            acuerdoParcialPct: Math.round((acuerdoParcial / totalTerminal) * 100),
            sinAcuerdoPct: Math.round((sinAcuerdo / totalTerminal) * 100),
          });
          setInternalLastUpdatedAt(new Date().toISOString());
        }

        const mecanismoCounts: Record<MecanismoGCC, number> = { MEDIACION: 0, CONCILIACION: 0, ARBITRAJE_PEDAGOGICO: 0 };
        const mecanismoCountsPrevious: Record<MecanismoGCC, number> = { MEDIACION: 0, CONCILIACION: 0, ARBITRAJE_PEDAGOGICO: 0 };

        let totalConMecanismo = 0;
        let totalConMecanismoPrevious = 0;

        currentRows.forEach((row) => {
          if (isMecanismoGCC(row.tipo_mecanismo)) {
            mecanismoCounts[row.tipo_mecanismo]++;
            totalConMecanismo++;
          }
        });

        previousRows.forEach((row) => {
          if (isMecanismoGCC(row.tipo_mecanismo)) {
            mecanismoCountsPrevious[row.tipo_mecanismo]++;
            totalConMecanismoPrevious++;
          }
        });

        const totalCurrent = currentRows.length || 1;

        // Calcular tendencias
        const mecanismos: MecanismStats[] = (
          Object.keys(mecanismoCounts) as MecanismoGCC[]
        ).map((mecanismo) => {
          const count = mecanismoCounts[mecanismo];
          const countPrevious = mecanismoCountsPrevious[mecanismo];
          
          let trend: 'up' | 'down' | 'stable' = 'stable';
          let trendValue = 0;

          if (countPrevious > 0) {
            const change = ((count - countPrevious) / countPrevious) * 100;
            trendValue = Math.round(change);
            if (change > 5) trend = 'up';
            else if (change < -5) trend = 'down';
          } else if (count > 0) {
            trend = 'up';
            trendValue = 100;
          }

          return {
            mecanismo,
            count,
            percentage: Math.round((count / totalCurrent) * 100),
            trend,
            trendValue,
          };
        });

        // Encontrar mecanismo más usado
        const sortedMecanismos = [...mecanismos].sort((a, b) => b.count - a.count);
        const mecanismoMasUsado = sortedMecanismos[0]?.count > 0 ? sortedMecanismos[0].mecanismo : null;

        // Calcular comparación con período anterior
        const activosCurrent = currentRows.filter((r) =>
          ['abierta', 'en_proceso', 'acuerdo_parcial'].includes(r.estado_proceso)
        ).length;
        const activosPrevious = previousRows.filter((r) =>
          ['abierta', 'en_proceso', 'acuerdo_parcial'].includes(r.estado_proceso)
        ).length;

        const vencidosCurrent = currentRows.filter((r) => {
          if (!r.fecha_limite_habil) return false;
          const diff = Math.ceil(
            (new Date(r.fecha_limite_habil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return diff < 0;
        }).length;

        const vencidosPrevious = previousRows.filter((r) => {
          if (!r.fecha_limite_habil) return false;
          const limitDate = new Date(r.fecha_limite_habil);
          const compareDate = new Date(thirtyDaysAgo);
          return limitDate < compareDate;
        }).length;

        setDashboardData({
          mecanismos,
          totalMecanismosAdoptados: totalConMecanismo,
          mecanismoMasUsado,
          tasaAdopcionMecanismos: Math.round((totalConMecanismo / totalCurrent) * 100),
          comparacionPeriodoAnterior: {
            activos: activosPrevious > 0 ? Math.round(((activosCurrent - activosPrevious) / activosPrevious) * 100) : 0,
            vencidos: vencidosPrevious > 0 ? Math.round(((vencidosCurrent - vencidosPrevious) / vencidosPrevious) * 100) : 0,
            mecanismos: totalConMecanismoPrevious > 0
              ? Math.round(((totalConMecanismo - totalConMecanismoPrevious) / totalConMecanismoPrevious) * 100)
              : 0,
          },
          registrosMecanismos: currentRows
            .filter((row): row is GccRowExtended & { tipo_mecanismo: MecanismoGCC } => isMecanismoGCC(row.tipo_mecanismo))
            .map((row) => ({
              casoId: row.id,
              mecanismo: row.tipo_mecanismo,
              descripcion: MECHANISM_META[row.tipo_mecanismo].descripcion,
              clasificacion: MECHANISM_META[row.tipo_mecanismo].clasificacion,
              estadoImplementacion: isEstadoProcesoGCC(row.estado_proceso)
                ? PROCESS_STATUS_LABELS[row.estado_proceso]
                : 'Estado no clasificado',
              estadoProceso: row.estado_proceso,
              createdAt: row.created_at,
            })),
        });
      } else if (error) {
        setExtendedError('No se pudieron cargar las métricas avanzadas GCC.');
        if (!externalBaseMetrics) {
          setInternalBaseError('No se pudieron cargar las métricas GCC.');
        }
      }
    } catch (err) {
      console.error('Error cargando métricas extendidas:', err);
      setExtendedError('Ocurrió un error inesperado al cargar métricas avanzadas GCC.');
      if (!externalBaseMetrics) {
        setInternalBaseError('Ocurrió un error inesperado al cargar métricas GCC.');
      }
    } finally {
      setIsLoadingExtended(false);
      if (!externalBaseMetrics) {
        setInternalBaseLoading(false);
      }
    }
  }, [externalBaseMetrics, tenantId]);

  useEffect(() => {
    void refreshExtendedMetrics();
  }, [refreshExtendedMetrics]);

  const refreshAllMetrics = useCallback(async () => {
    if (externalBaseMetrics) {
      await Promise.all([externalBaseMetrics.refresh(), refreshExtendedMetrics()]);
      return;
    }
    await refreshExtendedMetrics();
  }, [externalBaseMetrics, refreshExtendedMetrics]);

  const effectiveBaseMetrics = externalBaseMetrics
    ? externalBaseMetrics.metrics
    : internalBaseMetrics;

  const combinedMetrics: GccDashboardMetrics = useMemo(
    () => ({
      ...effectiveBaseMetrics,
      ...dashboardData,
    }),
    [dashboardData, effectiveBaseMetrics]
  );

  return {
    metrics: combinedMetrics,
    isLoading: (externalBaseMetrics?.isLoading ?? internalBaseLoading) || isLoadingExtended,
    error: externalBaseMetrics?.error ?? internalBaseError ?? extendedError,
    refresh: refreshAllMetrics,
    lastUpdatedAt: externalBaseMetrics?.lastUpdatedAt ?? internalLastUpdatedAt,
  };
};
