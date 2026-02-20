import { useCallback } from 'react';
import DOMPurify from 'dompurify';
// html2pdf.js doesn't ship perfect TS types in many projects; ignore if needed
// @ts-ignore
import html2pdf from 'html2pdf.js';

type PdfOrientation = 'portrait' | 'landscape';

interface PdfJsOptions {
  unit?: 'mm' | 'pt' | 'px';
  format?: 'a4' | 'letter' | [number, number];
  orientation?: PdfOrientation;
}

interface PdfHtml2CanvasOptions {
  scale?: number;
  useCORS?: boolean;
}

interface PdfImageOptions {
  type?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export type PdfOptions = Partial<{
  filename: string;
  margin: number;
  jsPDF: PdfJsOptions;
  html2canvas: PdfHtml2CanvasOptions;
  image: PdfImageOptions;
}>;

export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

export function usePdfGenerator() {
  const generateHtml = useCallback((html: string) => {
    return sanitizeHtml(html);
  }, []);

  const generatePdfFromHtml = useCallback(async (html: string, options: PdfOptions = {}) => {
    const sanitized = generateHtml(html);

    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.height = '297mm';
    container.innerHTML = sanitized;
    document.body.appendChild(container);

    const defaultConfig = {
      margin: options.margin ?? 15,
      filename: options.filename ?? 'document.pdf',
      image: options.image ?? { type: 'jpeg', quality: 0.98 },
      html2canvas: options.html2canvas ?? { scale: 2, useCORS: true },
      jsPDF: options.jsPDF ?? { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    try {
      // html2pdf can accept an Element as source. Request a blob output.
      // @ts-ignore
      const blob: Blob = await html2pdf().set(defaultConfig).from(container).outputPdf('blob');
      return blob;
    } finally {
      // cleanup DOM
      if (container.parentNode) container.parentNode.removeChild(container);
    }
  }, [generateHtml]);

  return { generateHtml, generatePdfFromHtml } as const;
}

export default usePdfGenerator;
