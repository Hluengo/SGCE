/**
 * GccCircular782Section - Sección reutilizable de conformidad Circular 782
 * 
 * Implementa los 5 campos requeridos por Circular 782:
 * 1. Participación voluntaria explícita
 * 2. Escenario de procedencia
 * 3. Plazo de exigibilidad de compromisos
 * 4. Autorización para divulgar resultado
 * 5. Evaluación y seguimiento
 */

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  BarChart3,
  Lock,
  FileText
} from 'lucide-react';

export type EscenarioProcedencia = 'SIN_INCUMPLIMIENTO' | 'CON_INCUMPLIMIENTO' | 'RESTAURATIVO';

interface GccCircular782SectionProps {
  collarMechanism?: 'green' | 'blue' | 'purple' | 'red';
  
  // 1. Participación voluntaria
  aceptaParticipacion: boolean;
  onAceptaParticipacionChange: (value: boolean) => void;
  
  // 2. Escenario de procedencia
  escenarioProcedencia?: EscenarioProcedencia;
  onEscenarioProcedenciaChange: (value: EscenarioProcedencia) => void;
  
  // 3. Plazo de exigibilidad
  plazoCompromiso: string;
  onPlazoCompromisoChange: (value: string) => void;
  
  // 4. Privacidad/Confidencialidad
  autorizaDivulgacionResultado: boolean;
  onAutorizaDivulgacionResultadoChange: (value: boolean) => void;
  
  // 5. Seguimiento
  fechaSeguimiento: string;
  onFechaSeguimientoChange: (value: string) => void;
  evaluacionResultado: string;
  onEvaluacionResultadoChange: (value: string) => void;
}

const colorScheme = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    checkbox: 'accent-green-600',
    btn: 'bg-green-600 hover:bg-green-700',
    text: 'text-green-700',
    icon: 'text-green-600'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    checkbox: 'accent-blue-600',
    btn: 'bg-blue-600 hover:bg-blue-700',
    text: 'text-blue-700',
    icon: 'text-blue-600'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    checkbox: 'accent-purple-600',
    btn: 'bg-purple-600 hover:bg-purple-700',
    text: 'text-purple-700',
    icon: 'text-purple-600'
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    checkbox: 'accent-red-600',
    btn: 'bg-red-600 hover:bg-red-700',
    text: 'text-red-700',
    icon: 'text-red-600'
  }
};

export const GccCircular782Section: React.FC<GccCircular782SectionProps> = ({
  collarMechanism = 'blue',
  aceptaParticipacion,
  onAceptaParticipacionChange,
  escenarioProcedencia,
  onEscenarioProcedenciaChange,
  plazoCompromiso,
  onPlazoCompromisoChange,
  autorizaDivulgacionResultado,
  onAutorizaDivulgacionResultadoChange,
  fechaSeguimiento,
  onFechaSeguimientoChange,
  evaluacionResultado,
  onEvaluacionResultadoChange
}) => {
  const colors = colorScheme[collarMechanism];

  return (
    <div className={`space-y-6 rounded-3xl border p-6 ${colors.bg} ${colors.border}`}>
      {/* Header */}
      <div className="flex items-start space-x-4 pb-4 border-b border-slate-200">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
          <FileText className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
            📋 Conformidad Circular 782
          </h3>
          <p className={`text-xs font-bold ${colors.text} uppercase tracking-widest mt-1`}>
            Requisitos de Gestión Colaborativa de Conflictos
          </p>
        </div>
      </div>

      {/* 1. Participación Voluntaria */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className={`w-4 h-4 ${colors.icon}`} />
          <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
            1. Participación Voluntaria Explícita
          </label>
        </div>
        <div className="pl-6 space-y-2">
          <label className="flex items-center space-x-4 cursor-pointer">
            <input
              type="checkbox"
              checked={aceptaParticipacion}
              onChange={(e) => onAceptaParticipacionChange(e.target.checked)}
              className={`w-5 h-5 rounded ${colors.checkbox}`}
            />
            <span className="text-xs font-bold text-slate-700">
              Todas las partes aceptan voluntariamente participar en este mecanismo
            </span>
          </label>
          <p className="text-xs italic text-slate-500">
            Circular 782: Garantizar expresamente que la participación será de carácter voluntario
          </p>
        </div>
      </div>

      {/* 2. Escenario de Procedencia */}
      <div className="space-y-4 pt-3 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <AlertCircle className={`w-4 h-4 ${colors.icon}`} />
          <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
            2. Escenario de Procedencia
          </label>
        </div>
        <div className="pl-6 space-y-2">
          <select
            value={escenarioProcedencia || ''}
            onChange={(e) => onEscenarioProcedenciaChange(e.target.value as EscenarioProcedencia)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-slate-500 focus:outline-none"
          >
            <option value="">Seleccione escenario...</option>
            <option value="SIN_INCUMPLIMIENTO">
              Sin incumplimiento de norma (gestión pura de conflicto)
            </option>
            <option value="CON_INCUMPLIMIENTO">
              Con incumplimiento de norma (parte del procedimiento disciplinario)
            </option>
            <option value="RESTAURATIVO">
              Restaurativo (post-disciplina, reparación de daño)
            </option>
          </select>
          <p className="text-xs italic text-slate-500">
            Circular 782: Aplicar según contexto del conflicto
          </p>
        </div>
      </div>

      {/* 3. Plazo de Exigibilidad */}
      <div className="space-y-4 pt-3 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <Calendar className={`w-4 h-4 ${colors.icon}`} />
          <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
            3. Plazo de Exigibilidad de Compromisos
          </label>
        </div>
        <div className="pl-6 space-y-2">
          <input
            type="date"
            value={plazoCompromiso}
            onChange={(e) => onPlazoCompromisoChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-slate-500 focus:outline-none"
          />
          <p className="text-xs italic text-slate-500">
            Circular 782: Fijar plazo para exigibilidad de compromisos adquiridos
          </p>
        </div>
      </div>

      {/* 4. Privacidad y Confidencialidad */}
      <div className="space-y-4 pt-3 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <Lock className={`w-4 h-4 ${colors.icon}`} />
          <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
            4. Privacidad y Confidencialidad
          </label>
        </div>
        <div className="pl-6 space-y-2">
          <label className="flex items-center space-x-4 cursor-pointer">
            <input
              type="checkbox"
              checked={!autorizaDivulgacionResultado}
              onChange={(e) => onAutorizaDivulgacionResultadoChange(!e.target.checked)}
              className={`w-5 h-5 rounded ${colors.checkbox}`}
            />
            <span className="text-xs font-bold text-slate-700">
              Contenido de acuerdos es de carácter privado (No divulgar)
            </span>
          </label>
          <label className="flex items-center space-x-4 cursor-pointer">
            <input
              type="checkbox"
              checked={autorizaDivulgacionResultado}
              onChange={(e) => onAutorizaDivulgacionResultadoChange(e.target.checked)}
              className={`w-5 h-5 rounded ${colors.checkbox}`}
            />
            <span className="text-xs font-bold text-slate-700">
              Se autoriza divulgación de resultado (previa autorización de partes)
            </span>
          </label>
          <p className="text-xs italic text-slate-500">
            Circular 782: Garantizar derecho a intimidad y confidencialidad
          </p>
        </div>
      </div>

      {/* 5. Evaluación y Seguimiento */}
      <div className="space-y-4 pt-3 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <BarChart3 className={`w-4 h-4 ${colors.icon}`} />
          <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
            5. Evaluación y Seguimiento
          </label>
        </div>
        <div className="pl-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Fecha de Evaluación
            </label>
            <input
              type="date"
              value={fechaSeguimiento}
              onChange={(e) => onFechaSeguimientoChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Resultado / Conclusiones
            </label>
            <textarea
              value={evaluacionResultado}
              onChange={(e) => onEvaluacionResultadoChange(e.target.value)}
              placeholder="¿Fue eficaz la solución? ¿Se cumplieron los compromisos?"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-slate-500 focus:outline-none"
            />
          </div>
          <p className="text-xs italic text-slate-500">
            Circular 782: Evaluar eficacia de solución y cumplimiento de compromisos
          </p>
        </div>
      </div>

      {/* Compliance Badge */}
      <div className="mt-4 flex items-center space-x-2 rounded-xl border border-slate-200 bg-white p-4">
        <CheckCircle2 className={`w-4 h-4 ${colors.icon} flex-shrink-0`} />
        <p className="text-xs font-bold text-slate-600">
          ✓ Todos los campos de Circular 782 están documentados en el acta
        </p>
      </div>
    </div>
  );
};

export default GccCircular782Section;

