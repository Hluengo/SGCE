import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores.
 * Retorna el valor después de un delay sin cambios.
 * @param value - Valor a debouncear
 * @param delay - Delay en milisegundos (default: 500)
 * @returns Valor debounceado
 */
export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancelar timeout si el valor cambia
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para debounce de funciones callback.
 * Útil para eventos de input que no deben ejecutarse inmediatamente.
 * @param callback - Función a debouncear
 * @param delay - Delay en milisegundos (default: 500)
 * @returns Función debounceada
 */
export const useDebouncedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 500
): T => {
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCallback = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback as T;
};

export default useDebounce;
