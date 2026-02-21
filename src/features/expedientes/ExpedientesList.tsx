/**
 * ExpedientesList - Componente de Listado y Filtrado de Expedientes Disciplinarios
 * Cumple con Circulares 781 y 782 de la Superintendencia de Educación
 *
 * Funcionalidades:
 * - Listado paginado de expedientes
 * - Búsqueda por folio, estudiante, fecha
 * - Filtros por estado, gravedad, tipo de falta
 * - Indicadores visuales de plazos
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useToast } from '@/shared/components/Toast/ToastProvider';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  Download,
  Users,
  Eye,
  History,
  ArrowRight
} from 'lucide-react';
import { EtapaProceso, GravedadFalta } from '@/types';
import { calcularDiasRestantes, esPlazoProximoVencer, AlertaPlazo } from '@/shared/utils/plazos';
import { AsyncState } from '@/shared/components/ui';
import { ExpedienteResumenModal } from './ExpedienteResumenModal';
import PageTitleHeader from '@/shared/components/PageTitleHeader';

/**
 * Opciones de filtrado
 */
interface FiltrosExpediente {
  busqueda: string;
  estado: EtapaProceso | 'TODOS';
  gravedad: GravedadFalta | 'TODOS';
  fechaDesde: string;
  fechaHasta: string;
  conPlazoProximo: boolean;
  conContraparte: boolean;
}

/**
 * Configuración de columnas para ordenamiento
 */
interface SortConfig {
  field: keyof typeof SORT_FIELDS;
  direction: 'asc' | 'desc';
}

const SORT_FIELDS = {
  id: 'Folio',
  nnaNombre: 'Estudiante',
  fechaInicio: 'Fecha Inicio',
  gravedad: 'Gravedad',
  etapa: 'Estado',
  plazoFatal: 'Plazo Fatal'
} as const;

const EXPEDIENTES_POR_PAGINA = 10;
type ExpedienteItem = ReturnType<typeof useConvivencia>['expedientes'][number];

const ExpedientesToolbar: React.FC<{
  hasResultados: boolean;
  onExport: () => void;
  onCreate: () => void;
}> = ({ hasResultados, onExport, onCreate }) => (
  <header>
    <PageTitleHeader
      title="Gestión de Expedientes"
      subtitle="Procedimiento disciplinario y medidas formativas · Circulares 781 y 782"
      icon={FileText}
      actions={(
        <div className="flex items-center space-x-3">
          <button
            onClick={onExport}
            disabled={!hasResultados}
            className="px-4 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={onCreate}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Expediente</span>
          </button>
        </div>
      )}
    />
  </header>
);

const ExpedientesFiltersCard: React.FC<{
  filtros: FiltrosExpediente;
  showFilters: boolean;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosExpediente>>;
  toggleFilters: () => void;
  limpiarFiltros: () => void;
}> = ({ filtros, showFilters, setFiltros, toggleFilters, limpiarFiltros }) => (
  <div className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/20 p-4 md:p-6 space-y-4">
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <label htmlFor="expedientes-search" className="sr-only">Buscar expedientes</label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
        <input
          id="expedientes-search"
          type="text"
          placeholder="Buscar por folio, estudiante, estado..."
          aria-label="Buscar expedientes por folio, estudiante o estado"
          value={filtros.busqueda}
          onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 focus:outline-none transition-all"
        />
      </div>

      <button
        onClick={toggleFilters}
        className={`px-4 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all flex items-center space-x-2 ${
          showFilters
            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Filtros</span>
        {(filtros.estado !== 'TODOS' || filtros.gravedad !== 'TODOS' || filtros.conPlazoProximo || filtros.conContraparte) && (
          <span className="w-2 h-2 bg-indigo-500 rounded-full" />
        )}
      </button>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => setFiltros(prev => ({ ...prev, conContraparte: !prev.conContraparte }))}
        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
          filtros.conContraparte
            ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
        }`}
      >
        Solo con contraparte (A/B)
      </button>
    </div>

    {showFilters && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
            Estado
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value as EtapaProceso | 'TODOS' }))}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 focus:outline-none"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="INICIO">Inicio</option>
              <option value="NOTIFICADO">Notificado</option>
              <option value="DESCARGOS">Descargos</option>
              <option value="INVESTIGACION">Investigación</option>
              <option value="RESOLUCION_PENDIENTE">Resolución Pendiente</option>
              <option value="RECONSIDERACION">Reconsideración</option>
              <option value="CERRADO_SANCION">Cerrado Sanción</option>
              <option value="CERRADO_GCC">EN PAUSA LEGAL</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
            Gravedad
            <select
              value={filtros.gravedad}
              onChange={(e) => setFiltros(prev => ({ ...prev, gravedad: e.target.value as GravedadFalta | 'TODOS' }))}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 focus:outline-none"
            >
              <option value="TODOS">Todas las gravedades</option>
              <option value="LEVE">Leve</option>
              <option value="RELEVANTE">Relevante</option>
              <option value="GRAVE">Grave</option>
              <option value="GRAVISIMA_EXPULSION">Gravísima (Expulsión)</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
            Fecha Desde
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 focus:outline-none"
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
            Fecha Hasta
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
              className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 focus:outline-none"
            />
          </label>
        </div>
      </div>
    )}

    <div className="flex items-center justify-between pt-2">
      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={filtros.conPlazoProximo}
          onChange={(e) => setFiltros(prev => ({ ...prev, conPlazoProximo: e.target.checked }))}
          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-bold text-slate-700">Solo plazos próximos a vencer</span>
      </label>

      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={filtros.conContraparte}
          onChange={(e) => setFiltros(prev => ({ ...prev, conContraparte: e.target.checked }))}
          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-bold text-slate-700">Solo expedientes con contraparte (A/B)</span>
      </label>

      <button
        onClick={limpiarFiltros}
        className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  </div>
);

const ExpedientesTableSection: React.FC<{
  expedientesPaginados: ExpedienteItem[];
  filtros: FiltrosExpediente;
  sortConfig: SortConfig;
  handleSort: (field: keyof typeof SORT_FIELDS) => void;
  navigate: ReturnType<typeof useNavigate>;
  setResumenExpedienteId: (id: string) => void;
  getPlazoIndicator: (plazoFatal: string) => { color: string; text: string };
  getGravedadColor: (gravedad: GravedadFalta) => string;
  getEstadoColor: (etapa: EtapaProceso) => string;
  firstItemIndex: number;
  lastItemIndex: number;
  filteredCount: number;
  paginaActualSegura: number;
  totalPaginas: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
}> = ({
  expedientesPaginados,
  filtros,
  sortConfig,
  handleSort,
  navigate,
  setResumenExpedienteId,
  getPlazoIndicator,
  getGravedadColor,
  getEstadoColor,
  firstItemIndex,
  lastItemIndex,
  filteredCount,
  paginaActualSegura,
  totalPaginas,
  onPrevPage,
  onNextPage,
  onGoToPage,
}) => (
  <div className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/20 overflow-hidden">
    <div className="hidden md:grid md:grid-cols-6 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
      {Object.entries(SORT_FIELDS).map(([field, label]) => (
        <button
          key={field}
          onClick={() => handleSort(field as keyof typeof SORT_FIELDS)}
          className="flex items-center space-x-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          <span>{label}</span>
          {sortConfig.field === field && (
            sortConfig.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
          )}
        </button>
      ))}
      <span className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">
        Acciones
      </span>
    </div>

    <div className="divide-y divide-slate-100">
      {expedientesPaginados.length === 0 ? (
        <div className="px-6 py-8">
          <AsyncState
            state="empty"
            title="Sin expedientes para mostrar"
            message={filtros.busqueda ? 'No encontramos coincidencias con los filtros actuales.' : 'Aún no hay expedientes registrados.'}
            compact
          />
        </div>
      ) : (
        expedientesPaginados.map((exp) => {
          const plazo = getPlazoIndicator(exp.plazoFatal);
          return (
            <div
              key={exp.id}
              className="group grid grid-cols-1 md:grid-cols-6 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => navigate(`/expedientes/${exp.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/expedientes/${exp.id}`);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-slate-800 uppercase">{exp.id}</span>
                  {exp.nnaNombreB && (
                    <span className="inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
                      Caso bilateral A/B
                    </span>
                  )}
                  {exp.etapa === 'CERRADO_GCC' && (
                    <span className="inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                      En Pausa Legal
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{exp.nnaNombre}</span>
                    {exp.nnaNombreB && (
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        B: {exp.nnaNombreB}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-slate-600">
                  {new Date(exp.fechaInicio).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getGravedadColor(exp.gravedad)}`}>
                  {exp.gravedad.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getEstadoColor(exp.etapa)}`}>
                  {exp.etapa === 'CERRADO_GCC' ? 'EN PAUSA LEGAL' : exp.etapa.replace('_', ' ')}
                </span>
                <div className={`w-8 h-8 rounded-full ${plazo.color} flex items-center justify-center ml-2`}>
                  <span className="text-white text-xs font-black">{plazo.text}</span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
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
                  title="Editar"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/expedientes/${exp.id}`);
                  }}
                  className="inline-flex items-center justify-center w-10 h-10 text-blue-600 bg-blue-50 rounded-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-sm md:group-hover:translate-x-1"
                  title="Ir al expediente"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>

    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
      <div className="text-sm font-medium text-slate-600">
        Mostrando {firstItemIndex} - {lastItemIndex} de {filteredCount}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onPrevPage}
          disabled={paginaActualSegura === 1 || totalPaginas === 0}
          className="p-2 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
          let pageNum: number;
          if (totalPaginas <= 5) {
            pageNum = i + 1;
          } else if (paginaActualSegura <= 3) {
            pageNum = i + 1;
          } else if (paginaActualSegura >= totalPaginas - 2) {
            pageNum = totalPaginas - 4 + i;
          } else {
            pageNum = paginaActualSegura - 2 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => onGoToPage(pageNum)}
              className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                paginaActualSegura === pageNum
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={onNextPage}
          disabled={totalPaginas === 0 || paginaActualSegura === totalPaginas}
          className="p-2 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

/**
 * Componente principal de listado
 */
const ExpedientesList: React.FC = () => {
  const navigate = useNavigate();
  const { expedientes, setIsWizardOpen } = useConvivencia();
  const toast = useToast();

  // Estados
  const [filtros, setFiltros] = useState<FiltrosExpediente>({
    busqueda: '',
    estado: 'TODOS',
    gravedad: 'TODOS',
    fechaDesde: '',
    fechaHasta: '',
    conPlazoProximo: false,
    conContraparte: false
  });
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'fechaInicio',
    direction: 'desc'
  });
  const [uiState, setUiState] = useState({
    paginaActual: 1,
    showFilters: false,
    resumenExpedienteId: null as string | null,
    alertasPlazo: [] as AlertaPlazo[]
  });
  const { paginaActual, showFilters, resumenExpedienteId, alertasPlazo } = uiState;

  // Cargar alertas de plazos
  useEffect(() => {
    const nuevasAlertas = expedientes
      .filter(exp => {
        const diasRestantes = calcularDiasRestantes(exp.plazoFatal);
        return esPlazoProximoVencer(diasRestantes);
      })
      .map(exp => ({
        expedienteId: exp.id,
        diasRestantes: calcularDiasRestantes(exp.plazoFatal),
        fechaLimite: exp.plazoFatal,
        gravedad: exp.gravedad
      }));

    setUiState((prev) => ({ ...prev, alertasPlazo: nuevasAlertas }));
  }, [expedientes]);

  // Debounce del término de búsqueda para evitar re-filtrado excesivo
  const debouncedBusqueda = useDebounce(filtros.busqueda, 300);

  // Filtrar expedientes
  const filteredExpedientes = useMemo(() => {
    let result = [...expedientes];

    // Filtro de búsqueda (debounced)
    if (debouncedBusqueda) {
      const term = debouncedBusqueda.toLowerCase();
      result = result.filter(exp =>
        exp.id.toLowerCase().includes(term) ||
        exp.nnaNombre.toLowerCase().includes(term) ||
        (exp.nnaNombreB ?? '').toLowerCase().includes(term) ||
        exp.etapa.toLowerCase().includes(term) ||
        exp.gravedad.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (filtros.estado !== 'TODOS') {
      result = result.filter(exp => exp.etapa === filtros.estado);
    }

    // Filtro por gravedad
    if (filtros.gravedad !== 'TODOS') {
      result = result.filter(exp => exp.gravedad === filtros.gravedad);
    }

    // Filtro por fecha
    if (filtros.fechaDesde) {
      result = result.filter(exp => new Date(exp.fechaInicio) >= new Date(filtros.fechaDesde));
    }
    if (filtros.fechaHasta) {
      result = result.filter(exp => new Date(exp.fechaInicio) <= new Date(filtros.fechaHasta));
    }

    // Filtro por plazo próximo
    if (filtros.conPlazoProximo) {
      result = result.filter(exp => {
        const dias = calcularDiasRestantes(exp.plazoFatal);
        return esPlazoProximoVencer(dias);
      });
    }

    // Filtro rápido: solo casos con contraparte (A/B)
    if (filtros.conContraparte) {
      result = result.filter(exp => Boolean(exp.nnaNombreB));
    }

    // Ordenamiento
    result.sort((a, b) => {
      let aVal: string | number = a[sortConfig.field as keyof typeof a] as string | number;
      let bVal: string | number = b[sortConfig.field as keyof typeof b] as string | number;

      if (sortConfig.field === 'gravedad') {
        const ordenGravedad = { GRAVISIMA_EXPULSION: 4, GRAVE: 3, RELEVANTE: 2, LEVE: 1 };
        aVal = ordenGravedad[aVal as GravedadFalta] || 0;
        bVal = ordenGravedad[bVal as GravedadFalta] || 0;
      }

      if (sortConfig.field === 'etapa') {
        const ordenEtapa: Record<EtapaProceso, number> = {
          INICIO: 1, NOTIFICADO: 2, DESCARGOS: 3, INVESTIGACION: 4,
          RESOLUCION_PENDIENTE: 5, RECONSIDERACION: 6, CERRADO_SANCION: 7, CERRADO_GCC: 7
        };
        aVal = ordenEtapa[aVal as EtapaProceso] || 0;
        bVal = ordenEtapa[bVal as EtapaProceso] || 0;
      }

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [expedientes, filtros, debouncedBusqueda, sortConfig]);

  // Paginación
  const totalPaginas = Math.ceil(filteredExpedientes.length / EXPEDIENTES_POR_PAGINA);
  const paginaActualSegura = totalPaginas > 0
    ? Math.min(Math.max(paginaActual, 1), totalPaginas)
    : 1;
  const indiceInicio = (paginaActualSegura - 1) * EXPEDIENTES_POR_PAGINA;
  const expedientesPaginados = filteredExpedientes.slice(indiceInicio, indiceInicio + EXPEDIENTES_POR_PAGINA);
  const hasResultados = filteredExpedientes.length > 0;
  const firstItemIndex = hasResultados ? indiceInicio + 1 : 0;
  const lastItemIndex = hasResultados
    ? Math.min(indiceInicio + EXPEDIENTES_POR_PAGINA, filteredExpedientes.length)
    : 0;

  useEffect(() => {
    if (totalPaginas === 0) {
      if (paginaActual !== 1) setUiState((prev) => ({ ...prev, paginaActual: 1 }));
      return;
    }
    if (paginaActual > totalPaginas) {
      setUiState((prev) => ({ ...prev, paginaActual: totalPaginas }));
    }
  }, [paginaActual, totalPaginas]);

  // Cambiar ordenamiento
  const handleSort = (field: keyof typeof SORT_FIELDS) => {
    if (sortConfig.field === field) {
      setSortConfig(prev => ({
        ...prev,
        direction: prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setSortConfig({ field, direction: 'desc' });
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: 'TODOS',
      gravedad: 'TODOS',
      fechaDesde: '',
      fechaHasta: '',
      conPlazoProximo: false,
      conContraparte: false
    });
    setUiState((prev) => ({ ...prev, paginaActual: 1 }));
  };

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Folio', 'Estudiante A', 'Estudiante B', 'Fecha Inicio', 'Gravedad', 'Estado', 'Plazo Fatal'];
    const rows = filteredExpedientes.map(exp => [
      exp.id,
      exp.nnaNombre,
      exp.nnaNombreB ?? '',
      new Date(exp.fechaInicio).toLocaleDateString(),
      exp.gravedad,
      exp.etapa,
      new Date(exp.plazoFatal).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expedientes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast?.showToast('success', 'Exportación completada', `Se exportaron ${filteredExpedientes.length} expedientes a CSV.`);
  };

  // Colores por gravedad
  const getGravedadColor = (gravedad: GravedadFalta) => {
    switch (gravedad) {
      case 'GRAVISIMA_EXPULSION': return 'text-red-600 bg-red-50 border-red-200';
      case 'RELEVANTE': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // Colores por estado
  const getEstadoColor = (etapa: EtapaProceso) => {
    if (etapa.startsWith('CERRADO')) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (etapa === 'RECONSIDERACION') return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  // Indicador de plazo
  const getPlazoIndicator = (plazoFatal: string) => {
    const dias = calcularDiasRestantes(plazoFatal);
    if (dias < 0) return { color: 'bg-red-500', text: 'Vencido' };
    if (dias <= 3) return { color: 'bg-orange-500', text: `${dias}d` };
    if (dias <= 7) return { color: 'bg-yellow-500', text: `${dias}d` };
    return { color: 'bg-emerald-500', text: `${dias}d` };
  };

  return (
    <main className="flex-1 p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50/30 overflow-y-auto">
      <ExpedientesToolbar
        hasResultados={hasResultados}
        onExport={exportarCSV}
        onCreate={() => setIsWizardOpen(true)}
      />

      {/* Alertas de plazos */}
      {alertasPlazo.length > 0 && (
        <div role="alert" className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex items-center space-x-4">
          <div className="p-3 bg-orange-500 text-white rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-black text-orange-800 uppercase text-xs">
              Plazos Próximos a Vencer
            </p>
            <p className="text-sm text-orange-700 font-medium">
              {alertasPlazo.length} expediente(s) requieren atención inmediata
            </p>
          </div>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs uppercase hover:bg-orange-600 transition-all">
            Ver Todos
          </button>
        </div>
      )}

      <ExpedientesFiltersCard
        filtros={filtros}
        showFilters={showFilters}
        setFiltros={setFiltros}
        toggleFilters={() => setUiState((prev) => ({ ...prev, showFilters: !prev.showFilters }))}
        limpiarFiltros={limpiarFiltros}
      />

      <ExpedientesTableSection
        expedientesPaginados={expedientesPaginados}
        filtros={filtros}
        sortConfig={sortConfig}
        handleSort={handleSort}
        navigate={navigate}
        setResumenExpedienteId={(id) => setUiState((prev) => ({ ...prev, resumenExpedienteId: id }))}
        getPlazoIndicator={getPlazoIndicator}
        getGravedadColor={getGravedadColor}
        getEstadoColor={getEstadoColor}
        firstItemIndex={firstItemIndex}
        lastItemIndex={lastItemIndex}
        filteredCount={filteredExpedientes.length}
        paginaActualSegura={paginaActualSegura}
        totalPaginas={totalPaginas}
        onPrevPage={() => setUiState((prev) => ({ ...prev, paginaActual: Math.max(prev.paginaActual - 1, 1) }))}
        onNextPage={() => setUiState((prev) => ({ ...prev, paginaActual: Math.min(prev.paginaActual + 1, totalPaginas || 1) }))}
        onGoToPage={(page) => setUiState((prev) => ({ ...prev, paginaActual: page }))}
      />
      
      {/* Modal de Resumen */}
      {resumenExpedienteId && (
        <ExpedienteResumenModal
          expedienteId={resumenExpedienteId}
          isOpen={!!resumenExpedienteId}
          onClose={() => setUiState((prev) => ({ ...prev, resumenExpedienteId: null }))}
        />
      )}
    </main>
  );
};

export default ExpedientesList;
