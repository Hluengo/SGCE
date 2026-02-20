/**
 * GccResolucion - Resolución y Cierre de Mediación
 * 
 * Responsabilidad: Panel de acciones finales donde se:
 *                  - Previsualizan actas de mediación
 *                  - Declara el cierre de mediación
 *                  - Destrabar expediente y continuar
 *                  - Acciones de cierre exitoso
 * 
 * Performance: Memoizado para evitar re-renders innecesarios
 */

import React, { useCallback } from 'react';
import {
  FileText,
  Clock,
  ShieldCheck
} from 'lucide-react';

// ==================== TIPOS ====================

export interface GccResolucionProps {
  // Estado
  statusGCC: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  actaTemplate: string;
  showActaPreview: boolean;
  
  // Callbacks
  onToggleActaPreview: () => void;
  onDestrabarDesdeGCC: () => void;
  onCierreExitoso: () => void;
}

// ==================== COMPONENTE ====================

export const GccResolucion: React.FC<GccResolucionProps> = ({
  statusGCC,
  actaTemplate,
  showActaPreview,
  onToggleActaPreview,
  onDestrabarDesdeGCC,
  onCierreExitoso
}) => {
  // Memoizar callbacks
  const handleTogglePreview = useCallback(
    () => onToggleActaPreview(),
    [onToggleActaPreview]
  );

  const handleDestrabado = useCallback(
    () => onDestrabarDesdeGCC(),
    [onDestrabarDesdeGCC]
  );

  const handleCierreExitoso = useCallback(
    () => onCierreExitoso(),
    [onCierreExitoso]
  );

  return (
    <div className="space-y-6">
      {/* Vista Previa del Acta (Expandible) */}
      {showActaPreview && (
        <div className="mb-10 p-4 md:p-6 rounded-2xl border border-slate-200 bg-slate-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Acta de Mediación Reparatoria
            </p>
            <button
              onClick={onToggleActaPreview}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              Cerrar
            </button>
          </div>
          <textarea
            readOnly
            value={actaTemplate}
            rows={12}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
          />
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold uppercase tracking-widest">
            Esta es una vista previa del acta. Revise los compromisos registrados antes de finalizar.
          </div>
        </div>
      )}

      {/* Acciones Finales */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 pt-4 md:pt-6 border-t border-slate-100">
        {/* Botón: Previsualizar Acta */}
        <button
          onClick={handleTogglePreview}
          className="flex-1 py-4 md:py-5 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center space-x-3 active:scale-95"
        >
          <FileText className="w-5 h-5" />
          <span>{showActaPreview ? 'Ocultar Acta' : 'Previsualizar Acta'}</span>
        </button>

        {/* Botón: Destrabado */}
        <button
          onClick={handleDestrabado}
          className="flex-1 py-4 md:py-5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-700 font-black text-xs uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center justify-center space-x-3 active:scale-95"
        >
          <Clock className="w-5 h-5" />
          <span className="leading-tight">Sacar de GCC<br />y Continuar</span>
        </button>

        {/* Botón: Cierre Exitoso */}
        <button
          onClick={handleCierreExitoso}
          disabled={statusGCC !== 'LOGRADO'}
          className={`flex-1 py-4 md:py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center space-x-3 active:scale-95 ${
            statusGCC === 'LOGRADO'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="leading-tight">Cierre Exitoso<br />por Vía Formativa</span>
        </button>
      </div>

      {/* Info Box */}
      {statusGCC !== 'LOGRADO' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-700 font-bold uppercase tracking-widest">
          ⓘ El cierre exitoso solo está disponible cuando el estado es "LOGRADO"
        </div>
      )}
    </div>
  );
};

export default React.memo(GccResolucion);

