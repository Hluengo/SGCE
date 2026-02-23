// useWorkerPdfGenerator.ts - Hook for PDF generation using Web Worker
import { useCallback, useRef } from 'react';
import type { PdfOptions } from './pdfShared';

interface WorkerMessage {
  type: 'success' | 'error';
  blob?: Blob;
  error?: string;
  id: string;
}

/**
 * Hook for generating PDFs using a Web Worker (experimental)
 * Current app strategy is server-side rendering via Edge Function.
 * This hook remains as a placeholder for a future worker-capable pipeline.
 */
export function useWorkerPdfGenerator() {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacks = useRef<Map<string, { resolve: (blob: Blob) => void; reject: (error: Error) => void }>>(
    new Map()
  );

  const initWorker = useCallback(() => {
    if (workerRef.current) return;

    try {
      // In production, you'd use a proper worker build
      // For now, this is a placeholder
      // Example: workerRef.current = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url));
      
      // Placeholder - worker setup would go here
      const worker: Worker | null = null;
      
      if (worker) {
        // @ts-ignore - Worker is null in placeholder, real worker would have onmessage
        worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
          const { type, blob, error, id } = event.data;
          const callbacks = pendingCallbacks.current.get(id);

          if (!callbacks) return;

          if (type === 'success' && blob) {
            callbacks.resolve(blob);
          } else if (type === 'error') {
            callbacks.reject(new Error(error || 'Worker failed'));
          }

          pendingCallbacks.current.delete(id);
        };
      }
      
      workerRef.current = worker;
    } catch (err) {
      console.warn('Worker initialization failed, will fall back to main thread');
    }
  }, []);

  const generatePdfFromHtml = useCallback(
    async (_html: string, _options: PdfOptions = {}): Promise<Blob> => {
      throw new Error('Worker PDF generation is not enabled. Use server-side PDF generation.');
    },
    []
  );

  return { generatePdfFromHtml, initWorker } as const;
}

export default useWorkerPdfGenerator;
