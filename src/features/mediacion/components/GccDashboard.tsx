/**
 * GccDashboard - Panel de métricas y tendencias GCC (versión integrada)
 * 
 * Se integra dentro de CentroMediacionGCC.tsx como sección opcional.
 * Diseño compacto siguiendo el estándar del Dashboard principal.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  GCC_PROCESS_STATUS_LABELS,
  useGccDashboardMetrics,
  type MecanismoGCC,
} from '@/shared/hooks/useGccDashboardMetrics';
import type { GccMetricsBaseSource } from '@/shared/hooks/useGccMetrics';
import { AsyncState } from '@/shared/components/ui';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MessageSquare,
  Scale,
  Gavel,
  Activity,
  CheckCircle2,
  XCircle,
  CircleDot,
  TrendingUpIcon,
  Download,
  Filter
} from 'lucide-react';

const FILTER_QUERY_KEYS = {
  mecanismo: 'gccMec',
  estado: 'gccEstado',
} as const;
const PROCESS_STATUS_OPTIONS = ['abierta', 'en_proceso', 'acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo', 'cerrada'] as const;
type ProcessStatusOption = typeof PROCESS_STATUS_OPTIONS[number];

const MECANISMO_CONFIG: Record<
  MecanismoGCC,
  { label: string; icon: React.ReactNode; bgClass: string; progressBarClass: string }
> = {
  MEDIACION: {
    label: 'Mediación',
    icon: <MessageSquare className="w-4 h-4" />,
    bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    progressBarClass: 'bg-emerald-400',
  },
  CONCILIACION: {
    label: 'Conciliación',
    icon: <Scale className="w-4 h-4" />,
    bgClass: 'bg-purple-50 border-purple-200 text-purple-700',
    progressBarClass: 'bg-purple-400',
  },
  ARBITRAJE_PEDAGOGICO: {
    label: 'Arbitraje',
    icon: <Gavel className="w-4 h-4" />,
    bgClass: 'bg-amber-50 border-amber-200 text-amber-700',
    progressBarClass: 'bg-amber-400',
  }
};

const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'stable'; value: number }> = ({ trend, value }) => {
  if (trend === 'stable') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-500">
        <Minus className="w-3 h-3" />
      </span>
    );
  }

  const isPositive = trend === 'up';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
};

/**
 * Panel compacto de métricas GCC con tendencias
 * Se integra como sección adicional dentro de CentroMediacionGCC
 */
interface GccDashboardProps {
  baseMetrics?: GccMetricsBaseSource;
}

export const GccDashboard: React.FC<GccDashboardProps> = ({ baseMetrics }) => {
  const { metrics, isLoading, error, lastUpdatedAt, refresh } = useGccDashboardMetrics({ baseMetrics });
  const [mecanismoFilter, setMecanismoFilter] = useState<MecanismoGCC | 'ALL'>(() => {
    if (typeof window === 'undefined') return 'ALL';
    const value = new URLSearchParams(window.location.search).get(FILTER_QUERY_KEYS.mecanismo);
    const valid = value && value in MECANISMO_CONFIG ? (value as MecanismoGCC) : 'ALL';
    return valid;
  });
  const [estadoFilter, setEstadoFilter] = useState<ProcessStatusOption | 'ALL'>(() => {
    if (typeof window === 'undefined') return 'ALL';
    const value = new URLSearchParams(window.location.search).get(FILTER_QUERY_KEYS.estado);
    return (value && PROCESS_STATUS_OPTIONS.includes(value as ProcessStatusOption))
      ? (value as ProcessStatusOption)
      : 'ALL';
  });
  const hasMetricData =
    metrics.activos > 0 ||
    metrics.vencidos > 0 ||
    metrics.t1 > 0 ||
    metrics.t2 > 0 ||
    metrics.totalMecanismosAdoptados > 0;
  const mechanismRecords = metrics.registrosMecanismos ?? [];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (mecanismoFilter === 'ALL') params.delete(FILTER_QUERY_KEYS.mecanismo);
    else params.set(FILTER_QUERY_KEYS.mecanismo, mecanismoFilter);
    if (estadoFilter === 'ALL') params.delete(FILTER_QUERY_KEYS.estado);
    else params.set(FILTER_QUERY_KEYS.estado, estadoFilter);
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [estadoFilter, mecanismoFilter]);

  const filteredRecords = useMemo(() => {
    return mechanismRecords.filter((item) => {
      const mechanismMatch = mecanismoFilter === 'ALL' || item.mecanismo === mecanismoFilter;
      const statusMatch = estadoFilter === 'ALL' || item.estadoProceso === estadoFilter;
      return mechanismMatch && statusMatch;
    });
  }, [mechanismRecords, mecanismoFilter, estadoFilter]);

  const qualitativeInsights = useMemo(() => {
    const acuerdoConResultado = metrics.acuerdoTotalPct + metrics.acuerdoParcialPct;
    const nivelDialogo =
      metrics.acuerdoTotalPct >= 60 ? 'Alto' :
      metrics.acuerdoTotalPct >= 35 ? 'Medio' :
      'En desarrollo';
    const calidadRestaurativa =
      acuerdoConResultado >= 70 ? 'Consolidada' :
      acuerdoConResultado >= 45 ? 'Aceptable' :
      'Reforzar acompañamiento';

    return { nivelDialogo, calidadRestaurativa };
  }, [metrics.acuerdoParcialPct, metrics.acuerdoTotalPct]);

  const getExportRows = () => filteredRecords.map((item) => [
    item.casoId,
    MECANISMO_CONFIG[item.mecanismo].label,
    item.descripcion,
    item.clasificacion,
    item.estadoImplementacion,
    item.estadoProceso,
    new Date(item.createdAt).toLocaleDateString('es-CL'),
  ]);

  const exportFilteredRecordsCsv = () => {
    const header = [
      'Caso',
      'Mecanismo',
      'Descripcion',
      'Clasificacion',
      'Estado implementacion',
      'Estado proceso',
      'Fecha registro',
    ];
    const rows = getExportRows();
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gcc-metricas-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportFilteredRecordsXlsx = async () => {
    const { utils, writeFile } = await import('xlsx');
    const rows = getExportRows();
    const worksheet = utils.aoa_to_sheet([
      ['Caso', 'Mecanismo', 'Descripcion', 'Clasificacion', 'Estado implementacion', 'Estado proceso', 'Fecha registro'],
      ...rows,
    ]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Métricas GCC');
    writeFile(workbook, `gcc-metricas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const formatTime = (iso: string | null): string => {
    if (!iso) return 'Sin actualización';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `Actualizado hace ${diff}s`;
    if (diff < 3600) return `Actualizado hace ${Math.floor(diff / 60)}m`;
    return `Actualizado hace ${Math.floor(diff / 3600)}h`;
  };

  if (isLoading && !lastUpdatedAt && !hasMetricData) {
    return (
      <AsyncState
        state="loading"
        title="Cargando métricas GCC"
        message="Estamos preparando el panel de análisis."
        compact
      />
    );
  }

  if (error && !hasMetricData) {
    return (
      <AsyncState
        state="error"
        title="No se pudo cargar el dashboard GCC"
        message={error}
        onRetry={() => {
          void refresh();
        }}
        compact
      />
    );
  }

  if (!isLoading && !lastUpdatedAt && !hasMetricData) {
    return (
      <AsyncState
        state="empty"
        title="Sin datos de mediación disponibles"
        message="Cuando existan mediaciones GCC, aquí verás tendencias y comparativas."
        compact
      />
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Sección: Comparación con Período Anterior */}
      <section className="bg-white border border-blue-100 rounded-2xl shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Comparación con Período Anterior
          </h3>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
              <Activity className="w-3 h-3" />
              {isLoading ? 'Actualizando...' : formatTime(lastUpdatedAt)}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
          <div className="rounded-lg md:rounded-xl border border-blue-200 bg-blue-50 p-3 md:p-4">
            <p className="text-[10px] md:text-xs font-black text-blue-700 uppercase tracking-tight">Casos Activos</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg md:text-xl font-black text-slate-900">{metrics.activos}</p>
              <TrendIndicator 
                trend={metrics.comparacionPeriodoAnterior.activos > 0 ? 'up' : metrics.comparacionPeriodoAnterior.activos < 0 ? 'down' : 'stable'}
                value={Math.abs(metrics.comparacionPeriodoAnterior.activos)}
              />
            </div>
          </div>
          
          <div className="rounded-lg md:rounded-xl border border-red-200 bg-red-50 p-3 md:p-4">
            <p className="text-[10px] md:text-xs font-black text-red-700 uppercase tracking-tight">Casos Vencidos</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg md:text-xl font-black text-slate-900">{metrics.vencidos}</p>
              <TrendIndicator 
                trend={metrics.comparacionPeriodoAnterior.vencidos < 0 ? 'up' : metrics.comparacionPeriodoAnterior.vencidos > 0 ? 'down' : 'stable'}
                value={Math.abs(metrics.comparacionPeriodoAnterior.vencidos)}
              />
            </div>
          </div>
          
          <div className="rounded-lg md:rounded-xl border border-rose-200 bg-rose-50 p-3 md:p-4">
            <p className="text-[10px] md:text-xs font-black text-rose-700 uppercase tracking-tight">Alerta T1</p>
            <p className="text-lg md:text-xl font-black text-slate-900">{metrics.t1}</p>
            <p className="text-[10px] md:text-xs text-rose-600">Vence mañana</p>
          </div>
          
          <div className="rounded-lg md:rounded-xl border border-amber-200 bg-amber-50 p-3 md:p-4">
            <p className="text-[10px] md:text-xs font-black text-amber-700 uppercase tracking-tight">Alerta T2</p>
            <p className="text-lg md:text-xl font-black text-slate-900">{metrics.t2}</p>
            <p className="text-[10px] md:text-xs text-amber-600">Vence en 2 días</p>
          </div>
        </div>
      </section>

      {/* Sección: Mecanismos GCC Adoptados */}
      <section className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-6">
          <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <TrendingUpIcon className="w-4 md:w-5 h-4 md:h-5 text-indigo-600" />
            Mecanismos GCC Adoptados
          </h3>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl md:text-3xl font-black text-indigo-600">{metrics.totalMecanismosAdoptados}</p>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Total</p>
          </div>
        </div>
        
        {/* Estadísticas destacadas */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6">
          <div className="col-span-1 rounded-lg md:rounded-xl border-2 border-indigo-200 bg-indigo-50 p-3 md:p-4">
            <p className="text-[10px] md:text-xs font-black text-indigo-700 uppercase tracking-tight">Tasa de Adopción</p>
            <p className="text-2xl md:text-3xl font-black text-indigo-600 mt-1">{metrics.tasaAdopcionMecanismos}%</p>
          </div>
          
          <div className="col-span-1 rounded-lg md:rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3 md:p-4">
            <p className="text-[10px] md:text-xs font-black text-emerald-700 uppercase tracking-tight">Más Utilizado</p>
            <p className="text-sm md:text-base font-black text-slate-900 mt-1">
              {metrics.mecanismoMasUsado ? MECANISMO_CONFIG[metrics.mecanismoMasUsado].label : 'N/A'}
            </p>
          </div>
          
          <div className="col-span-2 lg:col-span-1 rounded-lg md:rounded-xl border-2 border-blue-200 bg-blue-50 p-3 md:p-4">
            <p className="text-[10px] md:text-xs font-black text-blue-700 uppercase tracking-tight">Tendencia vs. Mes Anterior</p>
            <div className="flex items-center gap-2 mt-1">
              <TrendIndicator 
                trend={metrics.comparacionPeriodoAnterior.mecanismos > 0 ? 'up' : metrics.comparacionPeriodoAnterior.mecanismos < 0 ? 'down' : 'stable'}
                value={Math.abs(metrics.comparacionPeriodoAnterior.mecanismos)}
              />
              <span className="text-xs md:text-sm font-bold text-slate-600">
                {Math.abs(metrics.comparacionPeriodoAnterior.mecanismos)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Desglose por mecanismo */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
          {metrics.mecanismos.map((mecanismo) => {
            const config = MECANISMO_CONFIG[mecanismo.mecanismo];
            return (
              <div key={mecanismo.mecanismo} className={`rounded-lg md:rounded-xl border ${config.bgClass} p-3 md:p-4`}>
                <div className="flex items-center justify-between mb-2">
                  {config.icon}
                  <TrendIndicator trend={mecanismo.trend} value={mecanismo.trendValue} />
                </div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-tight">{config.label}</p>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <p className="text-xl md:text-2xl font-black text-slate-900">{mecanismo.count}</p>
                  <span className="text-[10px] md:text-xs font-bold text-slate-600">({mecanismo.percentage}%)</span>
                </div>
                {/* Barra de progreso */}
                <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full ${config.progressBarClass} transition-all duration-500`}
                    style={{ width: `${mecanismo.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-3 md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                Registro Detallado de Mecanismos GCC
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Clasificación, descripción y estado de implementación por caso.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportFilteredRecordsCsv}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:bg-slate-100"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
              <button
                onClick={() => { void exportFilteredRecordsXlsx(); }}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-700 hover:bg-blue-100"
              >
                <Download className="w-4 h-4" />
                Exportar XLSX
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <label className="mb-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <Filter className="w-3 h-3" />
                Mecanismo
              </label>
              <select
                value={mecanismoFilter}
                onChange={(event) => setMecanismoFilter(event.target.value as MecanismoGCC | 'ALL')}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">Todos</option>
                {(Object.keys(MECANISMO_CONFIG) as MecanismoGCC[]).map((key) => (
                  <option key={key} value={key}>{MECANISMO_CONFIG[key].label}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <label className="mb-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <Filter className="w-3 h-3" />
                Estado
              </label>
              <select
                value={estadoFilter}
                onChange={(event) => setEstadoFilter(event.target.value as ProcessStatusOption | 'ALL')}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">Todos</option>
                {PROCESS_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {GCC_PROCESS_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Registros filtrados</p>
              <p className="text-lg font-black text-emerald-800">{filteredRecords.length}</p>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[840px] text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 font-black">Caso</th>
                  <th className="px-3 py-2 font-black">Mecanismo</th>
                  <th className="px-3 py-2 font-black">Descripción</th>
                  <th className="px-3 py-2 font-black">Clasificación</th>
                  <th className="px-3 py-2 font-black">Estado Implementación</th>
                  <th className="px-3 py-2 font-black">Registro</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.slice(0, 30).map((item) => (
                    <tr key={`${item.casoId}-${item.createdAt}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono font-bold text-slate-700">{item.casoId.slice(0, 8)}</td>
                      <td className="px-3 py-2 font-bold text-slate-700">{MECANISMO_CONFIG[item.mecanismo].label}</td>
                      <td className="px-3 py-2 text-slate-600">{item.descripcion}</td>
                      <td className="px-3 py-2 text-slate-700">{item.clasificacion}</td>
                      <td className="px-3 py-2 text-slate-700">{item.estadoImplementacion}</td>
                      <td className="px-3 py-2 text-slate-500">{new Date(item.createdAt).toLocaleDateString('es-CL')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      Sin registros para el filtro aplicado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Sección: Resultados de Mediación */}
      <section className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-4 md:p-6">
        <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight mb-4 md:mb-6">
          Resultados de Mediación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="rounded-lg md:rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-[10px] md:text-xs font-black text-emerald-700 uppercase tracking-tight">Acuerdo Total</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-emerald-600">{metrics.acuerdoTotalPct}%</p>
          </div>
          
          <div className="rounded-lg md:rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <CircleDot className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-[10px] md:text-xs font-black text-blue-700 uppercase tracking-tight">Acuerdo Parcial</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-blue-600">{metrics.acuerdoParcialPct}%</p>
          </div>
          
          <div className="rounded-lg md:rounded-xl border border-slate-300 bg-slate-100 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <p className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-tight">Sin Acuerdo</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-slate-700">{metrics.sinAcuerdoPct}%</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Métrica Cualitativa: Nivel de Diálogo</p>
            <p className="text-sm font-black text-emerald-900 mt-1">{qualitativeInsights.nivelDialogo}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Métrica Cualitativa: Calidad Restaurativa</p>
            <p className="text-sm font-black text-blue-900 mt-1">{qualitativeInsights.calidadRestaurativa}</p>
          </div>
        </div>
      </section>

      {/* Nota informativa */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-2 text-xs">
          <Activity className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-blue-900">
            <p className="font-bold">Datos actualizados en tiempo real cada 30 segundos.</p>
            <p className="text-xs text-blue-700">
              Las tendencias se calculan comparando con el período de 30 días anterior.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GccDashboard;
