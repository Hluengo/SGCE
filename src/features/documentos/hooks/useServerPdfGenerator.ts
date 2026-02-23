// useServerPdfGenerator.ts - Hook for server-side PDF generation via Supabase Edge Function
import { useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { sanitizeHtml, PdfOptions } from './pdfShared';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Hook for generating PDFs using server-side rendering
 * This approach is better for complex documents and doesn't block the UI
 */
export function useServerPdfGenerator() {
  const generatePdfFromHtml = useCallback(
    async (html: string, options: PdfOptions = {}): Promise<Blob> => {
      const sanitized = sanitizeHtml(html);
      const filename = options.filename || 'document.pdf';

      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data, error } = await supabase.functions.invoke('generate-pdf', {
          body: {
            html: sanitized,
            options: {
              filename,
              format: options.jsPDF?.format || 'a4',
              orientation: options.jsPDF?.orientation || 'portrait',
            },
          },
        });

        if (error) {
          throw new Error(`Server error: ${error.message}`);
        }

        if (data instanceof Blob) {
          return data;
        }

        if (data instanceof ArrayBuffer) {
          return new Blob([data], { type: 'application/pdf' });
        }

        if (data instanceof Uint8Array) {
          return new Blob([data.buffer], { type: 'application/pdf' });
        }

        if (data && typeof data === 'object' && 'pdfBase64' in data) {
          const base64 = String((data as { pdfBase64: string }).pdfBase64);
          const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
          return new Blob([bytes], { type: 'application/pdf' });
        }

        throw new Error('Invalid PDF response from server');
        
      } catch (err) {
        console.error('Server-side PDF generation failed:', err);
        throw err;
      }
    },
    []
  );

  return { generatePdfFromHtml } as const;
}

export default useServerPdfGenerator;
