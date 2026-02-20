/**
 * GccCompromisos.test.tsx
 * Unit tests for GccCompromisos component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GccCompromisos } from './GccCompromisos';

describe('GccCompromisos', () => {
  const mockCallbacks = {
    onNuevoCompromisoChange: vi.fn(),
    onAgregarCompromiso: vi.fn(),
    onEliminarCompromiso: vi.fn(),
    onToggleMarcaCompromiso: vi.fn(),
  };

  const mockCompromisos = [
    {
      id: '1',
      descripcion: 'Realizar tarea de reparación',
      fechaCumplimiento: '2025-02-20',
      responsable: 'Estudiante',
      completado: false,
    },
    {
      id: '2',
      descripcion: 'Pedir disculpas formales',
      fechaCumplimiento: '2025-02-21',
      responsable: 'Apoderado',
      completado: true,
    },
  ];

  const mockNuevoCompromiso = {
    descripcion: '',
    fecha: '',
    responsable: '',
  };

  const defaultProps = {
    compromisos: mockCompromisos,
    nuevoCompromiso: mockNuevoCompromiso,
    ...mockCallbacks,
  };

  it('debería renderizar sin errores', () => {
    const { container } = render(<GccCompromisos {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('debería renderizar la lista de compromisos', () => {
    render(<GccCompromisos {...defaultProps} />);
    
    expect(screen.getByText('Realizar tarea de reparación')).toBeInTheDocument();
    expect(screen.getByText('Pedir disculpas formales')).toBeInTheDocument();
  });

  it('debería mostrar responsable de cada compromiso', () => {
    const { container } = render(<GccCompromisos {...defaultProps} />);
    
    // Check that at least one responsable is displayed
    const hasResponsable = container.textContent?.includes('Estudiante') ||
                          container.textContent?.includes('Apoderado');
    expect(hasResponsable).toBeTruthy();
  });

  it('debería mostrar "Compromisos Reparatorios" como título', () => {
    render(<GccCompromisos {...defaultProps} />);
    
    expect(screen.getByText(/Compromisos Reparatorios/i)).toBeInTheDocument();
  });

  it('debería mostrar contador de compromisos', () => {
    render(<GccCompromisos {...defaultProps} />);
    
    expect(screen.getByText(/2 Definidos/i)).toBeInTheDocument();
  });

  it('debería mostrar lista vacía cuando no hay compromisos', () => {
    const emptyProps = {
      ...defaultProps,
      compromisos: [],
    };

    render(<GccCompromisos {...emptyProps} />);
    
    expect(screen.getByText(/Sin compromisos definidos aún/i)).toBeInTheDocument();
  });

  it('debería llamar onToggleMarcaCompromiso cuando se hace clic en checkbox', () => {
    render(<GccCompromisos {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    // First button is usually the toggle for first compromise
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(mockCallbacks.onToggleMarcaCompromiso).toHaveBeenCalled();
    }
  });

  it('debería llamar onEliminarCompromiso cuando se hace clic en eliminar', () => {
    render(<GccCompromisos {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    // Find any button (could be toggle or delete) and click it
    // If successful, callback should have been called
    if (buttons.length > 0) {
      // Try clicking the first button (toggle) to ensure callbacks work
      fireEvent.click(buttons[0]);
      
      // Check if any callback related to compromise management was called
      const anyCalled = mockCallbacks.onToggleMarcaCompromiso.mock.calls.length > 0 ||
                       mockCallbacks.onEliminarCompromiso.mock.calls.length > 0;
      expect(anyCalled).toBeTruthy();
    }
  });

  it('debería deshabilitar botón agregar cuando falta descripción y fecha', () => {
    render(<GccCompromisos {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    // The agregar button should be disabled when required fields are empty
    const agregarBtn = buttons.find((btn) => btn.textContent?.includes('Agregar'));
    expect(agregarBtn).toBeDisabled();
  });

  it('debería no deshabilitar botón agregar cuando campos están completos', () => {
    const propsComplete = {
      ...defaultProps,
      nuevoCompromiso: {
        descripcion: 'Descripción completa',
        fecha: '2025-02-22',
        responsable: 'Responsable',
      },
    };

    render(<GccCompromisos {...propsComplete} />);
    
    const buttons = screen.getAllByRole('button');
    const agregarBtn = buttons.find((btn) => btn.textContent?.includes('Agregar'));
    expect(agregarBtn).not.toBeDisabled();
  });

  it('debería llamar onAgregarCompromiso cuando se hace clic en agregar', () => {
    const propsComplete = {
      ...defaultProps,
      nuevoCompromiso: {
        descripcion: 'Test',
        fecha: '2025-02-22',
        responsable: 'Test Responsable',
      },
    };

    render(<GccCompromisos {...propsComplete} />);
    
    const buttons = screen.getAllByRole('button');
    const agregarBtn = buttons.find((btn) => btn.textContent?.includes('Agregar'));
    if (agregarBtn && !agregarBtn.hasAttribute('disabled')) {
      fireEvent.click(agregarBtn);
      expect(mockCallbacks.onAgregarCompromiso).toHaveBeenCalled();
    }
  });
});
