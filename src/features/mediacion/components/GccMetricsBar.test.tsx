/**
 * GccMetricsBar.test.tsx
 * Unit tests for GccMetricsBar component
 * Actualizado para nuevo diseño grid: todas las métricas siempre visibles
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GccMetricsBar } from './GccMetricsBar';

describe('GccMetricsBar', () => {
  const defaultProps = {
    activos: 12,
    vencidos: 0,
    t1: 0,
    t2: 0,
    lastUpdated: new Date().toISOString(),
    isLoading: false,
  };

  describe('Renderizado básico', () => {
    it('debería renderizar sin errores', () => {
      const { container } = render(<GccMetricsBar {...defaultProps} />);
      expect(container).toBeTruthy();
    });

    it('debería mostrar el contador de casos activos', () => {
      render(<GccMetricsBar {...defaultProps} activos={25} />);
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Activos')).toBeInTheDocument();
    });

    it('debería mostrar estado de carga cuando isLoading es true', () => {
      render(<GccMetricsBar {...defaultProps} isLoading={true} />);
      expect(screen.getByText('Actualizando...')).toBeInTheDocument();
    });
  });

  describe('Vista grid con todas las métricas', () => {
    it('debería mostrar siempre las 4 métricas incluidas en el grid', () => {
      render(<GccMetricsBar {...defaultProps} />);
      
      // Verificar que las 4 métricas existen
      expect(screen.getByText('Activos')).toBeInTheDocument();
      expect(screen.getByText('Vence en 2 días')).toBeInTheDocument();
      expect(screen.getByText('Vence mañana')).toBeInTheDocument();
      expect(screen.getByText('Vencidos')).toBeInTheDocument();
    });

    it('debería mostrar valores de vencidos cuando hay casos', () => {
      render(<GccMetricsBar {...defaultProps} vencidos={5} />);
      expect(screen.getByText('Vencidos')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('debería mostrar valores de T1 (vence mañana) cuando hay casos', () => {
      render(<GccMetricsBar {...defaultProps} t1={3} />);
      expect(screen.getByText('Vence mañana')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('debería mostrar valores de T2 (vence en 2 días) siempre', () => {
      render(<GccMetricsBar {...defaultProps} t2={4} t1={2} />);
      expect(screen.getByText('Vence en 2 días')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      // Verificar que T1 también se muestra (ya no hay condicional)
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('debería mostrar todas las métricas con valor 0 cuando no hay urgencias', () => {
      render(<GccMetricsBar {...defaultProps} activos={10} vencidos={0} t1={0} t2={0} />);
      
      // Todas las métricas se muestran con sus labels
      expect(screen.getByText('Vencidos')).toBeInTheDocument();
      expect(screen.getByText('Vence mañana')).toBeInTheDocument();
      expect(screen.getByText('Vence en 2 días')).toBeInTheDocument();
      
      // Verificar que hay múltiples ceros (para vencidos, t1, t2)
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });

    it('debería mostrar múltiples valores simultáneamente', () => {
      render(<GccMetricsBar {...defaultProps} activos={10} vencidos={2} t1={3} t2={4} />);
      
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Formateo de timestamp', () => {
    it('debería formatear timestamp reciente en segundos', () => {
      const now = new Date();
      const fiveSecondsAgo = new Date(now.getTime() - 5000).toISOString();
      
      render(<GccMetricsBar {...defaultProps} lastUpdated={fiveSecondsAgo} />);
      expect(screen.getByText(/hace \d+s/)).toBeInTheDocument();
    });

    it('debería formatear timestamp en minutos', () => {
      const now = new Date();
      const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000).toISOString();
      
      render(<GccMetricsBar {...defaultProps} lastUpdated={threeMinutesAgo} />);
      expect(screen.getByText(/hace \d+m/)).toBeInTheDocument();
    });

    it('debería formatear timestamp en horas', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      
      render(<GccMetricsBar {...defaultProps} lastUpdated={twoHoursAgo} />);
      expect(screen.getByText(/hace \d+h/)).toBeInTheDocument();
    });

    it('debería mostrar mensaje cuando no hay timestamp', () => {
      render(<GccMetricsBar {...defaultProps} lastUpdated={null} />);
      expect(screen.getByText('Sin actualización')).toBeInTheDocument();
    });
  });

  describe('Estilos de severidad', () => {
    it('debería aplicar clases de estilo rojo para vencidos', () => {
      const { container } = render(<GccMetricsBar {...defaultProps} vencidos={2} />);
      const alertElement = container.querySelector('.bg-red-50');
      expect(alertElement).toBeInTheDocument();
    });

    it('debería aplicar clases de estilo rosa para T1', () => {
      const { container } = render(<GccMetricsBar {...defaultProps} t1={1} />);
      const alertElement = container.querySelector('.bg-rose-50');
      expect(alertElement).toBeInTheDocument();
    });

    it('debería aplicar clases de estilo ámbar para T2', () => {
      const { container } = render(<GccMetricsBar {...defaultProps} t2={3} />);
      const alertElement = container.querySelector('.bg-amber-50');
      expect(alertElement).toBeInTheDocument();
    });

    it('debería aplicar clases de estilo slate para activos', () => {
      const { container } = render(<GccMetricsBar {...defaultProps} />);
      const activosElement = container.querySelector('.bg-slate-50');
      expect(activosElement).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('debería manejar valores cero en todas las métricas', () => {
      render(<GccMetricsBar {...defaultProps} activos={0} vencidos={0} t1={0} t2={0} />);
      
      // Verificar que se muestran los labels incluso con 0
      expect(screen.getByText('Activos')).toBeInTheDocument();
      expect(screen.getByText('Vencidos')).toBeInTheDocument();
      expect(screen.getByText('Vence mañana')).toBeInTheDocument();
      expect(screen.getByText('Vence en 2 días')).toBeInTheDocument();
      
      // Verificar que hay múltiples ceros
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(4);
    });

    it('debería manejar números grandes', () => {
      render(<GccMetricsBar {...defaultProps} activos={9999} />);
      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    it('debería renderizar sin timestamp', () => {
      const { container } = render(<GccMetricsBar {...defaultProps} lastUpdated={null} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Responsive grid layout', () => {
    it('debería aplicar classes de grid responsive', () => {
      const { container } = render(<GccMetricsBar {...defaultProps} />);
      const gridElement = container.querySelector('.grid');
      
      expect(gridElement).toBeInTheDocument();
      expect(gridElement?.className).toContain('grid-cols-2'); // Mobile: 2 columnas
      expect(gridElement?.className).toContain('md:grid-cols-4'); // Desktop: 4 columnas
    });
  });
});
