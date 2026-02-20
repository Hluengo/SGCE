/**
 * GccMechanismSelector.test.tsx
 * Unit tests for GccMechanismSelector component
 * Enterprise standard - Full coverage for mechanism selection widget
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GccMechanismSelector } from './GccMechanismSelector';
import type { MecanismoGCC } from './index';

describe('GccMechanismSelector', () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    value: null as MecanismoGCC | null,
    onChange: mockOnChange,
    disabled: false,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Renderizado básico', () => {
    it('debería renderizar sin errores', () => {
      const { container } = render(<GccMechanismSelector {...defaultProps} />);
      expect(container).toBeTruthy();
    });

    it('debería renderizar los 3 mecanismos disponibles', () => {
      render(<GccMechanismSelector {...defaultProps} />);
      
      expect(screen.getByText('Mediación')).toBeInTheDocument();
      expect(screen.getByText('Conciliación')).toBeInTheDocument();
      expect(screen.getByText('Arbitraje')).toBeInTheDocument();
    });

    it('debería mostrar descripciones de cada mecanismo', () => {
      render(<GccMechanismSelector {...defaultProps} />);
      
      expect(screen.getByText('Tercero neutral facilitador')).toBeInTheDocument();
      expect(screen.getByText('Propuestas de solución')).toBeInTheDocument();
      expect(screen.getByText('Resolución institucional')).toBeInTheDocument();
    });

    it('debería renderizar todos los botones como role="radio"', () => {
      render(<GccMechanismSelector {...defaultProps} />);
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(3);
    });
  });

  describe('Selección de mecanismos', () => {

    it('debería llamar onChange al hacer clic en Mediación', () => {
      render(<GccMechanismSelector {...defaultProps} />);
      
      const mediacionBtn = screen.getByLabelText(/Mediación/i);
      fireEvent.click(mediacionBtn);
      
      expect(mockOnChange).toHaveBeenCalledWith('MEDIACION');
    });

    it('debería llamar onChange al hacer clic en Conciliación', () => {
      render(<GccMechanismSelector {...defaultProps} />);
      
      const conciliacionBtn = screen.getByLabelText(/Conciliación/i);
      fireEvent.click(conciliacionBtn);
      
      expect(mockOnChange).toHaveBeenCalledWith('CONCILIACION');
    });

    it('debería llamar onChange al hacer clic en Arbitraje', () => {
      render(<GccMechanismSelector {...defaultProps} />);
      
      const arbitrajeBtn = screen.getByLabelText(/Arbitraje/i);
      fireEvent.click(arbitrajeBtn);
      
      expect(mockOnChange).toHaveBeenCalledWith('ARBITRAJE_PEDAGOGICO');
    });
  });

  describe('Estado visual de selección', () => {
    it('debería resaltar Mediación cuando está seleccionada', () => {
      const { container } = render(
        <GccMechanismSelector {...defaultProps} value="MEDIACION" />
      );
      
      const selectedButton = container.querySelector('.bg-blue-50.border-blue-500');
      expect(selectedButton).toBeInTheDocument();
      expect(selectedButton?.textContent).toContain('Mediación');
    });

    it('debería mostrar checkmark cuando un mecanismo está seleccionado', () => {
      render(<GccMechanismSelector {...defaultProps} value="MEDIACION" />);
      
      // El checkmark está presente en el contenido del botón seleccionado
      const selectedButton = screen.getByRole('radio', { checked: true });
      expect(selectedButton.textContent).toContain('✓');
    });

    it('NO debería resaltar ningún mecanismo cuando value es null', () => {
      const { container } = render(<GccMechanismSelector {...defaultProps} value={null} />);
      
      const selectedButtons = container.querySelectorAll('.bg-blue-50.border-blue-500');
      expect(selectedButtons).toHaveLength(0);
    });
  });

  describe('Estado deshabilitado', () => {
    it('debería deshabilitar todos los botones cuando disabled=true', () => {
      render(<GccMechanismSelector {...defaultProps} disabled={true} />);
      
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('NO debería llamar onChange cuando disabled=true', () => {
      render(<GccMechanismSelector {...defaultProps} disabled={true} />);
      
      const mediacionBtn = screen.getByLabelText(/Mediación/i);
      fireEvent.click(mediacionBtn);
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('debería aplicar estilos de deshabilitado', () => {
      const { container } = render(<GccMechanismSelector {...defaultProps} disabled={true} />);
      
      const disabledButton = container.querySelector('button[role="radio"]:disabled');
      expect(disabledButton).toBeTruthy();
      expect(disabledButton?.className).toContain('disabled:opacity-50');
      expect(disabledButton?.className).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('Iconos', () => {
    it('debería renderizar iconos para todos los mecanismos', () => {
      const { container } = render(<GccMechanismSelector {...defaultProps} />);
      
      const icons = container.querySelectorAll('svg');
      // 3 mecanismos con iconos
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Estilos condicionales', () => {
    it('debería aplicar clases hover cuando no está deshabilitado', () => {
      const { container } = render(<GccMechanismSelector {...defaultProps} />);
      
      const button = container.querySelector('button');
      expect(button?.className).toContain('hover:');
    });

    it('debería aplicar border diferente para mecanismo seleccionado', () => {
      const { container } = render(
        <GccMechanismSelector {...defaultProps} value="CONCILIACION" />
      );
      
      const selectedButton = container.querySelector('.border-blue-500');
      expect(selectedButton).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('debería manejar cambios rápidos de selección', () => {
      render(<GccMechanismSelector {...defaultProps} />);
      
      const radioButtons = screen.getAllByRole('radio');
      
      fireEvent.click(radioButtons[0]);
      fireEvent.click(radioButtons[1]);
      fireEvent.click(radioButtons[2]);
      
      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });

    it('debería manejar mecanismo inválido en value', () => {
      // @ts-expect-error Testing invalid value
      const { container } = render(<GccMechanismSelector {...defaultProps} value="INVALID" />);
      
      // No debería mostrar ningún mecanismo como seleccionado
      const selectedButtons = container.querySelectorAll('.bg-blue-50.border-blue-500');
      expect(selectedButtons).toHaveLength(0);
    });
  });
});
