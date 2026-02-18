import React, { useEffect, useMemo, useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ChevronDown, X, Users, Search, ChevronUp } from 'lucide-react';
import { Estudiante } from '@/types';
import { ExpedienteFormValues } from './wizard.types';

interface WizardStudentSelectorProps {
  title: string;
  emptyHint: string;
  estudiantes: Estudiante[];
  fieldName: 'estudianteId' | 'actorBId';
  register: UseFormRegister<ExpedienteFormValues>;
  watch: UseFormWatch<ExpedienteFormValues>;
  setValue: UseFormSetValue<ExpedienteFormValues>;
  errors: FieldErrors<ExpedienteFormValues>;
  cursoFieldName?: 'actorBCurso';
}

export const WizardStudentSelector: React.FC<WizardStudentSelectorProps> = ({
  title,
  emptyHint,
  estudiantes,
  fieldName,
  register,
  watch,
  setValue,
  errors,
  cursoFieldName,
}) => {
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchEstudiante, setSearchEstudiante] = useState('');
  const selectedStudentId = watch(fieldName);

  const cursos = useMemo(() => {
    const cursosSet = new Set<string>();
    estudiantes.forEach((est) => {
      if (est.curso) cursosSet.add(est.curso);
    });
    return Array.from(cursosSet).sort((a, b) => a.localeCompare(b, 'es'));
  }, [estudiantes]);

  useEffect(() => {
    if (selectedCurso) return;
    if (!selectedStudentId) return;
    const selected = estudiantes.find((est) => est.id === selectedStudentId);
    if (selected?.curso) {
      setSelectedCurso(selected.curso);
      if (cursoFieldName) {
        setValue(cursoFieldName, selected.curso, { shouldValidate: true });
      }
    }
  }, [selectedCurso, selectedStudentId, estudiantes, cursoFieldName, setValue]);

  const estudiantesDelCurso = useMemo(() => {
    if (!selectedCurso) return [];
    let filtered = estudiantes.filter((est) => est.curso === selectedCurso);
    if (searchEstudiante.trim()) {
      const term = searchEstudiante.toLowerCase().trim();
      filtered = filtered.filter((est) => est.nombreCompleto.toLowerCase().includes(term));
    }
    return filtered;
  }, [estudiantes, selectedCurso, searchEstudiante]);

  const totalEstudiantesCurso = useMemo(() => {
    return estudiantes.filter((est) => est.curso === selectedCurso).length;
  }, [estudiantes, selectedCurso]);

  const handleClear = () => {
    setSelectedCurso('');
    setIsExpanded(false);
    setSearchEstudiante('');
    setValue(fieldName, '', { shouldValidate: true });
    if (cursoFieldName) {
      setValue(cursoFieldName, '', { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
        {title}
      </label>
      <div className="relative">
        <select
          value={selectedCurso}
          onChange={(event) => {
            const curso = event.target.value;
            setSelectedCurso(curso);
            setIsExpanded(false);
            setSearchEstudiante('');
            setValue(fieldName, '', { shouldValidate: true });
            if (cursoFieldName) {
              setValue(cursoFieldName, curso, { shouldValidate: true });
            }
          }}
          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:outline-none text-sm font-bold transition-all appearance-none cursor-pointer"
        >
          <option value="">Seleccione un curso...</option>
          {cursos.map((curso) => (
            <option key={curso} value={curso}>
              {curso}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>

      <div className={`space-y-3 transition-all ${!selectedCurso ? 'opacity-50 pointer-events-none' : ''}`}>
        {selectedCurso ? (
          <>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-bold text-blue-800">
                    {totalEstudiantesCurso} estudiante{totalEstudiantesCurso !== 1 ? 's' : ''} en {selectedCurso}
                  </p>
                  <p className="text-xs text-blue-600">
                    {isExpanded ? 'Ocultar lista' : 'Ver estudiantes para seleccionar'}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-blue-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-400" />
              )}
            </button>

            {isExpanded && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2">
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={searchEstudiante}
                      onChange={(event) => setSearchEstudiante(event.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/5 text-sm"
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

                <div className="max-h-60 overflow-y-auto">
                  {estudiantesDelCurso.length > 0 ? (
                    estudiantesDelCurso.map((est) => (
                      <label
                        key={est.id}
                        className="flex items-center p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                      >
                        <input
                          type="radio"
                          value={est.id}
                          {...register(fieldName)}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 flex-shrink-0"
                        />
                        <div className="ml-3 flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-600">
                              {est.nombreCompleto.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{est.nombreCompleto}</p>
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-sm">
                      {searchEstudiante ? `No se encontró "${searchEstudiante}"` : 'Sin estudiantes'}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cambiar curso
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center border border-slate-200 rounded-2xl bg-slate-50">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">{emptyHint}</p>
          </div>
        )}

        {errors[fieldName] && (
          <span className="text-red-500 text-xs font-bold">
            {String(errors[fieldName]?.message ?? '')}
          </span>
        )}
      </div>
    </div>
  );
};

export default WizardStudentSelector;
