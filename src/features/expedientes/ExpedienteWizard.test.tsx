
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpedienteWizard from './ExpedienteWizard';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';

// Mock del hook useConvivencia
vi.mock('@/shared/context/ConvivenciaContext', () => ({
    useConvivencia: vi.fn(),
    hitosBase: vi.fn(() => []), // Mock hitosBase as well
}));

describe('ExpedienteWizard', () => {
    const mockSetIsWizardOpen = vi.fn();
    const mockSetExpedientes = vi.fn();
    const mockCalcularPlazoLegal = vi.fn(() => new Date());
    const mockEstudiantes = [
        { id: 'est-1', nombreCompleto: 'Juan Pérez M.', curso: '7° A' },
        { id: 'est-2', nombreCompleto: 'María García L.', curso: '7° A' },
        { id: 'est-3', nombreCompleto: 'Pedro Soto R.', curso: '8° B' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useConvivencia).mockReturnValue({
            setIsWizardOpen: mockSetIsWizardOpen,
            setExpedientes: mockSetExpedientes,
            calcularPlazoLegal: mockCalcularPlazoLegal,
            estudiantes: mockEstudiantes,
        } as unknown as ReturnType<typeof useConvivencia>);
    });

    it('debe renderizar el paso 1 correctamente', () => {
        render(<ExpedienteWizard />);
        expect(screen.getByText(/Paso 1: Clasificación/i)).toBeInTheDocument();
        expect(screen.getByText(/Curso del Estudiante/i)).toBeInTheDocument();
        expect(screen.getByText(/Sujeto del Proceso/i)).toBeInTheDocument();
    });

    it('debe mostrar error si se intenta avanzar sin seleccionar estudiante', async () => {
        render(<ExpedienteWizard />);

        const nextButton = screen.getByRole('button', { name: /siguiente/i });
        expect(nextButton).toBeDisabled();
    });

    it('debe mostrar estudiantes del curso seleccionado', async () => {
        render(<ExpedienteWizard />);

        // Seleccionar curso 7° A
        const cursoSelect = screen.getByRole('combobox');
        fireEvent.change(cursoSelect, { target: { value: '7° A' } });

        // Expandir la lista de estudiantes
        const expandButton = await screen.findByRole('button', { name: /2 estudiantes en 7° A/i });
        fireEvent.click(expandButton);

        // Verificar que aparecen ambos estudiantes del curso
        await waitFor(() => {
            expect(screen.getByText('Juan Pérez M.')).toBeInTheDocument();
            expect(screen.getByText('María García L.')).toBeInTheDocument();
            // No debe aparecer Pedro que es de 8° B
            expect(screen.queryByText('Pedro Soto R.')).not.toBeInTheDocument();
        });
    });

    it('debe permitir avanzar cuando se completan los campos requeridos del paso 1', async () => {
        render(<ExpedienteWizard />);

        // 1. Seleccionar curso
        const cursoSelect = screen.getByRole('combobox');
        fireEvent.change(cursoSelect, { target: { value: '7° A' } });

        // 2. Expandir la lista de estudiantes
        const expandButton = await screen.findByRole('button', { name: /2 estudiantes en 7° A/i });
        fireEvent.click(expandButton);

        // 3. Seleccionar estudiante (por texto en el label)
        await waitFor(() => {
            expect(screen.getByText('Juan Pérez M.')).toBeInTheDocument();
        });
        
        // Hacer click en el div/label que contiene el estudiante
        const estudianteRow = screen.getByText('Juan Pérez M.').closest('label');
        fireEvent.click(estudianteRow!);

        // 4. Seleccionar Gravedad GRAVISIMA_EXPULSION
        const expulsionButton = screen.getByRole('button', { name: /Gravísima \/ Expulsión/i });
        fireEvent.click(expulsionButton);

        const nextButton = screen.getByRole('button', { name: /siguiente/i });

        await waitFor(() => {
            expect(nextButton).toBeEnabled();
        });

        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText(/Paso 2: Gradualidad/i)).toBeInTheDocument();
        });
    });

    it('debe filtrar correctamente por diferentes cursos', async () => {
        render(<ExpedienteWizard />);

        // Seleccionar 7° A
        const cursoSelect = screen.getByRole('combobox');
        fireEvent.change(cursoSelect, { target: { value: '7° A' } });

        // Expandir y verificar estudiantes de 7° A
        const expandButtonA = await screen.findByRole('button', { name: /2 estudiantes en 7° A/i });
        fireEvent.click(expandButtonA);

        await waitFor(() => {
            expect(screen.getByText('Juan Pérez M.')).toBeInTheDocument();
        });

        // Cambiar a 8° B
        fireEvent.change(cursoSelect, { target: { value: '8° B' } });

        // Expandir lista de 8° B
        const expandButtonB = await screen.findByRole('button', { name: /1 estudiante en 8° B/i });
        fireEvent.click(expandButtonB);

        await waitFor(() => {
            expect(screen.queryByText('Juan Pérez M.')).not.toBeInTheDocument();
            expect(screen.getByText('Pedro Soto R.')).toBeInTheDocument();
        });
    });
});
