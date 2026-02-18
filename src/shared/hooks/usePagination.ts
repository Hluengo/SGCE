import { useState, useCallback, useMemo } from 'react';

/** Opciones para el hook de paginación */
interface UsePaginationOptions<T> {
  /** Elementos a paginar */
  items: T[];
  /** Número de elementos por página (default: 10) */
  pageSize?: number;
  /** Página inicial (default: 1) */
  initialPage?: number;
}

/** Resultado del hook de paginación */
interface UsePaginationResult<T> {
  /** Elementos de la página actual */
  currentItems: T[];
  /** Página actual */
  currentPage: number;
  /** Total de páginas */
  totalPages: number;
  /** Total de elementos */
  totalItems: number;
  /** Si hay página siguiente */
  hasNextPage: boolean;
  /** Si hay página anterior */
  hasPreviousPage: boolean;
  /** Funciones de navegación */
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  /** Cambiar tamaño de página */
  setPageSize: (size: number) => void;
}

/**
 * Hook para gestionar paginación de listas.
 * @param options - Opciones de configuración
 * @returns Métodos y estados para paginación
 */
export const usePagination = <T>(
  options: UsePaginationOptions<T>
): UsePaginationResult<T> => {
  const { items, pageSize: initialPageSize = 10, initialPage = 1 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = Math.ceil(items.length / pageSize) || 1;

  // Ajustar página actual si excede el total
  const safeCurrentPage = useMemo(() => {
    if (currentPage > totalPages) {
      return totalPages;
    }
    if (currentPage < 1) {
      return 1;
    }
    return currentPage;
  }, [currentPage, totalPages]);

  // Elementos de la página actual
  const currentItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, safeCurrentPage, pageSize]);

  // Navegación
  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (safeCurrentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [safeCurrentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (safeCurrentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [safeCurrentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    const newSize = Math.max(1, size);
    setPageSizeState(newSize);
    setCurrentPage(1); // Reset a primera página
  }, []);

  return {
    currentItems,
    currentPage: safeCurrentPage,
    totalPages,
    totalItems: items.length,
    hasNextPage: safeCurrentPage < totalPages,
    hasPreviousPage: safeCurrentPage > 1,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize
  };
};

export default usePagination;
