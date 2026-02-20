/**
 * GccMetricsBar - Barra de métricas GCC (estilo Dashboard principal)
 * 
 * Muestra SIEMPRE las 4 métricas en grid compacto siguiendo el estándar
 * del "Panel de Gestión Colaborativa de Conflictos" del Dashboard.
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { AsyncState } from '@/shared/components/ui';

type MetricCard = {
  id: 'activos' | 't2' | 't1' | 'vencidos';
  label: string;
  value: number;
  cardClassName: string;
  labelClassName: string;
  valueClassName: string;
};

interface GccMetricsBarProps {
  activos: number;
  vencidos: number;
  t1: number;
  t2: number;
  lastUpdated: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  showAsyncStates?: boolean;
}

export const GccMetricsBar: React.FC<GccMetricsBarProps> = ({
  activos,
  vencidos,
  t1,
  t2,
  lastUpdated,
  isLoading = false,
  error = null,
  onRetry,
  showAsyncStates = false
}) => {
  const formatTime = (iso: string | null): string => {
    if (!iso) return 'Sin actualización';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    return `hace ${Math.floor(diff / 3600)}h`;
  };

  const cards: MetricCard[] = [
    {
      id: 'activos',
      label: 'Activos',
      value: activos,
      cardClassName: 'rounded-xl border border-slate-200 bg-slate-50 p-4',
      labelClassName: 'text-xs font-black uppercase text-slate-500',
      valueClassName: 'text-lg font-black text-slate-900',
    },
    {
      id: 't2',
      label: 'Vence en 2 días',
      value: t2,
      cardClassName: 'rounded-xl border border-amber-200 bg-amber-50 p-4',
      labelClassName: 'text-xs font-black uppercase text-amber-700',
      valueClassName: 'text-lg font-black text-amber-800',
    },
    {
      id: 't1',
      label: 'Vence mañana',
      value: t1,
      cardClassName: 'rounded-xl border border-rose-200 bg-rose-50 p-4',
      labelClassName: 'text-xs font-black uppercase text-rose-700',
      valueClassName: 'text-lg font-black text-rose-800',
    },
    {
      id: 'vencidos',
      label: 'Vencidos',
      value: vencidos,
      cardClassName: 'rounded-xl border border-red-200 bg-red-50 p-4',
      labelClassName: 'text-xs font-black uppercase text-red-700',
      valueClassName: 'text-lg font-black text-red-800',
    },
  ];
  const hasData = activos > 0 || vencidos > 0 || t1 > 0 || t2 > 0;

  if (showAsyncStates && isLoading && !lastUpdated && !hasData) {
    return (
      <AsyncState
        state="loading"
        title="Cargando métricas"
        message="Actualizando estado GCC."
        compact
      />
    );
  }

  if (showAsyncStates && error && !hasData) {
    return (
      <AsyncState
        state="error"
        title="No se pudieron cargar métricas"
        message={error}
        onRetry={onRetry}
        compact
      />
    );
  }

  return (
    <div className="flex-1">
      {/* Grid de métricas - estilo Dashboard principal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.id} className={card.cardClassName}>
            <p className={card.labelClassName}>{card.label}</p>
            <p className={card.valueClassName}>{card.value}</p>
          </div>
        ))}
      </div>
      
      {/* Timestamp */}
      <div className="mt-2 flex items-center justify-end gap-1 text-xs font-medium text-slate-500">
        <Activity className="w-3 h-3" />
        <span>{isLoading ? 'Actualizando...' : (lastUpdated ? `Actualizado ${formatTime(lastUpdated)}` : 'Sin actualización')}</span>
      </div>
    </div>
  );
};

