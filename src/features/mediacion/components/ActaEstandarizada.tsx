import React, { useMemo, useRef, useState } from 'react';
import { X, Download, Printer, FileText, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { Expediente } from '@/types';

interface ActaCompromiso {
  id: string;
  descripcion: string;
  fechaCumplimiento: string;
  responsable: string;
  completado: boolean;
}

interface ActaEstandarizadaProps {
  isOpen: boolean;
  onClose: () => void;
  numeroActa: string;
  establecimientoNombre: string;
  caso: Expediente;
  mecanismo: 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO';
  estado: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  responsableNombre: string;
  fechaSesion?: string;
  detallePrincipal?: string;
  compromisos: ActaCompromiso[];
}

const mecanismoLabel: Record<ActaEstandarizadaProps['mecanismo'], string> = {
  MEDIACION: 'Mediacion',
  CONCILIACION: 'Conciliacion',
  ARBITRAJE_PEDAGOGICO: 'Arbitraje Pedagogico',
};

function formatoFechaCL(fecha?: string): string {
  if (!fecha) return 'No registrada';
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return fecha;
  return parsed.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export const ActaEstandarizada: React.FC<ActaEstandarizadaProps> = ({
  isOpen,
  onClose,
  numeroActa,
  establecimientoNombre,
  caso,
  mecanismo,
  estado,
  responsableNombre,
  fechaSesion,
  detallePrincipal,
  compromisos,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const acuerdosTexto = useMemo(() => {
    if (detallePrincipal?.trim()) return detallePrincipal.trim();
    if (compromisos.length === 0) return 'No se registran acuerdos especificos en este cierre.';
    return compromisos.map((c, i) => `${i + 1}. ${c.descripcion}`).join('\n');
  }, [detallePrincipal, compromisos]);

  const handlePrint = () => {
    const node = contentRef.current;
    if (!node) return;

    const sanitizedContent = DOMPurify.sanitize(node.innerHTML, {
      USE_PROFILES: { html: true }
    });

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('sandbox', 'allow-modals allow-same-origin');
    iframe.srcdoc = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${numeroActa}</title>
        <style>
          @page { size: A4; margin: 16mm; }
          body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #0f172a; }
          .doc { max-width: 210mm; margin: 0 auto; }
          .heading-font { font-family: 'Segoe UI', Roboto, Arial, sans-serif; }
        </style>
      </head>
      <body>
        <div class="doc">${sanitizedContent}</div>
      </body>
      </html>
    `;

    const cleanup = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        cleanup();
        return;
      }
      frameWindow.focus();
      frameWindow.print();
      window.setTimeout(cleanup, 1000);
    };

    document.body.appendChild(iframe);
  };

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 8,
          filename: `${numeroActa}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(contentRef.current)
        .save();
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-5xl max-h-screen rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase">Vista Previa del Acta</h2>
              <p className="text-xs text-slate-500 font-medium">Num. {numeroActa}</p>
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
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-200 p-6 md:p-8 print:bg-white print:p-0">
          <div className="mx-auto w-full max-w-[210mm]">
            <div className="bg-white shadow-lg origin-top scale-[0.86] md:scale-[0.9] print:scale-100 print:shadow-none aspect-[1/1.41] print:aspect-auto">
              <div ref={contentRef} className="h-full p-8 md:p-10 text-[12px] leading-relaxed text-slate-900 font-serif print:block">
                <header className="border-b-[3px] border-blue-600 pb-4 mb-6">
                  <p className="text-2xl leading-none font-black tracking-tight text-blue-700 font-sans">{establecimientoNombre}</p>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide font-sans">Departamento de Convivencia Escolar</p>
                </header>

                <div className="text-right mb-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-sans">Numero de Acta</p>
                  <p className="text-xl font-black text-blue-700 font-sans">{numeroActa}</p>
                </div>

                <h1 className="text-center text-[18px] font-black text-blue-700 uppercase tracking-[0.18em] mb-6 font-sans">
                  Acta de Mediacion Estandar
                </h1>

                <section className="mb-5">
                  <h2 className="text-[11px] uppercase tracking-[0.14em] font-black text-blue-700 border-b border-slate-200 pb-1 mb-2 font-sans">
                    I. Identificacion del Establecimiento
                  </h2>
                  <p><strong>Establecimiento:</strong> {establecimientoNombre}</p>
                  <p><strong>Folio de expediente:</strong> {caso.id}</p>
                  <p><strong>Mecanismo aplicado:</strong> {mecanismoLabel[mecanismo]}</p>
                  <p><strong>Fecha de sesion:</strong> {formatoFechaCL(fechaSesion || caso.fechaInicio)}</p>
                </section>

                <section className="mb-5">
                  <h2 className="text-[11px] uppercase tracking-[0.14em] font-black text-blue-700 border-b border-slate-200 pb-1 mb-2 font-sans">
                    II. Identificacion de las Partes
                  </h2>
                  <p><strong>Parte A:</strong> {caso.nnaNombre}</p>
                  <p><strong>Curso:</strong> {caso.nnaCurso || 'No informado'}</p>
                  <p><strong>Parte B:</strong> {caso.nnaNombreB || 'No registrada'}</p>
                  <p><strong>Curso Parte B:</strong> {caso.nnaCursoB || 'No informado'}</p>
                </section>

                <section className="mb-5">
                  <h2 className="text-[11px] uppercase tracking-[0.14em] font-black text-blue-700 border-b border-slate-200 pb-1 mb-2 font-sans">
                    III. Acuerdos Alcanzados
                  </h2>
                  <p className="whitespace-pre-wrap">{acuerdosTexto}</p>
                  {compromisos.length > 0 && (
                    <div className="mt-3">
                      {compromisos.map((compromiso, idx) => (
                        <p key={compromiso.id}>
                          <strong>{idx + 1}.</strong> {compromiso.descripcion} (Responsable: {compromiso.responsable || 'No definido'}; Plazo: {compromiso.fechaCumplimiento || 'No definido'})
                        </p>
                      ))}
                    </div>
                  )}
                </section>

                <section className="mb-5">
                  <h2 className="text-[11px] uppercase tracking-[0.14em] font-black text-blue-700 border-b border-slate-200 pb-1 mb-2 font-sans">
                    IV. Analisis Tecnico
                  </h2>
                  <p>
                    Se deja constancia del proceso de gestion colaborativa del conflicto, conforme a Circular 782.
                    El estado de cierre del proceso corresponde a: <strong>{estado}</strong>.
                  </p>
                </section>

                <section className="border border-blue-300 rounded-lg p-3 mb-6 bg-blue-50/40 text-center">
                  <p className="text-[11px] font-black tracking-[0.12em] uppercase text-blue-700 font-sans">
                    Documento generado conforme a normativa vigente
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-sans">
                    Circular 782 - Superintendencia de Educacion
                  </p>
                </section>

                <section className="grid grid-cols-2 gap-8 mt-10 mb-6">
                  <div className="pt-12 border-t border-slate-400 text-center">
                    <p className="font-semibold">{responsableNombre}</p>
                    <p className="text-[10px] text-slate-500">Profesional Responsable</p>
                  </div>
                  <div className="pt-12 border-t border-slate-400 text-center">
                    <p className="font-semibold">Constancia Digital</p>
                    <p className="text-[10px] text-slate-500">Registro institucional</p>
                  </div>
                </section>

                <section className="mt-auto border-t border-slate-200 pt-3 text-[10px] text-slate-600">
                  <p>
                    Clausula de cierre legal: la presente acta se registra para efectos de cumplimiento, trazabilidad y ejecutabilidad institucional.
                    En lo que corresponda al mecanismo aplicado, se considera como antecedente de cosa juzgada interna y titulo ejecutivo administrativo escolar.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-500">Formato estandar legal de Acta GCC</p>
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

export default ActaEstandarizada;


