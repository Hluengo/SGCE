import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGccPanelProps } from './useGccPanelProps';

describe('useGccPanelProps', () => {
  const mechanismState = {
    horaInicio: '',
    setHoraInicio: vi.fn(),
    horaCierre: '',
    setHoraCierre: vi.fn(),
    acuerdoAlcanzado: false,
    setAcuerdoAlcanzado: vi.fn(),
    detallesAcuerdo: '',
    setDetallesAcuerdo: vi.fn(),
    fechaMediacion: '',
    setFechaMediacion: vi.fn(),
    firmaEstudiante1: false,
    firmaEstudiante2: false,
    firmaMediador: false,
    fechaConciliacion: '',
    setFechaConciliacion: vi.fn(),
    propuestaConciliador: '',
    setPropuestaConciliador: vi.fn(),
    propuestaAceptada: null,
    setPropuestaAceptada: vi.fn(),
    firmaConciliador: false,
    fechaArbitraje: '',
    setFechaArbitraje: vi.fn(),
    resolucionArbitro: '',
    setResolucionArbitro: vi.fn(),
    entiendeVinculancia: false,
    setEntiendeVinculancia: vi.fn(),
    firmaArbitro: false,
    aceptaParticipacion: false,
    setAceptaParticipacion: vi.fn(),
    escenarioProcedencia: undefined,
    setEscenarioProcedencia: vi.fn(),
    plazoCompromiso: '',
    setPlazoCompromiso: vi.fn(),
    autorizaDivulgacionResultado: false,
    setAutorizaDivulgacionResultado: vi.fn(),
    fechaSeguimiento: '',
    setFechaSeguimiento: vi.fn(),
    evaluacionResultado: '',
    setEvaluacionResultado: vi.fn(),
  };

  it('maps role and composes router props', () => {
    const { result } = renderHook(() =>
      useGccPanelProps({
        casoSeleccionado: { id: 'exp-1' } as any,
        usuarioRol: 'DIRECTOR',
        mecanismoSeleccionado: 'MEDIACION',
        statusGCC: 'PROCESO',
        compromisos: [],
        nuevoCompromiso: { descripcion: '', fecha: '', responsable: '' },
        facilitador: 'Fac',
        mechanismState: mechanismState as any,
        cambiarStatus: vi.fn(),
        agregarCompromiso: vi.fn(),
        eliminarCompromiso: vi.fn(),
        toggleCumplimiento: vi.fn(),
        cambiarFacilitador: vi.fn(),
        actualizarNuevoCompromiso: vi.fn(),
        toggleModal: vi.fn(),
      })
    );

    expect(result.current.userRoleForPanel).toBe('DIRECTOR');
    expect(result.current.panelRouterProps.userRole).toBe('DIRECTOR');
    expect(result.current.panelRouterProps.mecanismo).toBe('MEDIACION');
  });

  it('ignores invalid nuevoCompromiso field updates', () => {
    const actualizarNuevoCompromiso = vi.fn();
    const { result } = renderHook(() =>
      useGccPanelProps({
        casoSeleccionado: { id: 'exp-1' } as any,
        usuarioRol: 'FACILITADOR',
        mecanismoSeleccionado: 'MEDIACION',
        statusGCC: 'PROCESO',
        compromisos: [],
        nuevoCompromiso: { descripcion: '', fecha: '', responsable: '' },
        facilitador: 'Fac',
        mechanismState: mechanismState as any,
        cambiarStatus: vi.fn(),
        agregarCompromiso: vi.fn(),
        eliminarCompromiso: vi.fn(),
        toggleCumplimiento: vi.fn(),
        cambiarFacilitador: vi.fn(),
        actualizarNuevoCompromiso,
        toggleModal: vi.fn(),
      })
    );

    result.current.panelRouterProps.onNuevoCompromisoChange('otro', 'x');
    result.current.panelRouterProps.onNuevoCompromisoChange('descripcion', 'valor');

    expect(actualizarNuevoCompromiso).toHaveBeenCalledTimes(1);
    expect(actualizarNuevoCompromiso).toHaveBeenCalledWith({ descripcion: 'valor' });
  });
});

