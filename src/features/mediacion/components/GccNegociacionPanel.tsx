/**
 * GccNegociacionPanel - Negociación Asistida (Gestión Previa)
 * 
 * Circular 782: Mecanismo de resolución colaborativa
 * Plazo: 10 días hábiles (Gestión Previa, no formal)
 * Roles: Las PARTES negocian DIRECTAMENTE (sin mediador formal)
 * Facilitador: Solo de apoyo/contención emocional
 * 
 * Diferencias:
 * ✓ Sin mediador formal obligatorio
 * ✓ Partes negocian directamente
 * ✓ Facilitador de apoyo (opcional)
 * ✓ 10 días hábiles
 * ✓ Acta sin firma de mediador
 */

import React, { useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  Info,
  FileCheck,
  CheckCircle,
  Handshake
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

interface GccNegociacionPanelProps {
  caso: Expediente;
  
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
  
  // Facilitador de apoyo (opcional)
  facilitadorApoyo: string;
  onFacilitadorApoyoChange: (value: string) => void;
  
  // Hora sesión
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
  
  // Acciones
  onGenerarActa: () => void;
  onCerrarExpediente: () => void;
}

export const GccNegociacionPanel: React.FC<GccNegociacionPanelProps> = ({
  caso,
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
  facilitadorApoyo,
  onFacilitadorApoyoChange,
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
  onGenerarActa,
  onCerrarExpediente
}) => {
  const isAddCompromisoDisabled = useMemo(
    () => !nuevoCompromiso.descripcion || !nuevoCompromiso.fecha,
    [nuevoCompromiso.descripcion, nuevoCompromiso.fecha]
  );

  const facilitadores = [
    'Psicóloga Ana María González',
    'Psicólogo Roberto Martínez',
    'Educadora Carla Herrera',
    'Orientador Luis Vega'
  ];

  return (
    <section className="lg:col-span-2">
      <div className="bg-white rounded-3xl border border-green-100 shadow-xl shadow-green-200/20 p-4 md:p-10 animate-in zoom-in-95 duration-500 space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
            <Handshake className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
              🔓 Negociación Asistida
            </h2>
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mt-1">
              Gestión Previa • 10 días hábiles • Partes negocian directamente
            </p>
          </div>
        </div>

        {/* Info del Caso */}
        <div className="p-4 md:p-6 bg-green-50 border border-green-200 rounded-3xl space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-green-700">
            Caso en Negociación
          </p>
          <h3 className="text-lg font-black text-slate-900">
            {caso.nnaNombre}
          </h3>
          <p className="text-xs font-bold text-slate-500 font-mono">
            Folio: {caso.id}
          </p>
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs font-bold text-green-700">
              ℹ️ Las partes negocian DIRECTAMENTE sin mediador formal. El facilitador de apoyo solo proporciona contención emocional.
            </p>
          </div>
        </div>

        {/* Estado + Facilitador Apoyo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Estado del Proceso */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              Estado Negociación
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['PROCESO', 'LOGRADO', 'NO_ACUERDO'].map((est) => (
                <button
                  key={est}
                  onClick={() => onEstadoChange(est as 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO')}
                  className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                    estado === est
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
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

          {/* Facilitador de Apoyo */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              Facilitador de Apoyo (Opcional)
            </label>
            <select
              value={facilitadorApoyo}
              onChange={(e) => onFacilitadorApoyoChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-green-500/5 focus:border-green-300 focus:outline-none"
            >
              <option value="">Sin facilitador</option>
              {facilitadores.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horas de Sesión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block flex items-center">
              <Clock className="w-4 h-4 mr-2 text-green-600" />
              Hora Inicio
            </label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => onHoraInicioChange(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-green-500/5 focus:border-green-300 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block flex items-center">
              <Clock className="w-4 h-4 mr-2 text-green-600" />
              Hora Cierre
            </label>
            <input
              type="time"
              value={horaCierre}
              onChange={(e) => onHoraCierreChange(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-green-500/5 focus:border-green-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Conformidad Circular 782 */}
        <GccCircular782Section
          collarMechanism="green"
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

        {/* Resultado de Negociación */}
        <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
            <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
            ¿Lograron Acuerdo?
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onAcuerdoChange(true)}
              className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                acuerdoAlcanzado
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ✅ Sí - Acuerdo Alcanzado
            </button>
            <button
              onClick={() => onAcuerdoChange(false)}
              className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
                !acuerdoAlcanzado
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ❌ No - Sin Acuerdo
            </button>
          </div>
        </div>

        {/* Detalles del Acuerdo (si lo hay) */}
        {acuerdoAlcanzado && (
          <div className="space-y-4 p-6 bg-green-50 border border-green-200 rounded-3xl">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block flex items-center">
              <FileText className="w-4 h-4 mr-2 text-green-600" />
              Detalles del Acuerdo Alcanzado
            </label>
            <textarea
              value={detallesAcuerdo}
              onChange={(e) => onDetallesAcuerdoChange(e.target.value)}
              placeholder="Describa el acuerdo alcanzado por las partes..."
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border border-green-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
            />
          </div>
        )}

        {/* Compromisos Reparatorios */}
        {acuerdoAlcanzado && (
          <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
              <Handshake className="w-5 h-5 mr-3 text-green-600" />
              Compromisos Pactados
            </h4>

            {/* Listado de Compromisos */}
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
                    className="w-5 h-5 mt-1 rounded accent-green-600"
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
                Agregar Nuevo Compromiso
              </h5>
              <input
                type="text"
                value={nuevoCompromiso.descripcion}
                onChange={(e) => onNuevoCompromisoChange('descripcion', e.target.value)}
                placeholder="Descripción del compromiso"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={nuevoCompromiso.fecha}
                  onChange={(e) => onNuevoCompromisoChange('fecha', e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={nuevoCompromiso.responsable}
                  onChange={(e) => onNuevoCompromisoChange('responsable', e.target.value)}
                  placeholder="Responsable"
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <button
                onClick={onAgregarCompromiso}
                disabled={isAddCompromisoDisabled}
                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                  isAddCompromisoDisabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/30'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Compromiso</span>
              </button>
            </div>
          </div>
        )}

        {/* Acciones Finales */}
        <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <Info className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-xs font-bold text-green-700">
            {acuerdoAlcanzado
              ? 'Acuerdo alcanzado. El acta incluirá detalles del acuerdo y compromisos pactados.'
              : 'Sin acuerdo. El acta será constancia de la negociación realizada sin resultado positivo.'}
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
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/30'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            <span>Generar Acta</span>
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

export default GccNegociacionPanel;


