import { useState } from 'react';
import usePdfGenerator from '../hooks/usePdfGenerator';
import baseTemplate from '../../templates/baseTemplate';

export default function DocumentGeneratorExample() {
  const { generatePdfFromHtml } = usePdfGenerator();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const branding = { nombre_publico: 'Colegio Ejemplo', logo_url: null };
    const content = `<p>Documento de prueba generado el ${new Date().toLocaleString()}</p>`;
    const html = baseTemplate(branding, 'Documento de Prueba', content);
    try {
      const blob = await generatePdfFromHtml(html, { filename: 'documento_prueba.pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documento_prueba.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // ignore for example
      // eslint-disable-next-line no-console
      console.error('Error generando PDF', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">
        {loading ? 'Generando...' : 'Generar PDF de prueba'}
      </button>
    </div>
  );
}
