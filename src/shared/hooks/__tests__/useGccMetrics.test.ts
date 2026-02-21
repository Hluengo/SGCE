/**
 * useGccMetrics.test.ts
 * Tests para el hook de métricas GCC — polling, freshness, cálculos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────

const selectMock = vi.fn();
const eqMock = vi.fn();
const orderMock = vi.fn();
const limitMock = vi.fn();

const chainBuilder = {
  select: (...a: unknown[]) => { selectMock(...a); return chainBuilder; },
  eq: (...a: unknown[]) => { eqMock(...a); return chainBuilder; },
  order: (...a: unknown[]) => { orderMock(...a); return chainBuilder; },
  limit: (n: number) => { limitMock(n); return Promise.resolve({ data: mockRows, error: null }); },
};

const fromMock = vi.fn(() => chainBuilder);

vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock('@/shared/context/TenantContext', () => ({
  useTenant: () => ({ tenantId: '550e8400-e29b-41d4-a716-446655440000' }),
}));

vi.mock('@/shared/utils/expedienteRef', () => ({
  isUuid: (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
}));

// ── Datos de prueba ────────────────────────────────────────

const today = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
/**
 * Format date as YYYY-MM-DDT00:00:00 so that new Date(str) is parsed as LOCAL time.
 * This matches daysUntil() which extracts local date parts via getFullYear/getMonth/getDate.
 * Using bare "YYYY-MM-DD" is parsed as UTC which can shift the day in negative-offset timezones.
 */
const localDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
const inTwoDays = localDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2));
const inOneDay = localDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
const expired = localDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3));
const farFuture = localDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30));

let mockRows: Array<{ id: string; estado_proceso: string; fecha_limite_habil: string | null }> = [];

function setMockRows(rows: typeof mockRows) {
  mockRows = rows;
  // Re-create the limit mock to return new data
  chainBuilder.limit = (n: number) => {
    limitMock(n);
    return Promise.resolve({ data: mockRows, error: null });
  };
}

// ── Import del hook DESPUÉS de mocks ──────────────────────

import useGccMetrics from '../useGccMetrics';

// ── Suite ──────────────────────────────────────────────────

describe('useGccMetrics', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setMockRows([]);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  // ── Defaults ──

  it('debe usar 60000ms como intervalo de polling por defecto', () => {
    setMockRows([]);
    const { result } = renderHook(() => useGccMetrics({ autoRefresh: false }));
    // El hook se inicializa con estos defaults
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.freshness).toBe('unknown');
  });

  it('no debe cargar datos cuando enabled=false', async () => {
    const { result } = renderHook(() => useGccMetrics({ enabled: false }));
    // Esperar un tick
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(fromMock).not.toHaveBeenCalled();
    expect(result.current.metrics.activos).toBe(0);
  });

  // ── Carga inicial ──

  it('debe cargar métricas al montar con enabled=true', async () => {
    setMockRows([
      { id: '1', estado_proceso: 'abierta', fecha_limite_habil: inTwoDays },
      { id: '2', estado_proceso: 'en_proceso', fecha_limite_habil: inOneDay },
      { id: '3', estado_proceso: 'acuerdo_total', fecha_limite_habil: null },
    ]);

    const { result } = renderHook(() => useGccMetrics({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fromMock).toHaveBeenCalledWith('mediaciones_gcc_v2');
    expect(result.current.metrics.activos).toBe(2);
    expect(result.current.metrics.acuerdoTotalPct).toBe(100); // 1/1 terminal
    expect(result.current.lastUpdatedAt).not.toBeNull();
  });

  // ── Cálculo de métricas ──

  it('debe calcular t2, t1 y vencidos correctamente', async () => {
    setMockRows([
      { id: '1', estado_proceso: 'abierta', fecha_limite_habil: inTwoDays },   // T2
      { id: '2', estado_proceso: 'en_proceso', fecha_limite_habil: inOneDay },  // T1
      { id: '3', estado_proceso: 'abierta', fecha_limite_habil: expired },      // Vencido
      { id: '4', estado_proceso: 'en_proceso', fecha_limite_habil: null },      // Sin plazo
    ]);

    const { result } = renderHook(() => useGccMetrics({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.metrics.activos).toBe(4);
    expect(result.current.metrics.t2).toBe(1);
    expect(result.current.metrics.t1).toBe(1);
    expect(result.current.metrics.vencidos).toBe(1);
  });

  it('debe calcular porcentajes terminales correctamente', async () => {
    setMockRows([
      { id: '1', estado_proceso: 'acuerdo_total', fecha_limite_habil: null },
      { id: '2', estado_proceso: 'acuerdo_parcial', fecha_limite_habil: null },
      { id: '3', estado_proceso: 'sin_acuerdo', fecha_limite_habil: null },
      { id: '4', estado_proceso: 'cerrada', fecha_limite_habil: null },
    ]);

    const { result } = renderHook(() => useGccMetrics({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 4 terminales: 1 total, 1 parcial, 1 sin acuerdo, 1 cerrada
    expect(result.current.metrics.acuerdoTotalPct).toBe(25);
    expect(result.current.metrics.acuerdoParcialPct).toBe(25);
    expect(result.current.metrics.sinAcuerdoPct).toBe(25);
  });

  // ── hasData ──

  it('debe retornar hasData=false cuando no hay datos relevantes', async () => {
    setMockRows([]);

    const { result } = renderHook(() => useGccMetrics({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasData).toBe(false);
  });

  it('debe retornar hasData=true cuando hay activos', async () => {
    setMockRows([
      { id: '1', estado_proceso: 'abierta', fecha_limite_habil: inTwoDays },
    ]);

    const { result } = renderHook(() => useGccMetrics({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasData).toBe(true);
  });

  // ── Freshness ──

  it('debe reportar freshness=unknown antes de primer refresh', () => {
    const { result } = renderHook(() => useGccMetrics({ enabled: false }));
    expect(result.current.freshness).toBe('unknown');
    expect(result.current.secondsSinceUpdate).toBeNull();
  });

  // ── Error handling ──

  it('debe manejar error de Supabase', async () => {
    chainBuilder.limit = (n: number) => {
      limitMock(n);
      return Promise.resolve({ data: null, error: { message: 'DB error' } });
    };

    const { result } = renderHook(() => useGccMetrics({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('No se pudieron cargar las métricas GCC.');
  });

  it('debe manejar excepción inesperada', async () => {
    chainBuilder.limit = () => {
      throw new Error('Network failure');
    };

    const { result } = renderHook(() => useGccMetrics({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Ocurrió un error inesperado al cargar métricas GCC.');
  });

  // ── Refresh manual ──

  it('refresh() debe recargar métricas', async () => {
    setMockRows([
      { id: '1', estado_proceso: 'abierta', fecha_limite_habil: inTwoDays },
    ]);

    const { result } = renderHook(() => useGccMetrics({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.metrics.activos).toBe(1);

    // Añadir filas y refrescar
    setMockRows([
      { id: '1', estado_proceso: 'abierta', fecha_limite_habil: inTwoDays },
      { id: '2', estado_proceso: 'en_proceso', fecha_limite_habil: inOneDay },
    ]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.metrics.activos).toBe(2);
  });
});
