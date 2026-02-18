/* eslint-disable no-restricted-globals */
// pdf.worker.ts - Web Worker for PDF generation
// This worker runs in a separate thread to avoid blocking the main UI

// Import html2pdf in worker context
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface GeneratePdfMessage {
  type: 'generate';
  html: string;
  options: any;
  id: string;
}

self.onmessage = async (event: MessageEvent<GeneratePdfMessage>) => {
  const { type, html, options, id } = event.data;

  if (type !== 'generate') {
    self.postMessage({ type: 'error', error: 'Unknown message type', id });
    return;
  }

  try {
    // Create a temporary container in worker context (if DOM is available)
    // Note: In a true Web Worker, DOM is not available. 
    // html2pdf.js requires DOM access, so we need to use a different approach.
    // For now, this is a placeholder that would work in a "worker-like" environment.
    
    // Generate PDF from HTML string
    const blob = await html2pdf()
      .set(options)
      .from(html)
      .outputPdf('blob');

    // Send the blob back to the main thread
    self.postMessage({ 
      type: 'success', 
      blob, 
      id 
    });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error', 
      id 
    });
  }
};

export {};
