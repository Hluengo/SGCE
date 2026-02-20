/**
 * GccCompromisos - Gestión de Compromisos Reparatorios
 * 
 * Responsabilidad: Panel de compromisos reparatorios donde se:
 *                  - Lista compromisos registrados
 *                  - Marcar como completados
 *                  - Agregar nuevos compromisos
 *                  - Eliminar compromisos
 * 
 * Cumple Circular 782 (compromisos reparatorios)
 * 
 * Performance: Memoizado para evitar re-renders innecesarios
 */

import React, { useMemo, useCallback } from 'react';
import {
  CheckCircle,
  Trash2,
  Users,
  Calendar,
  Plus
} from 'lucide-react';

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

export interface GccCompromisosProps {
  // Compromisos actuales
  compromisos: Compromiso[];
  nuevoCompromiso: NuevoCompromiso;
  
  // Callbacks
  onNuevoCompromisoChange: (field: string, value: string) => void;
  onAgregarCompromiso: () => void;
  onEliminarCompromiso: (id: string) => void;
  onToggleMarcaCompromiso: (id: string) => void;
}

// ==================== COMPONENTE ====================

export const GccCompromisos: React.FC<GccCompromisosProps> = ({
  compromisos,
  nuevoCompromiso,
  onNuevoCompromisoChange,
  onAgregarCompromiso,
  onEliminarCompromiso,
  onToggleMarcaCompromiso
}) => {
  // Memoizar validación
  const isAddCompromisoDisabled = useMemo(
    () => !nuevoCompromiso.descripcion || !nuevoCompromiso.fecha,
    [nuevoCompromiso.descripcion, nuevoCompromiso.fecha]
  );

  // Memoizar callbacks
  const handleToggle = useCallback(
    (id: string) => onToggleMarcaCompromiso(id),
    [onToggleMarcaCompromiso]
  );

  const handleDelete = useCallback(
    (id: string) => onEliminarCompromiso(id),
    [onEliminarCompromiso]
  );

  const handleFieldChange = useCallback(
    (field: string, value: string) => onNuevoCompromisoChange(field, value),
    [onNuevoCompromisoChange]
  );

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
          <CheckCircle className="w-5 h-5 mr-3 text-emerald-600" />
          Compromisos Reparatorios
        </h4>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-600">
          {compromisos.length} Definidos
        </span>
      </div>

      {/* Lista de Compromisos Existentes */}
      <div className="space-y-4">
        {compromisos.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-400">
            Sin compromisos definidos aún
          </div>
        ) : (
          compromisos.map((comp) => (
            <div
              key={comp.id}
              className="group flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 transition-all hover:bg-emerald-50 md:p-6"
            >
              <div className="flex items-center space-x-6 flex-1">
                {/* Checkbox de Completado */}
                <button
                  onClick={() => handleToggle(comp.id)}
                  className={`p-2 rounded-xl border-2 transition-all flex-shrink-0 ${
                    comp.completado
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-bold ${
                      comp.completado
                        ? 'text-emerald-700 line-through'
                        : 'text-slate-800'
                    }`}
                  >
                    {comp.descripcion}
                  </p>
                  <div className="flex items-center mt-1 space-x-4 flex-wrap gap-2">
                    <span className="flex items-center text-xs font-black uppercase text-emerald-600">
                      <Users className="w-3 h-3 mr-1.5" />
                      {comp.responsable}
                    </span>
                    <span className="flex items-center text-xs font-black uppercase text-slate-400">
                      <Calendar className="w-3 h-3 mr-1.5" />
                      {new Date(comp.fechaCumplimiento).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón Eliminar */}
              <button
                onClick={() => handleDelete(comp.id)}
                className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-4"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Formulario para Nuevo Compromiso */}
      <div className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Nuevo Compromiso Reparatorio (Circular 782)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Descripción */}
          <input
            type="text"
            placeholder="Ej: Disculpas públicas, restitución, etc..."
            value={nuevoCompromiso.descripcion}
            onChange={(e) => handleFieldChange('descripcion', e.target.value)}
            className="md:col-span-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />

          {/* Fecha */}
          <input
            type="date"
            value={nuevoCompromiso.fecha}
            onChange={(e) => handleFieldChange('fecha', e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />

          {/* Responsable */}
          <select
            value={nuevoCompromiso.responsable}
            onChange={(e) => handleFieldChange('responsable', e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          >
            <option value="">Responsable...</option>
            <option value="Estudiante">Estudiante</option>
            <option value="Apoderado">Apoderado</option>
            <option value="Docente">Docente</option>
            <option value="Dirección">Dirección</option>
            <option value="Ambos">Ambos</option>
          </select>

          {/* Botón Agregar */}
          <button
            onClick={onAgregarCompromiso}
            disabled={isAddCompromisoDisabled}
            className="md:col-span-3 flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Compromiso</span>
          </button>
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold uppercase tracking-widest text-emerald-700">
          Los compromisos son acuerdos reparatorios conforme a Circular 782 del MINEDUC
        </div>
      </div>
    </div>
  );
};

export default React.memo(GccCompromisos);
