/**
 * GccPanelRouter - Enrutador inteligente de paneles GCC
 * 
 * Basado en el mecanismo seleccionado, renderiza el panel específico
 * Cada panel es optimizado para su mecanismo particular
 */

import React from 'react';
import type { Expediente } from '@/types';
import { GccMediacionPanel } from './GccMediacionPanel';
import { GccConciliacionPanel } from './GccConciliacionPanel';
import { GccArbitrajePanel } from './GccArbitrajePanel';

// Tipos comunes
export interface Compromiso {
  id: string;
  descripcion: string;
  fechaCumplimiento: string;
  responsable: string;
  completado: boolean;
}

export interface NuevoCompromiso {
  descripcion: string;
  fecha: string;
  responsable: string;
}

export type MecanismoGCC = 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO';

// Tipos para cumplimiento con Circular 782
export type EscenarioProcedencia = 'SIN_INCUMPLIMIENTO' | 'CON_INCUMPLIMIENTO' | 'RESTAURATIVO';

export interface GccPanelRouterProps {
  mecanismo: MecanismoGCC;
  caso: Expediente | null;
  userRole?: 'DIRECTOR' | 'FACILITADOR' | 'OTRO';
  
  // Estado común
  estado: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  onEstadoChange: (estado: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO') => void;
  
  // Compromisos
  compromisos: Compromiso[];
  nuevoCompromiso: NuevoCompromiso;
  onNuevoCompromisoChange: (field: string, value: string) => void;
  onAgregarCompromiso: () => void;
  onEliminarCompromiso: (id: string) => void;
  onToggleMarcaCompromiso: (id: string) => void;
  
  // ===== NUEVOS CAMPOS CIRCULAR 782 =====
  // 1. Participación voluntaria explícita
  aceptaParticipacion?: boolean;
  onAceptaParticipacionChange?: (value: boolean) => void;
  
  // 2. Escenario de procedencia (sin/con incumplimiento o restaurativo)
  escenarioProcedencia?: EscenarioProcedencia;
  onEscenarioProcedenciaChange?: (value: EscenarioProcedencia) => void;
  
  // 3. Plazo de exigibilidad de compromisos
  plazoCompromiso?: string;
  onPlazoCompromisoChange?: (value: string) => void;
  
  // 4. Autorización para divulgar resultado (privacidad)
  autorizaDivulgacionResultado?: boolean;
  onAutorizaDivulgacionResultadoChange?: (value: boolean) => void;
  
  // 5. Evaluación y seguimiento
  fechaSeguimiento?: string;
  onFechaSeguimientoChange?: (value: string) => void;
  evaluacionResultado?: string;
  onEvaluacionResultadoChange?: (value: string) => void;
  
  // Negociación específicos
  facilitadorApoyo?: string;
  onFacilitadorApoyoChange?: (value: string) => void;
  horaInicio?: string;
  onHoraInicioChange?: (value: string) => void;
  horaCierre?: string;
  onHoraCierreChange?: (value: string) => void;
  acuerdoAlcanzado?: boolean;
  onAcuerdoChange?: (value: boolean) => void;
  detallesAcuerdo?: string;
  onDetallesAcuerdoChange?: (value: string) => void;
  
  // Mediación específicos
  mediador?: string;
  onMediadorChange?: (value: string) => void;
  fechaMediacion?: string;
  onFechaMediacionChange?: (value: string) => void;
  firmaEstudiante1?: boolean;
  firmaEstudiante2?: boolean;
  firmaMediador?: boolean;
  
  // Conciliación específicos
  conciliador?: string;
  onConciliadorChange?: (value: string) => void;
  fechaConciliacion?: string;
  onFechaConciliacionChange?: (value: string) => void;
  propuestaConciliador?: string;
  onPropuestaConciliadorChange?: (value: string) => void;
  propuestaAceptada?: boolean | null;
  onPropuestaAceptadaChange?: (value: boolean | null) => void;
  firmaConciliador?: boolean;
  
  // Arbitraje específicos
  arbitro?: string;
  fechaArbitraje?: string;
  onFechaArbitrajeChange?: (value: string) => void;
  resolucionArbitro?: string;
  onResolucionArbitroChange?: (value: string) => void;
  entiendeVinculancia?: boolean;
  onEntiendeVinculanciaChange?: (value: boolean) => void;
  firmaArbitro?: boolean;
  
  // Acciones comunes
  onGenerarActa: () => void;
  onCerrarExpediente: () => void;
}

/**
 * GccPanelRouter - Renderiza el panel correcto según mecanismo
 * 
 * Validaciones:
 * - Mediación: requiere mediador
 * - Conciliación: requiere conciliador + propuesta
 * - Arbitraje: requiere DIRECTOR + resolución
 */
export const GccPanelRouter: React.FC<GccPanelRouterProps> = ({
  mecanismo,
  caso,
  userRole = 'OTRO',
  estado,
  onEstadoChange,
  compromisos,
  nuevoCompromiso,
  onNuevoCompromisoChange,
  onAgregarCompromiso,
  onEliminarCompromiso,
  onToggleMarcaCompromiso,
  // Circular 782 campos
  aceptaParticipacion = false,
  onAceptaParticipacionChange = () => {},
  escenarioProcedencia,
  onEscenarioProcedenciaChange = () => {},
  plazoCompromiso = '',
  onPlazoCompromisoChange = () => {},
  autorizaDivulgacionResultado = false,
  onAutorizaDivulgacionResultadoChange = () => {},
  fechaSeguimiento = '',
  onFechaSeguimientoChange = () => {},
  evaluacionResultado = '',
  onEvaluacionResultadoChange = () => {},
  // Mecanismo específicos
  horaInicio = '',
  onHoraInicioChange = () => {},
  horaCierre = '',
  onHoraCierreChange = () => {},
  acuerdoAlcanzado = false,
  onAcuerdoChange = () => {},
  detallesAcuerdo = '',
  onDetallesAcuerdoChange = () => {},
  mediador = '',
  onMediadorChange = () => {},
  fechaMediacion = '',
  onFechaMediacionChange = () => {},
  firmaEstudiante1 = false,
  firmaEstudiante2 = false,
  firmaMediador = false,
  conciliador = '',
  onConciliadorChange = () => {},
  fechaConciliacion = '',
  onFechaConciliacionChange = () => {},
  propuestaConciliador = '',
  onPropuestaConciliadorChange = () => {},
  propuestaAceptada = null,
  onPropuestaAceptadaChange = () => {},
  firmaConciliador = false,
  arbitro = 'Director del Establecimiento',
  fechaArbitraje = '',
  onFechaArbitrajeChange = () => {},
  resolucionArbitro = '',
  onResolucionArbitroChange = () => {},
  entiendeVinculancia = false,
  onEntiendeVinculanciaChange = () => {},
  firmaArbitro = false,
  onGenerarActa,
  onCerrarExpediente
}) => {
  if (!caso) return null;

  // Renderizar panel según mecanismo
  switch (mecanismo) {
    case 'MEDIACION':
      return (
        <GccMediacionPanel
          caso={caso}
          mediador={mediador}
          onMediadorChange={onMediadorChange}
          estado={estado}
          onEstadoChange={onEstadoChange}
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
          fechaMediacion={fechaMediacion}
          onFechaMediacionChange={onFechaMediacionChange}
          horaInicio={horaInicio}
          onHoraInicioChange={onHoraInicioChange}
          horaCierre={horaCierre}
          onHoraCierreChange={onHoraCierreChange}
          compromisos={compromisos}
          nuevoCompromiso={nuevoCompromiso}
          onNuevoCompromisoChange={onNuevoCompromisoChange}
          onAgregarCompromiso={onAgregarCompromiso}
          onEliminarCompromiso={onEliminarCompromiso}
          onToggleMarcaCompromiso={onToggleMarcaCompromiso}
          acuerdoAlcanzado={acuerdoAlcanzado}
          onAcuerdoChange={onAcuerdoChange}
          detallesAcuerdo={detallesAcuerdo}
          onDetallesAcuerdoChange={onDetallesAcuerdoChange}
          firmaEstudiante1={firmaEstudiante1}
          firmaEstudiante2={firmaEstudiante2}
          firmaMediador={firmaMediador}
          onGenerarActa={onGenerarActa}
          onCerrarExpediente={onCerrarExpediente}
        />
      );

    case 'CONCILIACION':
      return (
        <GccConciliacionPanel
          caso={caso}
          conciliador={conciliador}
          onConciliadorChange={onConciliadorChange}
          estado={estado}
          onEstadoChange={onEstadoChange}
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
          fechaConciliacion={fechaConciliacion}
          onFechaConciliacionChange={onFechaConciliacionChange}
          horaInicio={horaInicio}
          onHoraInicioChange={onHoraInicioChange}
          horaCierre={horaCierre}
          onHoraCierreChange={onHoraCierreChange}
          propuestaConciliador={propuestaConciliador}
          onPropuestaConciliadorChange={onPropuestaConciliadorChange}
          propuestaAceptada={propuestaAceptada}
          onPropuestaAceptadaChange={onPropuestaAceptadaChange}
          compromisos={compromisos}
          nuevoCompromiso={nuevoCompromiso}
          onNuevoCompromisoChange={onNuevoCompromisoChange}
          onAgregarCompromiso={onAgregarCompromiso}
          onEliminarCompromiso={onEliminarCompromiso}
          onToggleMarcaCompromiso={onToggleMarcaCompromiso}
          firmaEstudiante1={firmaEstudiante1}
          firmaEstudiante2={firmaEstudiante2}
          firmaConciliador={firmaConciliador}
          onGenerarActa={onGenerarActa}
          onCerrarExpediente={onCerrarExpediente}
        />
      );

    case 'ARBITRAJE_PEDAGOGICO':
      return (
        <GccArbitrajePanel
          caso={caso}
          userRole={userRole}
          arbitro={arbitro}
          estado={estado}
          onEstadoChange={onEstadoChange}
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
          fechaArbitraje={fechaArbitraje}
          onFechaArbitrajeChange={onFechaArbitrajeChange}
          horaInicio={horaInicio}
          onHoraInicioChange={onHoraInicioChange}
          horaCierre={horaCierre}
          onHoraCierreChange={onHoraCierreChange}
          resolucionArbitro={resolucionArbitro}
          onResolucionArbitroChange={onResolucionArbitroChange}
          entiendeVinculancia={entiendeVinculancia}
          onEntiendeVinculanciaChange={onEntiendeVinculanciaChange}
          compromisos={compromisos}
          nuevoCompromiso={nuevoCompromiso}
          onNuevoCompromisoChange={onNuevoCompromisoChange}
          onAgregarCompromiso={onAgregarCompromiso}
          onEliminarCompromiso={onEliminarCompromiso}
          onToggleMarcaCompromiso={onToggleMarcaCompromiso}
          firmaEstudiante1={firmaEstudiante1}
          firmaEstudiante2={firmaEstudiante2}
          firmaArbitro={firmaArbitro}
          onGenerarActa={onGenerarActa}
          onCerrarExpediente={onCerrarExpediente}
        />
      );

    default:
      // Fallback seguro a mediación para valores no reconocidos.
      return (
        <GccMediacionPanel
          caso={caso}
          mediador={mediador}
          onMediadorChange={onMediadorChange}
          estado={estado}
          onEstadoChange={onEstadoChange}
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
          fechaMediacion={fechaMediacion}
          onFechaMediacionChange={onFechaMediacionChange}
          horaInicio={horaInicio}
          onHoraInicioChange={onHoraInicioChange}
          horaCierre={horaCierre}
          onHoraCierreChange={onHoraCierreChange}
          compromisos={compromisos}
          nuevoCompromiso={nuevoCompromiso}
          onNuevoCompromisoChange={onNuevoCompromisoChange}
          onAgregarCompromiso={onAgregarCompromiso}
          onEliminarCompromiso={onEliminarCompromiso}
          onToggleMarcaCompromiso={onToggleMarcaCompromiso}
          acuerdoAlcanzado={acuerdoAlcanzado}
          onAcuerdoChange={onAcuerdoChange}
          detallesAcuerdo={detallesAcuerdo}
          onDetallesAcuerdoChange={onDetallesAcuerdoChange}
          firmaEstudiante1={firmaEstudiante1}
          firmaEstudiante2={firmaEstudiante2}
          firmaMediador={firmaMediador}
          onGenerarActa={onGenerarActa}
          onCerrarExpediente={onCerrarExpediente}
        />
      );
  }
};

export default React.memo(GccPanelRouter);
