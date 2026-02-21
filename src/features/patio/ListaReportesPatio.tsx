import React, { useEffect, useReducer } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { addBusinessDays } from '@/shared/utils/plazos';
import {
  AlertOctagon,
  CheckCircle,
  Clock,
  ArrowRight,
  Eye,
  Plus,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EstudianteBadge } from '@/shared/components/EstudianteBadge';
import ReportePatioModal from '@/features/dashboard/ReportePatioModal';
import PageTitleHeader from '@/shared/components/PageTitleHeader';

interface ReportePatio {
  id: string;
  informante: string;
  estudiante_id: string | null;
  estudiante_nombre: string | null;
  estudiante_curso: string | null;
  lugar: string | null;
  descripcion: string;
  gravedad_percibida: string;
  estado: string;
  accion_tomada: string | null;
  expediente_id: string | null;
  created_at: string;
}

type ActionStatus = { type: 'success' | 'error' | 'info'; message: string } | null;
type FilterType = 'ALL' | 'PENDIENTE' | 'DERIVADO';

interface ListaReportesState {
  reportes: ReportePatio[];
  loading: boolean;
  filter: FilterType;
  showModal: boolean;
  actionStatus: ActionStatus;
}

type ListaReportesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REPORTES'; payload: ReportePatio[] }
  | { type: 'SET_FILTER'; payload: FilterType }
  | { type: 'SET_SHOW_MODAL'; payload: boolean }
  | { type: 'SET_ACTION_STATUS'; payload: ActionStatus }
  | { type: 'UPDATE_REPORTE'; payload: { id: string; patch: Partial<ReportePatio> } };

const initialState: ListaReportesState = {
  reportes: [],
  loading: true,
  filter: 'ALL',
  showModal: false,
  actionStatus: null
};

function listaReportesReducer(state: ListaReportesState, action: ListaReportesAction): ListaReportesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_REPORTES':
      return { ...state, reportes: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SHOW_MODAL':
      return { ...state, showModal: action.payload };
    case 'SET_ACTION_STATUS':
      return { ...state, actionStatus: action.payload };
    case 'UPDATE_REPORTE':
      return {
        ...state,
        reportes: state.reportes.map((r) => (r.id === action.payload.id ? { ...r, ...action.payload.patch } : r))
      };
    default:
      return state;
  }
}

const FilterButtons: React.FC<{
  filter: FilterType;
  onFilter: (filter: FilterType) => void;
}> = ({ filter, onFilter }) => (
  <div className="flex gap-4 mb-6">
    {[
      { key: 'ALL', label: 'Todos' },
      { key: 'PENDIENTE', label: 'Pendientes' },
      { key: 'DERIVADO', label: 'Derivados' }
    ].map(f => (
      <button
        key={f.key}
        onClick={() => onFilter(f.key as FilterType)}
        className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-colors ${filter === f.key
          ? 'bg-blue-600 text-white'
          : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
      >
        {f.label}
      </button>
    ))}
  </div>
);

const ReportesStats: React.FC<{ reportes: ReportePatio[] }> = ({ reportes }) => (
  <div className="grid grid-cols-4 gap-4 mb-8">
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <p className="text-2xl font-black text-slate-900">{reportes.length}</p>
      <p className="text-xs text-slate-500 font-bold uppercase">Total</p>
    </div>
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <p className="text-2xl font-black text-amber-600">{reportes.filter(r => r.estado === 'PENDIENTE').length}</p>
      <p className="text-xs text-slate-500 font-bold uppercase">Pendientes</p>
    </div>
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <p className="text-2xl font-black text-purple-600">{reportes.filter(r => r.estado === 'DERIVADO').length}</p>
      <p className="text-xs text-slate-500 font-bold uppercase">Derivados</p>
    </div>
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <p className="text-2xl font-black text-emerald-600">{reportes.filter(r => r.estado === 'CERRADO').length}</p>
      <p className="text-xs text-slate-500 font-bold uppercase">Cerrados</p>
    </div>
  </div>
);

const ReporteCard: React.FC<{
  reporte: ReportePatio;
  getGravedadColor: (gravedad: string) => string;
  getEstadoIcon: (estado: string) => React.ReactNode;
  onActualizarEstado: (id: string, estado: string) => void;
  onDerivar: (id: string) => void;
  onIrAExpediente: (id: string) => void;
}> = ({ reporte, getGravedadColor, getEstadoIcon, onActualizarEstado, onDerivar, onIrAExpediente }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getGravedadColor(reporte.gravedad_percibida)}`}>
            {reporte.gravedad_percibida}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase">
            {getEstadoIcon(reporte.estado)}
            {reporte.estado}
          </span>
        </div>
        <EstudianteBadge nombre={reporte.estudiante_nombre || 'Sin nombre'} curso={reporte.estudiante_curso} size="md" />
        <p className="text-xs text-slate-400 mt-2">
          {reporte.lugar} • {new Date(reporte.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-mono text-blue-500 font-bold">{reporte.id.slice(0, 8)}</p>
        <p className="text-xs text-slate-400 uppercase">{reporte.informante}</p>
      </div>
    </div>

    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{reporte.descripcion}</p>

    {reporte.accion_tomada && (
      <div className="bg-slate-50 p-3 rounded-xl mb-4">
        <p className="text-xs font-black text-slate-400 uppercase mb-1">Acción tomada</p>
        <p className="text-xs text-slate-700">{reporte.accion_tomada}</p>
      </div>
    )}

    <div className="flex gap-2">
      {reporte.estado === 'PENDIENTE' && (
        <>
          <button
            onClick={() => onActualizarEstado(reporte.id, 'EN_REVISION')}
            className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-black uppercase hover:bg-blue-200 transition-colors"
          >
            En Revisión
          </button>
          <button
            onClick={() => onDerivar(reporte.id)}
            className="flex-1 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-black uppercase hover:bg-purple-200 transition-colors"
          >
            Derivar
          </button>
        </>
      )}
      {reporte.estado === 'EN_REVISION' && (
        <button
          onClick={() => onDerivar(reporte.id)}
          className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-black uppercase hover:bg-purple-700 transition-colors"
        >
          Derivar a Expediente
        </button>
      )}
      {reporte.estado === 'DERIVADO' && reporte.expediente_id && (
        <button
          onClick={() => onIrAExpediente(reporte.expediente_id as string)}
          className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase hover:bg-slate-800 transition-colors"
        >
          Ver Expediente
        </button>
      )}
      {reporte.estado !== 'CERRADO' && (
        <button
          onClick={() => onActualizarEstado(reporte.id, 'CERRADO')}
          className="px-4 py-2 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-black uppercase transition-colors"
        >
          Cerrar
        </button>
      )}
    </div>
  </div>
);

const getGravedadColor = (gravedad: string) => {
  switch (gravedad) {
    case 'LEVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'RELEVANTE': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'GRAVE': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case 'PENDIENTE': return <Clock className="w-4 h-4 text-amber-500" />;
    case 'EN_REVISION': return <Eye className="w-4 h-4 text-blue-500" />;
    case 'DERIVADO': return <ArrowRight className="w-4 h-4 text-purple-500" />;
    case 'CERRADO': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    default: return null;
  }
};

const mapReporteToTipoFalta = (gravedad: string): 'leve' | 'relevante' | 'expulsion' => {
  const g = (gravedad || '').toUpperCase();
  if (g === 'LEVE') return 'leve';
  if (g === 'RELEVANTE') return 'relevante';
  return 'expulsion';
};

const generarFolio = () => {
  const year = new Date().getFullYear();
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `EXP-${year}-${suffix}`;
};

const ListaReportesPatio: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const [state, dispatch] = useReducer(listaReportesReducer, initialState);

  const loadReportes = async () => {
    if (!supabase || !tenantId) {
      dispatch({ type: 'SET_REPORTES', payload: [] });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    const { data, error } = await supabase
      .from('reportes_patio')
      .select('*')
      .eq('establecimiento_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error cargando reportes:', error);
      dispatch({ type: 'SET_REPORTES', payload: [] });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    dispatch({ type: 'SET_REPORTES', payload: data as ReportePatio[] });
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  useEffect(() => {
    // Evitar mezcla visual al cambiar de colegio.
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_REPORTES', payload: [] });
    void loadReportes();
  }, [tenantId]);

  const handleReporteCreado = () => {
    void loadReportes();
    dispatch({ type: 'SET_SHOW_MODAL', payload: false });
  };

  const filteredReportes = state.reportes.filter((r) => {
    if (state.filter === 'ALL') return true;
    return r.estado === state.filter;
  });

  const handleIrAExpediente = async (expedienteDbIdOrFolio: string) => {
    if (!supabase) {
      navigate(`/expedientes/${expedienteDbIdOrFolio}`);
      return;
    }
    const { data } = await supabase
      .from('expedientes')
      .select('folio')
      .eq('id', expedienteDbIdOrFolio)
      .maybeSingle();
    navigate(`/expedientes/${data?.folio ?? expedienteDbIdOrFolio}`);
  };

  const handleDerivar = async (reporteId: string) => {
    if (!supabase || !tenantId) return;
    const reporte = state.reportes.find((r) => r.id === reporteId);
    if (!reporte) return;

    if (reporte.expediente_id) {
      await handleIrAExpediente(reporte.expediente_id);
      return;
    }

    if (!reporte.estudiante_id) {
      dispatch({ type: 'SET_ACTION_STATUS', payload: { type: 'error', message: 'No se puede derivar: el reporte no tiene estudiante asociado.' } });
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      dispatch({ type: 'SET_ACTION_STATUS', payload: { type: 'error', message: 'Debes iniciar sesión para derivar a expediente.' } });
      return;
    }

    dispatch({ type: 'SET_ACTION_STATUS', payload: { type: 'info', message: 'Derivando reporte a expediente...' } });

    let expedienteDbId: string | null = null;
    let expedienteFolio: string | null = null;

    try {
      const { data: existente, error: searchError } = await supabase
        .from('expedientes')
        .select('*')
        .eq('establecimiento_id', tenantId)
        .eq('estudiante_id', reporte.estudiante_id)
        .neq('estado_legal', 'cerrado')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (searchError) {
        console.error('Error buscando expediente existente:', { searchError, tenantId, estudiante_id: reporte.estudiante_id });
        dispatch({ type: 'SET_ACTION_STATUS', payload: { type: 'error', message: `Error al buscar expedientes: ${searchError.message}` } });
        return;
      }

      if (existente?.id) {
        expedienteDbId = existente.id;
        expedienteFolio = existente.folio;
      } else {
      const tipoFalta = mapReporteToTipoFalta(reporte.gravedad_percibida);
      const esExpulsion = tipoFalta === 'expulsion';
      const folio = generarFolio();
      const fechaInicio = new Date().toISOString();
      const plazoFatal = addBusinessDays(new Date(), esExpulsion ? 10 : 40).toISOString();

      const { data: inserted, error: insertError } = await supabase
        .from('expedientes')
        .insert({
          establecimiento_id: tenantId,
          estudiante_id: reporte.estudiante_id,
          folio,
          tipo_falta: tipoFalta,
          estado_legal: 'apertura',
          etapa_proceso: 'INICIO',
          fecha_inicio: fechaInicio,
          plazo_fatal: plazoFatal,
          creado_por: userId,
          acciones_previas: false,
          es_proceso_expulsion: esExpulsion,
          descripcion_hechos: reporte.descripcion,
          lugar_incidente: reporte.lugar,
          curso: reporte.estudiante_curso
        })
        .select('id, folio')
        .single();

      if (insertError || !inserted?.id) {
        console.error('Error creando expediente:', { insertError, tenantId, estudiante_id: reporte.estudiante_id });
        dispatch({ type: 'SET_ACTION_STATUS', payload: { type: 'error', message: `No se pudo crear expediente: ${insertError?.message ?? 'sin detalle'}` } });
        return;
      }
      expedienteDbId = inserted.id;
      expedienteFolio = inserted.folio;
    }

    const { error: reporteError } = await supabase
      .from('reportes_patio')
      .update({
        estado: 'DERIVADO',
        expediente_id: expedienteDbId,
        accion_tomada: `Derivado a expediente ${expedienteFolio}`
      })
      .eq('id', reporteId);

    if (reporteError) {
      dispatch({ type: 'SET_ACTION_STATUS', payload: { type: 'error', message: `Se creó/vinculó expediente, pero no se pudo actualizar reporte: ${reporteError.message}` } });
      return;
    }

    dispatch({
      type: 'UPDATE_REPORTE',
      payload: {
        id: reporteId,
        patch: { estado: 'DERIVADO', expediente_id: expedienteDbId, accion_tomada: `Derivado a expediente ${expedienteFolio}` }
      }
    });
    dispatch({ type: 'SET_ACTION_STATUS', payload: { type: 'success', message: `Reporte derivado correctamente al expediente ${expedienteFolio}.` } });
    navigate(`/expedientes/${expedienteFolio}`);
    } catch (error) {
      console.error('Error inesperado en derivación:', error);
      dispatch({ type: 'SET_ACTION_STATUS', payload: { type: 'error', message: `Error inesperado: ${error instanceof Error ? error.message : 'sin detalle'}` } });
    }
  };

  const handleActualizarEstado = async (reporteId: string, nuevoEstado: string) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('reportes_patio')
      .update({ estado: nuevoEstado })
      .eq('id', reporteId);

    if (error) {
      console.error('Error actualizando estado:', error);
      return;
    }

    dispatch({ type: 'UPDATE_REPORTE', payload: { id: reporteId, patch: { estado: nuevoEstado } } });
  };

  if (state.loading) {
    return (
      <main className="flex-1 p-4 md:p-8 bg-slate-50 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 bg-slate-50 overflow-y-auto">
      <header className="mb-8">
        <PageTitleHeader
          className="w-full"
          title="Registros de Patio"
          subtitle="Incidentes de convivencia y trazabilidad de acciones · Circulares 781 y 782"
          icon={ClipboardList}
          actions={
            <button
              onClick={() => dispatch({ type: 'SET_SHOW_MODAL', payload: true })}
              className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-500 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Reporte</span>
            </button>
          }
        />
      </header>

      {/* Filtros */}
      {state.actionStatus && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-bold ${
          state.actionStatus.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : state.actionStatus.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-blue-200 bg-blue-50 text-blue-700'
        }`}>
          {state.actionStatus.message}
        </div>
      )}

      <FilterButtons
        filter={state.filter}
        onFilter={(filter) => dispatch({ type: 'SET_FILTER', payload: filter })}
      />

      <ReportesStats reportes={state.reportes} />

      {/* Lista de reportes */}
      <div className="space-y-4">
        {filteredReportes.map(reporte => (
          <ReporteCard
            key={reporte.id}
            reporte={reporte}
            getGravedadColor={getGravedadColor}
            getEstadoIcon={getEstadoIcon}
            onActualizarEstado={handleActualizarEstado}
            onDerivar={(id) => {
              void handleDerivar(id);
            }}
            onIrAExpediente={(id) => {
              void handleIrAExpediente(id);
            }}
          />
        ))}

        {filteredReportes.length === 0 && (
          <div className="text-center py-12">
            <AlertOctagon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase">No hay reportes</p>
            <p className="text-sm text-slate-400">Los reportes aparecerán aquí cuando se creen</p>
          </div>
        )}
      </div>

      {/* Modal de Nuevo Reporte */}
      <ReportePatioModal
        isOpen={state.showModal}
        onClose={() => dispatch({ type: 'SET_SHOW_MODAL', payload: false })}
        onSuccess={handleReporteCreado}
      />
    </main>
  );
};

export default ListaReportesPatio;

