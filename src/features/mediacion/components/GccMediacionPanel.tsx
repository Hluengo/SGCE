/**
 * GccMediacionPanel - Mediación (Formal)
 * 
 * Circular 782: Mecanismo de resolución colaborativa
 * Plazo: 5 días hábiles
 * Roles: MEDIADOR FACILITA (no propone, no decide)
 * Rol del Mediador: Ayuda a las partes a llegar a su propio acuerdo
 * 
 * Diferencias:
 * ✓ Mediador OBLIGATORIO
 * ✓ Mediador facilita conversación (pero NO propone soluciones)
 * ✓ Las partes deciden el acuerdo
 * ✓ 5 días hábiles (formal)
 * ✓ Acta con firma de mediador
 */

import React, { useMemo } from 'react';
import {
  FileText,
  Users,
  Plus,
  Trash2,
  Clock,
  Info,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Handshake,
  User
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

interface GccMediacionPanelProps {
  caso: Expediente;
  
  // Mediador OBLIGATORIO
  mediador: string;
  onMediadorChange: (value: string) => void;
  
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
  fechaMediacion: string;
  onFechaMediacionChange: (value: string) => void;
  horaInicio: string;
  onHoraInicioChange: (value: string) => void;
  horaCierre: string;
  onHoraCierreChange: (value: string) => void;
  
  // Compromisos
  compromisos: Compromiso[];
  nuevoCompromiso: NuevoCompromiso;
  onNuevoCompromisoChange: (field: string, value: string) => void;
  onAgregarCompromiso: () => void;
  onEliminarCompromiso: (id: string) => void;
  onToggleMarcaCompromiso: (id: string) => void;
  
  // Acuerdo alcanzado
  acuerdoAlcanzado: boolean;
  onAcuerdoChange: (value: boolean) => void;
  detallesAcuerdo: string;
  onDetallesAcuerdoChange: (value: string) => void;
  
  // Firmas
  firmaEstudiante1: boolean;
  firmaEstudiante2: boolean;
  firmaMediador: boolean;
  
  // Acciones
  onGenerarActa: () => void;
  onCerrarExpediente: () => void;
}

export const GccMediacionPanel: React.FC<GccMediacionPanelProps> = ({
  caso,
  mediador,
  onMediadorChange,
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
  fechaMediacion,
  onFechaMediacionChange,
  horaInicio,
  onHoraInicioChange,
  horaCierre,
  onHoraCierreChange,
  compromisos,
  nuevoCompromiso,
  onNuevoCompromisoChange,
  onAgregarCompromiso,
  onEliminarCompromiso,
  onToggleMarcaCompromiso,
  acuerdoAlcanzado,
  onAcuerdoChange,
  detallesAcuerdo,
  onDetallesAcuerdoChange,
  firmaEstudiante1,
  firmaEstudiante2,
  firmaMediador,
  onGenerarActa,
  onCerrarExpediente
}) => {
  const isAddCompromisoDisabled = useMemo(
    () => !nuevoCompromiso.descripcion || !nuevoCompromiso.fecha,
    [nuevoCompromiso.descripcion, nuevoCompromiso.fecha]
  );

  const mediadores = [
    'Psicóloga Ana María González',
    'Psicólogo Roberto Martínez',
    'Educadora Carla Herrera',
    'Orientador Luis Vega'
  ];

  return (
    <section className="lg:col-span-2">
      <div className="bg-white rounded-3xl border border-blue-100 shadow-xl shadow-blue-200/20 p-4 md:p-10 animate-in zoom-in-95 duration-500 space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
              👥 Mediación
            </h2>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">
              Formal • 5 días hábiles • El mediador FACILITA (no propone ni decide)
            </p>
          </div>
        </div>

        {/* Info del Caso */}
        <div className="p-4 md:p-6 bg-blue-50 border border-blue-200 rounded-3xl space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-blue-700">
            Caso en Mediación
          </p>
          <h3 className="text-lg font-black text-slate-900">
            {caso.nnaNombre}
          </h3>
          <p className="text-xs font-bold text-slate-500 font-mono">
            Folio: {caso.id}
          </p>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs font-bold text-blue-700">
              ℹ️ El MEDIADOR ayuda a las partes a COMUNICARSE Y NEGOCIAR. No propone soluciones, facilita que ellas las encuentren.
            </p>
          </div>
        </div>

        {/* Estado + Mediador (OBLIGATORIO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Estado del Proceso */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              Estado Mediación
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['PROCESO', 'LOGRADO', 'NO_ACUERDO'].map((est) => (
                <button
                  key={est}
                  onClick={() => onEstadoChange(est as 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO')}
                  className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                    estado === est
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {est === 'PROCESO' && 'En Curso'}
                  {est === 'LOGRADO' && 'Acuerdo'}
                  {est === 'NO_ACUERDO' && 'Sin Acuerdo'}
                </button>
              ))}
            </div>
          </div>

          {/* Mediador OBLIGATORIO */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
              Mediador Asignado *
            </label>
            <select
              value={mediador}
              onChange={(e) => onMediadorChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-blue-300 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 focus:outline-none"
              required
            >
              <option value="">-- Seleccionar mediador profesional --</option>
              {mediadores.map((med) => (
                <option key={med} value={med}>
                  {med}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sesión de Mediación */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
            <Clock className="w-5 h-5 mr-3 text-blue-600" />
            Sesión de Mediación
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Fecha
              </label>
              <input
                type="date"
                value={fechaMediacion}
                onChange={(e) => onFechaMediacionChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Hora Inicio
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => onHoraInicioChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                Hora Cierre
              </label>
              <input
                type="time"
                value={horaCierre}
                onChange={(e) => onHoraCierreChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Conformidad Circular 782 */}
        <GccCircular782Section
          collarMechanism="blue"
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

        {/* Resultado de Mediación */}
        <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
            <CheckCircle className="w-5 h-5 mr-3 text-blue-600" />
            Resultado Mediación
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onAcuerdoChange(true)}
              className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                acuerdoAlcanzado
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ✅ Acuerdo Alcanzado
            </button>
            <button
              onClick={() => onAcuerdoChange(false)}
              className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                !acuerdoAlcanzado
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ❌ Sin Acuerdo
            </button>
          </div>
        </div>

        {/* Detalles del Acuerdo (si lo hay) */}
        {acuerdoAlcanzado && (
          <div className="space-y-4 p-6 bg-blue-50 border border-blue-200 rounded-3xl">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Detalles del Acuerdo
            </label>
            <textarea
              value={detallesAcuerdo}
              onChange={(e) => onDetallesAcuerdoChange(e.target.value)}
              placeholder="Describa el acuerdo alcanzado a través de la mediación..."
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border border-blue-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>
        )}

        {/* Compromisos Pactados */}
        {acuerdoAlcanzado && (
          <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
              <Handshake className="w-5 h-5 mr-3 text-blue-600" />
              Compromisos Pactados
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
                    className="w-5 h-5 mt-1 rounded accent-blue-600"
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
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={nuevoCompromiso.fecha}
                  onChange={(e) => onNuevoCompromisoChange('fecha', e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={nuevoCompromiso.responsable}
                  onChange={(e) => onNuevoCompromisoChange('responsable', e.target.value)}
                  placeholder="Responsable"
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={onAgregarCompromiso}
                disabled={isAddCompromisoDisabled}
                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                  isAddCompromisoDisabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Compromiso</span>
              </button>
            </div>
          </div>
        )}

        {/* Firmas */}
        <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
            <User className="w-5 h-5 mr-3 text-blue-600" />
            Firmas
          </h4>

          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border-2 ${firmaEstudiante1 ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Estudiante 1</p>
              <div className="mt-3 flex items-center space-x-2">
                {firmaEstudiante1 ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-xs font-bold text-green-700">Firmó</span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Pendiente</span>
                )}
              </div>
            </div>

            <div className={`p-4 rounded-xl border-2 ${firmaEstudiante2 ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Estudiante 2</p>
              <div className="mt-3 flex items-center space-x-2">
                {firmaEstudiante2 ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-xs font-bold text-green-700">Firmó</span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Pendiente</span>
                )}
              </div>
            </div>

            <div className={`p-4 rounded-xl border-2 ${firmaMediador ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Mediador</p>
              <div className="mt-3 flex items-center space-x-2">
                {firmaMediador ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-xs font-bold text-green-700">Firmó</span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Pendiente</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Final */}
        <div className="flex items-center space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-xs font-bold text-blue-700">
            El acta de mediación requiere firmas de AMBAS PARTES y del MEDIADOR.
          </p>
        </div>

        {/* Botones Finales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <button
            onClick={onGenerarActa}
            disabled={estado === 'PROCESO'}
            className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              estado === 'PROCESO'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            <span>Generar Acta de Mediación</span>
          </button>
          
          <button
            onClick={onCerrarExpediente}
            disabled={estado === 'PROCESO'}
            className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              estado === 'PROCESO'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-600 text-white hover:bg-slate-700'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span>Cerrar Expediente</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default GccMediacionPanel;


