import React, { useEffect, lazy, Suspense, useMemo, useReducer } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Lock,
  ShieldCheck,
  FileDigit,
  Heart,
  Plus,
  Users,
  Search,
  Eye,
  EyeOff,
  MoreVertical,
  AlertCircle,
  Clock,
  ExternalLink,
  Filter,
  FileText,
  UserCheck
} from 'lucide-react';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { useTenantBranding } from '@/shared/hooks/useTenantBranding';
import PageTitleHeader from '@/shared/components/PageTitleHeader';

// Lazy load modales pesados para reducir bundle size
const NuevaIntervencionModal = lazy(() => import('@/features/dashboard/NuevaIntervencionModal'));
const RegistrarDerivacionModal = lazy(() => import('@/features/dashboard/RegistrarDerivacionModal'));
const OficioPreviewModal = lazy(() => import('@/features/documentos/components/OficioPreviewModal'));

interface Intervencion {
  id: string;
  nnaId: string;
  nnaNombre: string;
  fecha: string;
  tipo: 'ENTREVISTA' | 'OBSERVACION' | 'VISITA' | 'DERIVACION';
  participantes: string;
  resumen: string;
  privado: boolean;
  autor: string;
}

interface Derivacion {
  id: string;
  nnaNombre: string;
  institucion: 'OPD' | 'COSAM' | 'TRIBUNAL' | 'SALUD';
  fechaEnvio: string;
  estado: 'PENDIENTE' | 'RESPONDIDO';
  numeroOficio: string;
}

interface BitacoraPsicosocialRow {
  id: string;
  estudiante_id: string | null;
  tipo: Intervencion['tipo'] | null;
  participantes: string | null;
  resumen: string | null;
  privado: boolean | null;
  autor: string | null;
  created_at: string | null;
  estudiantes: { nombre_completo: string } | Array<{ nombre_completo: string }> | null;
}

interface DerivacionExternaRow {
  id: string;
  estudiante_id: string | null;
  nna_nombre: string | null;
  institucion: Derivacion['institucion'] | null;
  fecha_envio: string | null;
  estado: Derivacion['estado'] | null;
  numero_oficio: string | null;
  estudiantes: { nombre_completo: string } | Array<{ nombre_completo: string }> | null;
}

interface BitacoraUiState {
  showIntervencionModal: boolean;
  showDerivacionModal: boolean;
  showOficioModal: boolean;
  selectedDerivacion: Derivacion | null;
}

interface BitacoraDataState {
  intervenciones: Intervencion[];
  derivaciones: Derivacion[];
  isLoadingIntervenciones: boolean;
  isLoadingDerivaciones: boolean;
}

type BitacoraDataAction =
  | { type: 'SET_INTERVENCIONES'; payload: Intervencion[] }
  | { type: 'SET_DERIVACIONES'; payload: Derivacion[] }
  | { type: 'SET_LOADING_INTERVENCIONES'; payload: boolean }
  | { type: 'SET_LOADING_DERIVACIONES'; payload: boolean };

type BitacoraUiAction =
  | { type: 'OPEN_INTERVENCION_MODAL' }
  | { type: 'CLOSE_INTERVENCION_MODAL' }
  | { type: 'OPEN_DERIVACION_MODAL' }
  | { type: 'CLOSE_DERIVACION_MODAL' }
  | { type: 'OPEN_OFICIO_MODAL'; payload: Derivacion }
  | { type: 'CLOSE_OFICIO_MODAL' };

const initialBitacoraUiState: BitacoraUiState = {
  showIntervencionModal: false,
  showDerivacionModal: false,
  showOficioModal: false,
  selectedDerivacion: null
};

const initialBitacoraDataState: BitacoraDataState = {
  intervenciones: [],
  derivaciones: [],
  isLoadingIntervenciones: true,
  isLoadingDerivaciones: true,
};

function bitacoraUiReducer(state: BitacoraUiState, action: BitacoraUiAction): BitacoraUiState {
  switch (action.type) {
    case 'OPEN_INTERVENCION_MODAL':
      return { ...state, showIntervencionModal: true };
    case 'CLOSE_INTERVENCION_MODAL':
      return { ...state, showIntervencionModal: false };
    case 'OPEN_DERIVACION_MODAL':
      return { ...state, showDerivacionModal: true };
    case 'CLOSE_DERIVACION_MODAL':
      return { ...state, showDerivacionModal: false };
    case 'OPEN_OFICIO_MODAL':
      return { ...state, selectedDerivacion: action.payload, showOficioModal: true };
    case 'CLOSE_OFICIO_MODAL':
      return { ...state, selectedDerivacion: null, showOficioModal: false };
    default:
      return state;
  }
}

function bitacoraDataReducer(state: BitacoraDataState, action: BitacoraDataAction): BitacoraDataState {
  switch (action.type) {
    case 'SET_INTERVENCIONES':
      return { ...state, intervenciones: action.payload };
    case 'SET_DERIVACIONES':
      return { ...state, derivaciones: action.payload };
    case 'SET_LOADING_INTERVENCIONES':
      return { ...state, isLoadingIntervenciones: action.payload };
    case 'SET_LOADING_DERIVACIONES':
      return { ...state, isLoadingDerivaciones: action.payload };
    default:
      return state;
  }
}

const useBitacoraPsicosocialView = () => {
  const location = useLocation();
  const { tenantId } = useTenant();
  const { branding } = useTenantBranding();
  const [isPrivacyBlurred, setIsPrivacyBlurred] = useLocalDraft('bitacora:privacy', true);
  const [searchTerm, setSearchTerm] = useLocalDraft('bitacora:search', '');
  const [activeTab, setActiveTab] = useLocalDraft<'REGISTRO' | 'DERIVACIONES' | 'PROTOCOLOS'>('bitacora:tab', 'REGISTRO');
  const [ui, dispatch] = useReducer(bitacoraUiReducer, initialBitacoraUiState);
  const [dataState, dataDispatch] = useReducer(bitacoraDataReducer, initialBitacoraDataState);
  const { intervenciones, derivaciones, isLoadingIntervenciones, isLoadingDerivaciones } = dataState;

  useEffect(() => {
    if (location.pathname === '/bitacora/intervencion') {
      dispatch({ type: 'OPEN_INTERVENCION_MODAL' });
    } else if (location.pathname === '/bitacora/derivacion') {
      dispatch({ type: 'OPEN_DERIVACION_MODAL' });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/bitacora/intervencion') {
      setActiveTab('REGISTRO');
    } else if (location.pathname === '/bitacora/derivacion') {
      setActiveTab('DERIVACIONES');
    }
  }, [location.pathname, setActiveTab]);

  useEffect(() => {
    const loadIntervenciones = async () => {
      if (!supabase) {
        dataDispatch({ type: 'SET_LOADING_INTERVENCIONES', payload: false });
        return;
      }
      try {
        let query = supabase
          .from('bitacora_psicosocial')
          .select('id, estudiante_id, tipo, participantes, resumen, privado, autor, created_at, estudiantes(nombre_completo)')
          .order('created_at', { ascending: false })
          .limit(200);
        if (tenantId) {
          query = query.eq('establecimiento_id', tenantId);
        }
        const { data, error } = await query;

        if (error || !data || data.length === 0) {
          if (error) {
            console.warn('Supabase: no se pudieron cargar intervenciones', error);
          }
          return;
        }

        const mapped = (data as BitacoraPsicosocialRow[]).map((row): Intervencion => ({
          id: row.id,
          nnaId: row.estudiante_id ?? '',
          nnaNombre: Array.isArray(row.estudiantes) ? row.estudiantes[0]?.nombre_completo ?? 'Sin nombre' : row.estudiantes?.nombre_completo ?? 'Sin nombre',
          fecha: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          tipo: row.tipo ?? 'ENTREVISTA',
          participantes: row.participantes ?? '',
          resumen: row.resumen ?? '',
          privado: row.privado ?? true,
          autor: row.autor ?? 'Sistema'
        }));

        dataDispatch({ type: 'SET_INTERVENCIONES', payload: mapped });
      } finally {
        dataDispatch({ type: 'SET_LOADING_INTERVENCIONES', payload: false });
      }
    };

    const loadDerivaciones = async () => {
      if (!supabase) {
        dataDispatch({ type: 'SET_LOADING_DERIVACIONES', payload: false });
        return;
      }
      try {
        let query = supabase
          .from('derivaciones_externas')
          .select('id, estudiante_id, nna_nombre, institucion, fecha_envio, estado, numero_oficio, estudiantes(nombre_completo)')
          .order('fecha_envio', { ascending: false })
          .limit(200);
        if (tenantId) {
          query = query.eq('establecimiento_id', tenantId);
        }
        const { data, error } = await query;

        if (error || !data || data.length === 0) {
          if (error) {
            console.warn('Supabase: no se pudieron cargar derivaciones', error);
          }
          return;
        }

        const mapped = (data as DerivacionExternaRow[]).map((row): Derivacion => ({
          id: row.id,
          nnaNombre: row.nna_nombre ?? (Array.isArray(row.estudiantes) ? row.estudiantes[0]?.nombre_completo : row.estudiantes?.nombre_completo) ?? 'Sin nombre',
          institucion: row.institucion ?? 'OPD',
          fechaEnvio: row.fecha_envio ?? new Date().toISOString().split('T')[0],
          estado: row.estado ?? 'PENDIENTE',
          numeroOficio: row.numero_oficio ?? ''
        }));

        dataDispatch({ type: 'SET_DERIVACIONES', payload: mapped });
      } finally {
        dataDispatch({ type: 'SET_LOADING_DERIVACIONES', payload: false });
      }
    };

    loadIntervenciones();
    loadDerivaciones();
  }, [tenantId]);

  const filteredIntervenciones = useMemo(() => {
    return intervenciones.filter(i =>
      i.nnaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.resumen.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [intervenciones, searchTerm]);

  return (
    <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-700">
      <div className="px-4 md:px-8 py-4 border-b border-slate-200 bg-white">
        <PageTitleHeader
          title="Bitácora Psicosocial"
          subtitle="Registro confidencial de intervenciones y derivaciones · Circulares 781 y 782"
          icon={Heart}
        />
      </div>

      {/* Banner de Sesión Segura */}
      <div className="bg-indigo-900 text-indigo-100 px-4 md:px-8 py-2 flex flex-col md:flex-row items-start md:items-center justify-between text-xs font-black uppercase tracking-widest shrink-0 gap-4">
        <div className="flex items-center space-x-4">
          <Lock className="w-3.5 h-3.5" />
          <span>Sesión Segura: Información Confidencial Protegida (Art. 22 Ley 21.430)</span>
        </div>
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center space-x-1.5 bg-indigo-800 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Dupla Psicosocial Activa</span>
          </div>
          <button
            onClick={() => setIsPrivacyBlurred(!isPrivacyBlurred)}
            className="flex items-center space-x-2 hover:text-white transition-colors"
          >
            {isPrivacyBlurred ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isPrivacyBlurred ? 'Mostrar Contenido' : 'Activar Privacidad'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Navegación Lateral Interna */}
        <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 md:p-8 flex flex-col space-y-6">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('REGISTRO')}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'REGISTRO' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <FileDigit className="w-4 h-4" />
              <span>Bitácora Diaria</span>
            </button>
            <button
              onClick={() => setActiveTab('DERIVACIONES')}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'DERIVACIONES' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Red de Protección</span>
            </button>
            <button
              onClick={() => setActiveTab('PROTOCOLOS')}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PROTOCOLOS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Protocolos Emerg.</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <button
              onClick={() => dispatch({ type: 'OPEN_INTERVENCION_MODAL' })}
              className="w-full flex items-center space-x-4 px-4 py-3 bg-emerald-50 text-emerald-700 border-2 border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Intervención</span>
            </button>
            <button
              onClick={() => dispatch({ type: 'OPEN_DERIVACION_MODAL' })}
              className="w-full flex items-center space-x-4 px-4 py-3 bg-violet-50 text-violet-700 border-2 border-violet-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Derivación</span>
            </button>
          </div>

          <div className="mt-auto bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Buscador de Casos</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Nombre NNA..."
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </aside>

        {/* Área de Contenido Principal */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Listado de Intervenciones */}
          {activeTab === 'REGISTRO' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-slate-50/30 custom-scrollbar">
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase">Cronología de Intervenciones</h3>
                  <p className="text-xs md:text-xs text-slate-500 font-medium">Registro psicosocial histórico y confidencial.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600"><Filter className="w-4 h-4" /></button>
                </div>
              </header>

              <div className="space-y-6">
                {isLoadingIntervenciones ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-200 p-4 md:p-8 animate-pulse">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-slate-200 rounded w-1/3" />
                          <div className="h-3 bg-slate-100 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-4/5" />
                      </div>
                    </div>
                  ))
                ) : filteredIntervenciones.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm font-medium">No hay intervenciones registradas.</div>
                ) : (
                  filteredIntervenciones.map((int) => (
                  <div key={int.id} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20 p-4 md:p-8 group relative">
                    <div className="flex flex-col md:flex-row items-start md:justify-between mb-4 gap-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-4 rounded-2xl ${int.tipo === 'ENTREVISTA' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                          {int.tipo === 'ENTREVISTA' ? <Users className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-4">
                            <h4 className="text-sm font-black text-slate-900 uppercase">{int.nnaNombre}</h4>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-xs font-mono">{int.id}</span>
                            {int.privado && (
                              <span className="flex items-center text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                                <Lock className="w-3 h-3 mr-1" /> Privado Dupla
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {int.tipo} • {int.fecha} • {int.autor}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 text-slate-300 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Participantes</p>
                        <p className="text-xs font-bold text-slate-600">{int.participantes}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Relato de la Intervención</p>
                        <div className={`p-6 bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-500 ${isPrivacyBlurred ? 'blur-md select-none opacity-40' : ''}`}>
                          <p className="text-sm font-medium leading-relaxed text-slate-700">{int.resumen}</p>
                        </div>
                        {isPrivacyBlurred && (
                          <button
                            onClick={() => setIsPrivacyBlurred(false)}
                            className="absolute inset-x-0 bottom-12 flex justify-center items-center text-xs font-black text-indigo-600 uppercase hover:underline"
                          >
                            Haga clic para revelar el contenido sensible
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          )}

          {/* Panel de Derivaciones */}
          {activeTab === 'DERIVACIONES' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 animate-in slide-in-from-right-4 duration-500">
              <header>
                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase">Redes de Protección & Derivaciones</h3>
                <p className="text-xs md:text-xs text-slate-500 font-medium mt-1">Gestión de oficios y seguimiento de respuestas externas.</p>
              </header>

              <div className="grid gap-4">
                {isLoadingDerivaciones ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white p-4 md:p-8 rounded-3xl border border-slate-200 animate-pulse">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-slate-200 rounded w-1/4" />
                          <div className="h-3 bg-slate-100 rounded w-1/3" />
                          <div className="h-3 bg-slate-100 rounded w-1/5" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : derivaciones.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm font-medium">No hay derivaciones registradas.</div>
                ) : (
                  derivaciones.map((der) => (
                  <div key={der.id} className="bg-white p-4 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-4 rounded-2xl ${der.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          <ExternalLink className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase">{der.nnaNombre}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                            {der.institucion} • {der.fechaEnvio}
                          </p>
                          <p className="text-xs text-slate-500 mt-2 font-medium">{der.numeroOficio}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${der.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {der.estado}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => dispatch({ type: 'OPEN_OFICIO_MODAL', payload: der })}
                      className="mt-8 w-full py-3 bg-white border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all rounded-xl flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Ver Oficio Adjunto</span>
                    </button>
                  </div>
                ))
                )}

                <button
                  onClick={() => dispatch({ type: 'OPEN_DERIVACION_MODAL' })}
                  className="bg-indigo-50 border-2 border-indigo-200 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:bg-indigo-100 transition-all group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-indigo-900 uppercase">Registrar Nueva Derivación</h5>
                    <p className="text-xs text-indigo-400 font-medium max-w-52 mt-1">Inicie el proceso de vinculación con la red externa.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Panel de Protocolos de Emergencia */}
          {activeTab === 'PROTOCOLOS' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 animate-in zoom-in-95 duration-500">
              <header className="bg-red-600 p-4 md:p-8 rounded-3xl text-white shadow-2xl shadow-red-200 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex items-center space-x-6">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Centro de Protocolos de Vulneración</h3>
                    <p className="text-red-100 text-xs font-bold uppercase tracking-widest mt-1">Actuación Inmediata según Circular 781</p>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-4 md:p-10 rounded-3xl border border-red-100 shadow-xl shadow-red-500/5 space-y-6">
                  <h4 className="text-lg font-black text-red-700 tracking-tight uppercase flex items-center">
                    <Heart className="w-5 h-5 mr-3" /> Maltrato / Abuso Sexual
                  </h4>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Si existe sospecha fundada de abuso sexual o maltrato físico constitutivo de delito, el establecimiento tiene un plazo de <span className="font-black text-red-600 uppercase">24 horas hábiles</span> para denunciar ante el Ministerio Público, Carabineros o PDI.
                  </p>
                  <ul className="space-y-4">
                    {['Entrevista inicial de acogida (No interrogatorio)', 'Resguardo de la integridad física del NNA', 'Comunicación a Dirección', 'Denuncia Oficial / Notificación SIE'].map((step, idx) => (
                      <li key={step} className="flex items-center space-x-4 text-xs font-bold text-slate-700 uppercase">
                        <span className="w-5 h-5 rounded bg-red-50 text-red-600 flex items-center justify-center text-xs">{idx + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-200 active:scale-95 transition-all">
                    Activar Protocolo de Denuncia
                  </button>
                </div>

                <div className="bg-white p-4 md:p-10 rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5 space-y-6">
                  <h4 className="text-lg font-black text-blue-700 tracking-tight uppercase flex items-center">
                    <UserCheck className="w-5 h-5 mr-3" /> Riesgo Vital / Suicida
                  </h4>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    En caso de riesgo inminente de daño a sí mismo o terceros, proceda con la derivación inmediata a servicio de urgencia y contacte a los adultos responsables.
                  </p>
                  <ul className="space-y-4">
                    {['Contención emocional primaria', 'Supervisión constante 1:1', 'Derivación a Urgencia Salud Mental', 'Registro en bitácora privada'].map((step, idx) => (
                      <li key={step} className="flex items-center space-x-4 text-xs font-bold text-slate-700 uppercase">
                        <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-xs">{idx + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all">
                    Activar Protocolo Salud Mental
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modales de Acciones */}
      <Suspense fallback={<div />}>
      <NuevaIntervencionModal
        isOpen={ui.showIntervencionModal}
        onClose={() => dispatch({ type: 'CLOSE_INTERVENCION_MODAL' })}
        onSuccess={async () => {
          if (!supabase) return;
          const { data, error } = await supabase
            .from('bitacora_psicosocial')
            .select('id, estudiante_id, tipo, participantes, resumen, privado, autor, created_at, estudiantes(nombre_completo)')
            .order('created_at', { ascending: false })
            .limit(200);

          if (error || !data || data.length === 0) {
            if (error) {
              console.warn('Supabase: no se pudieron cargar intervenciones', error);
            }
            return;
          }

          const mapped = (data as BitacoraPsicosocialRow[]).map((row): Intervencion => ({
            id: row.id,
            nnaId: row.estudiante_id ?? '',
            nnaNombre: Array.isArray(row.estudiantes) ? row.estudiantes[0]?.nombre_completo ?? 'Sin nombre' : row.estudiantes?.nombre_completo ?? 'Sin nombre',
            fecha: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            tipo: row.tipo ?? 'ENTREVISTA',
            participantes: row.participantes ?? '',
            resumen: row.resumen ?? '',
            privado: row.privado ?? true,
            autor: row.autor ?? 'Sistema'
          }));

          dataDispatch({ type: 'SET_INTERVENCIONES', payload: mapped });
        }}
      />
      </Suspense>
      
      <Suspense fallback={<div />}>
        <RegistrarDerivacionModal
          isOpen={ui.showDerivacionModal}
          onClose={() => dispatch({ type: 'CLOSE_DERIVACION_MODAL' })}
        />
      </Suspense>

      {ui.selectedDerivacion && (
        <Suspense fallback={<div />}>
          <OficioPreviewModal
            isOpen={ui.showOficioModal}
            onClose={() => dispatch({ type: 'CLOSE_OFICIO_MODAL' })}
            data={{
              nombreEstablecimiento: branding?.nombre_publico || 'Establecimiento Educacional',
              direccionEstablecimiento: '',
              telefonoEstablecimiento: '',
              emailEstablecimiento: '',
              nombreEstudiante: ui.selectedDerivacion.nnaNombre,
              numeroOficio: ui.selectedDerivacion.numeroOficio,
              fechaDerivacion: ui.selectedDerivacion.fechaEnvio,
              institucionDestino: ui.selectedDerivacion.institucion as 'OPD' | 'COSAM' | ' TRIBUNAL' | 'SALUD',
              nombreInstitucionDestino: ui.selectedDerivacion.institucion,
              motivoDerivacion: 'Derivacion segun Circular 781/782',
              urgencia: 'MEDIA',
              nombreProfesional: 'Equipo de Convivencia Escolar'
            }}
            branding={branding ? {
              nombre_publico: branding.nombre_publico,
              logo_url: branding.logo_url,
              color_primario: branding.color_primario,
              color_secundario: branding.color_secundario,
              color_texto: branding.color_texto
            } : null}
          />
        </Suspense>
      )}

    </main>
  );
};

const BitacoraPsicosocial: React.FC = () => useBitacoraPsicosocialView();

export default BitacoraPsicosocial;
