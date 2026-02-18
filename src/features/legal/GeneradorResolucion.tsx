
import React, { useState, useEffect, useMemo } from 'react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import {
  FileText, 
  X, 
  Eye, 
  Save, 
  ShieldAlert, 
  Scale, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  PenTool,
  Printer,
  Download
} from 'lucide-react';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';

interface GeneradorResolucionProps {
  onClose: () => void;
}

const FACTORES = [
  { id: 'at-1', type: 'atenuante', label: 'Irreprochable conducta anterior', text: 'Se considera como atenuante la irreprochable conducta anterior del estudiante, quien no registra sanciones previas en el presente año escolar.' },
  { id: 'at-2', type: 'atenuante', label: 'Reconocimiento espontáneo', text: 'El estudiante reconoció de forma espontánea y veraz su participación en los hechos, facilitando la investigación.' },
  { id: 'ag-1', type: 'agravante', label: 'Premeditación', text: 'Se observa un grado de planificación previa en la ejecución de la conducta, lo cual agrava la responsabilidad.' },
  { id: 'ag-2', type: 'agravante', label: 'Afectación a la comunidad', text: 'La conducta generó un impacto negativo significativo en el clima de convivencia del curso y/o establecimiento.' }
];

const GeneradorResolucion: React.FC<GeneradorResolucionProps> = ({ onClose }) => {
  const { expedienteSeleccionado } = useConvivencia();
  const [showPreview, setShowPreview] = useState(false);
  const draftKey = useMemo(
    () => `resolucion:${expedienteSeleccionado?.id ?? 'none'}:sections`,
    [expedienteSeleccionado?.id]
  );
  const [sections, setSections] = useLocalDraft(draftKey, {
    vistos: '',
    considerando: '',
    fundamentos: '',
    proporcionalidad: '',
    resolucion: ''
  });

  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);

  useEffect(() => {
    if (expedienteSeleccionado) {
      setSections({
        vistos: `VISTOS: Los antecedentes del estudiante ${expedienteSeleccionado.nnaNombre}; lo dispuesto en el Reglamento Interno de Convivencia Escolar (RICE); las facultades conferidas por la Ley N° 20.370 (LGE) y la Circular N° 782 de la Superintendencia de Educación.`,
        considerando: `CONSIDERANDO: Que, con fecha ${new Date(expedienteSeleccionado.fechaInicio).toLocaleDateString()}, se inició un procedimiento investigativo por falta de gravedad ${expedienteSeleccionado.gravedad}. Que, de los antecedentes recopilados, se ha logrado acreditar que...`,
        fundamentos: `FUNDAMENTOS JURÍDICOS: La conducta descrita vulnera el Artículo XX del RICE vigente. Se hace presente que el proceso ha respetado íntegramente las etapas de notificación y descargos según exige la Circular 782.`,
        proporcionalidad: `ANÁLISIS DE PROPORCIONALIDAD: Atendida la naturaleza de la falta y los antecedentes del estudiante, se estima que la medida es necesaria y proporcional, toda vez que...`,
        resolucion: `RESUELVO: Aplíquese la medida de [INSERTAR MEDIDA]. Se informa al apoderado que dispone de un plazo de 15 días hábiles para solicitar la reconsideración de esta medida ante la entidad sostenedora.`
      });
    }
  }, [expedienteSeleccionado]);

  const handleToggleFactor = (factorId: string) => {
    const factor = FACTORES.find(f => f.id === factorId);
    if (!factor) return;

    if (selectedFactors.includes(factorId)) {
      setSelectedFactors(prev => prev.filter(id => id !== factorId));
      setSections(prev => ({
        ...prev,
        fundamentos: prev.fundamentos.replace(`\n${factor.text}`, '')
      }));
    } else {
      setSelectedFactors(prev => [...prev, factorId]);
      setSections(prev => ({
        ...prev,
        fundamentos: `${prev.fundamentos}\n${factor.text}`
      }));
    }
  };

  const hasReconsideration = sections.resolucion.toLowerCase().includes('reconsideración') || 
                            sections.resolucion.toLowerCase().includes('15 días');

  const isValid = sections.resolucion.length > 20 && hasReconsideration;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header del Editor */}
        <header className="px-4 md:px-8 py-4 md:py-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Redacción de Resolución Oficial</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cumplimiento Estándar Circular 782</p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <button 
              onClick={() => setShowPreview(true)}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              Vista Previa
            </button>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Cuerpo del Generador */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Columna Izquierda: Editor */}
          <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-white custom-scrollbar">
            
            <section className="space-y-4">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Sección 1: Vistos
              </label>
              <textarea 
                className="w-full min-h-[100px] p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:outline-none focus:border-blue-400 transition-all resize-none"
                value={sections.vistos}
                onChange={e => setSections({...sections, vistos: e.target.value})}
              />
            </section>

            <section className="space-y-4">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center">
                <ShieldAlert className="w-4 h-4 mr-2" />
                Sección 2: Considerando (Hechos)
              </label>
              <textarea 
                className="w-full min-h-[150px] p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:outline-none focus:border-blue-400 transition-all resize-none"
                value={sections.considerando}
                onChange={e => setSections({...sections, considerando: e.target.value})}
              />
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center">
                  <Scale className="w-4 h-4 mr-2" />
                  Sección 3: Fundamentos Jurídicos
                </label>
                <div className="flex space-x-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Inyectar:</span>
                  <button onClick={() => setSections({...sections, fundamentos: sections.fundamentos + '\nArt. 10 LGE'})} className="text-[9px] font-bold text-blue-600 hover:underline">Art. 10 LGE</button>
                  <button onClick={() => setSections({...sections, fundamentos: sections.fundamentos + '\nCircular 782/2025'})} className="text-[9px] font-bold text-blue-600 hover:underline">Circ. 782</button>
                </div>
              </div>
              <textarea 
                className="w-full min-h-[150px] p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:outline-none focus:border-blue-400 transition-all resize-none"
                value={sections.fundamentos}
                onChange={e => setSections({...sections, fundamentos: e.target.value})}
              />
            </section>

            <section className="space-y-4">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Sección 4: Proporcionalidad
              </label>
              <textarea 
                className="w-full min-h-[100px] p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:outline-none focus:border-blue-400 transition-all resize-none"
                value={sections.proporcionalidad}
                onChange={e => setSections({...sections, proporcionalidad: e.target.value})}
              />
            </section>

            <section className="space-y-4">
              <label className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Sección 5: Resolución y Notificación de Plazos
              </label>
              <textarea 
                className={`w-full min-h-[120px] p-6 border rounded-2xl text-sm font-black focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all resize-none ${
                  hasReconsideration ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}
                value={sections.resolucion}
                onChange={e => setSections({...sections, resolucion: e.target.value})}
              />
              {!hasReconsideration && (
                <p className="text-[10px] text-red-500 font-bold animate-pulse uppercase tracking-tight">
                  Error: Falta incluir el derecho de reconsideración (15 días hábiles). Obligatorio por Circular 782.
                </p>
              )}
            </section>

          </div>

          {/* Columna Derecha: Asistente Normativo */}
          <div className="w-full lg:w-96 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-4 md:p-8 flex flex-col shrink-0 overflow-y-auto">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-3 text-blue-600" />
              Asistente Normativo
            </h3>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gradualidad y Factores</p>
                <div className="space-y-3">
                  {FACTORES.map(f => (
                    <button
                      key={f.id}
                      onClick={() => handleToggleFactor(f.id)}
                      className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-start space-x-3 group ${
                        selectedFactors.includes(f.id) 
                        ? 'border-blue-600 bg-blue-50/50' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${f.type === 'atenuante' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className={`text-[10px] font-black uppercase ${selectedFactors.includes(f.id) ? 'text-blue-700' : 'text-slate-500'}`}>
                          {f.label}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium leading-tight mt-1 group-hover:text-slate-500">
                          Click para {selectedFactors.includes(f.id) ? 'remover' : 'inyectar'} texto legal.
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-xl shadow-blue-500/20">
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Checklist SIE
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-[10px] font-bold">
                    <ChevronRight className="w-3 h-3 mr-2 text-blue-300" />
                    Identificación completa NNA
                  </li>
                  <li className="flex items-center text-[10px] font-bold">
                    <ChevronRight className="w-3 h-3 mr-2 text-blue-300" />
                    Individualización de normativa
                  </li>
                  <li className="flex items-center text-[10px] font-bold">
                    <ChevronRight className="w-3 h-3 mr-2 text-blue-300" />
                    Fundamentación del hecho
                  </li>
                  <li className={`flex items-center text-[10px] font-bold transition-colors ${hasReconsideration ? 'text-emerald-300' : 'text-white'}`}>
                    <ChevronRight className="w-3 h-3 mr-2 text-blue-300" />
                    Derecho de Reconsideración
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <button 
                disabled={!isValid}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3 ${
                  isValid ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Finalizar y Firmar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Vista Previa (Estilo Legal) */}
      {showPreview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-4 md:p-10 overflow-y-auto">
          <div className="bg-white w-full max-w-[850px] min-h-[900px] md:min-h-[1100px] p-6 md:p-24 shadow-2xl relative font-serif text-slate-900">
            {/* Botón cerrar preview */}
            <button 
              onClick={() => setShowPreview(false)}
              className="absolute -top-12 right-0 flex items-center text-white text-[10px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors"
            >
              <X className="w-5 h-5 mr-2" />
              Cerrar Vista Previa
            </button>

            {/* Acciones del documento */}
            <div className="absolute top-10 right-10 flex space-x-4 no-print">
               <button className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Printer className="w-5 h-5" /></button>
               <button className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Download className="w-5 h-5" /></button>
            </div>

            {/* Membrete Simulado */}
            <div className="border-b-2 border-slate-900 pb-8 mb-12 flex justify-between items-start">
              <div>
                <h1 className="text-lg font-bold uppercase leading-tight">Liceo Bicentenario Excellence</h1>
                <p className="text-xs uppercase font-medium">Departamento de Convivencia Escolar</p>
                <p className="text-[10px] italic">"Hacia una comunidad protectora y formativa"</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">FOLIO: {expedienteSeleccionado?.id}</p>
                <p className="text-xs">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
              </div>
            </div>

            <div className="text-center mb-12">
               <h2 className="text-xl font-bold uppercase tracking-widest underline decoration-2 underline-offset-8">Resolución Exenta de Medida Disciplinaria</h2>
            </div>

            {/* Contenido del Documento */}
            <div className="space-y-8 text-sm leading-relaxed text-justify">
               <p className="whitespace-pre-wrap">{sections.vistos}</p>
               <p className="whitespace-pre-wrap">{sections.considerando}</p>
               <p className="whitespace-pre-wrap">{sections.fundamentos}</p>
               <p className="whitespace-pre-wrap">{sections.proporcionalidad}</p>
               <p className="whitespace-pre-wrap font-bold bg-slate-50 p-6 border-l-4 border-slate-900">{sections.resolucion}</p>
            </div>

            {/* Firmas y Timbres */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
              <div className="text-center border-t border-slate-900 pt-4">
                 <p className="font-bold uppercase text-[10px]">Juan Director</p>
                 <p className="text-[9px] uppercase">Director General</p>
                 <p className="text-[8px] text-slate-400 mt-2">Firmado Electrónicamente vía SGE</p>
              </div>
              <div className="text-center border-t border-slate-900 pt-4">
                 <p className="font-bold uppercase text-[10px]">Encargado Convivencia</p>
                 <p className="text-[9px] uppercase">Ministro de Fe</p>
                 <div className="mt-4 w-16 h-16 border-2 border-blue-900/20 rounded-full mx-auto flex items-center justify-center opacity-30">
                    <ShieldAlert className="w-8 h-8 text-blue-900" />
                 </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 text-[8px] text-slate-400 text-center uppercase tracking-widest">
               Este documento es oficial y cuenta con validez para auditoría ante la Superintendencia de Educación.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneradorResolucion;
