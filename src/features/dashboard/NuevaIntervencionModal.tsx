
import React, { useReducer } from 'react';
import { Hand, Users, Calendar, Clock, Send, CheckCircle, ChevronDown, X } from 'lucide-react';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { supabase } from '@/shared/lib/supabaseClient';
import AssistantHeaderButton from '@/shared/components/AssistantHeaderButton';

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

interface NuevaIntervencionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

const NuevaIntervencionModal: React.FC<NuevaIntervencionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { estudiantes, setIsAssistantOpen } = useConvivencia();
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

  const cursos = React.useMemo(() => {
    const cursosSet = new Set<string>();
    (estudiantes || []).forEach(est => {
      if (est.curso) cursosSet.add(est.curso);
    });
    return Array.from(cursosSet).sort();
  }, [estudiantes]);

  const estudiantesDelCurso = React.useMemo(() => {
    if (!ui.selectedCurso) return [];
    let filtered = (estudiantes || []).filter(est => est.curso === ui.selectedCurso);
    if (ui.searchEstudiante.trim()) {
      const term = ui.searchEstudiante.toLowerCase();
      filtered = filtered.filter(est => est.nombreCompleto.toLowerCase().includes(term));
    }
    return filtered;
  }, [estudiantes, ui.searchEstudiante, ui.selectedCurso]);

  const totalEstudiantes = React.useMemo(() => {
    return (estudiantes || []).filter(est => est.curso === ui.selectedCurso).length;
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
    setTimeout(() => {
      dispatch({ type: 'SET_ENVIADO', payload: false });
      clearFormData();
      dispatch({ type: 'RESET_SELECTOR' });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Hand className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Nueva Intervención</h2>
              <p className="text-xs text-slate-400 font-bold uppercase">Registro de Intervención Psicosocial</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AssistantHeaderButton onClick={() => setIsAssistantOpen(true)} />
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {ui.enviado ? (
          <div className="py-12 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-black text-slate-900">INTERVENCIÓN REGISTRADA</h3>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-6">
            {ui.submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                No se pudo registrar la intervención: {ui.submitError}
              </div>
            )}
            {/* Selector de Curso */}
            <label className="block space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Curso del Estudiante</span>
              <select
                value={ui.selectedCurso}
                onChange={(e) => { dispatch({ type: 'SET_SELECTED_CURSO', payload: e.target.value }); handleClearEstudiante(); }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              >
                <option value="">Seleccione curso...</option>
                {cursos.map(curso => (
                  <option key={curso} value={curso}>{curso}</option>
                ))}
              </select>
            </label>

            {/* Selector de Estudiante */}
            <label className={`block space-y-3 ${!ui.selectedCurso ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Estudiante</span>
              {ui.selectedCurso ? (
                <>
                  <button type="button" onClick={() => dispatch({ type: 'SET_IS_EXPANDED', payload: !ui.isExpanded })} className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-emerald-800">{totalEstudiantes} estudiante{totalEstudiantes !== 1 ? 's' : ''} en {ui.selectedCurso}</p>
                        <p className="text-xs text-emerald-600">{ui.isExpanded ? 'Ocultar' : 'Ver lista'}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-emerald-400 transition-transform ${ui.isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {ui.isExpanded && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <input type="text" placeholder="Buscar..." value={ui.searchEstudiante} onChange={(e) => dispatch({ type: 'SET_SEARCH_ESTUDIANTE', payload: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {estudiantesDelCurso.map(est => (
                          <button type="button" key={est.id} onClick={() => handleEstudianteSelect(est)} className="w-full flex items-center p-3 hover:bg-emerald-50 border-b border-slate-100">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-emerald-600">{est.nombreCompleto.charAt(0)}</span></div>
                            <p className="ml-3 text-sm font-bold text-slate-800">{est.nombreCompleto}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.estudianteId && !ui.isExpanded && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center"><span className="text-sm font-bold text-emerald-700">{formData.estudianteNombre.charAt(0)}</span></div>
                        <div><p className="text-sm font-bold text-slate-800">{formData.estudianteNombre}</p><p className="text-xs text-slate-500">{formData.estudianteCurso}</p></div>
                      </div>
                      <button type="button" onClick={handleClearEstudiante} className="p-2 hover:bg-emerald-200 rounded-lg"><span className="text-xs">✕</span></button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center border border-slate-200 rounded-xl bg-slate-50"><p className="text-sm font-bold text-slate-500">Seleccione un curso</p></div>
              )}
            </label>

            {/* Tipo de Intervención */}
            <label className="block space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipo de Intervención</span>
              <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.tipoIntervencion} onChange={e => setFormData({...formData, tipoIntervencion: e.target.value})}>
                <option value="">Seleccione tipo...</option>
                <option value="PSICOLOGICA">Psicológica</option>
                <option value="SOCIAL">Social</option>
                <option value="PSICOPEDAGOGICA">Psicopedagógica</option>
                <option value="CONVIVENCIA">Convivencia Escolar</option>
                <option value="OTRO">Otro</option>
              </select>
            </label>

            {/* Responsable */}
            <label className="block space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Responsable</span>
              <input required type="text" placeholder="Nombre del profesional" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} />
            </label>

            {/* Objetivos */}
            <label className="block space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Objetivos</span>
              <textarea required className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none" placeholder="Objetivos..." value={formData.objetivos} onChange={e => setFormData({...formData, objetivos: e.target.value})} />
            </label>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><Calendar className="w-3 h-3 mr-2" /> Inicio</span>
                <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><Clock className="w-3 h-3 mr-2" /> Término</span>
                <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.fechaFin} onChange={e => setFormData({...formData, fechaFin: e.target.value})} />
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">Cancelar</button>
              <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Registrar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NuevaIntervencionModal;


