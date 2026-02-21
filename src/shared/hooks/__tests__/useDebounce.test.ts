/**
 * useDebounce.test.ts
 * Tests para los hooks de debounce: useDebounce y useDebouncedCallback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe retornar el valor inicial inmediatamente', () => {
    const { result } = renderHook(() => useDebounce('hola', 500));
    expect(result.current).toBe('hola');
  });

  it('no debe actualizar el valor antes del delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'ab', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });

    expect(result.current).toBe('a');
  });

  it('debe actualizar el valor después del delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'abc', delay: 300 });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe('abc');
  });

  it('debe reiniciar el timer con cada cambio de valor', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    // Cambio rápido: a → ab → abc (cada uno antes del delay)
    rerender({ value: 'ab', delay: 300 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a'); // Todavía no actualizado

    rerender({ value: 'abc', delay: 300 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a'); // Timer reiniciado, todavía 'a'

    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('abc'); // 300ms desde último cambio
  });

  it('debe usar 500ms como delay por defecto', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'x' } }
    );

    rerender({ value: 'y' });
    act(() => { vi.advanceTimersByTime(400); });
    expect(result.current).toBe('x');

    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('y');
  });

  it('debe funcionar con tipos numéricos', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 42 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe(42);
  });

  it('debe funcionar con null y undefined', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 'algo' as string | null } }
    );

    rerender({ value: null });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBeNull();
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no debe ejecutar el callback inmediatamente', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current('arg1');
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('debe ejecutar el callback después del delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current('arg1');
    });

    act(() => { vi.advanceTimersByTime(300); });
    expect(callback).toHaveBeenCalledWith('arg1');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('debe cancelar la ejecución previa con llamadas rápidas', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => { result.current('a'); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { result.current('b'); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { result.current('c'); });
    act(() => { vi.advanceTimersByTime(300); });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('c');
  });
});
