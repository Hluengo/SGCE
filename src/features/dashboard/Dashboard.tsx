
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useExpedientes } from '@/shared/hooks';
import { useToast } from '@/shared/components/Toast/ToastProvider';
import NormativeBadge from '@/shared/components/NormativeBadge';
import PlazoCounter from '@/shared/components/PlazoCounter';
import { EstudianteBadge } from '@/shared/components/EstudianteBadge';
import { AsyncState } from '@/shared/components/ui';
import type { GravedadFalta } from '@/types';
import { EstadisticasConvivencia, DistribucionPorCurso } from './EstadisticasConvivencia';
import { FilePlus, ArrowRight, Files, Search, FilterX, Eye, History, FileText } from 'lucide-react';
import { ExpedienteResumenModal } from '@/features/expedientes/ExpedienteResumenModal';
import { GccDashboard } from '@/features/mediacion/components';

const isSeguimientoScc = (etapa?: string | null): boolean => {
  const value = (etapa ?? '').toUpperCase();
  return value.includes('GCC') || value.includes('SCC');
};

const formatEtapaLabel = (etapa?: string | null): string => {
  const value = (etapa ?? '').toUpperCase();
  if (value === 'CERRADO_GCC') return 'PAUSA LEGAL';
  return (etapa ?? '').replace('_', ' ');
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
    className="w-full text-left bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 hover:border-blue-200"
  >
    <div className="flex items-center justify-between">
      <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
        {exp.id}
      </span>
      <NormativeBadge gravedad={exp.gravedad} />
    </div>
    <div>
      <p className="text-xs font-black text-slate-400 uppercase">Estudiante</p>
      <EstudianteBadge
        nombre={exp.nnaNombre}
        curso={exp.nnaCurso}
        size="sm"
      />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-black text-slate-400 uppercase">Etapa</p>
        <p className="text-xs font-black text-slate-600 uppercase">{formatEtapaLabel(exp.etapa)}</p>
        {isSeguimientoScc(exp.etapa) && (
          <span className="mt-1 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-black uppercase tracking-tight text-emerald-700">
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
  <div className="px-4 py-12 text-center space-y-4">
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-sm">
      {searchTerm ? <FilterX className="w-8 h-8" /> : <Files className="w-8 h-8" />}
    </div>
    <p className="text-slate-800 font-black text-xs uppercase tracking-widest">
      {searchTerm ? 'Sin coincidencias' : 'No hay expedientes'}
    </p>
  </div>
);

const SeguimientoExpedientesSection: React.FC<{
  displayedExpedientes: Array<{
    id: string;
    dbId?: string | null;
    nnaNombre: string;
    nnaCurso?: string | null;
    gravedad: GravedadFalta;
    etapa: string;
    plazoFatal: string;
  }>;
  courseFilter: string | null;
  setCourseFilter: (course: string | null) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  navigate: (path: string) => void;
  onOpenResumen: (expedienteId: string) => void;
}> = ({
  displayedExpedientes,
  courseFilter,
  setCourseFilter,
  searchTerm,
  setSearchTerm,
  navigate,
  onOpenResumen
}) => (
  <section className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
    <div className="p-4 md:p-6 lg:p-8 border-b border-slate-100 space-y-4 md:space-y-0 md:flex md:flex-row md:justify-between md:items-center md:gap-6 bg-slate-50/40">
      <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
        <div className="w-3 h-8 bg-blue-600 rounded-full flex-shrink-0"></div>
        <h3 className="font-black text-slate-800 text-lg md:text-base lg:text-lg tracking-tight uppercase truncate">
          {courseFilter ? `Expedientes: ${courseFilter}` : 'Expedientes en Seguimiento'}
        </h3>
        {courseFilter && (
          <button
            onClick={() => setCourseFilter(null)}
            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full hover:bg-blue-200 flex-shrink-0"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      <div className="relative w-full md:flex-1 md:max-w-xs lg:max-w-sm">
        <label htmlFor="dashboard-search" className="sr-only">Buscar expedientes</label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input
          id="dashboard-search"
          type="text"
          placeholder="Buscar por nombre, folio o gravedad..."
          aria-label="Buscar expedientes por nombre, folio o gravedad"
          className="w-full pl-12 pr-6 py-3 md:py-2.5 bg-white border border-slate-200 rounded-xl md:rounded-lg text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>

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

    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs md:text-sm">
        <thead>
          <tr className="text-xs text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
            <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 font-black">Folio</th>
            <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 font-black">Estudiante (NNA)</th>
            <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 font-black hidden sm:table-cell">Gravedad</th>
            <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 font-black hidden md:table-cell">Etapa Legal</th>
            <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 font-black hidden lg:table-cell">Plazo Fatal</th>
            <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 font-black text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {displayedExpedientes.length > 0 ? (
            displayedExpedientes.map((exp) => (
              <tr
                key={exp.id}
                className="hover:bg-blue-50/40 transition-all group cursor-pointer text-xs md:text-sm"
                onClick={() => navigate(`/expedientes/${exp.id}`)}
              >
                <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4">
                  <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 md:px-3 py-1 rounded-lg md:rounded-xl border border-blue-100 whitespace-nowrap">
                    {exp.id}
                  </span>
                </td>
                <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4">
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                    <EstudianteBadge
                      nombre={exp.nnaNombre}
                      curso={exp.nnaCurso}
                      size="sm"
                      showIcon={true}
                    />
                  </div>
                </td>
                <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4 hidden sm:table-cell">
                  <NormativeBadge gravedad={exp.gravedad} />
                </td>
                <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4 hidden md:table-cell">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${exp.etapa.startsWith('CERRADO') ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tight">
                      {formatEtapaLabel(exp.etapa)}
                    </span>
                  </div>
                  {isSeguimientoScc(exp.etapa) && (
                    <span className="mt-1 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-black uppercase tracking-tight text-emerald-700">
                      En Seguimiento GCC
                    </span>
                  )}
                </td>
                <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4 hidden lg:table-cell">
                  <PlazoCounter fechaLimite={exp.plazoFatal} />
                </td>
                <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-right">
                  <div className="flex items-center justify-end gap-1 md:gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenResumen(exp.dbId ?? exp.id);
                      }}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg md:rounded-xl transition-all flex-shrink-0"
                      title="Ver Resumen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/expedientes/${exp.id}?tab=timeline`);
                      }}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg md:rounded-xl transition-all flex-shrink-0"
                      title="Ver Timeline"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/expedientes/${exp.id}/editar?modo=apertura`);
                      }}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg md:rounded-xl transition-all flex-shrink-0"
                      title="Editar apertura"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/expedientes/${exp.id}`);
                      }}
                      className="inline-flex items-center justify-center w-8 md:w-10 h-8 md:h-10 text-blue-600 bg-blue-50 rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm group-hover:translate-x-1 flex-shrink-0"
                      title="Ir al expediente"
                    >
                      <ArrowRight className="w-4 md:w-5 h-4 md:h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-3 md:px-4 lg:px-6 py-8 md:py-12 lg:py-20">
                <AsyncState
                  state="empty"
                  title={searchTerm ? 'Sin coincidencias' : 'No hay expedientes'}
                  message={searchTerm ? `No encontramos resultados para "${searchTerm}"` : 'No se han detectado procesos disciplinarios activos.'}
                  compact
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

/**
 * Dashboard principal con estadísticas y distribución por curso
 */
const Dashboard: React.FC = () => {
  const { expedientes, setIsWizardOpen } = useConvivencia();
  const { filteredExpedientes, searchTerm, setSearchTerm } = useExpedientes(expedientes);
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
          className="flex items-center space-x-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 group"
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
      <section className="space-y-3">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
          Panel de Gestión Colaborativa de Conflictos
        </h3>
        <GccDashboard />
      </section>

      <SeguimientoExpedientesSection
        displayedExpedientes={displayedExpedientes}
        courseFilter={courseFilter}
        setCourseFilter={setCourseFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        navigate={navigate}
        onOpenResumen={setResumenExpedienteId}
      />

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


