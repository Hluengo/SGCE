/**
 * GccDashboard.test.tsx
 * Unit tests para el componente GccDashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GccDashboard } from './GccDashboard';
import * as hookModule from '@/shared/hooks/useGccDashboardMetrics';

vi.mock('@/shared/hooks/useGccDashboardMetrics');

describe('GccDashboard', () => {
  const mockMetrics = {
    activos: 25,
    vencidos: 3,
    t1: 2,
    t2: 4,
    acuerdoTotalPct: 45,
    acuerdoParcialPct: 30,
    sinAcuerdoPct: 25,
    mecanismos: [
      {
        mecanismo: 'MEDIACION' as const,
        count: 12,
        percentage: 48,
        trend: 'up' as const,
        trendValue: 15
      },
      {
        mecanismo: 'CONCILIACION' as const,
        count: 9,
        percentage: 36,
        trend: 'down' as const,
        trendValue: -10
      },
      {
        mecanismo: 'ARBITRAJE_PEDAGOGICO' as const,
        count: 4,
        percentage: 16,
        trend: 'stable' as const,
        trendValue: 0
      }
    ],
    totalMecanismosAdoptados: 25,
    mecanismoMasUsado: 'MEDIACION' as const,
    tasaAdopcionMecanismos: 85,
    comparacionPeriodoAnterior: {
      activos: 10,
      vencidos: -5,
      mecanismos: 12
    },
    registrosMecanismos: [
      {
        casoId: 'EXP-001',
        mecanismo: 'MEDIACION' as const,
        descripcion: 'Diálogo facilitado por tercero imparcial para acuerdos voluntarios y reparación.',
        clasificacion: 'Mecanismo restaurativo voluntario',
        estadoImplementacion: 'Implementado',
        estadoProceso: 'acuerdo_total',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.spyOn(hookModule, 'useGccDashboardMetrics').mockReturnValue({
      metrics: mockMetrics,
      isLoading: false,
      refresh: vi.fn(),
      lastUpdatedAt: new Date().toISOString()
    });
  });

  describe('Renderizado básico', () => {
    it('debería renderizar la sección de comparación', () => {
      render(<GccDashboard />);
      expect(screen.getByText('Comparación con Período Anterior')).toBeInTheDocument();
    });

    it('debería renderizar la sección de mecanismos adoptados', () => {
      render(<GccDashboard />);
      expect(screen.getByText('Mecanismos GCC Adoptados')).toBeInTheDocument();
    });

    it('debería renderizar todas las secciones principales', () => {
      render(<GccDashboard />);
      
      expect(screen.getByText('Comparación con Período Anterior')).toBeInTheDocument();
      expect(screen.getByText('Mecanismos GCC Adoptados')).toBeInTheDocument();
      expect(screen.getByText('Resultados de Mediación')).toBeInTheDocument();
    });
  });

  describe('KPIs principales', () => {
    it('debería mostrar el contador de casos activos', () => {
      render(<GccDashboard />);
      expect(screen.getAllByText('25').length).toBeGreaterThan(0);
      expect(screen.getByText('Casos Activos')).toBeInTheDocument();
    });

    it('debería mostrar casos vencidos', () => {
      render(<GccDashboard />);
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
      expect(screen.getByText('Casos Vencidos')).toBeInTheDocument();
    });

    it('debería mostrar alerta T1', () => {
      render(<GccDashboard />);
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
      expect(screen.getByText('Alerta T1')).toBeInTheDocument();
    });

    it('debería mostrar alerta T2', () => {
      render(<GccDashboard />);
      expect(screen.getAllByText('4').length).toBeGreaterThan(0);
      expect(screen.getByText('Alerta T2')).toBeInTheDocument();
    });
  });

  describe('Mecanismos adoptados', () => {
    it('debería mostrar el total de mecanismos adoptados', () => {
      render(<GccDashboard />);
      expect(screen.getAllByText('25').length).toBeGreaterThan(0);
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('debería mostrar la tasa de adopción', () => {
      render(<GccDashboard />);
      expect(screen.getByText('Tasa de Adopción')).toBeInTheDocument();
      expect(screen.getAllByText('85%').length).toBeGreaterThan(0);
    });

    it('debería mostrar el mecanismo más usado', () => {
      render(<GccDashboard />);
      expect(screen.getByText('Más Utilizado')).toBeInTheDocument();
      expect(screen.getAllByText(/Mediación/).length).toBeGreaterThan(0);
    });

    it('debería renderizar los 3 mecanismos respaldados por backend', () => {
      render(<GccDashboard />);
      
      expect(screen.getAllByText(/Mediación/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Conciliación/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Arbitraje/).length).toBeGreaterThan(0);
    });

    it('debería mostrar los contadores de cada mecanismo', () => {
      render(<GccDashboard />);
      
      expect(screen.getAllByText('12').length).toBeGreaterThan(0);  // Mediación
      expect(screen.getAllByText('9').length).toBeGreaterThan(0);   // Conciliación
      expect(screen.getAllByText('4').length).toBeGreaterThan(0);   // Arbitraje
    });

    it('debería mostrar los porcentajes de cada mecanismo', () => {
      render(<GccDashboard />);
      
      expect(screen.getByText('(48%)')).toBeInTheDocument(); // Mediación
      expect(screen.getByText('(36%)')).toBeInTheDocument(); // Conciliación
      expect(screen.getByText('(16%)')).toBeInTheDocument(); // Arbitraje
    });
  });

  describe('Indicadores de tendencia', () => {
    it('debería mostrar tendencias positivas con ícono up', () => {
      const { container } = render(<GccDashboard />);
      
      // Buscar elementos con TrendingUp (indicadores positivos)
      const upIcons = container.querySelectorAll('.lucide-trending-up');
      expect(upIcons.length).toBeGreaterThan(0);
    });

    it('debería mostrar tendencias negativas con ícono down', () => {
      const { container } = render(<GccDashboard />);
      
      // Buscar elementos con TrendingDown (indicadores negativos)
      const downIcons = container.querySelectorAll('.lucide-trending-down');
      expect(downIcons.length).toBeGreaterThan(0);
    });

    it('debería mostrar tendencias estables con ícono minus', () => {
      const { container } = render(<GccDashboard />);
      
      // Buscar elementos con Minus (indicadores estables)
      const minusIcons = container.querySelectorAll('.lucide-minus');
      expect(minusIcons.length).toBeGreaterThan(0);
    });

    it('debería mostrar valores de tendencia', () => {
      render(<GccDashboard />);
      
      expect(screen.getAllByText('15%').length).toBeGreaterThan(0); // Mediación up
      expect(screen.getAllByText('10%').length).toBeGreaterThan(0); // Conciliación down
    });
  });

  describe('Resultados de mediación', () => {
    it('debería mostrar porcentaje de acuerdos totales', () => {
      render(<GccDashboard />);
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Acuerdo Total')).toBeInTheDocument();
    });

    it('debería mostrar porcentaje de acuerdos parciales', () => {
      render(<GccDashboard />);
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('Acuerdo Parcial')).toBeInTheDocument();
    });

    it('debería mostrar porcentaje sin acuerdo', () => {
      render(<GccDashboard />);
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('Sin Acuerdo')).toBeInTheDocument();
    });
  });

  describe('Comparación con período anterior', () => {
    it('debería mostrar comparación en métricas', () => {
      render(<GccDashboard />);
      
      expect(screen.getAllByText(/vs\./i).length).toBeGreaterThan(0);
    });

    it('debería mostrar el cambio en casos activos', () => {
      render(<GccDashboard />);
      expect(screen.getAllByText('10%').length).toBeGreaterThan(0);
    });

    it('debería mostrar el cambio en mecanismos adoptados', () => {
      render(<GccDashboard />);
      expect(screen.getAllByText('12%').length).toBeGreaterThan(0);
    });
  });

  describe('Estado de carga', () => {
    it('debería mostrar "Actualizando..." cuando isLoading es true', () => {
      vi.spyOn(hookModule, 'useGccDashboardMetrics').mockReturnValue({
        metrics: mockMetrics,
        isLoading: true,
        refresh: vi.fn(),
        lastUpdatedAt: null
      });

      render(<GccDashboard />);
      expect(screen.getByText('Actualizando...')).toBeInTheDocument();
    });

    it('debería mostrar timestamp de actualización cuando no está cargando', () => {
      render(<GccDashboard />);
      expect(screen.getByText(/Actualizado hace/)).toBeInTheDocument();
    });
  });

  describe('Nota informativa', () => {
    it('debería mostrar información sobre actualización automática', () => {
      render(<GccDashboard />);
      expect(screen.getByText(/Datos actualizados en tiempo real/i)).toBeInTheDocument();
    });

    it('debería explicar el cálculo de tendencias', () => {
      render(<GccDashboard />);
      expect(screen.getByText(/Las tendencias se calculan comparando con el período de 30 días anterior/i)).toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    it('debería aplicar clases responsivas en secciones', () => {
      const { container } = render(<GccDashboard />);
      
      // Verificar que hay elementos con clases md:
      const responsiveElements = container.querySelectorAll('[class*="md:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    it('debería usar grid para distribuir tarjetas', () => {
      const { container } = render(<GccDashboard />);
      
      const gridElements = container.querySelectorAll('[class*="grid"]');
      expect(gridElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accesibilidad', () => {
    it('debería tener estructura semántica con sections', () => {
      const { container } = render(<GccDashboard />);
      
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(3);
    });

    it('debería tener headings con jerarquía correcta', () => {
      const { container } = render(<GccDashboard />);
      
      const h3s = container.querySelectorAll('h3');
      
      expect(h3s.length).toBeGreaterThan(0);
    });
  });
});
