// useServerPdfGenerator.ts - Hook for server-side PDF generation via Supabase Edge Function
import { useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { sanitizeHtml, PdfOptions } from './usePdfGenerator';

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

      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data, error } = await supabase.functions.invoke('generate-pdf', {
          body: {
            html: sanitized,
            options: {
              filename: options.filename || 'document.pdf',
              format: options.jsPDF?.format || 'a4',
              orientation: options.jsPDF?.orientation || 'portrait',
            },
          },
        });

        if (error) {
          throw new Error(`Server error: ${error.message}`);
        }

        // If the function returns a blob or base64
        if (data instanceof Blob) {
          return data;
        }

        // If it returns base64 or URL, convert to blob
        throw new Error('PDF generation endpoint not yet implemented on server');
        
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
