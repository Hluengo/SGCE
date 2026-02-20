import React, { useMemo } from 'react';
import { FilePlus, Shield, Info, X } from 'lucide-react';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';

export type NuevaEvidenciaPayload = {
  origen: 'ESTABLECIMIENTO' | 'APODERADO' | 'DECLARACION_ESTUDIANTE';
  categoria: 'TESTIMONIAL' | 'DOCUMENTAL' | 'AUDIOVISUAL' | 'DIGITAL';
  descripcion: string;
  hito: 'INVESTIGACION' | 'DESCARGOS' | 'APOYO_PREVIO';
  esSensible: boolean;
  hashIntegridad: string;
  fechaCarga: string;
  archivoNombre?: string;
};

type Props = {
  isOpen: boolean;
  archivoNombre?: string;
  onClose: () => void;
  onSubmit: (payload: NuevaEvidenciaPayload) => void;
};

type EvidenciaDraft = Pick<NuevaEvidenciaPayload, 'origen' | 'categoria' | 'descripcion' | 'hito' | 'esSensible'>;

const ORIGEN_OPTIONS: NuevaEvidenciaPayload['origen'][] = ['ESTABLECIMIENTO', 'APODERADO', 'DECLARACION_ESTUDIANTE'];
const CATEGORIA_OPTIONS: NuevaEvidenciaPayload['categoria'][] = ['TESTIMONIAL', 'DOCUMENTAL', 'AUDIOVISUAL', 'DIGITAL'];
const HITO_OPTIONS: NuevaEvidenciaPayload['hito'][] = ['INVESTIGACION', 'DESCARGOS', 'APOYO_PREVIO'];

const generateHash = () => {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `sha256-${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
};

const FormularioNuevaEvidencia: React.FC<Props> = ({ isOpen, archivoNombre, onClose, onSubmit }) => {
  const draftKey = `evidencia:nueva:${archivoNombre ?? 'sin_archivo'}`;
  const [form, setForm, clearForm] = useLocalDraft<EvidenciaDraft>(draftKey, {
    origen: 'ESTABLECIMIENTO' as const,
    categoria: 'DOCUMENTAL' as const,
    descripcion: '',
    hito: 'INVESTIGACION' as const,
    esSensible: false
  });

  const hashIntegridad = useMemo(() => generateHash(), [isOpen, archivoNombre]);
  const fechaCarga = useMemo(() => new Date().toISOString(), [isOpen, archivoNombre]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({
      ...form,
      hashIntegridad,
      fechaCarga,
      archivoNombre
    });
    clearForm();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl max-h-screen rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <header className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Formulario de Nueva Evidencia</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Custodia SIE - Registro Formal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 md:p-8 space-y-6 overflow-y-auto min-h-0">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Archivo</p>
              <p className="text-xs font-black text-slate-800 uppercase truncate max-w-52 md:max-w-none">
                {archivoNombre ?? 'Sin archivo seleccionado'}
              </p>
            </div>
            <div className="flex items-center text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
              <Shield className="w-3 h-3 mr-2" />
              Cadena de Custodia
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Origen de la Evidencia
              <select
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                value={form.origen}
                onChange={(e) => {
                  const value = e.target.value as NuevaEvidenciaPayload['origen'];
                  if (ORIGEN_OPTIONS.includes(value)) {
                    setForm({ ...form, origen: value });
                  }
                }}
              >
                <option value="ESTABLECIMIENTO">Aportada por el Establecimiento</option>
                <option value="APODERADO">Aportada por el Apoderado</option>
                <option value="DECLARACION_ESTUDIANTE">Declaración de Estudiante</option>
              </select>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Categorización Normativa
              <select
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                value={form.categoria}
                onChange={(e) => {
                  const value = e.target.value as NuevaEvidenciaPayload['categoria'];
                  if (CATEGORIA_OPTIONS.includes(value)) {
                    setForm({ ...form, categoria: value });
                  }
                }}
              >
                <option value="TESTIMONIAL">Testimonial</option>
                <option value="DOCUMENTAL">Documental</option>
                <option value="AUDIOVISUAL">Audiovisual</option>
                <option value="DIGITAL">Evidencia Digital</option>
              </select>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Descripción Objetiva de los Hechos
            <textarea
              className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none resize-none"
              placeholder="Ej: Se observa al estudiante X ingresando al baño a las 10:00 hrs..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Vínculo con Hito del Debido Proceso
              <select
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                value={form.hito}
                onChange={(e) => {
                  const value = e.target.value as NuevaEvidenciaPayload['hito'];
                  if (HITO_OPTIONS.includes(value)) {
                    setForm({ ...form, hito: value });
                  }
                }}
              >
                <option value="INVESTIGACION">Investigación inicial</option>
                <option value="DESCARGOS">Prueba de descargos</option>
                <option value="APOYO_PREVIO">Antecedente previo de apoyo</option>
              </select>
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Clasificación de Privacidad</p>
              <label className="flex items-center space-x-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.esSensible}
                  onChange={(e) => setForm({ ...form, esSensible: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded border-slate-300"
                />
                <span className="text-xs font-black text-slate-700 uppercase">Evidencia Sensible (Dirección/Convivencia)</span>
              </label>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-blue-300">Control de Cadena de Custodia</p>
              <Info className="w-4 h-4 text-blue-300" />
            </div>
            <div className="space-y-2 text-xs font-bold">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-300">Hash de Integridad</span>
                <span className="font-mono text-slate-100">{hashIntegridad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Fecha/Hora de Carga</span>
                <span className="text-slate-100">{new Date(fechaCarga).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-3 md:justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
          >
            Guardar Metadatos
          </button>
        </footer>
      </div>
    </div>
  );
};

export default FormularioNuevaEvidencia;


