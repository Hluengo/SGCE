/**
 * GccCasosPanel - Panel de Casos para Mediación
 * 
 * Responsabilidad: Mostrar lista de casos disponibles para derivar a GCC
 *                  y procesos activos en mediación
 * 
 * Props de entrada: expedientes[], selectedCaseId, onSelectCase
 * Callbacks: onSelectCase(caseId)
 * 
 * Performance: Memoizado para evitar re-renders innecesarios
 */

import React, { useCallback, useMemo } from 'react';
import type { Expediente } from '@/types';

// ==================== TIPOS ====================

type AlertaPlazo = 'OK' | 'T2' | 'T1' | 'VENCIDO';

// ==================== UTILIDADES ====================

/**
 * Parsea fecha de string a Date
 * Soporta formatos: ISO string, YYYY-MM-DD, DD-MM-YYYY
 */
const parseFecha = (value?: string | null): Date | null => {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const parts = value.split('-');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const parsed = new Date(`${y}-${m}-${d}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

/**
 * Calcula diferencia en días entre hoy y fecha target
 */
const diffDias = (target: Date): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Determina alerta de plazo según fecha
 * OK: 2+ días
 * T2: 2 días
 * T1: 1 día
 * VENCIDO: <0 días
 */
const getAlertaPlazo = (fecha?: string | null): AlertaPlazo => {
  const parsed = parseFecha(fecha);
  if (!parsed) return 'OK';
  const days = diffDias(parsed);
  if (days < 0) return 'VENCIDO';
  if (days <= 1) return 'T1';
  if (days <= 2) return 'T2';
  return 'OK';
};

// ==================== TIPOS DE PROPS ====================

export interface GccCasosPanelProps {
  /** Casos disponibles para derivar a GCC */
  casosParaGCC: Expediente[];
  
  /** Casos ya en proceso GCC */
  casosConDerivacion: Expediente[];
  
  /** ID del caso actualmente seleccionado */
  selectedCaseId: string | null;
  
  /** Callback cuando se selecciona un caso */
  onSelectCase: (caseId: string) => void;
}

// ==================== COMPONENTE ====================

/**
 * Panel de casos: muestra lista de expedientes disponibles
 * para derivar a GCC y procesos activos en mediación
 */
export const GccCasosPanel: React.FC<GccCasosPanelProps> = ({
  casosParaGCC,
  casosConDerivacion,
  selectedCaseId,
  onSelectCase
}) => {
  // Memoizar callback de selección
  const handleSelectCase = useCallback(
    (caseId: string) => onSelectCase(caseId),
    [onSelectCase]
  );

  // Memoizar casos ordenados
  const sortedCasosParaGCC = useMemo(
    () => [...casosParaGCC].sort((a, b) => a.nnaNombre.localeCompare(b.nnaNombre)),
    [casosParaGCC]
  );

  const sortedCasosConDerivacion = useMemo(
    () => [...casosConDerivacion].sort((a, b) => a.nnaNombre.localeCompare(b.nnaNombre)),
    [casosConDerivacion]
  );

  // Unificar casos en una sola lista
  const todosLosCasos = useMemo(() => {
    const disponibles = sortedCasosParaGCC.map(exp => ({
      ...exp,
      tipo: 'disponible' as const,
      alerta: 'OK' as AlertaPlazo
    }));
    
    const activos = sortedCasosConDerivacion.map(exp => ({
      ...exp,
      tipo: 'activo' as const,
      alerta: getAlertaPlazo(exp.plazoFatal)
    }));
    
    return [...disponibles, ...activos];
  }, [sortedCasosParaGCC, sortedCasosConDerivacion]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/20">
      {/* Header */}
      <div className="p-3 md:p-4 lg:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <h3 className="text-base md:text-lg font-bold text-slate-900">Casos GCC</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
            <span className="text-slate-600">Disponibles ({sortedCasosParaGCC.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
            <span className="text-slate-600">Activos ({sortedCasosConDerivacion.length})</span>
          </div>
        </div>
      </div>

      {/* Tabla Unificada */}
      {todosLosCasos.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-12">
          No hay casos disponibles
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase tracking-widest text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-2 md:px-3 lg:px-6 py-3 md:py-4">Expediente</th>
                <th className="px-2 md:px-3 lg:px-6 py-3 md:py-4">Estudiante</th>
                <th className="px-2 md:px-3 lg:px-6 py-3 md:py-4">Estado</th>
                <th className="hidden md:table-cell px-2 md:px-3 lg:px-6 py-3 md:py-4">Plazo</th>
                <th className="px-2 md:px-3 lg:px-6 py-3 md:py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todosLosCasos.map((caso) => (
                <tr 
                  key={caso.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    selectedCaseId === caso.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Expediente */}
                  <td className={`px-2 md:px-3 lg:px-6 py-3 md:py-4 font-bold font-mono text-xs ${
                    caso.tipo === 'disponible' ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    {caso.id.slice(0, 8)}
                  </td>

                  {/* Estudiante */}
                  <td className="px-2 md:px-3 lg:px-6 py-3 md:py-4">
                    <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{caso.nnaNombre}</p>
                  </td>

                  {/* Estado */}
                  <td className="px-2 md:px-3 lg:px-6 py-3 md:py-4">
                    {caso.tipo === 'disponible' ? (
                      <span className="rounded-full bg-emerald-100 px-2 md:px-2.5 py-0.5 md:py-1 text-xs font-bold uppercase tracking-tight text-emerald-700">
                        Disponible
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2 md:px-2.5 py-0.5 md:py-1 text-xs font-bold uppercase tracking-tight text-blue-700">
                        En Progreso
                      </span>
                    )}
                  </td>

                  {/* Plazo - Oculto en mobile */}
                  <td className="hidden md:table-cell px-2 md:px-3 lg:px-6 py-3 md:py-4">
                    {caso.tipo === 'activo' && caso.alerta !== 'OK' ? (
                      <span
                        className={`rounded-full px-2 md:px-2.5 py-0.5 md:py-1 text-xs font-bold uppercase tracking-tight ${
                          caso.alerta === 'VENCIDO'
                            ? 'bg-red-100 text-red-700'
                            : caso.alerta === 'T1'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {caso.alerta === 'VENCIDO'
                          ? 'Vencido'
                          : caso.alerta === 'T1'
                            ? 'Vence mañana'
                            : 'Vence en 2 días'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">
                        {caso.tipo === 'disponible' ? '—' : 'En plazo'}
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-2 md:px-3 lg:px-6 py-3 md:py-4 text-right">
                    <button
                      onClick={() => handleSelectCase(caso.id)}
                      className={`px-2 md:px-3 py-1 md:py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                        selectedCaseId === caso.id
                          ? 'bg-blue-600 text-white'
                          : caso.tipo === 'disponible'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {selectedCaseId === caso.id 
                        ? 'Sel.' 
                        : caso.tipo === 'disponible' 
                          ? 'Selec.' 
                          : 'Ver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default React.memo(GccCasosPanel);
