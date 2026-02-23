# Sistema de Generación de Documentos PDF

Módulo completo para generar documentos oficiales con branding institucional en formato PDF.

## 📦 Instalación

Las dependencias ya están configuradas en `package.json`:
- `dompurify` - Sanitización de HTML
- `@supabase/supabase-js` - Invocación de Edge Function para render PDF

## 🚀 Uso Rápido

### Opción 1: Cliente (Recomendado)

```tsx
import { usePdfGenerator, baseTemplate } from '@/features/documentos';

function MiComponente() {
  const { generatePdfFromHtml } = usePdfGenerator();

  const handleGenerar = async () => {
    const branding = {
      nombre_publico: 'Mi Colegio',
      logo_url: 'https://...',
      color_primario: '#0b5cff',
    };
    
    const contenido = `<p>Contenido del documento...</p>`;
    const html = baseTemplate(branding, 'Título del Documento', contenido);
    
    const blob = await generatePdfFromHtml(html, {
      filename: 'mi_documento.pdf',
    });
    
    // Descargar
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi_documento.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={handleGenerar}>Generar PDF</button>;
}
```

### Opción 2: Servidor (Para documentos pesados)

```tsx
import { useServerPdfGenerator } from '@/features/documentos/hooks/useServerPdfGenerator';

function MiComponente() {
  const { generatePdfFromHtml } = useServerPdfGenerator();
  
  // Mismo uso que la opción 1
  // Se procesa en Supabase Edge Function
}
```

**Nota:** La Edge Function `generate-pdf` ya está implementada; requiere configurar secretos `PDF_RENDERER_URL` (y opcional `PDF_RENDERER_TOKEN`).

### Opción 3: Web Worker (Experimental)

```tsx
import { useWorkerPdfGenerator } from '@/features/documentos/hooks/useWorkerPdfGenerator';

// Similar a opción 1, pero actualmente es placeholder
// El flujo activo usa server-side rendering vía Edge Function
```

## 📄 Plantillas Disponibles

### Plantilla Base

```tsx
import { baseTemplate } from '@/features/documentos/templates/baseTemplate';

const html = baseTemplate(branding, 'Título', '<p>Contenido</p>');
```

### Crear Plantilla Personalizada

```tsx
// src/features/documentos/templates/MiPlantilla.ts
import { baseTemplate, DocumentBranding } from './baseTemplate';

export function plantillaActa(
  branding: DocumentBranding,
  datos: { fecha: string; participantes: string[] }
) {
  const contenido = `
    <div>
      <p><strong>Fecha:</strong> ${datos.fecha}</p>
      <h3>Participantes</h3>
      <ul>
        ${datos.participantes.map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>
  `;
  
  return baseTemplate(branding, 'ACTA DE REUNIÓN', contenido);
}
```

## 🎨 Personalización

### Opciones de PDF

```tsx
const opciones = {
  filename: 'documento.pdf',
  jsPDF: {
    format: 'a4', // o 'letter'
    orientation: 'portrait', // o 'landscape'
  },
};

const blob = await generatePdfFromHtml(html, opciones);
```

### Branding Personalizado

```tsx
const branding = {
  nombre_publico: 'Nombre del Colegio',
  logo_url: 'https://ejemplo.com/logo.png',
  color_primario: '#0b5cff',
  color_secundario: '#64748b',
  color_texto: '#111827',
  direccion: 'Calle Falsa 123',
  telefono: '+56 9 1234 5678',
  email: 'contacto@colegio.cl',
  web: 'www.colegio.cl',
};
```

## 🧪 Tests

```bash
# Ejecutar todos los tests del módulo
npm test -- src/features/documentos

# Ejecutar un test específico
npm test -- src/features/documentos/hooks/usePdfGenerator.test.ts
```

## 📚 Storybook

```bash
# Iniciar Storybook
npm run storybook

# Ver componente de ejemplo
# Navegar a: Features/Documentos/DocumentGeneratorExample
```

## 🔒 Seguridad

El HTML se sanitiza automáticamente con DOMPurify antes de generar el PDF:

```tsx
import { sanitizeHtml } from '@/features/documentos';

const htmlLimpio = sanitizeHtml('<script>alert(1)</script><p>Hola</p>');
// Resultado: '<p>Hola</p>'
```

## 📋 Tipos de Documentos Sugeridos

Según el plan original, estos son los documentos a implementar:

- ✅ Plantilla base (implementado)
- ⏳ Acta de Procedimiento
- ⏳ Resolución Disciplinaria
- ⏳ Constancia de Conducta
- ⏳ Constancia de Taller
- ⏳ Reporte de Incidente
- ⏳ Constancia de Derivación
- ⏳ Acta de Compromiso
- ⏳ Recomendación

## 🚧 Roadmap

### Fase Actual: Fundamentos ✅
- [x] Hook `usePdfGenerator`
- [x] Plantilla base HTML/CSS
- [x] Sanitización HTML
- [x] Tests unitarios
- [x] Story de Storybook
- [x] Estructura para Worker/Server

### Próxima Fase: Plantillas Específicas
- [ ] Implementar 3 plantillas de documentos
- [ ] Componente `DocumentForm` para entrada de datos
- [ ] Componente `DocumentPreview` para vista previa

### Fase Futura: Integración
- [ ] Integrar en vistas existentes (ExpedienteDetail, etc.)
- [ ] Sistema de plantillas guardadas en DB
- [ ] Generación por lotes

## 🐛 Problemas Conocidos

1. **HTMLCanvasElement warning en tests**: Normal en jsdom, no afecta producción.
2. **Web Worker limitado**: No está habilitado aún; usar Edge Function.
3. **CORS con imágenes**: Si el logo falla, usar proxy o base64.

## 📞 Soporte

Para dudas, revisar:
- [DOCUMENT_GENERATION_SYSTEM.md](../../../plans/DOCUMENT_GENERATION_SYSTEM.md) - Especificación completa
- Tests en `__tests__/` - Ejemplos de uso
- Stories en Storybook - Demos interactivas
