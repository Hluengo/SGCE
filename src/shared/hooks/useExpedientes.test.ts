import { renderHook, act } from '@testing-library/react';
import { useExpedientes } from './useExpedientes';
import type { Expediente } from '@/types';

// Mock de los types
const mockExpedientes: Expediente[] = [
  {
    id: 'EXP-001',
    nnaNombre: 'Juan Pérez',
    etapa: 'INICIO',
    gravedad: 'LEVE',
    fechaInicio: '2025-01-01',
    plazoFatal: '2025-02-01',
    encargadoId: 'u1',
    accionesPrevias: false,
    hitos: [],
  },
  {
    id: 'EXP-002',
    nnaNombre: 'María García',
    etapa: 'INVESTIGACION',
    gravedad: 'GRAVISIMA_EXPULSION',
    fechaInicio: '2025-01-15',
    plazoFatal: '2025-01-25',
    encargadoId: 'u1',
    esProcesoExpulsion: true,
    accionesPrevias: true,
    hitos: [],
  },
  {
    id: 'EXP-003',
    nnaNombre: 'Pedro López',
    etapa: 'CERRADO_SANCION',
    gravedad: 'RELEVANTE',
    fechaInicio: '2024-12-01',
    plazoFatal: '2024-12-15',
    encargadoId: 'u1',
    accionesPrevias: false,
    hitos: [],
  },
];

describe('useExpedientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe retornar todos los expedientes cuando no hay término de búsqueda', () => {
    const { result } = renderHook(() => useExpedientes(mockExpedientes));
    
    expect(result.current.filteredExpedientes).toHaveLength(3);
    expect(result.current.kpis.activos).toBe(2); // 2 no cerrados
  });

  it('debe filtrar por nombre de estudiante', () => {
    const { result } = renderHook(() => useExpedientes(mockExpedientes));
    
    act(() => {
      result.current.setSearchTerm('Juan');
    });
    
    expect(result.current.filteredExpedientes).toHaveLength(1);
    expect(result.current.filteredExpedientes[0].nnaNombre).toBe('Juan Pérez');
  });

  it('debe filtrar por folio', () => {
    const { result } = renderHook(() => useExpedientes(mockExpedientes));
    
    act(() => {
      result.current.setSearchTerm('EXP-002');
    });
    
    expect(result.current.filteredExpedientes).toHaveLength(1);
    expect(result.current.filteredExpedientes[0].id).toBe('EXP-002');
  });

  it('debe filtrar por gravedad', () => {
    const { result } = renderHook(() => useExpedientes(mockExpedientes));
    
    act(() => {
      result.current.setSearchTerm('EXPULSION');
    });
    
    expect(result.current.filteredExpedientes).toHaveLength(1);
  });

  it('debe calcular KPIs correctamente', () => {
    const { result } = renderHook(() => useExpedientes(mockExpedientes));
    
    expect(result.current.kpis.activos).toBe(2);
    expect(result.current.kpis.vencimientosCriticos).toBeGreaterThanOrEqual(0);
    expect(result.current.kpis.acuerdosGCC).toBe(0);
    expect(result.current.kpis.total).toBe(3);
  });

  it('debe limpiar búsqueda', () => {
    const { result } = renderHook(() => useExpedientes(mockExpedientes));
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    expect(result.current.searchTerm).toBe('test');
    
    act(() => {
      result.current.clearSearch();
    });
    
    expect(result.current.searchTerm).toBe('');
    expect(result.current.filteredExpedientes).toHaveLength(3);
  });

  it('debe ser case insensitive', () => {
    const { result } = renderHook(() => useExpedientes(mockExpedientes));
    
    act(() => {
      result.current.setSearchTerm('MARÍA');
    });
    
    expect(result.current.filteredExpedientes).toHaveLength(1);
  });
});
