import React, { useMemo } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Expediente } from '@/types';

/** Props para EstadisticasConvivencia */
interface EstadisticasConvivenciaProps {
  expedientes: Expediente[];
  onFilterByCourse?: (course: string | null) => void;
}

/**
 * Componente de Panel General de Expedientes.
 * Muestra KPIs operativos generales: total, activos, por vencer y resueltos.
 */
export const EstadisticasConvivencia: React.FC<EstadisticasConvivenciaProps> = ({
  expedientes,
  onFilterByCourse
}) => {
  // KPIs generales
  const kpis = useMemo(() => {
    const activos = expedientes.filter(e => 
      !['CERRADO_SANCION', 'CERRADO_GCC'].includes(e.etapa)
    );
    
    const proximosVencer = activos.filter(e => {
      const diasRestantes = Math.ceil(
        (new Date(e.plazoFatal).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return diasRestantes > 0 && diasRestantes <= 5;
    });

    const resueltos = expedientes.filter(e => 
      ['CERRADO_SANCION', 'CERRADO_GCC'].includes(e.etapa)
    );

    return {
      total: expedientes.length,
      activos: activos.length,
      proximosVencer: proximosVencer.length,
      resueltos: resueltos.length
    };
  }, [expedientes]);

  return (
    <div className="bg-white border border-emerald-100 rounded-3xl shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
          Panel General de Expedientes
        </h3>
        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
          Datos operativos
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          title="Total"
          value={kpis.total}
          icon={<FileText className="w-5 h-5" />}
          color="slate"
        />
        <KPICard
          title="Activos"
          value={kpis.activos}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          onClick={() => onFilterByCourse?.(null)}
        />
        <KPICard
          title="Por vencer"
          value={kpis.proximosVencer}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <KPICard
          title="Resueltos"
          value={kpis.resueltos}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
        />
      </div>
    </div>
  );
};

/** KPI Card individual */
interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'slate' | 'red' | 'emerald' | 'amber';
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, onClick }) => {
  const colors = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all text-left ${colors[color]} ${
        onClick ? 'cursor-pointer hover:brightness-95' : ''
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide mb-1">
        {icon}
        <span>{title}</span>
      </div>
      <p className="text-3xl leading-none font-black">{value}</p>
    </button>
  );
};

/**
 * Componente separado para Distribución por Curso (KPI Cards Moderno)
 * Muestra estadísticas por curso en formato de cards visuales con KPIs.
 */
export const DistribucionPorCurso: React.FC<{
  statsByCourse: Array<{ curso: string; total: number; leves: number; relevantes: number; graves: number }>;
  currentFilter?: string | null;
  onFilterByCourse?: (course: string | null) => void;
}> = ({ statsByCourse, currentFilter, onFilterByCourse }) => {
  if (statsByCourse.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-3xl border border-slate-200 shadow-sm p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">
            Distribución por Curso
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {statsByCourse.length} {statsByCourse.length === 1 ? 'curso' : 'cursos'} con expedientes activos
          </p>
        </div>
        {currentFilter && (
          <button
            onClick={() => onFilterByCourse?.(null)}
            className="px-4 py-2 bg-blue-100 text-blue-700 text-xs font-black rounded-xl hover:bg-blue-200 transition-all uppercase tracking-wide"
          >
            ✕ Limpiar filtro
          </button>
        )}
      </div>

      {/* Grid de Cursos como KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsByCourse.map(({ curso, total, leves, relevantes, graves }) => {
          const isActive = currentFilter === curso;
          const levesPct = total > 0 ? Math.round((leves / total) * 100) : 0;
          const relevantesPct = total > 0 ? Math.round((relevantes / total) * 100) : 0;
          const gravesPct = total > 0 ? Math.round((graves / total) * 100) : 0;

          return (
            <button
              key={curso}
              onClick={() => onFilterByCourse?.(isActive ? null : curso)}
              className={`group relative overflow-hidden rounded-2xl transition-all duration-300 border-2 ${
                isActive
                  ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-200/30 scale-105'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/20'
              }`}
            >
              {/* Fondo decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative p-5 md:p-6 space-y-4">
                {/* Nombre del curso y total */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 text-sm md:text-base uppercase tracking-tight truncate">
                      {curso}
                    </h4>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-2xl md:text-3xl font-black text-blue-600">
                      {total}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      expediente{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Barra de progreso de gravedad */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest">
                    Composición por gravedad
                  </p>
                  <div className="flex h-2 gap-1 rounded-full overflow-hidden bg-slate-200">
                    {leves > 0 && (
                      <div
                        className="bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${levesPct}%` }}
                        title={`Leves: ${leves}`}
                      />
                    )}
                    {relevantes > 0 && (
                      <div
                        className="bg-amber-500 rounded-full transition-all"
                        style={{ width: `${relevantesPct}%` }}
                        title={`Relevantes: ${relevantes}`}
                      />
                    )}
                    {graves > 0 && (
                      <div
                        className="bg-red-500 rounded-full transition-all"
                        style={{ width: `${gravesPct}%` }}
                        title={`Graves: ${graves}`}
                      />
                    )}
                  </div>
                </div>

                {/* Mini KPIs de gravedad */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                    <p className="text-xs font-black text-emerald-700 leading-tight">
                      {leves}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">
                      Leves
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                    <p className="text-xs font-black text-amber-700 leading-tight">
                      {relevantes}
                    </p>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">
                      Relevantes
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
                    <p className="text-xs font-black text-red-700 leading-tight">
                      {graves}
                    </p>
                    <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight">
                      Graves
                    </p>
                  </div>
                </div>

                {/* Indicador de filtro activo */}
                {isActive && (
                  <div className="flex items-center justify-center gap-1 pt-2 border-t border-blue-100">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-xs font-black text-blue-600 uppercase tracking-wide">
                      Filtro activo
                    </p>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EstadisticasConvivencia;

