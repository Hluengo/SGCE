import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { isUuid } from '@/shared/utils/expedienteRef';

type GccRow = {
  id: string;
  estado_proceso: string;
  fecha_limite_habil: string | null;
};

export type GccMetrics = {
  activos: number;
  t2: number;
  t1: number;
  vencidos: number;
  acuerdoTotalPct: number;
  acuerdoParcialPct: number;
  sinAcuerdoPct: number;
};

export type GccFreshness = 'fresh' | 'stale' | 'old' | 'unknown';

const INITIAL_METRICS: GccMetrics = {
  activos: 0,
  t2: 0,
  t1: 0,
  vencidos: 0,
  acuerdoTotalPct: 0,
  acuerdoParcialPct: 0,
  sinAcuerdoPct: 0
};

const daysUntil = (value: string | null): number | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

export interface UseGccMetricsOptions {
  pollingMs?: number;
  autoRefresh?: boolean;
  enabled?: boolean;
}

export interface UseGccMetricsResult {
  metrics: GccMetrics;
  hasData: boolean;
  isLoading: boolean;
  error?: string | null;
  refresh: () => Promise<void>;
  lastUpdatedAt: string | null;
  secondsSinceUpdate: number | null;
  freshness: GccFreshness;
}

export type GccMetricsBaseSource = Pick<
  UseGccMetricsResult,
  'metrics' | 'isLoading' | 'refresh' | 'lastUpdatedAt' | 'error'
>;

const useGccMetrics = (options: UseGccMetricsOptions = {}): UseGccMetricsResult => {
  const { pollingMs = 60000, autoRefresh = true, enabled = true } = options;
  const { tenantId } = useTenant();
  const [metrics, setMetrics] = useState<GccMetrics>(INITIAL_METRICS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !supabase || !tenantId || !isUuid(tenantId)) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('mediaciones_gcc_v2')
        .select('id, estado_proceso, fecha_limite_habil')
        .eq('establecimiento_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (!error && data) {
        const rows = data as GccRow[];
        const activeRows = rows.filter((r) => ['abierta', 'en_proceso', 'acuerdo_parcial'].includes(r.estado_proceso));
        const t2 = activeRows.filter((r) => daysUntil(r.fecha_limite_habil) === 2).length;
        const t1 = activeRows.filter((r) => daysUntil(r.fecha_limite_habil) === 1).length;
        const vencidos = activeRows.filter((r) => {
          const diff = daysUntil(r.fecha_limite_habil);
          return diff !== null && diff < 0;
        }).length;

        const terminalRows = rows.filter((r) => ['acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo', 'cerrada'].includes(r.estado_proceso));
        const totalTerminal = terminalRows.length || 1;
        const acuerdoTotal = terminalRows.filter((r) => r.estado_proceso === 'acuerdo_total').length;
        const acuerdoParcial = terminalRows.filter((r) => r.estado_proceso === 'acuerdo_parcial').length;
        const sinAcuerdo = terminalRows.filter((r) => r.estado_proceso === 'sin_acuerdo').length;

        setMetrics({
          activos: activeRows.length,
          t2,
          t1,
          vencidos,
          acuerdoTotalPct: Math.round((acuerdoTotal / totalTerminal) * 100),
          acuerdoParcialPct: Math.round((acuerdoParcial / totalTerminal) * 100),
          sinAcuerdoPct: Math.round((sinAcuerdo / totalTerminal) * 100)
        });
        setLastUpdatedAt(new Date().toISOString());
      } else if (error) {
        setError('No se pudieron cargar las métricas GCC.');
      }
    } catch (err) {
      console.error('Error refrescando métricas GCC:', err);
      setError('Ocurrió un error inesperado al cargar métricas GCC.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, tenantId]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || !autoRefresh || !pollingMs) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, pollingMs);
    return () => window.clearInterval(timer);
  }, [enabled, autoRefresh, pollingMs, refresh]);

  useEffect(() => {
    if (!enabled || !autoRefresh) return;
    const onFocus = () => { void refresh(); };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, autoRefresh, refresh]);

  const hasData = useMemo(
    () => metrics.activos > 0 || metrics.vencidos > 0 || metrics.acuerdoTotalPct > 0 || metrics.acuerdoParcialPct > 0 || metrics.sinAcuerdoPct > 0,
    [metrics]
  );

  const secondsSinceUpdate = useMemo(() => {
    if (!lastUpdatedAt) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(lastUpdatedAt).getTime()) / 1000));
  }, [lastUpdatedAt]);

  const freshness = useMemo<GccFreshness>(() => {
    if (secondsSinceUpdate === null) return 'unknown';
    if (secondsSinceUpdate < 60) return 'fresh';
    if (secondsSinceUpdate <= 120) return 'stale';
    return 'old';
  }, [secondsSinceUpdate]);

  return { metrics, hasData, isLoading, error, refresh, lastUpdatedAt, secondsSinceUpdate, freshness };
};

export default useGccMetrics;
