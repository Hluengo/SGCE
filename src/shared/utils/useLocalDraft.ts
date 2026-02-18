import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook para persistir datos en localStorage del navegador
 * Util para guardar estados de formularios parcialmente completados.
 *
 * Nota: el valor inicial puede ser un objeto literal creado en cada render.
 * Para evitar loops de render, no rehidratamos por cambios de `initialValue`,
 * solo cuando cambia la `key`.
 */
export function useLocalDraft<T>(key: string, initialValue: T) {
  const initialRef = useRef<T>(initialValue);

  // Mantener referencia al ultimo initialValue sin disparar setState.
  useEffect(() => {
    initialRef.current = initialValue;
  }, [initialValue]);

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // ignore
    }
    return initialValue;
  });

  // Rehidrata solo cuando cambia la key (ej. etapa/caso diferente).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setValue(JSON.parse(raw) as T);
        return;
      }
    } catch {
      // ignore
    }
    setValue(initialRef.current);
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  const clear = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    setValue(initialRef.current);
  }, [key]);

  return [value, setValue, clear] as const;
}

