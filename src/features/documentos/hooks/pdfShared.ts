import DOMPurify from 'dompurify';

type PdfOrientation = 'portrait' | 'landscape';

interface PdfJsOptions {
  unit?: 'mm' | 'pt' | 'px';
  format?: 'a4' | 'letter' | [number, number];
  orientation?: PdfOrientation;
}

interface PdfRenderOptions {
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
  render: PdfRenderOptions;
  image: PdfImageOptions;
}>;

export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
