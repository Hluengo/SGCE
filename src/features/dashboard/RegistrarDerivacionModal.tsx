
import React, { useReducer } from 'react';
import { ArrowRightCircle, Users, Calendar, Send, CheckCircle, ChevronDown, X } from 'lucide-react';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { supabase } from '@/shared/lib/supabaseClient';
import AssistantHeaderButton from '@/shared/components/AssistantHeaderButton';

interface FormDataDerivacion {
  estudianteId: string | null;
  estudianteNombre: string;
  estudianteCurso: string;
  derivadoA: string;
  motivo: string;
  urgencia: 'BAJA' | 'MEDIA' | 'ALTA';
  fechaDerivacion: string;
  observaciones: string;
}

interface RegistrarDerivacionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DerivacionUiState {
  enviado: boolean;
  submitError: string | null;
  selectedCurso: string;
  isExpanded: boolean;
  searchEstudiante: string;
}

type DerivacionUiAction =
  | { type: 'SET_ENVIADO'; payload: boolean }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_CURSO'; payload: string }
  | { type: 'SET_IS_EXPANDED'; payload: boolean }
  | { type: 'SET_SEARCH_ESTUDIANTE'; payload: string }
  | { type: 'RESET_SELECTOR' };

const initialUiState: DerivacionUiState = {
  enviado: false,
  submitError: null,
  selectedCurso: '',
  isExpanded: false,
  searchEstudiante: ''
};

function derivacionUiReducer(state: DerivacionUiState, action: DerivacionUiAction): DerivacionUiState {
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

const RegistrarDerivacionModal: React.FC<RegistrarDerivacionModalProps> = ({ isOpen, onClose }) => {
  const { estudiantes, setIsAssistantOpen } = useConvivencia();
  const { tenantId } = useTenant();
  const [ui, dispatch] = useReducer(derivacionUiReducer, initialUiState);

  const [formData, setFormData, clearFormData] = useLocalDraft<FormDataDerivacion>('derivacion:registrar', {
    estudianteId: null,
    estudianteNombre: '',
    estudianteCurso: '',
    derivadoA: '',
    motivo: '',
    urgencia: 'MEDIA',
    fechaDerivacion: '',
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

    const institutionByDestino: Record<string, 'OPD' | 'COSAM' | 'TRIBUNAL' | 'SALUD'> = {
      PSICOLOGO: 'COSAM',
      PSICOPEDAGOGO: 'COSAM',
      TRABAJADOR_SOCIAL: 'OPD',
      PSIQUIATRA: 'SALUD',
      MEDICO: 'SALUD',
      OTRO: 'OPD'
    };

    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (userId) {
        const numeroOficio = [formData.urgencia, formData.motivo, formData.observaciones]
          .filter(Boolean)
          .join(' | ');

        const { error } = await supabase.from('derivaciones_externas').insert({
          establecimiento_id: tenantId,
          estudiante_id: formData.estudianteId,
          nna_nombre: formData.estudianteNombre || null,
          institucion: institutionByDestino[formData.derivadoA] ?? 'OPD',
          fecha_envio: formData.fechaDerivacion,
          numero_oficio: numeroOficio || null,
          estado: 'PENDIENTE'
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
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 animate-in fade-in"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.75rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.75rem)',
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center">
              <ArrowRightCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Registrar Derivación</h2>
              <p className="text-xs text-slate-400 font-bold uppercase">Derivación a Especialista</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AssistantHeaderButton onClick={() => setIsAssistantOpen(true)} />
            <button onClick={onClose} className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 hover:bg-slate-100 rounded-xl">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {ui.enviado ? (
          <div className="py-12 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-violet-500 mx-auto" />
            <h3 className="text-xl font-black text-slate-900">DERIVACIÓN REGISTRADA</h3>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-6">
            {ui.submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                No se pudo registrar la derivación: {ui.submitError}
              </div>
            )}
            {/* Selector de Curso */}
            <label className="block space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Curso del Estudiante</span>
              <select
                value={ui.selectedCurso}
                onChange={(e) => {
                  dispatch({ type: 'SET_SELECTED_CURSO', payload: e.target.value });
                  handleClearEstudiante();
                }}
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
                  <button type="button" onClick={() => dispatch({ type: 'SET_IS_EXPANDED', payload: !ui.isExpanded })} className="w-full p-4 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-violet-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-violet-800">{totalEstudiantes} estudiante{totalEstudiantes !== 1 ? 's' : ''} en {ui.selectedCurso}</p>
                        <p className="text-xs text-violet-600">{ui.isExpanded ? 'Ocultar' : 'Ver lista'}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-violet-400 transition-transform ${ui.isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {ui.isExpanded && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <input type="text" placeholder="Buscar..." value={ui.searchEstudiante} onChange={(e) => dispatch({ type: 'SET_SEARCH_ESTUDIANTE', payload: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {estudiantesDelCurso.map(est => (
                          <button type="button" key={est.id} onClick={() => handleEstudianteSelect(est)} className="w-full flex items-center p-3 hover:bg-violet-50 border-b border-slate-100">
                            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-violet-600">{est.nombreCompleto.charAt(0)}</span></div>
                            <p className="ml-3 text-sm font-bold text-slate-800">{est.nombreCompleto}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.estudianteId && !ui.isExpanded && (
                    <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-200 rounded-full flex items-center justify-center"><span className="text-sm font-bold text-violet-700">{formData.estudianteNombre.charAt(0)}</span></div>
                        <div><p className="text-sm font-bold text-slate-800">{formData.estudianteNombre}</p><p className="text-xs text-slate-500">{formData.estudianteCurso}</p></div>
                      </div>
                      <button type="button" onClick={handleClearEstudiante} className="p-2 hover:bg-violet-200 rounded-lg"><span className="text-xs">✕</span></button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center border border-slate-200 rounded-xl bg-slate-50"><p className="text-sm font-bold text-slate-500">Seleccione un curso</p></div>
              )}
            </label>

            {/* Derivado a */}
            <label className="block space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Derivado a</span>
              <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.derivadoA} onChange={e => setFormData({...formData, derivadoA: e.target.value})}>
                <option value="">Seleccione destino...</option>
                <option value="PSICOLOGO">Psicólogo</option>
                <option value="PSICOPEDAGOGO">Psicopedagogo</option>
                <option value="TRABAJADOR_SOCIAL">Trabajador Social</option>
                <option value="PSIQUIATRA">Psiquiatra</option>
                <option value="MEDICO">Médico</option>
                <option value="OTRO">Otro</option>
              </select>
            </label>

            {/* Motivo */}
            <label className="block space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Motivo</span>
              <textarea required className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none" placeholder="Motivo de la derivación..." value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} />
            </label>

            {/* Urgencia */}
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Urgencia</p>
              <div className="flex gap-4">
                {(['BAJA', 'MEDIA', 'ALTA'] as const).map(u => (
                  <button key={u} type="button" onClick={() => setFormData({...formData, urgencia: u})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${formData.urgencia === u ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-400 border-slate-100'}`}>{u}</button>
                ))}
              </div>
            </div>

            {/* Fecha */}
            <label className="block space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><Calendar className="w-3 h-3 mr-2" /> Fecha</span>
              <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.fechaDerivacion} onChange={e => setFormData({...formData, fechaDerivacion: e.target.value})} />
            </label>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 min-h-11 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">Cancelar</button>
              <button type="submit" className="flex-1 min-h-11 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-500 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Registrar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegistrarDerivacionModal;


