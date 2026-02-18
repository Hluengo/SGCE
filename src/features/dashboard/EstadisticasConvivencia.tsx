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
    <div className="bg-white border border-emerald-100 rounded-[2rem] shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
          Panel General de Expedientes
        </h3>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
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
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide mb-1">
        {icon}
        <span>{title}</span>
      </div>
      <p className="text-3xl leading-none font-black">{value}</p>
    </button>
  );
};

/**
 * Componente separado para Distribución por Curso
 * Permite ver la distribución de expedientes por curso y filtrar al hacer click.
 */
export const DistribucionPorCurso: React.FC<{
  statsByCourse: Array<{ curso: string; total: number; leves: number; relevantes: number; graves: number }>;
  currentFilter?: string | null;
  onFilterByCourse?: (course: string | null) => void;
}> = ({ statsByCourse, currentFilter, onFilterByCourse }) => {
  if (statsByCourse.length === 0) return null;
  
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
          Distribución por Curso
        </h3>
        {currentFilter && (
          <button
            onClick={() => onFilterByCourse?.(null)}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold uppercase"
          >
            Limpiar filtro
          </button>
        )}
      </div>

      <div className="space-y-3">
        {statsByCourse.map(({ curso, total, leves, relevantes, graves }) => {
          const isActive = currentFilter === curso;

          return (
            <button
              key={curso}
              onClick={() => onFilterByCourse?.(isActive ? null : curso)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-50 border-2 border-blue-200' 
                  : 'bg-slate-50 border border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-xs text-slate-700 uppercase">{curso}</span>
                <span className="text-xs font-black text-slate-500">{total} expediente{total !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex gap-1">
                <span className={`h-1.5 rounded-full ${leves > 0 ? 'bg-emerald-400' : 'bg-slate-200'}`} style={{ width: `${leves > 0 ? Math.max(leves * 10, 10) : 0}%`, minWidth: leves > 0 ? '8px' : '0' }} />
                <span className={`h-1.5 rounded-full ${relevantes > 0 ? 'bg-amber-400' : 'bg-slate-200'}`} style={{ width: `${relevantes > 0 ? Math.max(relevantes * 10, 10) : 0}%`, minWidth: relevantes > 0 ? '8px' : '0' }} />
                <span className={`h-1.5 rounded-full ${graves > 0 ? 'bg-red-400' : 'bg-slate-200'}`} style={{ width: `${graves > 0 ? Math.max(graves * 10, 10) : 0}%`, minWidth: graves > 0 ? '8px' : '0' }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EstadisticasConvivencia;
