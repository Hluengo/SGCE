/**
 * useGccDashboardMetrics
 * Hook avanzado que extiende useGccMetrics con datos de mecanismos adoptados,
 * tendencias y comparaciones con períodos anteriores
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { isUuid } from '@/shared/utils/expedienteRef';
import useGccMetrics, { type GccMetrics, type GccMetricsBaseSource } from './useGccMetrics';

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
  const internalBaseMetrics = useGccMetrics({
    autoRefresh: false,
    enabled: !externalBaseMetrics,
  });
  const baseMetrics = externalBaseMetrics ?? internalBaseMetrics;
  
  const [dashboardData, setDashboardData] = useState<Omit<GccDashboardMetrics, keyof GccMetrics>>(
    INITIAL_DASHBOARD_METRICS
  );
  const [isLoadingExtended, setIsLoadingExtended] = useState(false);
  const [extendedError, setExtendedError] = useState<string | null>(null);

  const refreshExtendedMetrics = useCallback(async () => {
    if (!supabase || !tenantId || !isUuid(tenantId)) return;
    
    setIsLoadingExtended(true);
    setExtendedError(null);
    try {
      // Obtener datos del período actual (últimos 30 días)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [currentPeriodResponse, previousPeriodResponse] = await Promise.all([
        supabase
          .from('mediaciones_gcc_v2')
          .select('id, estado_proceso, fecha_limite_habil, tipo_mecanismo, created_at')
          .eq('establecimiento_id', tenantId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('mediaciones_gcc_v2')
          .select('id, estado_proceso, tipo_mecanismo, created_at')
          .eq('establecimiento_id', tenantId)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString())
      ]);

      const { data: currentData, error: currentError } = currentPeriodResponse;
      const { data: previousData } = previousPeriodResponse;

      if (!currentError && currentData) {
        const currentRows = currentData as GccRowExtended[];
        const previousRows = (previousData || []) as GccRowExtended[];

        // Contar mecanismos del período actual
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
      } else if (currentError) {
        setExtendedError('No se pudieron cargar las métricas avanzadas GCC.');
      }
    } catch (err) {
      console.error('Error cargando métricas extendidas:', err);
      setExtendedError('Ocurrió un error inesperado al cargar métricas avanzadas GCC.');
    } finally {
      setIsLoadingExtended(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void refreshExtendedMetrics();
  }, [refreshExtendedMetrics]);

  const refreshAllMetrics = useCallback(async () => {
    await Promise.all([baseMetrics.refresh(), refreshExtendedMetrics()]);
  }, [baseMetrics, refreshExtendedMetrics]);

  const combinedMetrics: GccDashboardMetrics = useMemo(
    () => ({
      ...baseMetrics.metrics,
      ...dashboardData,
    }),
    [baseMetrics.metrics, dashboardData]
  );

  return {
    metrics: combinedMetrics,
    isLoading: baseMetrics.isLoading || isLoadingExtended,
    error: baseMetrics.error ?? extendedError,
    refresh: refreshAllMetrics,
    lastUpdatedAt: baseMetrics.lastUpdatedAt,
  };
};
