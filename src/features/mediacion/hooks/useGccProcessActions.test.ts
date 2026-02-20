import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseTenant = vi.fn();
const mockUseAuth = vi.fn();
const fromMock = vi.fn();

vi.mock('@/shared/context/TenantContext', () => ({
  useTenant: () => mockUseTenant(),
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { useGccProcessActions } from './useGccProcessActions';

function createSelectBuilder(result: unknown, error: unknown = null) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: result, error })),
  };
  return builder;
}

function createUpdateBuilder(error: unknown = null) {
  const builder = {
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(resolve({ data: null, error })),
  };
  return builder;
}

function createInsertBuilder(error: unknown = null) {
  return {
    insert: vi.fn(async () => ({ data: null, error })),
  };
}

describe('useGccProcessActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenant.mockReturnValue({ tenantId: 'tenant-1' });
    mockUseAuth.mockReturnValue({ usuario: { id: 'user-1' } });
  });

  it('fetchMediacionActiva returns latest row', async () => {
    fromMock.mockImplementation(() =>
      createSelectBuilder({
        id: 'med-1',
        tipo_mecanismo: 'MEDIACION',
        estado_proceso: 'en_proceso',
      })
    );

    const { result } = renderHook(() => useGccProcessActions());
    const row = await result.current.fetchMediacionActiva('exp-1');

    expect(row?.id).toBe('med-1');
    expect(fromMock).toHaveBeenCalledWith('mediaciones_gcc_v2');
  });

  it('registrarResultado writes all entities and returns mapped status', async () => {
    fromMock
      .mockImplementationOnce(() => createUpdateBuilder(null))
      .mockImplementationOnce(() => createInsertBuilder(null))
      .mockImplementationOnce(() => createInsertBuilder(null))
      .mockImplementationOnce(() => createInsertBuilder(null));

    const { result } = renderHook(() => useGccProcessActions());
    const status = await result.current.registrarResultado({
      mediacionId: 'med-1',
      mecanismoSeleccionado: 'MEDIACION',
      payload: {
        resultado: 'acuerdo_total',
        acuerdos: ['a1'],
        compromisos: ['c1'],
        observaciones: 'ok',
      },
    });

    expect(status).toBe('LOGRADO');
    expect(fromMock).toHaveBeenNthCalledWith(1, 'mediaciones_gcc_v2');
    expect(fromMock).toHaveBeenNthCalledWith(2, 'actas_gcc_v2');
    expect(fromMock).toHaveBeenNthCalledWith(3, 'compromisos_gcc_v2');
    expect(fromMock).toHaveBeenNthCalledWith(4, 'hitos_gcc_v2');
  });

  it('registrarResultado throws when update fails', async () => {
    fromMock.mockImplementationOnce(() =>
      createUpdateBuilder({ message: 'db update error' })
    );

    const { result } = renderHook(() => useGccProcessActions());
    await expect(
      result.current.registrarResultado({
        mediacionId: 'med-1',
        mecanismoSeleccionado: 'MEDIACION',
        payload: {
          resultado: 'sin_acuerdo',
          acuerdos: [],
          compromisos: [],
          observaciones: '',
        },
      })
    ).rejects.toThrow('No se pudo guardar resultado');
  });
});

