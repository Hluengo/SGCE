import { useServerPdfGenerator } from '../../hooks/useServerPdfGenerator';
import { sanitizeHtml, type PdfOptions } from '../../hooks/pdfShared';

/**
 * Backward-compatible hook.
 * PDF generation now runs server-side through Supabase Edge Function.
 */
export function usePdfGenerator() {
  const { generatePdfFromHtml } = useServerPdfGenerator();
  const generateHtml = sanitizeHtml;
  return { generateHtml, generatePdfFromHtml } as const;
}

export { sanitizeHtml, type PdfOptions };
export default usePdfGenerator;
