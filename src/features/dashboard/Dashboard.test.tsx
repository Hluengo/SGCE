
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/shared/components/Toast/ToastProvider';
import { UIProvider } from '@/shared/context/providers/UIProvider';
import type { Expediente } from '@/types';

vi.mock('@/shared/context/ConvivenciaContext', () => ({
    useConvivencia: vi.fn(),
}));

vi.mock('@/shared/hooks/useGccMetrics', () => ({
    default: vi.fn(() => ({
        metrics: {
            activos: 0,
            t2: 0,
            t1: 0,
            vencidos: 0,
            acuerdoTotalPct: 0,
            acuerdoParcialPct: 0,
            sinAcuerdoPct: 0
        },
        hasData: false,
        isLoading: false,
        lastUpdatedAt: null,
        freshness: 'unknown' as const
    }))
}));

describe('Dashboard', () => {
    const mockSetIsWizardOpen = vi.fn();
    
    const mockExpedientes: Expediente[] = [
        {
            id: 'EXP-2025-001',
            nnaNombre: 'A. Rojas B.',
            nnaCurso: '8° Básico A',
            etapa: 'INVESTIGACION',
            gravedad: 'RELEVANTE',
            fechaInicio: new Date().toISOString(),
            plazoFatal: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            encargadoId: 'u1',
            esProcesoExpulsion: false,
            accionesPrevias: false,
            hitos: []
        },
        {
            id: 'EXP-2025-002',
            nnaNombre: 'M. Soto L.',
            nnaCurso: '7° Básico B',
            etapa: 'NOTIFICADO',
            gravedad: 'GRAVISIMA_EXPULSION',
            fechaInicio: new Date().toISOString(),
            plazoFatal: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            encargadoId: 'u1',
            esProcesoExpulsion: true,
            accionesPrevias: true,
            hitos: []
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useConvivencia).mockReturnValue({
            expedientes: mockExpedientes,
            setIsWizardOpen: mockSetIsWizardOpen,
        } as unknown as ReturnType<typeof useConvivencia>);
    });

    it('debe renderizar el Dashboard correctamente', () => {
        render(
            <BrowserRouter>
                <UIProvider>
                    <ToastProvider>
                        <Dashboard />
                    </ToastProvider>
                </UIProvider>
            </BrowserRouter>
        );
        expect(screen.getByText(/Panel de Gestión Normativa/i)).toBeInTheDocument();
    });

    it('debe mostrar las estadísticas de expedientes', () => {
        render(
            <BrowserRouter>
                <UIProvider>
                    <ToastProvider>
                        <Dashboard />
                    </ToastProvider>
                </UIProvider>
            </BrowserRouter>
        );
        // KPIs del componente EstadisticasConvivencia
        expect(screen.getAllByText(/Total/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Activos/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Resueltos/i).length).toBeGreaterThan(0);
    });

    it('debe mostrar distribución por curso', () => {
        render(
            <BrowserRouter>
                <UIProvider>
                    <ToastProvider>
                        <Dashboard />
                    </ToastProvider>
                </UIProvider>
            </BrowserRouter>
        );
        expect(screen.getByText(/Distribución por Curso/i)).toBeInTheDocument();
        // Verificar que la distribución muestra algún contenido
        const distributionSection = screen.getByText(/Distribución por Curso/i).closest('div');
        expect(distributionSection).toBeInTheDocument();
    });

    it('debe abrir el wizard al hacer clic en Nuevo Proceso Legal', () => {
        render(
            <BrowserRouter>
                <UIProvider>
                    <ToastProvider>
                        <Dashboard />
                    </ToastProvider>
                </UIProvider>
            </BrowserRouter>
        );
        const button = screen.getByText(/Nuevo Expediente/i);
        fireEvent.click(button);
        expect(mockSetIsWizardOpen).toHaveBeenCalledWith(true);
    });

    it('debe filtrar expedientes por término de búsqueda', async () => {
        render(
            <BrowserRouter>
                <UIProvider>
                    <ToastProvider>
                        <Dashboard />
                    </ToastProvider>
                </UIProvider>
            </BrowserRouter>
        );
        const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
        fireEvent.change(searchInput, { target: { value: 'Rojas' } });
        
        await waitFor(() => {
            expect(screen.getAllByText(/A. Rojas B./i).length).toBeGreaterThan(0);
            expect(screen.queryByText(/M. Soto L./i)).not.toBeInTheDocument();
        });
    });

    it('debe mostrar estado vacío cuando no hay coincidencias', async () => {
        render(
            <BrowserRouter>
                <UIProvider>
                    <ToastProvider>
                        <Dashboard />
                    </ToastProvider>
                </UIProvider>
            </BrowserRouter>
        );
        const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
        fireEvent.change(searchInput, { target: { value: 'ZZZ' } });

        await waitFor(() => {
            expect(screen.getAllByText(/Sin coincidencias/i).length).toBeGreaterThan(0);
        });
    });

    it('debe mostrar ambos expedientes inicialmente', async () => {
        render(
            <BrowserRouter>
                <UIProvider>
                    <ToastProvider>
                        <Dashboard />
                    </ToastProvider>
                </UIProvider>
            </BrowserRouter>
        );
        
        // Verificar que ambos expedientes aparecen al menos una vez
        expect(screen.getAllByText(/A. Rojas B./i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/M. Soto L./i).length).toBeGreaterThan(0);
    });
});
