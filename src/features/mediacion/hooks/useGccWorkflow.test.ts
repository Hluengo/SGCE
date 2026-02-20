import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockShowToast = vi.fn();
const mockHandleDerivacionCompleta = vi.fn();
const mockFetchMediacionActiva = vi.fn();
const mockRegistrarResultado = vi.fn();
const mockEstadoProcesoToStatus = vi.fn();

vi.mock('@/shared/components/Toast/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/shared/hooks/useGccDerivacion', () => ({
  useGccDerivacion: () => ({
    handleDerivacionCompleta: mockHandleDerivacionCompleta,
  }),
}));

vi.mock('./useGccProcessActions', () => ({
  useGccProcessActions: () => ({
    fetchMediacionActiva: mockFetchMediacionActiva,
    registrarResultado: mockRegistrarResultado,
    estadoProcesoToStatus: mockEstadoProcesoToStatus,
  }),
}));

import { useGccWorkflow } from './useGccWorkflow';

describe('useGccWorkflow', () => {
  const baseParams = {
    expedientes: [
      {
        id: 'exp-1',
        dbId: 'db-exp-1',
        nnaNombre: 'NNA 1',
        etapa: 'INVESTIGACION',
      },
    ] as any,
    setExpedientes: vi.fn(),
    setExpedienteSeleccionado: vi.fn(),
    selectedCaseId: 'exp-1',
    selectedMediacionId: 'med-1',
    mecanismoSeleccionado: 'MEDIACION' as const,
    selectCase: vi.fn(),
    setMediacionId: vi.fn(),
    cambiarMecanismo: vi.fn(),
    cambiarStatus: vi.fn(),
    toggleModal: vi.fn(),
    refreshGccMetrics: vi.fn(async () => {}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockEstadoProcesoToStatus.mockReturnValue('PROCESO');
  });

  it('handleSelectCase sets mediacion and status when active mediation exists', async () => {
    mockFetchMediacionActiva.mockResolvedValue({
      id: 'med-10',
      tipo_mecanismo: 'MEDIACION',
      estado_proceso: 'en_proceso',
    });

    const { result } = renderHook(() => useGccWorkflow(baseParams));
    await result.current.handleSelectCase('exp-1');

    expect(baseParams.selectCase).toHaveBeenCalledWith('exp-1');
    expect(baseParams.setMediacionId).toHaveBeenCalledWith('med-10');
    expect(baseParams.cambiarMecanismo).toHaveBeenCalledWith('MEDIACION');
    expect(baseParams.cambiarStatus).toHaveBeenCalledWith('PROCESO');
  });

  it('handleDerivacionCompletaInternal updates stage and closes derivation modal', async () => {
    mockHandleDerivacionCompleta.mockResolvedValue({ mediacionId: 'med-99' });

    const { result } = renderHook(() => useGccWorkflow(baseParams));
    await result.current.handleDerivacionCompletaInternal({
      motivo: 'm',
      objetivos: ['o1'],
      mediadorAsignado: 'med',
      fechaMediacion: '2026-02-19',
    });

    expect(baseParams.setMediacionId).toHaveBeenCalledWith('med-99');
    expect(baseParams.setExpedientes).toHaveBeenCalled();
    expect(baseParams.toggleModal).toHaveBeenCalledWith('showDerivacionForm');
  });

  it('handleResultadoCompleto shows error toast when no active mediacion', async () => {
    const { result } = renderHook(() =>
      useGccWorkflow({ ...baseParams, selectedMediacionId: null })
    );
    await result.current.handleResultadoCompleto({
      resultado: 'sin_acuerdo',
      acuerdos: [],
      compromisos: [],
      observaciones: '',
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      'error',
      'GCC',
      'No hay mediacion activa para registrar resultado.'
    );
  });
});

