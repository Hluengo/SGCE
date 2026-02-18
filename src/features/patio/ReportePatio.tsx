
import React, { useState, useMemo } from 'react';
import { AlertCircle, MapPin, Send, ShieldAlert, CheckCircle, Calendar, ChevronDown, ChevronUp, Users, Search, X } from 'lucide-react';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { supabase } from '@/shared/lib/supabaseClient';

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

const ReportePatio: React.FC = () => {
  const { estudiantes } = useConvivencia();
  const { tenantId } = useTenant();
  const [enviado, setEnviado] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchEstudiante, setSearchEstudiante] = useState('');

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

  // Obtener cursos únicos ordenados
  const cursos = useMemo(() => {
    const cursosSet = new Set<string>();
    estudiantes.forEach(est => {
      if (est.curso) {
        cursosSet.add(est.curso);
      }
    });
    return Array.from(cursosSet).sort();
  }, [estudiantes]);

  // Filtrar estudiantes por curso Y término de búsqueda
  const estudiantesDelCurso = useMemo(() => {
    if (!selectedCurso) return [];

    let filtered = estudiantes.filter(est => est.curso === selectedCurso);

    if (searchEstudiante.trim()) {
      const term = searchEstudiante.toLowerCase().trim();
      filtered = filtered.filter(est =>
        est.nombreCompleto.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [estudiantes, selectedCurso, searchEstudiante]);

  // Total de estudiantes en el curso
  const totalEstudiantesCurso = useMemo(() => {
    return estudiantes.filter(est => est.curso === selectedCurso).length;
  }, [estudiantes, selectedCurso]);

  const handleEstudianteSelect = (estudiante: { id: string; nombreCompleto: string; curso?: string | null }) => {
    setFormData(prev => ({
      ...prev,
      estudianteId: estudiante.id,
      estudianteNombre: estudiante.nombreCompleto,
      estudianteCurso: estudiante.curso || selectedCurso
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

  const handleCursoChange = (curso: string) => {
    setSelectedCurso(curso);
    handleClearEstudiante();
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (userId) {
        // Determinar fecha_incidente
        const fechaIncidente = formData.fechaIncidente
          ? new Date(formData.fechaIncidente).toISOString()
          : new Date().toISOString();

        await supabase
          .from('reportes_patio')
          .insert({
            establecimiento_id: tenantId,
            informante: formData.informante,
            estudiante_id: formData.estudianteId,
            estudiante_nombre: formData.estudianteNombre || null,
            lugar: formData.lugar || null,
            descripcion: formData.descripcion,
            gravedad_percibida: formData.gravedadPercibida,
            fecha_incidente: fechaIncidente,
            curso: formData.estudianteCurso || selectedCurso || null
          });
      } else {
        console.warn('Supabase: no hay sesion activa, se usara fallback local');
      }
    }
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
    clearFormData();
    setSelectedCurso('');
    handleClearEstudiante();
  };

  return (
    <main className="flex-1 p-4 md:p-10 bg-slate-50 flex justify-center items-center overflow-y-auto animate-in fade-in duration-700">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] border border-slate-200 shadow-2xl p-6 md:p-12 space-y-8">
        <header className="text-center space-y-2">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-100 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Reporte de Incidente en Patio</h2>
          <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em]">Entrada Rápida - Vigilancia y Convivencia</p>
        </header>

        {enviado ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-black text-slate-900">REPORTE ENVIADO</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">El encargado de convivencia ha sido notificado para la apertura de folio.</p>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-6">
            {/* Primera fila: Informante y Curso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Informante (Nombre/Cargo)
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 focus:outline-none"
                  value={formData.informante}
                  onChange={e => setFormData({ ...formData, informante: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Curso del Estudiante
                </label>
                <div className="relative">
                  <select
                    value={selectedCurso}
                    onChange={(e) => handleCursoChange(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Seleccione curso...</option>
                    {cursos.map((curso) => (
                      <option key={curso} value={curso}>
                        {curso}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Segunda fila: Selector de Estudiante (mismo patrón que WizardStep1Clasificacion) */}
            <div className={`space-y-3 transition-all ${!selectedCurso ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Estudiante(s) Involucrado(s)
              </label>

              {selectedCurso ? (
                <>
                  {/* Barra de resumen con botón expandir */}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-amber-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-amber-800">
                          {totalEstudiantesCurso} estudiante{totalEstudiantesCurso !== 1 ? 's' : ''} en {selectedCurso}
                        </p>
                        <p className="text-xs text-amber-600">
                          {isExpanded ? 'Ocultar lista' : 'Ver estudiantes para seleccionar'}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-amber-400" />
                    )}
                  </button>

                  {/* Lista expandida con buscador */}
                  {isExpanded && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2">
                      {/* Buscador */}
                      <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchEstudiante}
                            onChange={(e) => setSearchEstudiante(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/5 text-sm"
                          />
                          {searchEstudiante && (
                            <button
                              type="button"
                              onClick={() => setSearchEstudiante('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded"
                            >
                              <X className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lista con scroll */}
                      <div className="max-h-60 overflow-y-auto">
                        {estudiantesDelCurso.length > 0 ? (
                          estudiantesDelCurso.map((est) => (
                            <button
                              type="button"
                              key={est.id}
                              onClick={() => handleEstudianteSelect(est)}
                              className={`w-full flex items-center p-3 hover:bg-amber-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${formData.estudianteId === est.id ? 'bg-amber-100' : ''
                                }`}
                            >
                              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-amber-600">
                                  {est.nombreCompleto.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-3 flex items-center gap-3 flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{est.nombreCompleto}</p>
                                {formData.estudianteId === est.id && (
                                  <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-sm">
                            {searchEstudiante
                              ? `No se encontró "${searchEstudiante}"`
                              : 'Sin estudiantes'}
                          </div>
                        )}
                      </div>

                      {/* Footer con cambio de curso */}
                      <div className="p-3 bg-slate-50 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={handleClearEstudiante}
                          className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cambiar curso
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Estudiante seleccionado */}
                  {formData.estudianteId && !isExpanded && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-amber-700">
                            {formData.estudianteNombre.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{formData.estudianteNombre}</p>
                          <p className="text-xs text-slate-500">{formData.estudianteCurso}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearEstudiante}
                        className="p-2 hover:bg-amber-200 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">
                    Seleccione un curso para ver los estudiantes
                  </p>
                </div>
              )}
            </div>

            {/* Tercera fila: Lugar y Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <MapPin className="w-3 h-3 mr-2" /> Lugar del Evento
                </label>
                <select
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none"
                  value={formData.lugar}
                  onChange={e => setFormData({ ...formData, lugar: e.target.value })}
                >
                  <option value="">Seleccione lugar...</option>
                  <option value="PATIO">Patio Central</option>
                  <option value="SALA">Sala de Clases</option>
                  <option value="BANO">Baños</option>
                  <option value="COMEDOR">Casino/Comedor</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Calendar className="w-3 h-3 mr-2" /> Fecha y Hora del Incidente
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none"
                  value={formData.fechaIncidente}
                  onChange={e => setFormData({ ...formData, fechaIncidente: e.target.value })}
                />
              </div>
            </div>

            {/* Cuarta fila: Gravedad */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <ShieldAlert className="w-3 h-3 mr-2" /> Gravedad Observada
              </label>
              <div className="flex gap-4">
                {(['LEVE', 'RELEVANTE', 'GRAVE'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gravedadPercibida: g })}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.gravedadPercibida === g ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-400 border-slate-100'
                      }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Quinta fila: Descripción */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Narración de los Hechos
              </label>
              <textarea
                required
                className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none resize-none"
                placeholder="Describa brevemente lo sucedido..."
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-3 active:scale-95"
            >
              <Send className="w-5 h-5" />
              <span>Enviar a Convivencia</span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default ReportePatio;
