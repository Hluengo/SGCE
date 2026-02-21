
import React, { useReducer } from 'react';
import { Hand, Users, Calendar, Clock, Send, CheckCircle, ChevronDown } from 'lucide-react';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { supabase } from '@/shared/lib/supabaseClient';

interface FormDataIntervencion {
  estudianteId: string | null;
  estudianteNombre: string;
  estudianteCurso: string;
  tipoIntervencion: string;
  responsable: string;
  objetivos: string;
  metodologia: string;
  fechaInicio: string;
  fechaFin: string;
  observaciones: string;
}

interface IntervencionUiState {
  enviado: boolean;
  submitError: string | null;
  selectedCurso: string;
  isExpanded: boolean;
  searchEstudiante: string;
}

type IntervencionUiAction =
  | { type: 'SET_ENVIADO'; payload: boolean }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_CURSO'; payload: string }
  | { type: 'SET_IS_EXPANDED'; payload: boolean }
  | { type: 'SET_SEARCH_ESTUDIANTE'; payload: string }
  | { type: 'RESET_SELECTOR' };

const initialUiState: IntervencionUiState = {
  enviado: false,
  submitError: null,
  selectedCurso: '',
  isExpanded: false,
  searchEstudiante: ''
};

function intervencionUiReducer(state: IntervencionUiState, action: IntervencionUiAction): IntervencionUiState {
  switch (action.type) {
    case 'SET_ENVIADO':
      return { ...state, enviado: action.payload };
    case 'SET_SUBMIT_ERROR':
      return { ...state, submitError: action.payload };
    case 'SET_SELECTED_CURSO':
      return { ...state, selectedCurso: action.payload };
    case 'SET_IS_EXPANDED':
      return { ...state, isExpanded: action.payload };
    case 'SET_SEARCH_ESTUDIANTE':
      return { ...state, searchEstudiante: action.payload };
    case 'RESET_SELECTOR':
      return { ...state, selectedCurso: '', isExpanded: false, searchEstudiante: '' };
    default:
      return state;
  }
}

const NuevaIntervencion: React.FC = () => {
  const { estudiantes } = useConvivencia();
  const { tenantId } = useTenant();
  const [ui, dispatch] = useReducer(intervencionUiReducer, initialUiState);

  const [formData, setFormData, clearFormData] = useLocalDraft<FormDataIntervencion>('intervencion:nueva', {
    estudianteId: null,
    estudianteNombre: '',
    estudianteCurso: '',
    tipoIntervencion: '',
    responsable: '',
    objetivos: '',
    metodologia: '',
    fechaInicio: '',
    fechaFin: '',
    observaciones: ''
  });

  // Obtener cursos únicos
  const cursos = React.useMemo(() => {
    const cursosSet = new Set<string>();
    estudiantes.forEach(est => {
      if (est.curso) cursosSet.add(est.curso);
    });
    return Array.from(cursosSet).sort();
  }, [estudiantes]);

  // Filtrar estudiantes por curso
  const estudiantesDelCurso = React.useMemo(() => {
    if (!ui.selectedCurso) return [];
    let filtered = estudiantes.filter(est => est.curso === ui.selectedCurso);
    if (ui.searchEstudiante.trim()) {
      const term = ui.searchEstudiante.toLowerCase();
      filtered = filtered.filter(est => est.nombreCompleto.toLowerCase().includes(term));
    }
    return filtered;
  }, [estudiantes, ui.searchEstudiante, ui.selectedCurso]);

  const totalEstudiantes = React.useMemo(() => {
    return estudiantes.filter(est => est.curso === ui.selectedCurso).length;
  }, [estudiantes, ui.selectedCurso]);

  const handleEstudianteSelect = (est: { id: string; nombreCompleto: string; curso?: string | null }) => {
    setFormData(prev => ({
      ...prev,
      estudianteId: est.id,
      estudianteNombre: est.nombreCompleto,
      estudianteCurso: est.curso || ui.selectedCurso
    }));
    dispatch({ type: 'SET_IS_EXPANDED', payload: false });
    dispatch({ type: 'SET_SEARCH_ESTUDIANTE', payload: '' });
  };

  const handleClearEstudiante = () => {
    setFormData(prev => ({
      ...prev,
      estudianteId: null,
      estudianteNombre: '',
      estudianteCurso: ''
    }));
    dispatch({ type: 'SET_IS_EXPANDED', payload: false });
    dispatch({ type: 'SET_SEARCH_ESTUDIANTE', payload: '' });
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_SUBMIT_ERROR', payload: null });
    if (!tenantId) {
      dispatch({ type: 'SET_SUBMIT_ERROR', payload: 'No hay colegio seleccionado.' });
      return;
    }

    const tipoIntervencionMap: Record<string, 'ENTREVISTA' | 'OBSERVACION' | 'VISITA' | 'DERIVACION'> = {
      PSICOLOGICA: 'ENTREVISTA',
      SOCIAL: 'VISITA',
      PSICOPEDAGOGICA: 'OBSERVACION',
      CONVIVENCIA: 'DERIVACION',
      OTRO: 'ENTREVISTA'
    };

    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (userId) {
        const resumenPartes = [
          `Objetivos: ${formData.objetivos}`,
          formData.metodologia ? `Metodologia: ${formData.metodologia}` : null,
          formData.observaciones ? `Observaciones: ${formData.observaciones}` : null
        ].filter(Boolean).join('\n');

        const { error } = await supabase.from('bitacora_psicosocial').insert({
          establecimiento_id: tenantId,
          estudiante_id: formData.estudianteId,
          profesional_id: userId,
          notas_confidenciales: resumenPartes || formData.objetivos,
          nivel_privacidad: 'alta',
          es_vulneracion: false,
          tipo: tipoIntervencionMap[formData.tipoIntervencion] ?? 'ENTREVISTA',
          participantes: formData.responsable,
          resumen: resumenPartes || formData.objetivos,
          privado: true,
          autor: formData.responsable
        });

        if (error) {
          dispatch({ type: 'SET_SUBMIT_ERROR', payload: error.message });
          return;
        }
      }
    }
    dispatch({ type: 'SET_ENVIADO', payload: true });
    setTimeout(() => dispatch({ type: 'SET_ENVIADO', payload: false }), 3000);
    clearFormData();
    dispatch({ type: 'RESET_SELECTOR' });
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-slate-50 flex justify-center items-center overflow-y-auto animate-in fade-in duration-700">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-12 space-y-8">
        <header className="text-center space-y-2">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Hand className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Nueva Intervención</h2>
          <p className="text-slate-400 font-bold text-xs md:text-xs uppercase tracking-widest">Registro de Intervención Psicosocial</p>
        </header>

        {ui.enviado ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-black text-slate-900">INTERVENCIÓN REGISTRADA</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">El estudiante ha sido derivado para intervención.</p>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-6">
            {ui.submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                No se pudo registrar la intervención: {ui.submitError}
              </div>
            )}
            {/* Selector de Curso y Estudiante */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="intervencion-curso" className="text-xs font-black text-slate-400 uppercase tracking-widest">Curso del Estudiante</label>
                <div className="relative">
                  <select
                    id="intervencion-curso"
                    value={ui.selectedCurso}
                    onChange={(e) => { dispatch({ type: 'SET_SELECTED_CURSO', payload: e.target.value }); handleClearEstudiante(); }}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Seleccione curso...</option>
                    {cursos.map(curso => (
                      <option key={curso} value={curso}>{curso}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Selector de Estudiante */}
            <div className={`space-y-4 transition-all ${!ui.selectedCurso ? 'opacity-50 pointer-events-none' : ''}`}>
              <label htmlFor="intervencion-estudiante-search" className="text-xs font-black text-slate-400 uppercase tracking-widest block">Estudiante</label>
              {ui.selectedCurso ? (
                <>
                  <button type="button" onClick={() => dispatch({ type: 'SET_IS_EXPANDED', payload: !ui.isExpanded })} className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between hover:bg-emerald-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-emerald-800">{totalEstudiantes} estudiante{totalEstudiantes !== 1 ? 's' : ''} en {ui.selectedCurso}</p>
                        <p className="text-xs text-emerald-600">{ui.isExpanded ? 'Ocultar lista' : 'Ver estudiantes'}</p>
                      </div>
                    </div>
                    {ui.isExpanded ? <ChevronDown className="w-5 h-5 text-emerald-400 rotate-180" /> : <ChevronDown className="w-5 h-5 text-emerald-400" />}
                  </button>
                  {ui.isExpanded && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2">
                      <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <input id="intervencion-estudiante-search" type="text" placeholder="Buscar por nombre..." value={ui.searchEstudiante} onChange={(e) => dispatch({ type: 'SET_SEARCH_ESTUDIANTE', payload: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {estudiantesDelCurso.map(est => (
                          <button type="button" key={est.id} onClick={() => handleEstudianteSelect(est)} className="w-full flex items-center p-4 hover:bg-emerald-50 cursor-pointer border-b border-slate-100">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-emerald-600">{est.nombreCompleto.charAt(0)}</span></div>
                            <p className="ml-3 text-sm font-bold text-slate-800">{est.nombreCompleto}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.estudianteId && !ui.isExpanded && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center"><span className="text-sm font-bold text-emerald-700">{formData.estudianteNombre.charAt(0)}</span></div>
                        <div><p className="text-sm font-bold text-slate-800">{formData.estudianteNombre}</p><p className="text-xs text-slate-500">{formData.estudianteCurso}</p></div>
                      </div>
                      <button type="button" onClick={handleClearEstudiante} className="p-2 hover:bg-emerald-200 rounded-lg"><span className="text-xs">✕</span></button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50"><p className="text-sm font-bold text-slate-500">Seleccione un curso</p></div>
              )}
            </div>

            {/* Tipo de Intervención */}
            <div className="space-y-2">
              <label htmlFor="intervencion-tipo" className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipo de Intervención</label>
              <select id="intervencion-tipo" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.tipoIntervencion} onChange={e => setFormData({...formData, tipoIntervencion: e.target.value})}>
                <option value="">Seleccione tipo...</option>
                <option value="PSICOLOGICA">Psicológica</option>
                <option value="SOCIAL">Social</option>
                <option value="PSICOPEDAGOGICA">Psicopedagógica</option>
                <option value="CONVIVENCIA">Convivencia Escolar</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            {/* Responsable */}
            <div className="space-y-2">
              <label htmlFor="intervencion-responsable" className="text-xs font-black text-slate-400 uppercase tracking-widest">Responsable</label>
              <input id="intervencion-responsable" required type="text" placeholder="Nombre del profesional" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} />
            </div>

            {/* Objetivos */}
            <div className="space-y-2">
              <label htmlFor="intervencion-objetivos" className="text-xs font-black text-slate-400 uppercase tracking-widest">Objetivos</label>
              <textarea id="intervencion-objetivos" required className="w-full h-24 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium resize-none" placeholder="Objetivos de la intervención..." value={formData.objetivos} onChange={e => setFormData({...formData, objetivos: e.target.value})} />
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="intervencion-fecha-inicio" className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><Calendar className="w-3 h-3 mr-2" /> Fecha Inicio</label>
                <input id="intervencion-fecha-inicio" required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label htmlFor="intervencion-fecha-fin" className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><Clock className="w-3 h-3 mr-2" /> Fecha Término</label>
                <input id="intervencion-fecha-fin" required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.fechaFin} onChange={e => setFormData({...formData, fechaFin: e.target.value})} />
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <label htmlFor="intervencion-observaciones" className="text-xs font-black text-slate-400 uppercase tracking-widest">Observaciones</label>
              <textarea id="intervencion-observaciones" className="w-full h-24 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium resize-none" placeholder="Observaciones adicionales..." value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
            </div>

            {/* Botón */}
            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center space-x-4">
              <Send className="w-5 h-5" /><span>Registrar Intervención</span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default NuevaIntervencion;


