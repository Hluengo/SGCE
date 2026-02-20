/**
 * OficioPreviewModal.tsx
 * Modal para previsualizar e imprimir el oficio de derivacion
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Printer, FileText, Loader2 } from 'lucide-react';
import { oficioDerivacionTemplate, OficioDerivacionData } from '../templates/oficioDerivacionTemplate';
import { DocumentBranding } from '../templates/baseTemplate';

interface OficioPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: OficioDerivacionData;
  branding: DocumentBranding | null;
}

const OficioPreviewModal: React.FC<OficioPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  branding
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    if (isOpen && data) {
      const html = oficioDerivacionTemplate(branding, data);
      setHtmlContent(html);
    }
  }, [isOpen, data, branding]);

  const handlePrint = () => {
    const printContent = containerRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permita ventanas emergentes para imprimir');
      return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownloadPdf = async () => {
    if (!containerRef.current) return;
    
    setIsGenerating(true);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      const element = containerRef.current;
      const filename = `Oficio_${data.numeroOficio || 'derivacion'}.pdf`;
      
      const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-5xl max-h-screen rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase">Vista Previa del Oficio</h2>
              <p className="text-xs text-slate-500 font-medium">Num. {data.numeroOficio || 'Sin numero'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase hover:bg-slate-300 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-slate-200 p-8">
          <div className="bg-white mx-auto shadow-lg" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
            <div ref={containerRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Documento generado conforme a Circulares N 781 y N 782 de la Superintendencia de Educacion
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase hover:bg-slate-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OficioPreviewModal;

