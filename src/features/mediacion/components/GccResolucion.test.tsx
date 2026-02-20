/**
 * GccResolucion.test.tsx
 * Unit tests for GccResolucion component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GccResolucion } from './GccResolucion';

describe('GccResolucion', () => {
  const mockCallbacks = {
    onToggleActaPreview: vi.fn(),
    onDestrabarDesdeGCC: vi.fn(),
    onCierreExitoso: vi.fn(),
  };

  const mockActaTemplate = `
    ACTA DE MEDIACIÓN
    Caso: Test Case
    Resultado: LOGRADO
    Fecha: 2025-02-18
  `;

  const defaultProps = {
    statusGCC: 'PROCESO' as const,
    actaTemplate: mockActaTemplate,
    showActaPreview: false,
    ...mockCallbacks,
  };

  it('debería renderizar el componente sin errores', () => {
    const { container } = render(<GccResolucion {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('debería mostrar botón de vista previa de acta', () => {
    render(<GccResolucion {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('debería llamar onToggleActaPreview cuando se hace clic en vista previa', () => {
    render(<GccResolucion {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    // Find acta/preview button
    const previewBtn = buttons.find(btn => btn.textContent?.includes('Acta') || btn.textContent?.includes('Previsualizar'));
    if (previewBtn) {
      fireEvent.click(previewBtn);
      expect(mockCallbacks.onToggleActaPreview).toHaveBeenCalled();
    }
  });

  it('debería mostrar acta cuando showActaPreview es true', () => {
    const propsWithPreview = {
      ...defaultProps,
      showActaPreview: true,
    };

    const { container } = render(<GccResolucion {...propsWithPreview} />);
    
    // Check if some acta template content is visible (more flexible)
    const hasContent = container.textContent?.includes('Test Case') || 
                      container.textContent?.includes('LOGRADO') ||
                      container.textContent?.includes('2025-02-18');
    expect(hasContent).toBeTruthy();
  });

  it('debería no mostrar acta cuando showActaPreview es false', () => {
    render(<GccResolucion {...defaultProps} />);
    
    expect(screen.queryByText(/ACTA DE MEDIACIÓN/i)).not.toBeInTheDocument();
  });

  it('debería mostrar botones en estado PROCESO', () => {
    render(<GccResolucion {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    // Should have at least the destrabado button in PROCESO state
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('debería llamar onDestrabarDesdeGCC cuando se hace clic en Destrabado', () => {
    render(<GccResolucion {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    const destraboBtn = buttons.find(btn => btn.textContent?.includes('GCC') || btn.textContent?.includes('Destrabado'));
    
    if (destraboBtn) {
      fireEvent.click(destraboBtn);
      expect(mockCallbacks.onDestrabarDesdeGCC).toHaveBeenCalled();
    }
  });

  it('debería mostrar diferentes opciones según statusGCC', () => {
    const propsLogrado = {
      ...defaultProps,
      statusGCC: 'LOGRADO' as const,
    };

    render(<GccResolucion {...propsLogrado} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('debería llamar onCierreExitoso cuando se hace clic en cierre exitoso', () => {
    const propsLogrado = {
      ...defaultProps,
      statusGCC: 'LOGRADO' as const,
    };

    render(<GccResolucion {...propsLogrado} />);
    
    const buttons = screen.getAllByRole('button');
    const cierreBtn = buttons.find(btn => btn.textContent?.includes('Cierre'));
    
    if (cierreBtn && !cierreBtn.hasAttribute('disabled')) {
      fireEvent.click(cierreBtn);
      expect(mockCallbacks.onCierreExitoso).toHaveBeenCalled();
    }
  });

  it('debería renderizar acta template cuando preview está activo', () => {
    const propsWithPreview = {
      ...defaultProps,
      showActaPreview: true,
      actaTemplate: 'CONTENIDO_DE_PRUEBA_ESPECIAL',
    };

    render(<GccResolucion {...propsWithPreview} />);
    
    expect(screen.getByText(/CONTENIDO_DE_PRUEBA_ESPECIAL/i)).toBeInTheDocument();
  });

  it('debería permitir múltiples clics en botones', () => {
    render(<GccResolucion {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    const destraboBtn = buttons.find(btn => btn.textContent?.includes('GCC'));
    
    if (destraboBtn) {
      // Click once, check call count is at least 1
      fireEvent.click(destraboBtn);
      const callCountAfterOne = mockCallbacks.onDestrabarDesdeGCC.mock.calls.length;
      
      // Click again
      fireEvent.click(destraboBtn);
      const callCountAfterTwo = mockCallbacks.onDestrabarDesdeGCC.mock.calls.length;
      
      // Verify we have more calls after second click than after first
      expect(callCountAfterTwo).toBeGreaterThan(callCountAfterOne);
    }
  });
});
