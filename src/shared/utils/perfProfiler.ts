import type { ProfilerOnRenderCallback } from 'react';

type PerfEntry = {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interaction?: string;
};

declare global {
  interface Window {
    __SGCE_PERF__?: PerfEntry[];
  }
}

const DEFAULT_THRESHOLD_MS = 8;

export const isPerfProfilerEnabled = (): boolean =>
  Boolean(import.meta.env.DEV && import.meta.env.VITE_PERF_PROFILE === 'true');

const pushPerfEntry = (entry: PerfEntry) => {
  if (typeof window === 'undefined') return;
  const perf = (window.__SGCE_PERF__ ??= []);
  perf.push(entry);
  if (perf.length > 200) perf.shift();
};

export const createRenderProfiler = (
  id: string,
  thresholdMs: number = DEFAULT_THRESHOLD_MS
): ProfilerOnRenderCallback => {
  return (componentId, phase, actualDuration, baseDuration, startTime, commitTime) => {
    if (!isPerfProfilerEnabled()) return;
    if (actualDuration < thresholdMs) return;

    const entry: PerfEntry = {
      id: componentId || id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    };

    pushPerfEntry(entry);
    console.debug('[Perf][Render]', entry);
  };
};

export const trackInteraction = (name: string) => {
  if (!isPerfProfilerEnabled() || typeof performance === 'undefined') return;
  performance.mark(`${name}:start`);
};

export const trackInteractionEnd = (name: string) => {
  if (!isPerfProfilerEnabled() || typeof performance === 'undefined') return;
  const start = `${name}:start`;
  const end = `${name}:end`;
  performance.mark(end);
  try {
    performance.measure(name, start, end);
    const [measure] = performance.getEntriesByName(name).slice(-1);
    if (measure?.duration !== undefined) {
      console.debug('[Perf][Interaction]', { name, duration: measure.duration });
    }
  } catch {
    // ignore missing marks
  } finally {
    performance.clearMarks(start);
    performance.clearMarks(end);
    performance.clearMeasures(name);
  }
};

export const trackAsyncInteraction = async <T>(
  name: string,
  work: () => Promise<T>
): Promise<T> => {
  trackInteraction(name);
  try {
    return await work();
  } finally {
    trackInteractionEnd(name);
  }
};

