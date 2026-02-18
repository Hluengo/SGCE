# 🚀 Inicio Rápido - Generación de PDFs

## 1. Las dependencias ya están instaladas ✅

```bash
# Verificar instalación
npm list html2pdf.js html2canvas dompurify
```

## 2. Ver demo en Storybook

```powershell
npm run storybook
```

Navegar a: **Features → Documentos → DocumentGeneratorExample**

## 3. Ejecutar tests

```powershell
npm test -- src/features/documentos
```

**Resultado esperado:** ✅ 8 tests passing

## 4. Usar en tu componente

```tsx
import { usePdfGenerator, baseTemplate } from '@/features/documentos';

function MiComponente() {
  const { generatePdfFromHtml } = usePdfGenerator();

  const generarPDF = async () => {
    const branding = {
      nombre_publico: 'Mi Colegio',
      color_primario: '#0b5cff',
    };
    
    const html = baseTemplate(branding, 'MI DOCUMENTO', '<p>Hola mundo</p>');
    const blob = await generatePdfFromHtml(html);
    
    // Descargar
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={generarPDF}>📄 Generar PDF</button>;
}
```

## 5. Compilar proyecto

```powershell
npm run build
```

**Estado:** ✅ Compilación exitosa (verificado)

---

## 📚 Más Información

- [README completo](../src/features/documentos/README.md)
- [Resumen ejecutivo](./PDF_GENERATION_SUMMARY.md)
- [Implementación detallada](./DOCUMENT_GENERATION_IMPLEMENTATION.md)
- [Plan original](../plans/DOCUMENT_GENERATION_SYSTEM.md)

---

**¡Todo listo para usar! 🎉**
