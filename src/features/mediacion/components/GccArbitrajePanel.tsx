/**
 * GccArbitrajePanel - Arbitraje Pedagógico (Formal)
 * 
 * Circular 782: Mecanismo de resolución - MÁXIMA AUTORIDAD
 * Plazo: 5 días hábiles
 * Roles: SOLO DIRECTOR puede ser árbitro
 * Rol del Árbitro: DECIDE VINCULANTEMENTE (reemplaza a las partes)
 * Característica única: DECISIÓN FINAL E INAPELABLE
 * 
 * Diferencias clave:
 * ✓ SOLO DIRECTOR puede usar este mecanismo
 * ✓ RESOLUCIÓN DEL ÁRBITRO (campo único - decisión vinculante)
 * ✓ NO se pueden apelar la decisión
 * ✓ 5 días hábiles (formal)
 * ✓ Acta con firma del Director como árbitro
 */

import React, { useMemo } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Clock,
  Info,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Handshake,
  User,
  Shield
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

interface GccArbitrajePanelProps {
  caso: Expediente;
  userRole: 'DIRECTOR' | 'FACILITADOR' | 'OTRO';
  
  // Árbitro = Director (validado por rol)
  arbitro: string;
  
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
  fechaArbitraje: string;
  onFechaArbitrajeChange: (value: string) => void;
  horaInicio: string;
  onHoraInicioChange: (value: string) => void;
  horaCierre: string;
  onHoraCierreChange: (value: string) => void;
  
  // RESOLUCIÓN DEL ÁRBITRO (CAMPO ÚNICO - VINCULANTE)
  resolucionArbitro: string;
  onResolucionArbitroChange: (value: string) => void;
  
  // Confirmación de que entiende que es vinculante
  entiendeVinculancia: boolean;
  onEntiendeVinculanciaChange: (value: boolean) => void;
  
  // Compromisos
  compromisos: Compromiso[];
  nuevoCompromiso: NuevoCompromiso;
  onNuevoCompromisoChange: (field: string, value: string) => void;
  onAgregarCompromiso: () => void;
  onEliminarCompromiso: (id: string) => void;
  onToggleMarcaCompromiso: (id: string) => void;
  
  // Firmas
  firmaEstudiante1: boolean;
  firmaEstudiante2: boolean;
  firmaArbitro: boolean;
  
  // Acciones
  onGenerarActa: () => void;
  onCerrarExpediente: () => void;
}

export const GccArbitrajePanel: React.FC<GccArbitrajePanelProps> = ({
  caso,
  userRole,
  arbitro,
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
  fechaArbitraje,
  onFechaArbitrajeChange,
  horaInicio,
  onHoraInicioChange,
  horaCierre,
  onHoraCierreChange,
  resolucionArbitro,
  onResolucionArbitroChange,
  entiendeVinculancia,
  onEntiendeVinculanciaChange,
  compromisos,
  nuevoCompromiso,
  onNuevoCompromisoChange,
  onAgregarCompromiso,
  onEliminarCompromiso,
  onToggleMarcaCompromiso,
  firmaEstudiante1,
  firmaEstudiante2,
  firmaArbitro,
  onGenerarActa,
  onCerrarExpediente
}) => {
  const isAddCompromisoDisabled = useMemo(
    () => !nuevoCompromiso.descripcion || !nuevoCompromiso.fecha,
    [nuevoCompromiso.descripcion, nuevoCompromiso.fecha]
  );

  const isResolucionFilled = resolucionArbitro.trim().length > 0;
  const isDirector = userRole === 'DIRECTOR';
  const canGenerateActa = estado !== 'PROCESO' && isResolucionFilled && entiendeVinculancia;

  if (!isDirector) {
    return (
      <section className="lg:col-span-2">
        <div className="bg-white rounded-3xl border border-red-100 shadow-xl shadow-red-200/20 p-8 md:p-12 animate-in zoom-in-95 duration-500">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                ⚠️ Acceso Restringido
              </h3>
              <p className="text-sm font-bold text-red-700 mt-3">
                Solo los DIRECTORES del establecimiento pueden usar el mecanismo de Arbitraje Pedagógico.
              </p>
              <p className="text-xs font-bold text-red-600 mt-2">
                Si desea continuar, solicite a un Director que acceda a este expediente.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lg:col-span-2">
      <div className="bg-white rounded-3xl border border-red-100 shadow-xl shadow-red-200/20 p-4 md:p-10 animate-in zoom-in-95 duration-500 space-y-8">
        
        {/* Header - Con advertencia bien visible */}
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
            <Scale className="w-8 h-8 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                ⚖️  Arbitraje Pedagógico
              </h2>
              <span className="px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-xs font-black rounded-full uppercase tracking-widest">
                Vinculante
              </span>
            </div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-1">
              Decisión Final del Director • 5 días hábiles • Inapelable
            </p>
          </div>
        </div>

        {/* Advertencia Legal PRINCIPAL */}
        <div className="p-6 bg-red-50 border-2 border-red-400 rounded-3xl space-y-4">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-black text-red-800 uppercase tracking-widest text-sm">
                ⚠️  ADVERTENCIA LEGAL
              </p>
              <p className="text-sm font-bold text-red-700 mt-2">
                Este mecanismo permite que USTED, como DIRECTOR, DECIDA VINCULANTEMENTE sobre el conflicto. La decisión que tome será FINAL E INAPELABLE. Las partes NO PODRÁN RECURRIR ni impugnar su resolución.
              </p>
            </div>
          </div>
        </div>

        {/* Info del Caso */}
        <div className="p-4 md:p-6 bg-red-50 border border-red-200 rounded-3xl space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-red-700">
            Caso en Arbitraje Pedagógico
          </p>
          <h3 className="text-lg font-black text-slate-900">
            {caso.nnaNombre}
          </h3>
          <p className="text-xs font-bold text-slate-500 font-mono">
            Folio: {caso.id}
          </p>
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-xs font-bold text-red-700">
              ℹ️ Como Director, USTED ES EL ÁRBITRO. Su decisión reemplaza a la negociación, mediación o conciliación. Es FINAL y VINCULANTE.
            </p>
          </div>
        </div>

        {/* Árbitro (Director - mostrado como información) */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
            <Shield className="w-5 h-5 mr-3 text-red-600" />
            Árbitro del Proceso
          </h4>
          <div className="p-4 bg-white border-2 border-red-300 rounded-xl">
            <p className="text-sm font-black text-red-700 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>{arbitro}</span>
            </p>
            <p className="text-xs font-bold text-slate-500 mt-2">
              Usted está autorizado como DIRECTOR para ejercer esta función.
            </p>
          </div>
        </div>

        {/* Estado + Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Estado */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              Estado del Arbitraje
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['PROCESO', 'LOGRADO'].map((est) => (
                <button
                  key={est}
                  onClick={() => onEstadoChange(est as 'PROCESO' | 'LOGRADO')}
                  className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                    estado === est
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {est === 'PROCESO' && 'En Curso'}
                  {est === 'LOGRADO' && 'Finalizado'}
                </button>
              ))}
            </div>
          </div>

          {/* Fechas del Arbitraje */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block flex items-center">
              <Clock className="w-4 h-4 mr-2 text-red-600" />
              Sesión de Arbitraje
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="date"
                value={fechaArbitraje}
                onChange={(e) => onFechaArbitrajeChange(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Fecha"
              />
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => onHoraInicioChange(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Inicio"
              />
              <input
                type="time"
                value={horaCierre}
                onChange={(e) => onHoraCierreChange(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Cierre"
              />
            </div>
          </div>
        </div>

        {/* Conformidad Circular 782 */}
        <GccCircular782Section
          collarMechanism="red"
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

        {/* RESOLUCIÓN DEL ÁRBITRO - CAMPO ÚNICO Y OBLIGATORIO */}
        <div className="space-y-4 p-6 bg-red-50 border-2 border-red-400 rounded-3xl">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
            <Scale className="w-5 h-5 mr-3 text-red-600" />
            Resolución del Árbitro *
          </h4>
          
          <div className="p-4 bg-red-100/50 border border-red-300 rounded-xl">
            <p className="text-xs font-bold text-red-800">
              ⚖️  Una vez que FIRME esta resolución, será VINCULANTE para ambas partes. No habrá recurso posible. Sea cuidadoso y fundamentado.
            </p>
          </div>

          <textarea
            value={resolucionArbitro}
            onChange={(e) => onResolucionArbitroChange(e.target.value)}
            placeholder="Escriba su RESOLUCIÓN como Director Árbitro. Debe ser clara, objetiva, fundamentada y específica. Ejemplo: 'Se resuelve que el Estudiante A cumplirá 10 horas de servicio comunitario en la biblioteca, y el Estudiante B se someterá a seguimiento con la dupla psicosocial por 30 días...'"
            rows={7}
            className="w-full px-4 py-3 rounded-2xl border-2 border-red-400 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
            required
          />

          {!isResolucionFilled && (
            <div className="flex items-center space-x-2 p-4 bg-red-100 border border-red-300 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700">
                La resolución es OBLIGATORIA
              </p>
            </div>
          )}
        </div>

        {/* Compromisos Derivados */}
        {isResolucionFilled && (
          <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
              <Handshake className="w-5 h-5 mr-3 text-red-600" />
              Compromisos de la Resolución
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
                    className="w-5 h-5 mt-1 rounded accent-red-600"
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
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={nuevoCompromiso.fecha}
                  onChange={(e) => onNuevoCompromisoChange('fecha', e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={nuevoCompromiso.responsable}
                  onChange={(e) => onNuevoCompromisoChange('responsable', e.target.value)}
                  placeholder="Responsable"
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <button
                onClick={onAgregarCompromiso}
                disabled={isAddCompromisoDisabled}
                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                  isAddCompromisoDisabled
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Compromiso</span>
              </button>
            </div>
          </div>
        )}

        {/* Checkbox de Vinculancia */}
        {isResolucionFilled && (
          <div className="space-y-4 p-6 bg-red-50 border-2 border-red-300 rounded-3xl">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={entiendeVinculancia}
                onChange={(e) => onEntiendeVinculanciaChange(e.target.checked)}
                id="entiende-vinculancia"
                className="w-6 h-6 mt-1 rounded-lg accent-red-600 cursor-pointer"
              />
              <label htmlFor="entiende-vinculancia" className="cursor-pointer flex-1">
                <p className="text-sm font-black text-red-800 uppercase tracking-widest">
                  ✅ Confirmo que esta RESOLUCIÓN es FINAL E INAPELABLE
                </p>
                <p className="text-xs font-bold text-red-700 mt-2">
                  Entiendo que al FIRMAR esta resolución, las partes involucradas NO PODRÁN apelar, recurrir ni impugnar mi decisión. Es VINCULANTE y DEFINITIVA.
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Firmas */}
        {isResolucionFilled && entiendeVinculancia && (
          <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
              <User className="w-5 h-5 mr-3 text-red-600" />
              Firmas
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border-2 ${firmaEstudiante1 ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Estudiante 1</p>
                <div className="mt-3 flex items-center space-x-2">
                  {firmaEstudiante1 ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-xs font-bold text-green-700">Informado</span>
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
                      <span className="text-xs font-bold text-green-700">Informado</span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">Pendiente</span>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 ${firmaArbitro ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Árbitro</p>
                <div className="mt-3 flex items-center space-x-2">
                  {firmaArbitro ? (
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
        )}

        {/* Info Final */}
        <div className="flex items-center space-x-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <Info className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs font-bold text-red-700">
            El acta de arbitraje será INAPELABLE. Se registrará en el expediente disciplinario del estudiante.
          </p>
        </div>

        {/* Botones Finales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <button
            onClick={onGenerarActa}
            disabled={!canGenerateActa}
            className={`py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              !canGenerateActa
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            <span>Firmar Resolución (Inapelable)</span>
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

export default GccArbitrajePanel;


