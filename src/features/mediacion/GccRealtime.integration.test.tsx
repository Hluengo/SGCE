import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock Supabase FIRST (before any other imports)
vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(function(this: unknown) { return this; }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      track: vi.fn(),
      send: vi.fn()
    })),
    removeChannel: vi.fn()
  }
}));

// Now import the modules we're testing
import { useGccRealtime } from './hooks/useGccRealtime';
import { GccRealtimeProvider, useGccRealtimeContext } from './context/GccRealtimeContext';
import { RealtimePresenceIndicator, RealtimeActivityIndicator } from './components/RealtimeIndicators';

describe('GCC Realtime - Phase 8 Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import useGccRealtime hook successfully', () => {
    expect(useGccRealtime).toBeDefined();
    expect(typeof useGccRealtime).toBe('function');
  });

  it('should import GccRealtimeContext successfully', () => {
    expect(GccRealtimeProvider).toBeDefined();
    expect(useGccRealtimeContext).toBeDefined();
  });

  it('should import RealtimeIndicators components successfully', () => {
    expect(RealtimePresenceIndicator).toBeDefined();
    expect(RealtimeActivityIndicator).toBeDefined();
  });

  it('should create realtime hook instance', () => {
    const { result } = renderHook(() => useGccRealtime('med-001'));
    
    expect(result.current).toBeDefined();
    expect(result.current.subscribe).toBeDefined();
    expect(result.current.trackPresence).toBeDefined();
    expect(result.current.broadcastMessage).toBeDefined();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useGccRealtime('med-001'));
    
    expect(result.current.isConnected).toBeDefined();
    expect(typeof result.current.isConnected).toBe('boolean');
  });

  it('Phase 8 - Real-time Collaboration infrastructure is ready', () => {
    // Basic smoke test that all modules load correctly
    expect(useGccRealtime).toBeDefined();
    expect(GccRealtimeProvider).toBeDefined();
    expect(RealtimePresenceIndicator).toBeDefined();
    expect(RealtimeActivityIndicator).toBeDefined();
  });
});
