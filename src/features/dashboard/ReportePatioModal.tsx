
import React, { useMemo, useReducer } from 'react';
import { AlertCircle, MapPin, Send, CheckCircle, Calendar, ChevronDown, Users, X } from 'lucide-react';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { supabase } from '@/shared/lib/supabaseClient';
import AssistantHeaderButton from '@/shared/components/AssistantHeaderButton';
import { Estudiante } from '@/types';

type GravedadType = 'LEVE' | 'RELEVANTE' | 'GRAVE';

interface FormDataPatio {
  informante: string;
  estudianteId: string | null;
  estudianteNombre: string;
  estudianteCurso: string;
  lugar: string;
  descripcion: string;
  gravedadPercibida: GravedadType;
  fechaIncidente: string;
}

interface ReportePatioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ReportePatioUiState {
  enviado: boolean;
  submitError: string | null;
  selectedCurso: string;
  isExpanded: boolean;
  searchEstudiante: string;
}

type ReportePatioUiAction =
  | { type: 'SET_ENVIADO'; payload: boolean }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }
  | { type: 'SET_SELECTED_CURSO'; payload: string }
  | { type: 'SET_IS_EXPANDED'; payload: boolean }
  | { type: 'SET_SEARCH_ESTUDIANTE'; payload: string }
  | { type: 'RESET_SELECTOR' };

const initialUiState: ReportePatioUiState = {
  enviado: false,
  submitError: null,
  selectedCurso: '',
  isExpanded: false,
  searchEstudiante: ''
};

function reportePatioUiReducer(state: ReportePatioUiState, action: ReportePatioUiAction): ReportePatioUiState {
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

const ReportePatioModal: React.FC<ReportePatioModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { estudiantes, setIsAssistantOpen } = useConvivencia();
  const { tenantId } = useTenant();
  const [ui, dispatch] = useReducer(reportePatioUiReducer, initialUiState);

  const [formData, setFormData, clearFormData] = useLocalDraft<FormDataPatio>(`reporte:patio:${tenantId ?? 'no-tenant'}`, {
    informante: '',
    estudianteId: null,
    estudianteNombre: '',
    estudianteCurso: '',
    lugar: '',
    descripcion: '',
    gravedadPercibida: 'LEVE',
    fechaIncidente: ''
  });

  const cursos = useMemo(() => {
    const cursosSet = new Set<string>();
    (estudiantes || []).forEach((est: Estudiante) => {
      if (est.curso) {
        cursosSet.add(est.curso);
      }
    });
    return Array.from(cursosSet).sort();
  }, [estudiantes]);

  const estudiantesDelCurso = useMemo(() => {
    if (!ui.selectedCurso) return [];
    let filtered = (estudiantes || []).filter((est: Estudiante) => est.curso === ui.selectedCurso);
    if (ui.searchEstudiante.trim()) {
      const term = ui.searchEstudiante.toLowerCase().trim();
      filtered = filtered.filter((est: Estudiante) => est.nombreCompleto.toLowerCase().includes(term));
    }
    return filtered;
  }, [estudiantes, ui.searchEstudiante, ui.selectedCurso]);

  const totalEstudiantesCurso = (estudiantes || []).filter((est: Estudiante) => est.curso === ui.selectedCurso).length;

  const handleEstudianteSelect = (estudiante: { id: string; nombreCompleto: string; curso?: string | null }) => {
    setFormData((prev: FormDataPatio) => ({
      ...prev,
      estudianteId: estudiante.id,
      estudianteNombre: estudiante.nombreCompleto,
      estudianteCurso: estudiante.curso || ui.selectedCurso
    }));
    dispatch({ type: 'SET_IS_EXPANDED', payload: false });
    dispatch({ type: 'SET_SEARCH_ESTUDIANTE', payload: '' });
  };

  const handleClearEstudiante = () => {
    setFormData((prev: FormDataPatio) => ({
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
    if (!tenantId) return;
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (userId) {
        const fechaIncidente = formData.fechaIncidente
          ? new Date(formData.fechaIncidente).toISOString()
          : new Date().toISOString();

        const { error } = await supabase.from('reportes_patio').insert({
          establecimiento_id: tenantId,
          estudiante_id: formData.estudianteId,
          estudiante_nombre: formData.estudianteNombre || null,
          curso: formData.estudianteCurso || ui.selectedCurso,
          informante: formData.informante,
          lugar: formData.lugar || null,
          descripcion: formData.descripcion,
          gravedad_percibida: formData.gravedadPercibida,
          fecha_incidente: fechaIncidente
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
      onSuccess?.(); // Notificar al padre que se creó el reporte
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Nuevo Reporte de Patio</h2>
              <p className="text-xs text-slate-400 font-bold uppercase">Reporte de Incidente</p>
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
            <h3 className="text-xl font-black text-slate-900">REPORTE REGISTRADO</h3>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-6">
            {ui.submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                No se pudo registrar el reporte: {ui.submitError}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="reporte-curso" className="text-xs font-black text-slate-400 uppercase tracking-widest">Curso del Estudiante</label>
              <select
                id="reporte-curso"
                value={ui.selectedCurso}
                onChange={(e) => { dispatch({ type: 'SET_SELECTED_CURSO', payload: e.target.value }); handleClearEstudiante(); }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              >
                <option value="">Seleccione curso...</option>
                {cursos.map((curso: string) => (
                  <option key={curso} value={curso}>{curso}</option>
                ))}
              </select>
            </div>

            <div className={`space-y-3 ${!ui.selectedCurso ? 'opacity-50 pointer-events-none' : ''}`}>
              <label htmlFor="reporte-estudiante-search" className="text-xs font-black text-slate-400 uppercase tracking-widest block">Estudiante</label>
              {ui.selectedCurso ? (
                <>
                  <button type="button" onClick={() => dispatch({ type: 'SET_IS_EXPANDED', payload: !ui.isExpanded })} className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-amber-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-amber-800">{totalEstudiantesCurso} estudiante{totalEstudiantesCurso !== 1 ? 's' : ''} en {ui.selectedCurso}</p>
                        <p className="text-xs text-amber-600">{ui.isExpanded ? 'Ocultar' : 'Ver lista'}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-amber-400 transition-transform ${ui.isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {ui.isExpanded && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <input id="reporte-estudiante-search" type="text" placeholder="Buscar..." value={ui.searchEstudiante} onChange={(e) => dispatch({ type: 'SET_SEARCH_ESTUDIANTE', payload: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {estudiantesDelCurso.map((est: Estudiante) => (
                          <button type="button" key={est.id} onClick={() => handleEstudianteSelect(est)} className="w-full flex items-center p-3 hover:bg-amber-50 border-b border-slate-100">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-amber-600">{est.nombreCompleto.charAt(0)}</span></div>
                            <p className="ml-3 text-sm font-bold text-slate-800">{est.nombreCompleto}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.estudianteId && !ui.isExpanded && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center"><span className="text-sm font-bold text-amber-700">{formData.estudianteNombre.charAt(0)}</span></div>
                        <div><p className="text-sm font-bold text-slate-800">{formData.estudianteNombre}</p><p className="text-xs text-slate-500">{formData.estudianteCurso}</p></div>
                      </div>
                      <button type="button" onClick={handleClearEstudiante} className="p-2 hover:bg-amber-200 rounded-lg"><span className="text-xs">✕</span></button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center border border-slate-200 rounded-xl bg-slate-50"><p className="text-sm font-bold text-slate-500">Seleccione un curso</p></div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="reporte-informante" className="text-xs font-black text-slate-400 uppercase tracking-widest">Informante</label>
              <input id="reporte-informante" required type="text" placeholder="Nombre del funcionario que reporta" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.informante} onChange={(e) => setFormData({ ...formData, informante: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="reporte-lugar" className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><MapPin className="w-3 h-3 mr-2" /> Lugar</label>
                <input id="reporte-lugar" required type="text" placeholder="Dónde ocurrió" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.lugar} onChange={(e) => setFormData({ ...formData, lugar: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label htmlFor="reporte-fecha" className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><Calendar className="w-3 h-3 mr-2" /> Fecha</label>
                <input id="reporte-fecha" required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.fechaIncidente} onChange={(e) => setFormData({ ...formData, fechaIncidente: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gravedad Percibida</p>
              <div className="flex gap-4">
                {(['LEVE', 'RELEVANTE', 'GRAVE'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setFormData((prev: FormDataPatio) => ({ ...prev, gravedadPercibida: g }))} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${formData.gravedadPercibida === g ? g === 'LEVE' ? 'bg-amber-400 text-white border-amber-400' : g === 'RELEVANTE' ? 'bg-orange-500 text-white border-orange-500' : 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-400 border-slate-100'}`}>{g}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="reporte-descripcion" className="text-xs font-black text-slate-400 uppercase tracking-widest">Descripción del Incidente</label>
              <textarea id="reporte-descripcion" required className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none" placeholder="Relato objetivo de lo observado..." value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">Cancelar</button>
              <button type="submit" className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-500 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Registrar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportePatioModal;

