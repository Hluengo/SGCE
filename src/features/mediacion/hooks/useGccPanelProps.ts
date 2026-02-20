import { useCallback, useMemo } from 'react';
import type { Expediente } from '@/types';
import type { GccPanelRouterProps } from '../components/GccPanelRouter';
import type { GccFormState, MecanismoGCC } from '@/shared/hooks/useGccForm';
import type { useGccMechanismState } from './useGccMechanismState';

type UserRoleForPanel = 'DIRECTOR' | 'FACILITADOR';
type NuevoCompromisoField = 'descripcion' | 'fecha' | 'responsable';

interface UseGccPanelPropsParams {
  casoSeleccionado: Expediente | null;
  usuarioRol?: string;
  mecanismoSeleccionado: MecanismoGCC;
  statusGCC: GccFormState['statusGCC'];
  compromisos: GccFormState['compromisos'];
  nuevoCompromiso: GccFormState['nuevoCompromiso'];
  facilitador: string;
  mechanismState: ReturnType<typeof useGccMechanismState>;
  cambiarStatus: (status: GccFormState['statusGCC']) => void;
  agregarCompromiso: (compromiso: GccFormState['compromisos'][number]) => void;
  eliminarCompromiso: (id: string) => void;
  toggleCumplimiento: (id: string) => void;
  cambiarFacilitador: (facilitador: string) => void;
  actualizarNuevoCompromiso: (
    updates: Partial<GccFormState['nuevoCompromiso']>
  ) => void;
  toggleModal: (modal: keyof GccFormState['uiState']) => void;
}

export function useGccPanelProps({
  casoSeleccionado,
  usuarioRol,
  mecanismoSeleccionado,
  statusGCC,
  compromisos,
  nuevoCompromiso,
  facilitador,
  mechanismState,
  cambiarStatus,
  agregarCompromiso,
  eliminarCompromiso,
  toggleCumplimiento,
  cambiarFacilitador,
  actualizarNuevoCompromiso,
  toggleModal,
}: UseGccPanelPropsParams) {
  const handleAgregarCompromiso = useCallback(() => {
    if (!nuevoCompromiso.descripcion || !nuevoCompromiso.fecha) return;
    agregarCompromiso({
      id: crypto.randomUUID(),
      descripcion: nuevoCompromiso.descripcion,
      fechaCumplimiento: nuevoCompromiso.fecha,
      responsable: nuevoCompromiso.responsable || 'Estudiante',
      completado: false,
    });
  }, [nuevoCompromiso, agregarCompromiso]);

  const handleNuevoCompromisoChange = useCallback(
    (field: string, value: string) => {
      if (
        field === 'descripcion' ||
        field === 'fecha' ||
        field === 'responsable'
      ) {
        actualizarNuevoCompromiso({ [field]: value } as Partial<
          Record<NuevoCompromisoField, string>
        >);
      }
    },
    [actualizarNuevoCompromiso]
  );

  const userRoleForPanel: UserRoleForPanel =
    usuarioRol === 'DIRECTOR' ? 'DIRECTOR' : 'FACILITADOR';

  const panelRouterProps: GccPanelRouterProps = useMemo(
    () => ({
      mecanismo: mecanismoSeleccionado,
      caso: casoSeleccionado,
      userRole: userRoleForPanel,
      estado: statusGCC,
      onEstadoChange: cambiarStatus,
      compromisos,
      nuevoCompromiso,
      onNuevoCompromisoChange: handleNuevoCompromisoChange,
      onAgregarCompromiso: handleAgregarCompromiso,
      onEliminarCompromiso: eliminarCompromiso,
      onToggleMarcaCompromiso: toggleCumplimiento,
      facilitadorApoyo: facilitador,
      onFacilitadorApoyoChange: cambiarFacilitador,
      horaInicio: mechanismState.horaInicio,
      onHoraInicioChange: mechanismState.setHoraInicio,
      horaCierre: mechanismState.horaCierre,
      onHoraCierreChange: mechanismState.setHoraCierre,
      acuerdoAlcanzado: mechanismState.acuerdoAlcanzado,
      onAcuerdoChange: mechanismState.setAcuerdoAlcanzado,
      detallesAcuerdo: mechanismState.detallesAcuerdo,
      onDetallesAcuerdoChange: mechanismState.setDetallesAcuerdo,
      mediador: facilitador,
      onMediadorChange: cambiarFacilitador,
      fechaMediacion: mechanismState.fechaMediacion,
      onFechaMediacionChange: mechanismState.setFechaMediacion,
      firmaEstudiante1: mechanismState.firmaEstudiante1,
      firmaEstudiante2: mechanismState.firmaEstudiante2,
      firmaMediador: mechanismState.firmaMediador,
      conciliador: facilitador,
      onConciliadorChange: cambiarFacilitador,
      fechaConciliacion: mechanismState.fechaConciliacion,
      onFechaConciliacionChange: mechanismState.setFechaConciliacion,
      propuestaConciliador: mechanismState.propuestaConciliador,
      onPropuestaConciliadorChange: mechanismState.setPropuestaConciliador,
      propuestaAceptada: mechanismState.propuestaAceptada,
      onPropuestaAceptadaChange: mechanismState.setPropuestaAceptada,
      firmaConciliador: mechanismState.firmaConciliador,
      arbitro: 'Director del Establecimiento',
      fechaArbitraje: mechanismState.fechaArbitraje,
      onFechaArbitrajeChange: mechanismState.setFechaArbitraje,
      resolucionArbitro: mechanismState.resolucionArbitro,
      onResolucionArbitroChange: mechanismState.setResolucionArbitro,
      entiendeVinculancia: mechanismState.entiendeVinculancia,
      onEntiendeVinculanciaChange: mechanismState.setEntiendeVinculancia,
      firmaArbitro: mechanismState.firmaArbitro,
      aceptaParticipacion: mechanismState.aceptaParticipacion,
      onAceptaParticipacionChange: mechanismState.setAceptaParticipacion,
      escenarioProcedencia: mechanismState.escenarioProcedencia,
      onEscenarioProcedenciaChange: mechanismState.setEscenarioProcedencia,
      plazoCompromiso: mechanismState.plazoCompromiso,
      onPlazoCompromisoChange: mechanismState.setPlazoCompromiso,
      autorizaDivulgacionResultado: mechanismState.autorizaDivulgacionResultado,
      onAutorizaDivulgacionResultadoChange:
        mechanismState.setAutorizaDivulgacionResultado,
      fechaSeguimiento: mechanismState.fechaSeguimiento,
      onFechaSeguimientoChange: mechanismState.setFechaSeguimiento,
      evaluacionResultado: mechanismState.evaluacionResultado,
      onEvaluacionResultadoChange: mechanismState.setEvaluacionResultado,
      onGenerarActa: () => toggleModal('showActaPreview'),
      onCerrarExpediente: () => toggleModal('showCierreModal'),
    }),
    [
      mecanismoSeleccionado,
      casoSeleccionado,
      userRoleForPanel,
      statusGCC,
      cambiarStatus,
      compromisos,
      nuevoCompromiso,
      handleNuevoCompromisoChange,
      handleAgregarCompromiso,
      eliminarCompromiso,
      toggleCumplimiento,
      facilitador,
      cambiarFacilitador,
      mechanismState,
      toggleModal,
    ]
  );

  return {
    panelRouterProps,
    userRoleForPanel,
  };
}

