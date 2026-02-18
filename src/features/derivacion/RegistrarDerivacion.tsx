
import React, { useState } from 'react';
import { ArrowRightCircle, Users, Calendar, Send, CheckCircle, ChevronDown } from 'lucide-react';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { supabase } from '@/shared/lib/supabaseClient';

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

const RegistrarDerivacion: React.FC = () => {
  const { estudiantes } = useConvivencia();
  const { tenantId } = useTenant();
  const [enviado, setEnviado] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchEstudiante, setSearchEstudiante] = useState('');

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
    if (!selectedCurso) return [];
    let filtered = estudiantes.filter(est => est.curso === selectedCurso);
    if (searchEstudiante.trim()) {
      const term = searchEstudiante.toLowerCase();
      filtered = filtered.filter(est => est.nombreCompleto.toLowerCase().includes(term));
    }
    return filtered;
  }, [estudiantes, selectedCurso, searchEstudiante]);

  const totalEstudiantes = React.useMemo(() => {
    return estudiantes.filter(est => est.curso === selectedCurso).length;
  }, [estudiantes, selectedCurso]);

  const handleEstudianteSelect = (est: { id: string; nombreCompleto: string; curso?: string | null }) => {
    setFormData(prev => ({
      ...prev,
      estudianteId: est.id,
      estudianteNombre: est.nombreCompleto,
      estudianteCurso: est.curso || selectedCurso
    }));
    setIsExpanded(false);
    setSearchEstudiante('');
  };

  const handleClearEstudiante = () => {
    setFormData(prev => ({
      ...prev,
      estudianteId: null,
      estudianteNombre: '',
      estudianteCurso: ''
    }));
    setIsExpanded(false);
    setSearchEstudiante('');
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!tenantId) {
      setSubmitError('No hay colegio seleccionado.');
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
          setSubmitError(error.message);
          return;
        }
      }
    }
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
    clearFormData();
    setSelectedCurso('');
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-slate-50 flex justify-center items-center overflow-y-auto animate-in fade-in duration-700">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] border border-slate-200 shadow-2xl p-6 md:p-12 space-y-8">
        <header className="text-center space-y-2">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-violet-100 text-violet-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <ArrowRightCircle className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Registrar Derivación</h2>
          <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em]">Derivación a Especialista</p>
        </header>

        {enviado ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95">
            <CheckCircle className="w-16 h-16 text-violet-500 mx-auto" />
            <h3 className="text-xl font-black text-slate-900">DERIVACIÓN REGISTRADA</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">El estudiante ha sido derivado exitosamente.</p>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-6">
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                No se pudo registrar la derivación: {submitError}
              </div>
            )}
            {/* Selector de Curso y Estudiante */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso del Estudiante</label>
                <div className="relative">
                  <select
                    value={selectedCurso}
                    onChange={(e) => { setSelectedCurso(e.target.value); handleClearEstudiante(); }}
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
            <div className={`space-y-3 transition-all ${!selectedCurso ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estudiante</label>
              {selectedCurso ? (
                <>
                  <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="w-full p-4 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-between hover:bg-violet-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-violet-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-violet-800">{totalEstudiantes} estudiante{totalEstudiantes !== 1 ? 's' : ''} en {selectedCurso}</p>
                        <p className="text-xs text-violet-600">{isExpanded ? 'Ocultar lista' : 'Ver estudiantes'}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-violet-400 rotate-180" /> : <ChevronDown className="w-5 h-5 text-violet-400" />}
                  </button>
                  {isExpanded && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2">
                      <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <input type="text" placeholder="Buscar por nombre..." value={searchEstudiante} onChange={(e) => setSearchEstudiante(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {estudiantesDelCurso.map(est => (
                          <button type="button" key={est.id} onClick={() => handleEstudianteSelect(est)} className="w-full flex items-center p-3 hover:bg-violet-50 cursor-pointer border-b border-slate-100">
                            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-violet-600">{est.nombreCompleto.charAt(0)}</span></div>
                            <p className="ml-3 text-sm font-bold text-slate-800">{est.nombreCompleto}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.estudianteId && !isExpanded && (
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
                <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50"><p className="text-sm font-bold text-slate-500">Seleccione un curso</p></div>
              )}
            </div>

            {/* Derivado a */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Derivado a</label>
              <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.derivadoA} onChange={e => setFormData({...formData, derivadoA: e.target.value})}>
                <option value="">Seleccione destino...</option>
                <option value="PSICOLOGO">Psicólogo</option>
                <option value="PSICOPEDAGOGO">Psicopedagogo</option>
                <option value="TRABAJADOR_SOCIAL">Trabajador Social</option>
                <option value="PSIQUIATRA">Psiquiatra</option>
                <option value="MEDICO">Médico</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo de Derivación</label>
              <textarea required className="w-full h-24 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium resize-none" placeholder="Describa el motivo de la derivación..." value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} />
            </div>

            {/* Urgencia */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Urgencia</label>
              <div className="flex gap-4">
                {(['BAJA', 'MEDIA', 'ALTA'] as const).map(u => (
                  <button key={u} type="button" onClick={() => setFormData({...formData, urgencia: u})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.urgencia === u ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-400 border-slate-100'}`}>{u}</button>
                ))}
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Calendar className="w-3 h-3 mr-2" /> Fecha de Derivación</label>
              <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.fechaDerivacion} onChange={e => setFormData({...formData, fechaDerivacion: e.target.value})} />
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones</label>
              <textarea className="w-full h-24 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium resize-none" placeholder="Observaciones adicionales..." value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
            </div>

            {/* Botón */}
            <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-violet-500 transition-all flex items-center justify-center space-x-3">
              <Send className="w-5 h-5" /><span>Registrar Derivación</span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default RegistrarDerivacion;
