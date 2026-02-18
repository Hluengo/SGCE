
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useExpedientes, useGccMetrics } from '@/shared/hooks';
import { useToast } from '@/shared/components/Toast/ToastProvider';
import NormativeBadge from '@/shared/components/NormativeBadge';
import PlazoCounter from '@/shared/components/PlazoCounter';
import { EstudianteBadge } from '@/shared/components/EstudianteBadge';
import type { GravedadFalta } from '@/types';
import { EstadisticasConvivencia, DistribucionPorCurso } from './EstadisticasConvivencia';
import { FilePlus, ArrowRight, Files, Search, FilterX, Eye, History, FileText } from 'lucide-react';
import { ExpedienteResumenModal } from '@/features/expedientes/ExpedienteResumenModal';

const isSeguimientoScc = (etapa?: string | null): boolean => {
  const value = (etapa ?? '').toUpperCase();
  return value.includes('GCC') || value.includes('SCC');
};

const formatEtapaLabel = (etapa?: string | null): string => {
  const value = (etapa ?? '').toUpperCase();
  if (value === 'CERRADO_GCC') return 'PAUSA LEGAL';
  return (etapa ?? '').replace('_', ' ');
};

const formatUpdatedAgo = (iso: string | null): string => {
  if (!iso) return 'Sin actualización';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `Actualizado hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  return `Actualizado hace ${diffMin}m`;
};

/**
 * Componente ExpedienteCard para vista móvil
 */
const ExpedienteCard: React.FC<{
  exp: { id: string; nnaNombre: string; nnaCurso?: string | null; gravedad: GravedadFalta; etapa: string; plazoFatal: string };
  onClick: () => void;
}> = ({ exp, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-blue-200"
  >
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
        {exp.id}
      </span>
      <NormativeBadge gravedad={exp.gravedad} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase">Estudiante</p>
      <EstudianteBadge
        nombre={exp.nnaNombre}
        curso={exp.nnaCurso}
        size="sm"
      />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase">Etapa</p>
        <p className="text-[10px] font-black text-slate-600 uppercase">{formatEtapaLabel(exp.etapa)}</p>
        {isSeguimientoScc(exp.etapa) && (
          <span className="mt-1 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-tight text-emerald-700">
            En Seguimiento GCC
          </span>
        )}
      </div>
      <PlazoCounter fechaLimite={exp.plazoFatal} />
    </div>
  </button>
);

/**
 * Componente EmptyState para cuando no hay resultados
 */
const EmptyState: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
  <div className="px-4 py-12 text-center space-y-3">
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-sm">
      {searchTerm ? <FilterX className="w-8 h-8" /> : <Files className="w-8 h-8" />}
    </div>
    <p className="text-slate-800 font-black text-xs uppercase tracking-widest">
      {searchTerm ? 'Sin coincidencias' : 'No hay expedientes'}
    </p>
  </div>
);

/**
 * Dashboard principal con estadísticas y distribución por curso
 */
const Dashboard: React.FC = () => {
  const { expedientes, setIsWizardOpen } = useConvivencia();
  const { filteredExpedientes, searchTerm, setSearchTerm } = useExpedientes(expedientes);
  const { metrics: gccMetrics, hasData: hasGccData, isLoading: isLoadingGcc, lastUpdatedAt, freshness } = useGccMetrics();
  const navigate = useNavigate();
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const toast = useToast();
  
  // Estado para modal de resumen
  const [resumenExpedienteId, setResumenExpedienteId] = useState<string | null>(null);

  // Mostrar toast al abrir el wizard
  const handleOpenWizard = () => {
    toast?.showToast('info', 'Nuevo Expediente', 'Complete los datos para crear un nuevo expediente disciplinario.');
    setIsWizardOpen(true);
  };

  // Filtrar por curso si está activo
  const displayedExpedientes = courseFilter
    ? filteredExpedientes.filter(exp => exp.nnaCurso === courseFilter)
    : filteredExpedientes;

  // Calcular distribución por curso para el componente separado
  const statsByCourse = useMemo(() => {
    const courseMap = new Map<string, { total: number; leves: number; relevantes: number; graves: number }>();
    
    filteredExpedientes.forEach(exp => {
      const curso = exp.nnaCurso || 'Sin curso';
      const existing = courseMap.get(curso) || { total: 0, leves: 0, relevantes: 0, graves: 0 };
      existing.total += 1;
      if (exp.gravedad === 'LEVE') existing.leves += 1;
      else if (exp.gravedad === 'RELEVANTE') existing.relevantes += 1;
      else if (exp.gravedad === 'GRAVISIMA_EXPULSION') existing.graves += 1;
      courseMap.set(curso, existing);
    });

    return Array.from(courseMap.entries())
      .map(([curso, stats]) => ({ curso, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpedientes]);

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Panel de Gestión Normativa</h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm">Control Operativo de Circulares 781 & 782</p>
        </div>
        <button
          onClick={handleOpenWizard}
          aria-label="Crear nuevo expediente"
          className="flex items-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 group"
        >
          <FilePlus className="w-5 h-5 group-hover:rotate-12 transition-transform" aria-hidden="true" />
          <span className="text-xs tracking-widest uppercase">Nuevo Expediente</span>
        </button>
      </header>

      {/* Panel General de Expedientes */}
      <EstadisticasConvivencia
        expedientes={expedientes}
        onFilterByCourse={(course) => setCourseFilter(course)}
      />

      {/* Panel de Gestión Colaborativa de Conflictos */}
      <section className="bg-white border border-emerald-100 rounded-[2rem] shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Panel de Gestión Colaborativa de Conflictos</h3>
          <div className="text-right">
            <span className="block text-[10px] font-black text-emerald-700 uppercase tracking-wider">
              {hasGccData ? 'Datos reales' : 'Sin registros GCC'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <span className={`inline-block h-2 w-2 rounded-full ${
                freshness === 'fresh'
                  ? 'bg-emerald-500'
                  : freshness === 'stale'
                    ? 'bg-amber-500'
                    : freshness === 'old'
                      ? 'bg-red-500'
                      : 'bg-slate-400'
              }`} />
              {isLoadingGcc ? 'Actualizando...' : formatUpdatedAgo(lastUpdatedAt)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-black text-slate-500 uppercase">Activos</p>
            <p className="text-lg font-black text-slate-900">{gccMetrics.activos}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[9px] font-black text-amber-700 uppercase">Vence en 2 días</p>
            <p className="text-lg font-black text-amber-800">{gccMetrics.t2}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-[9px] font-black text-rose-700 uppercase">Vence mañana</p>
            <p className="text-lg font-black text-rose-800">{gccMetrics.t1}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-[9px] font-black text-red-700 uppercase">Vencidos</p>
            <p className="text-lg font-black text-red-800">{gccMetrics.vencidos}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[9px] font-black text-emerald-700 uppercase">% Acuerdo Total</p>
            <p className="text-lg font-black text-emerald-800">{gccMetrics.acuerdoTotalPct}%</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-[9px] font-black text-blue-700 uppercase">% Acuerdo Parcial</p>
            <p className="text-lg font-black text-blue-800">{gccMetrics.acuerdoParcialPct}%</p>
          </div>
          <div className="rounded-xl border border-slate-300 bg-slate-100 p-3">
            <p className="text-[9px] font-black text-slate-700 uppercase">% Sin Acuerdo</p>
            <p className="text-lg font-black text-slate-900">{gccMetrics.sinAcuerdoPct}%</p>
          </div>
        </div>
      </section>

      {/* Expedientes en Seguimiento */}
      <section className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
        {/* Barra de filtros */}
        <div className="p-4 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/40">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-8 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-slate-800 text-lg md:text-xl tracking-tight uppercase">
              {courseFilter ? `Expedientes: ${courseFilter}` : 'Expedientes en Seguimiento'}
            </h3>
            {courseFilter && (
              <button
                onClick={() => setCourseFilter(null)}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full hover:bg-blue-200"
              >
                ✕ Limpiar
              </button>
            )}
          </div>

          <div className="relative w-full md:w-96">
            <label htmlFor="dashboard-search" className="sr-only">Buscar expedientes</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              id="dashboard-search"
              type="text"
              placeholder="Buscar por nombre, folio o gravedad..."
              aria-label="Buscar expedientes por nombre, folio o gravedad"
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Vista móvil */}
        <div className="md:hidden p-4 space-y-4">
          {displayedExpedientes.length > 0 ? (
            displayedExpedientes.map((exp) => (
              <ExpedienteCard
                key={exp.id}
                exp={exp}
                onClick={() => navigate(`/expedientes/${exp.id}`)}
              />
            ))
          ) : (
            <EmptyState searchTerm={searchTerm} />
          )}
        </div>

        {/* Vista escritorio */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 md:px-10 py-5 font-black">Folio</th>
                <th className="px-4 md:px-10 py-5 font-black">Estudiante (NNA)</th>
                <th className="px-4 md:px-10 py-5 font-black">Gravedad</th>
                <th className="px-4 md:px-10 py-5 font-black">Etapa Legal</th>
                <th className="px-4 md:px-10 py-5 font-black">Plazo Fatal</th>
                <th className="px-4 md:px-10 py-5 font-black text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayedExpedientes.length > 0 ? (
                displayedExpedientes.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-blue-50/40 transition-all group cursor-pointer"
                    onClick={() => navigate(`/expedientes/${exp.id}`)}
                  >
                    <td className="px-4 md:px-10 py-6">
                      <span className="font-mono text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                        {exp.id}
                      </span>
                    </td>
                    <td className="px-4 md:px-10 py-6">
                      <div className="flex items-center space-x-4">
                        <EstudianteBadge
                          nombre={exp.nnaNombre}
                          curso={exp.nnaCurso}
                          size="md"
                          showIcon={true}
                        />
                      </div>
                    </td>
                    <td className="px-4 md:px-10 py-6">
                      <NormativeBadge gravedad={exp.gravedad} />
                    </td>
                    <td className="px-4 md:px-10 py-6">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${exp.etapa.startsWith('CERRADO') ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                          {formatEtapaLabel(exp.etapa)}
                        </span>
                      </div>
                      {isSeguimientoScc(exp.etapa) && (
                        <span className="mt-1 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-tight text-emerald-700">
                          En Seguimiento GCC
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-10 py-6">
                      <PlazoCounter fechaLimite={exp.plazoFatal} />
                    </td>
                    <td className="px-4 md:px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResumenExpedienteId(exp.dbId ?? exp.id);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Ver Resumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/expedientes/${exp.id}?tab=timeline`);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Ver Timeline"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/expedientes/${exp.id}/editar?modo=apertura`);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Editar apertura"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/expedientes/${exp.id}`);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 text-blue-600 bg-blue-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm group-hover:translate-x-1"
                          title="Ir al expediente"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 md:px-10 py-12 md:py-20">
                    <div className="text-center space-y-4 bg-slate-50/20 py-12 rounded-2xl">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-sm">
                        {searchTerm ? <FilterX className="w-10 h-10" /> : <Files className="w-10 h-10" />}
                      </div>
                      <div>
                        <p className="text-slate-800 font-black text-sm uppercase tracking-widest">
                          {searchTerm ? 'Sin coincidencias' : 'No hay expedientes'}
                        </p>
                        <p className="text-slate-400 font-bold text-[10px] uppercase mt-1 tracking-tight italic">
                          {searchTerm ? `No encontramos resultados para "${searchTerm}"` : 'No se han detectado procesos disciplinarios activos.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Distribución por Curso - Separado después de Expedientes en Seguimiento */}
      <DistribucionPorCurso
        statsByCourse={statsByCourse}
        currentFilter={courseFilter}
        onFilterByCourse={(course) => setCourseFilter(course)}
      />
      
      {/* Modal de Resumen de Expediente */}
      {resumenExpedienteId && (
        <ExpedienteResumenModal
          expedienteId={resumenExpedienteId}
          isOpen={!!resumenExpedienteId}
          onClose={() => setResumenExpedienteId(null)}
        />
      )}
    </main>
  );
};

export default Dashboard;
