import { useMemo, useState, useCallback, useEffect } from 'react';
import type { Expediente } from '@/types';

/**
 * Hook personalizado para filtrar y buscar expedientes
 * Proporciona funcionalidad de búsqueda por múltiples campos
 */
export const useExpedientes = (expedientes: Expediente[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(Date.now());

  // Actualizar now cada minuto para evitar recalculos innecesarios
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, []);

  /**
   * Filtra expedientes según el término de búsqueda
   * Busca en: nombre estudiante, folio, gravedad, etapa
   */
  const filteredExpedientes = useMemo(() => {
    if (!searchTerm.trim()) return expedientes;
    
    const term = searchTerm.toLowerCase();
    return expedientes.filter(exp => 
      exp.nnaNombre.toLowerCase().includes(term) ||
      exp.id.toLowerCase().includes(term) ||
      exp.gravedad.toLowerCase().includes(term) ||
      exp.etapa.toLowerCase().includes(term)
    );
  }, [expedientes, searchTerm]);

  /**
   * Calcula estadísticas KPI de los expedientes
   * Memoizado para evitar recalculos en cada render
   */
  const kpis = useMemo(() => {
    const cuarentaYOchoHorasMs = 48 * 60 * 60 * 1000;

    return {
      activos: filteredExpedientes.filter(e => 
        e.etapa !== 'CERRADO_SANCION' && 
        e.etapa !== 'CERRADO_GCC'
      ).length,
      vencimientosCriticos: filteredExpedientes.filter(e => {
        if (e.etapa === 'CERRADO_SANCION' || e.etapa === 'CERRADO_GCC') return false;
        const limite = new Date(e.plazoFatal).getTime();
        const diff = limite - now;
        return diff > 0 && diff < cuarentaYOchoHorasMs;
      }).length,
      acuerdosGCC: filteredExpedientes.filter(e => 
        e.etapa === 'CERRADO_GCC'
      ).length,
      total: filteredExpedientes.length,
    };
  }, [filteredExpedientes, now]);

  /**
   * Resetea el término de búsqueda
   */
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filteredExpedientes,
    kpis,
    clearSearch,
  };
};

export default useExpedientes;
