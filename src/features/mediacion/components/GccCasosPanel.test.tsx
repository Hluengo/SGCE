/**
 * GccCasosPanel.test.tsx
 * Tests para el componente de panel de casos GCC
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GccCasosPanel } from './GccCasosPanel';
import type { GccCasosPanelProps } from './GccCasosPanel';
import type { Expediente } from '@/types';

// ── Datos mock ─────────────────────────────────────────────

const today = new Date();
const inTwoDays = new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0];
const tomorrow = new Date(today.getTime() + 1 * 86400000).toISOString().split('T')[0];
const expired = new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0];
const farFuture = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0];

function makeExpediente(overrides: Partial<Expediente> = {}): Expediente {
  return {
    id: 'exp-001',
    nnaNombre: 'Juan Pérez',
    etapa: 'INVESTIGACION',
    gravedad: 'GRAVE',
    fechaInicio: '2026-01-01',
    plazoFatal: farFuture,
    encargadoId: 'enc-1',
    accionesPrevias: true,
    hitos: [],
    ...overrides,
  };
}

const casosParaGCC: Expediente[] = [
  makeExpediente({ id: 'exp-a1', nnaNombre: 'Camila Rojas' }),
  makeExpediente({ id: 'exp-a2', nnaNombre: 'Andrés Soto' }),
];

const casosConDerivacion: Expediente[] = [
  makeExpediente({ id: 'exp-b1', nnaNombre: 'María López', plazoFatal: expired }),
  makeExpediente({ id: 'exp-b2', nnaNombre: 'Diego Vera', plazoFatal: tomorrow }),
  makeExpediente({ id: 'exp-b3', nnaNombre: 'Elena Díaz', plazoFatal: farFuture }),
];

// ── Suite ──────────────────────────────────────────────────

describe('GccCasosPanel', () => {
  const onSelectCase = vi.fn();

  const defaultProps: GccCasosPanelProps = {
    casosParaGCC,
    casosConDerivacion,
    selectedCaseId: null,
    onSelectCase,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──

  it('debe renderizar sin errores', () => {
    const { container } = render(<GccCasosPanel {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('debe mostrar el título "Casos GCC"', () => {
    render(<GccCasosPanel {...defaultProps} />);
    expect(screen.getByText('Casos GCC')).toBeInTheDocument();
  });

  it('debe mostrar conteo de disponibles y activos', () => {
    render(<GccCasosPanel {...defaultProps} />);
    expect(screen.getByText(/Disponibles \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Activos \(3\)/)).toBeInTheDocument();
  });

  // ── Tabla ──

  it('debe renderizar todos los casos en la tabla', () => {
    render(<GccCasosPanel {...defaultProps} />);
    // Verificar nombres de estudiantes
    expect(screen.getByText('Camila Rojas')).toBeInTheDocument();
    expect(screen.getByText('Andrés Soto')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
    expect(screen.getByText('Diego Vera')).toBeInTheDocument();
    expect(screen.getByText('Elena Díaz')).toBeInTheDocument();
  });

  it('debe mostrar badges de estado Disponible y En Progreso', () => {
    render(<GccCasosPanel {...defaultProps} />);
    const disponibles = screen.getAllByText('Disponible');
    const enProgreso = screen.getAllByText('En Progreso');
    expect(disponibles).toHaveLength(2);
    expect(enProgreso).toHaveLength(3);
  });

  it('debe mostrar alertas de plazo para casos activos', () => {
    render(<GccCasosPanel {...defaultProps} />);
    expect(screen.getByText('Vencido')).toBeInTheDocument();
    expect(screen.getByText('Vence mañana')).toBeInTheDocument();
  });

  // ── Estado vacío ──

  it('debe mostrar mensaje cuando no hay casos', () => {
    render(
      <GccCasosPanel
        casosParaGCC={[]}
        casosConDerivacion={[]}
        selectedCaseId={null}
        onSelectCase={onSelectCase}
      />
    );
    expect(screen.getByText('No hay casos disponibles')).toBeInTheDocument();
  });

  // ── Selección ──

  it('debe llamar onSelectCase al hacer clic en un caso', () => {
    render(<GccCasosPanel {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // Clic en el primer botón de selección
    fireEvent.click(buttons[0]);
    expect(onSelectCase).toHaveBeenCalledTimes(1);
  });

  it('debe resaltar la fila del caso seleccionado', () => {
    const { container } = render(
      <GccCasosPanel {...defaultProps} selectedCaseId="exp-a1" />
    );
    // La fila seleccionada debe tener bg-blue-50
    const selectedRow = container.querySelector('tr.bg-blue-50');
    expect(selectedRow).toBeTruthy();
  });

  it('debe mostrar "Sel." en el botón del caso seleccionado', () => {
    render(
      <GccCasosPanel {...defaultProps} selectedCaseId="exp-a1" />
    );
    expect(screen.getByText('Sel.')).toBeInTheDocument();
  });

  // ── Ordenamiento ──

  it('debe ordenar casos alfabéticamente por nombre', () => {
    const { container } = render(<GccCasosPanel {...defaultProps} />);
    const rows = container.querySelectorAll('tbody tr');
    // Disponibles primero (A-Z): Andrés Soto, Camila Rojas
    // Luego activos (A-Z): Diego Vera, Elena Díaz, María López
    const names = Array.from(rows).map(
      (row) => row.querySelectorAll('td')[1]?.textContent
    );
    expect(names[0]).toBe('Andrés Soto');
    expect(names[1]).toBe('Camila Rojas');
    expect(names[2]).toBe('Diego Vera');
    expect(names[3]).toBe('Elena Díaz');
    expect(names[4]).toBe('María López');
  });
});
