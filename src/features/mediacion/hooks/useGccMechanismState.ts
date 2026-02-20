import { useMemo, useState } from 'react';

export type EscenarioProcedencia =
  | 'SIN_INCUMPLIMIENTO'
  | 'CON_INCUMPLIMIENTO'
  | 'RESTAURATIVO';

/**
 * Estado local para formularios de mecanismos GCC.
 * Separamos este bloque para reducir complejidad del componente contenedor.
 */
export function useGccMechanismState() {
  const [horaInicio, setHoraInicio] = useState('');
  const [horaCierre, setHoraCierre] = useState('');
  const [acuerdoAlcanzado, setAcuerdoAlcanzado] = useState(false);
  const [detallesAcuerdo, setDetallesAcuerdo] = useState('');

  const [fechaMediacion, setFechaMediacion] = useState('');
  const [firmaEstudiante1] = useState(false);
  const [firmaEstudiante2] = useState(false);
  const [firmaMediador] = useState(false);

  const [fechaConciliacion, setFechaConciliacion] = useState('');
  const [propuestaConciliador, setPropuestaConciliador] = useState('');
  const [propuestaAceptada, setPropuestaAceptada] = useState<boolean | null>(null);
  const [firmaConciliador] = useState(false);

  const [fechaArbitraje, setFechaArbitraje] = useState('');
  const [resolucionArbitro, setResolucionArbitro] = useState('');
  const [entiendeVinculancia, setEntiendeVinculancia] = useState(false);
  const [firmaArbitro] = useState(false);

  const [aceptaParticipacion, setAceptaParticipacion] = useState(false);
  const [escenarioProcedencia, setEscenarioProcedencia] = useState<
    EscenarioProcedencia | undefined
  >();
  const [plazoCompromiso, setPlazoCompromiso] = useState('');
  const [autorizaDivulgacionResultado, setAutorizaDivulgacionResultado] = useState(false);
  const [fechaSeguimiento, setFechaSeguimiento] = useState('');
  const [evaluacionResultado, setEvaluacionResultado] = useState('');

  return useMemo(
    () => ({
      horaInicio,
      setHoraInicio,
      horaCierre,
      setHoraCierre,
      acuerdoAlcanzado,
      setAcuerdoAlcanzado,
      detallesAcuerdo,
      setDetallesAcuerdo,
      fechaMediacion,
      setFechaMediacion,
      firmaEstudiante1,
      firmaEstudiante2,
      firmaMediador,
      fechaConciliacion,
      setFechaConciliacion,
      propuestaConciliador,
      setPropuestaConciliador,
      propuestaAceptada,
      setPropuestaAceptada,
      firmaConciliador,
      fechaArbitraje,
      setFechaArbitraje,
      resolucionArbitro,
      setResolucionArbitro,
      entiendeVinculancia,
      setEntiendeVinculancia,
      firmaArbitro,
      aceptaParticipacion,
      setAceptaParticipacion,
      escenarioProcedencia,
      setEscenarioProcedencia,
      plazoCompromiso,
      setPlazoCompromiso,
      autorizaDivulgacionResultado,
      setAutorizaDivulgacionResultado,
      fechaSeguimiento,
      setFechaSeguimiento,
      evaluacionResultado,
      setEvaluacionResultado,
    }),
    [
      horaInicio,
      horaCierre,
      acuerdoAlcanzado,
      detallesAcuerdo,
      fechaMediacion,
      firmaEstudiante1,
      firmaEstudiante2,
      firmaMediador,
      fechaConciliacion,
      propuestaConciliador,
      propuestaAceptada,
      firmaConciliador,
      fechaArbitraje,
      resolucionArbitro,
      entiendeVinculancia,
      firmaArbitro,
      aceptaParticipacion,
      escenarioProcedencia,
      plazoCompromiso,
      autorizaDivulgacionResultado,
      fechaSeguimiento,
      evaluacionResultado,
    ]
  );
}
