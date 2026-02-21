/**
 * GccConciliacionPanel - Conciliación (Formal)
 * 
 * Circular 782: Mecanismo de resolución colaborativa
 * Plazo: 5 días hábiles
 * Roles: CONCILIADOR PROPONE soluciones específicas
 * Rol del Conciliador: Propone una solución que las partes pueden ACEPTAR o RECHAZAR
 * 
 * Diferencias clave respecto a Mediación:
 * ✓ PROPUESTA DEL CONCILIADOR (campo único de este mecanismo)
 * ✓ Conciliador SÍ propone soluciones
 * ✓ Las partes aceptan o rechazan la propuesta
 * ✓ 5 días hábiles (formal)
 */

import React, { useMemo } from 'react';
import {
  Plus,
  Trash2,
  Clock,
  Info,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Handshake,
  Lightbulb,
} from 'lucide-react';
import type { Expediente } from '@/types';
import { GccCircular782Section, type EscenarioProcedencia } from './GccCircular782Section';

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

interface GccConciliacionPanelProps {
  caso: Expediente;
  
  // Conciliador OBLIGATORIO
  conciliador: string;
  onConciliadorChange: (value: string) => void;
  
  // Estado del proceso
  estado: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  onEstadoChange: (estado: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO') => void;
  
  // ===== NUEVOS CAMPOS CIRCULAR 782 =====
  aceptaParticipacion: boolean;
  onAceptaParticipacionChange: (value: boolean) => void;
  escenarioProcedencia?: EscenarioProcedencia;
  onEscenarioProcedenciaChange: (value: EscenarioProcedencia) => void;
  plazoCompromiso: string;
  onPlazoCompromisoChange: (value: string) => void;
  autorizaDivulgacionResultado: boolean;
  onAutorizaDivulgacionResultadoChange: (value: boolean) => void;
  fechaSeguimiento: string;
  onFechaSeguimientoChange: (value: string) => void;
  evaluacionResultado: string;
  onEvaluacionResultadoChange: (value: string) => void;
  
  // Fechas y horas
  fechaConciliacion: string;
  onFechaConciliacionChange: (value: string) => void;
  horaInicio: string;
  onHoraInicioChange: (value: string) => void;
  horaCierre: string;
  onHoraCierreChange: (value: string) => void;
  
  // PROPUESTA DEL CONCILIADOR (CAMPO ÚNICO)
  propuestaConciliador: string;
  onPropuestaConciliadorChange: (value: string) => void;
  
  // Respuesta de las partes
  propuestaAceptada: boolean | null;
  onPropuestaAceptadaChange: (value: boolean | null) => void;
  
  // Compromisos (solo si aceptan propuesta)
  compromisos: Compromiso[];
  nuevoCompromiso: NuevoCompromiso;
  onNuevoCompromisoChange: (field: string, value: string) => void;
  onAgregarCompromiso: () => void;
  onEliminarCompromiso: (id: string) => void;
  onToggleMarcaCompromiso: (id: string) => void;
  
  // Firmas (compatibilidad legacy, no bloquean acta)
  firmaEstudiante1: boolean;
  firmaEstudiante2: boolean;
  firmaConciliador: boolean;
  
  // Acciones
  onGenerarActa: () => void;
  onCerrarExpediente: () => void;
}

function useGccConciliacionPanelView({
  caso,
  conciliador,
  onConciliadorChange,
  estado,
  onEstadoChange,
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
  onEvaluacionResultadoChange,
  fechaConciliacion,
  onFechaConciliacionChange,
  horaInicio,
  onHoraInicioChange,
  horaCierre,
  onHoraCierreChange,
  propuestaConciliador,
  onPropuestaConciliadorChange,
  propuestaAceptada,
  onPropuestaAceptadaChange,
  compromisos,
  nuevoCompromiso,
  onNuevoCompromisoChange,
  onAgregarCompromiso,
  onEliminarCompromiso,
  onToggleMarcaCompromiso,
  onGenerarActa,
  onCerrarExpediente
}: GccConciliacionPanelProps) {
  const isAddCompromisoDisabled = useMemo(
    () => !nuevoCompromiso.descripcion || !nuevoCompromiso.fecha,
    [nuevoCompromiso.descripcion, nuevoCompromiso.fecha]
  );

  const conciliadores = [
    'Psicóloga Ana María González',
    'Psicólogo Roberto Martínez',
    'Educadora Carla Herrera',
    'Orientador Luis Vega'
  ];

  const isPropuestaFilled = propuestaConciliador.trim().length > 0;

  return (
    <section className="lg:col-span-2">
      <div className="bg-white rounded-3xl border border-purple-100 shadow-xl shadow-purple-200/20 p-4 md:p-10 animate-in zoom-in-95 duration-500 space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
            <Lightbulb className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
              💡 Conciliación
            </h2>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-1">
              Formal • 5 días hábiles • Editor PROPONE soluciones específicas
            </p>
          </div>
        </div>

        {/* Info del Caso */}
        <div className="p-4 md:p-6 bg-purple-50 border border-purple-200 rounded-3xl space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-purple-700">
            Caso en Conciliación
          </p>
          <h3 className="text-lg font-black text-slate-900">
            {caso.nnaNombre}
          </h3>
          <p className="text-xs font-bold text-slate-500 font-mono">
            Folio: {caso.id}
          </p>
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-xs font-bold text-purple-700">
              ℹ️ El CONCILIADOR analiza el conflicto y PROPONE una solución específica. Las partes pueden ACEPTARLA o RECHAZARLA.
            </p>
          </div>
        </div>

        {/* Estado + Conciliador (OBLIGATORIO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Estado del Proceso */}
          <div className="space-y-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              Estado Conciliación
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['PROCESO', 'LOGRADO', 'NO_ACUERDO'].map((est) => (
                <button
                  key={est}
                  onClick={() => onEstadoChange(est as 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO')}
                  className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                    estado === est
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {est === 'PROCESO' && 'En Curso'}
                  {est === 'LOGRADO' && 'Aceptada'}
                  {est === 'NO_ACUERDO' && 'Rechazada'}
                </button>
              ))}
            </div>
          </div>

          {/* Conciliador OBLIGATORIO */}
          <div className="space-y-4">
            <label htmlFor="gcc-conciliacion-conciliador" className="text-xs font-black text-slate-400 uppercase tracking-widest block flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
              Conciliador Asignado *
            </label>
            <select
              id="gcc-conciliacion-conciliador"
              value={conciliador}
              onChange={(e) => onConciliadorChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-purple-300 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/5 focus:border-purple-300 focus:outline-none"
              required
            >
              <option value="">-- Seleccionar conciliador --</option>
              {conciliadores.map((con) => (
                <option key={con} value={con}>
                  {con}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sesión de Conciliación */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
            <Clock className="w-5 h-5 mr-3 text-purple-600" />
            Sesión de Conciliación
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="gcc-conciliacion-fecha" className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Fecha
              </label>
              <input
                id="gcc-conciliacion-fecha"
                type="date"
                value={fechaConciliacion}
                onChange={(e) => onFechaConciliacionChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/5 focus:border-purple-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gcc-conciliacion-hora-inicio" className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Hora Inicio
              </label>
              <input
                id="gcc-conciliacion-hora-inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => onHoraInicioChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/5 focus:border-purple-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="gcc-conciliacion-hora-cierre" className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Hora Cierre
              </label>
              <input
                id="gcc-conciliacion-hora-cierre"
                type="time"
                value={horaCierre}
                onChange={(e) => onHoraCierreChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-500/5 focus:border-purple-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Conformidad Circular 782 */}
        <GccCircular782Section
          collarMechanism="purple"
          aceptaParticipacion={aceptaParticipacion}
          onAceptaParticipacionChange={onAceptaParticipacionChange}
          escenarioProcedencia={escenarioProcedencia}
          onEscenarioProcedenciaChange={onEscenarioProcedenciaChange}
          plazoCompromiso={plazoCompromiso}
          onPlazoCompromisoChange={onPlazoCompromisoChange}
          autorizaDivulgacionResultado={autorizaDivulgacionResultado}
          onAutorizaDivulgacionResultadoChange={onAutorizaDivulgacionResultadoChange}
          fechaSeguimiento={fechaSeguimiento}
          onFechaSeguimientoChange={onFechaSeguimientoChange}
          evaluacionResultado={evaluacionResultado}
          onEvaluacionResultadoChange={onEvaluacionResultadoChange}
        />

        {/* PROPUESTA DEL CONCILIADOR - CAMPO ÚNICO Y OBLIGATORIO */}
        <div className="space-y-4 p-6 bg-purple-50 border-2 border-purple-300 rounded-3xl">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
            <Lightbulb className="w-5 h-5 mr-3 text-purple-600" />
            Propuesta del Conciliador *
          </h4>
          
          <div className="p-4 bg-purple-100/50 border border-purple-200 rounded-xl">
            <p className="text-xs font-bold text-purple-700">
              💡 Contenga la SOLUCIÓN ESPECÍFICA que el conciliador propone a ambas partes. Debe ser clara, objetiva y realista.
            </p>
          </div>

          <textarea
            value={propuestaConciliador}
            onChange={(e) => onPropuestaConciliadorChange(e.target.value)}
            placeholder="Escriba la propuesta específica del conciliador. Ejemplo: 'Que el Estudiante A pida disculpas formales ante testigos, y el Estudiante B se comprometa a no hacer comentarios negativos...'"
            rows={6}
            className="w-full px-4 py-3 rounded-2xl border-2 border-purple-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
            required
          />

          {!isPropuestaFilled && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700">
                La propuesta es OBLIGATORIA antes de continuar
              </p>
            </div>
          )}
        </div>

        {/* Respuesta de las Partes */}
        {isPropuestaFilled && (
          <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
              <CheckCircle className="w-5 h-5 mr-3 text-purple-600" />
              Respuesta de las Partes
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onPropuestaAceptadaChange(true)}
                className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                  propuestaAceptada === true
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ✅ Aceptan Propuesta
              </button>
              <button
                onClick={() => onPropuestaAceptadaChange(false)}
                className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                  propuestaAceptada === false
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ❌ Rechazan Propuesta
              </button>
            </div>
          </div>
        )}

        {/* Compromisos (Solo si aceptan) */}
        {propuestaAceptada === true && (
          <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
              <Handshake className="w-5 h-5 mr-3 text-purple-600" />
              Compromisos Derivados de la Propuesta
            </h4>

            {/* Listado */}
            <div className="space-y-4">
              {compromisos.map((compromiso) => (
                <div
                  key={compromiso.id}
                  className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={compromiso.completado}
                    onChange={() => onToggleMarcaCompromiso(compromiso.id)}
                    className="w-5 h-5 mt-1 rounded accent-purple-600"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${compromiso.completado ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {compromiso.descripcion}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Responsable: {compromiso.responsable} • Fecha: {compromiso.fechaCumplimiento}
                    </p>
                  </div>
                  <button
                    onClick={() => onEliminarCompromiso(compromiso.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Nuevo Compromiso */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <h5 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                Agregar Compromiso
              </h5>
              <input
                type="text"
                value={nuevoCompromiso.descripcion}
                onChange={(e) => onNuevoCompromisoChange('descripcion', e.target.value)}
                placeholder="Descripción"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={nuevoCompromiso.fecha}
                  onChange={(e) => onNuevoCompromisoChange('fecha', e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={nuevoCompromiso.responsable}
                  onChange={(e) => onNuevoCompromisoChange('responsable', e.target.value)}
                  placeholder="Responsable"
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <button
                onClick={onAgregarCompromiso}
                disabled={isAddCompromisoDisabled}
                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                  isAddCompromisoDisabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/30'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Compromiso</span>
              </button>
            </div>
          </div>
        )}

        {/* Info Final */}
        <div className="flex items-center space-x-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl">
          <Info className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <p className="text-xs font-bold text-purple-700">
            {propuestaAceptada === true
              ? 'Propuesta ACEPTADA. El acta digital incluirá la propuesta y los compromisos derivados.'
              : propuestaAceptada === false
                ? 'Propuesta RECHAZADA. El acta digital dejará constancia de la conciliación realizada sin éxito.'
                : 'Seleccione si las partes aceptan o rechazan la propuesta.'}
          </p>
        </div>

        {/* Botones Finales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <button
            onClick={onGenerarActa}
            disabled={!isPropuestaFilled || propuestaAceptada === null}
            className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              !isPropuestaFilled || propuestaAceptada === null
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/30'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            <span>Generar Acta Estandar</span>
          </button>
          
          <button
            onClick={onCerrarExpediente}
            className="py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 bg-slate-600 text-white hover:bg-slate-700"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Cerrar Expediente</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export const GccConciliacionPanel: React.FC<GccConciliacionPanelProps> = (props) =>
  useGccConciliacionPanelView(props);

export default GccConciliacionPanel;


