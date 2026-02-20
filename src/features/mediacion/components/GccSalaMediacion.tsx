/**
 * GccSalaMediacion - Sala de Mediación / Panel de Trabajo
 * 
 * Responsabilidad: Panel principal de mediación donde se:
 *                  - Registran compromisos reparatorios
 *                  - Gestiona estado del acuerdo
 *                  - Facilita decisiones finales
 * 
 * Props de entrada: casoSeleccionado, estado, compromisos, etc
 * Callbacks: onDerivacionCompleta, onResultadoCompleto, onCierreCompleto
 * 
 * Performance: Usa useCallback para callbacks memoizados a componentes hijos
 */

import React from 'react';
import {
  FileText,
  Info,
  Handshake,
  X,
  FileCheck
} from 'lucide-react';
import type { Expediente } from '@/types';
import { GccCompromisos } from './GccCompromisos';
import { GccResolucion } from './GccResolucion';

// ==================== TIPOS ====================

interface Compromiso {
  id: string;
  descripcion: string;
  fechaCumplimiento: string;
  responsable: string;
  completado: boolean;
}

interface NuevoCompromiso {
  descripcion: string;
  fecha: string;
  responsable: string;
}

interface GccSalaMediacionProps {
  // Caso actual
  casoSeleccionado: Expediente | null;
  
  // Facilitador responsable
  facilitador: string;
  onFacilitadorChange: (value: string) => void;
  
  // Estado del proceso
  statusGCC: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  onStatusChange: (status: string) => void;
  
  // Compromisos
  compromisos: Compromiso[];
  nuevoCompromiso: NuevoCompromiso;
  onNuevoCompromisoChange: (field: string, value: string) => void;
  onAgregarCompromiso: () => void;
  onEliminarCompromiso: (id: string) => void;
  onToggleMarcaCompromiso: (id: string) => void;
  
  // Resultado de mediación
  resultadoMediacion: string;
  onResultadoMediacionChange: (value: string) => void;
  
  // Flag de formularios
  showDerivacionForm: boolean;
  
  showResultadoForm: boolean;
  onToggleResultadoForm: () => void;

  onDestrabarDesdeGCC: () => void;
  onCierreExitoso: () => void;
  
  // Componentes hijos
  derivacionFormComponent: React.ReactNode;
  resultadoFormComponent: React.ReactNode;
}

// ==================== COMPONENTE ====================

export const GccSalaMediacion: React.FC<GccSalaMediacionProps> = ({
  casoSeleccionado,
  facilitador,
  onFacilitadorChange,
  statusGCC,
  onStatusChange,
  compromisos,
  nuevoCompromiso,
  onNuevoCompromisoChange,
  onAgregarCompromiso,
  onEliminarCompromiso,
  onToggleMarcaCompromiso,
  resultadoMediacion,
  onResultadoMediacionChange,
  showDerivacionForm,
  showResultadoForm,
  onToggleResultadoForm,
  onDestrabarDesdeGCC,
  onCierreExitoso,
  derivacionFormComponent,
  resultadoFormComponent
}) => {
  return (
    <section className="lg:col-span-2 space-y-8">
      {/* DERIVACIÓN FORM MODAL */}
      {showDerivacionForm && casoSeleccionado ? (
        <>
          {derivacionFormComponent}
        </>
      ) : showResultadoForm && casoSeleccionado ? (
        // RESULTADO FORM MODAL
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-200/20 p-4 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center">
              <FileCheck className="w-6 h-6 mr-3 text-emerald-600" />
              Registrar Resultado de Mediación
            </h3>
            <button
              onClick={onToggleResultadoForm}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {resultadoFormComponent}
        </div>
      ) : casoSeleccionado ? (
        // MAIN SALA PANEL
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-200/20 p-4 md:p-10 animate-in zoom-in-95 duration-500">
          {/* Info del Caso */}
          <div className="mb-10 p-4 md:p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
              Caso en Mediación
            </p>
            <h2 className="text-lg md:text-xl font-black text-slate-900">
              {casoSeleccionado.nnaNombre}
            </h2>
            <p className="text-xs font-bold text-slate-500 font-mono">
              Folio: {casoSeleccionado.id}
            </p>
          </div>

          {/* Facilitador + Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Facilitador Input */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Facilitador Responsable
              </label>
              <input
                type="text"
                value={facilitador}
                onChange={(e) => onFacilitadorChange(e.target.value)}
                placeholder="Nombre del facilitador"
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Estado Buttons */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Estado del Proceso
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['PROCESO', 'LOGRADO', 'NO_ACUERDO'].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => onStatusChange(estado)}
                    className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                      statusGCC === estado
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {estado === 'PROCESO' && 'En Proceso'}
                    {estado === 'LOGRADO' && 'Logrado'}
                    {estado === 'NO_ACUERDO' && 'Sin Acuerdo'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Compromisos Section */}
          <div className="mb-10 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
            <GccCompromisos
              compromisos={compromisos}
              nuevoCompromiso={nuevoCompromiso}
              onNuevoCompromisoChange={onNuevoCompromisoChange}
              onAgregarCompromiso={onAgregarCompromiso}
              onEliminarCompromiso={onEliminarCompromiso}
              onToggleMarcaCompromiso={onToggleMarcaCompromiso}
            />
          </div>

          {/* Acta Preview */}
          <div className="mb-10 p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
              <FileText className="w-5 h-5 mr-3 text-emerald-600" />
              Vista Previa del Acta
            </h4>
            <textarea
              value={resultadoMediacion}
              onChange={(e) => onResultadoMediacionChange(e.target.value)}
              placeholder="Contenido del acta de mediación..."
              rows={6}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Acciones Finales */}
          <GccResolucion
            statusGCC={statusGCC}
            actaTemplate={resultadoMediacion}
            showActaPreview={false}
            onToggleActaPreview={() => {}}
            onDestrabarDesdeGCC={onDestrabarDesdeGCC}
            onCierreExitoso={onCierreExitoso}
          />
        </div>
      ) : (
        // EMPTY STATE - No case selected
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-200/10 p-8 md:p-20 flex flex-col items-center justify-center text-center space-y-6 h-full">
          <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-50 text-emerald-300">
            <Handshake className="w-16 h-16" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
              Sala de Conciliación GCC
            </h3>
            <p className="text-slate-400 font-bold text-xs md:text-sm mt-2 max-w-sm">
              Seleccione un proceso del listado izquierdo para iniciar el diseño del acuerdo
              reparatorio.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full">
            <Info className="w-4 h-4" />
            <span>Solo casos en Etapa de Investigación o Notificación</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default GccSalaMediacion;

