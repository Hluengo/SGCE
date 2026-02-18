# Sistema de Generación de Documentos Oficiales

## 1. Resumen Ejecutivo

Este documento presenta la arquitectura técnica para implementar un sistema completo de generación de documentos oficiales en la aplicación de gestión de convivencia escolar. El sistema permitirá crear documentos profesionales con formato institucional, integrando automáticamente el branding del establecimiento.

### Objetivos Principales
- Generar documentos PDF con apariencia corporativa profesional
- Integrar automáticamente logo y colores institucionales
- Proporcionar plantillas para diferentes tipos de documentos
- Permitir personalización dinámica según el establecimiento

---

## 2. Análisis del Sistema Existente

### 2.1 Sistema de Branding Existente

El proyecto ya cuenta con un sistema de branding parcialmente implementado:

```typescript
// src/shared/hooks/useTenantBranding.ts
interface TenantBrandingConfig {
  id: string;
  establecimiento_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  color_texto: string;
  color_fondo: string;
  nombre_publico: string;
  tipografia_body: string;
  tipografia_heading: string;
}
```

**Fuente de datos**: Tabla `configuracion_branding` en Supabase
**Acceso**: RPC `get_tenant_branding(p_establecimiento_id)`

### 2.2 Vistas Candidatas para PDF

| Vista | Tipo de Documento Sugerido |
|-------|------------------------------|
| ExpedienteDetail | Acta de Procedimiento, Resolución, Recomendación |
| ListaReportesPatio | Reporte de Incidentes |
| RegistrarDerivacion | Constancia de Derivación |
| BitacoraPsicosocial | Constancia de Intervención |
| SeguimientoApoyo | Constancia de Apoyo |
| AdminColegios | Certificado de Matrícula |

---

## 3. Arquitectura Técnica

### 3.1 Estructura de Directorios Propuesta

```
src/
├── features/
│   └── documentos/
│       ├── components/
│       │   ├── DocumentGenerator.tsx    # Componente principal
│       │   ├── DocumentPreview.tsx       # Previsualización
│       │   ├── DocumentForm.tsx          # Formulario dinámico
│       │   └── ExportButton.tsx          # Botón de exportación
│       ├── templates/
│       │   ├── baseTemplate.ts           # Plantilla base HTML
│       │   ├── ActaProcedimiento.ts
│       │   ├── Resolucion.ts
│       │   ├── ConstanciaConducta.ts
│       │   ├── ConstanciaTaller.ts
│       │   ├── ReporteIncidente.ts
│       │   └── Derivacion.ts
│       ├── hooks/
│       │   ├── useDocumentBranding.ts   # Hook para branding de documentos
│       │   └── usePdfGenerator.ts        # Hook para generación PDF
│       ├── types/
│       │   └── index.ts                 # Tipos de documentos
│       └── index.ts
```

### 3.2 Componentes Principales

#### 3.2.1 Hook: useDocumentBranding

```typescript
// Extiende useTenantBranding con datos adicionales para documentos
interface DocumentBranding extends TenantBrandingConfig {
  direccion?: string;
  telefono?: string;
  email?: string;
  web?: string;
  rbd?: string;
}

export function useDocumentBranding(): {
  branding: DocumentBranding | null;
  isLoading: boolean;
}
```

#### 3.2.2 Componente: DocumentGenerator

```typescript
interface DocumentGeneratorProps {
  tipoDocumento: TipoDocumento;
  datos: DocumentData;
  onPreview?: () => void;
  onExport?: (blob: Blob) => void;
}
```

### 3.3 Tipos de Documentos Soportados

```typescript
type TipoDocumento = 
  | 'acta_procedimiento'      # Acta de reunión de convivencia
  | 'resolucion'              # Resolución disciplinaria
  | 'constancia_conducta'     # Certificado de buena conducta
  | 'constancia_taller'       # Constancia de participación
  | 'reporte_incidente'       # Reporte oficial de incidente
  | 'constancia_derivacion'   # Constancia de derivación
  | 'compromiso'              # Acta de compromiso
  | 'recomendacion'           # Recomendación disciplinaria
```

---

## 4. Especificación de Plantillas

### 4.1 Plantilla Base (HTML/CSS)

Cada documento seguirá una estructura HTML profesional:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --color-primario: #HEX;
      --color-secundario: #HEX;
      --color-texto: #HEX;
    }
    .documento {
      font-family: 'Tipografía', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .encabezado {
      display: flex;
      align-items: center;
      border-bottom: 3px solid var(--color-primario);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      max-height: 80px;
      margin-right: 20px;
    }
    .titulo-documento {
      color: var(--color-primario);
      font-size: 24px;
      text-transform: uppercase;
    }
    .contenido {
      line-height: 1.8;
      text-align: justify;
    }
    .firma {
      margin-top: 60px;
      display: flex;
      justify-content: space-around;
    }
    .pie-pagina {
      margin-top: 40px;
      border-top: 1px solid #ccc;
      padding-top: 15px;
      font-size: 10px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="documento">
    <!-- Encabezado con logo -->
    <div class="encabezado">
      <img src="logo_url" class="logo" />
      <div>
        <h1 class="titulo-institucion">Nombre Institución</h1>
        <p class="subtitulo">Dependencia: Dirección de Convivencia Escolar</p>
      </div>
    </div>
    
    <!-- Título del documento -->
    <h2 class="titulo-documento">TÍTULO DEL DOCUMENTO</h2>
    
    <!-- Contenido dinámico -->
    <div class="contenido">
      <!-- Datos del estudiante, cuerpo del documento, etc. -->
    </div>
    
    <!-- Firmas -->
    <div class="firma">
      <div class="firma-bloque">...</div>
      <div class="firma-bloque">...</div>
    </div>
    
    <!-- Pie de página -->
    <div class="pie-pagina">
      <p>Dirección: ... | Tel: ... | Email: ...</p>
      <p>Página X de Y</p>
    </div>
  </div>
</body>
</html>
```

### 4.2 Personalización por Tipo de Documento

| Documento | Campos Requeridos | Plantilla Específica |
|-----------|-------------------|---------------------|
| Acta Procedimiento | fecha, participantes, acuerdos | Tabla de acuerdos |
| Resolución | expediente, medida, considerandos | Numeración legal |
| Constancia Conducta | estudiante, periodo, observaciones | Formato certificado |
| Constancia Taller | estudiante, taller, horas | Tabla de actividades |
| Reporte Incidente | fecha, lugar, descripción, involucrados | Descripción detallada |
| Constancia Derivación | estudiante, institución destino, motivo | Datos de contacto |

---

## 5. Integración con Vistas Existentes

### 5.1 Patrón de Integración

Cada vista que necesite generar documentos seguirá este patrón:

```typescript
// Ejemplo en ExpedienteDetail.tsx
import { useDocumentGenerator } from '@/features/documentos';

// En el componente
const { generateDocument, isGenerating } = useDocumentGenerator();

const handleGenerarActa = async () => {
  const documento = await generateDocument('acta_procedimiento', {
    expediente: expedienteActual,
    estudiante: estudianteData,
    // ...otros datos
  });
  
  // Mostrar preview o descargar
  documento.preview(); // o documento.download();
};
```

### 5.2 Botón de Exportación

```typescript
// Componente reutilizable para añadir a cualquier vista
<ExportButton
  tiposDisponibles={['acta', 'resolucion', 'reporte']}
  onSelect={(tipo) => handleGenerarDocumento(tipo)}
  label="Generar Documento"
/>
```

---

## 6. Librería para PDF

### 6.1 Opciones Consideradas

| Librería | Ventajas | Desventajas |
|----------|----------|--------------|
| jsPDF | Ampliamente usada, buena documentación | Renderizado manual |
| html2pdf.js | Convierte HTML directamente | Dependencia de html2canvas |
| react-pdf | nativamente React | Curva de aprendizaje |
| @react-pdf/renderer | PDFs generation desde componentes React | Limitado para HTML complejo |

### 6.2 Recomendación: html2pdf.js

```typescript
import html2pdf from 'html2pdf.js';

export async function generarPdf(html: string, opciones?: Options): Promise<Blob> {
  const config = {
    margin: 10,
    filename: `${tipo_documento}_${fecha}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
    ...opciones
  };
  
  return html2pdf().set(config).from(html).outputPdf('blob');
}
```

---

## 7. Implementación por Fases

### Fase 1: Fundamentos ✅ COMPLETADA
- [x] Crear estructura de directorios
- [x] Implementar hook useDocumentBranding → usePdfGenerator
- [x] Crear plantilla base HTML
- [x] Integrar html2pdf.js
- [x] Añadir sanitización con DOMPurify
- [x] Tests unitarios (8 passing)
- [x] Story de Storybook
- [x] Documentación completa

**Estado:** Implementación funcional lista para usar  
**Fecha completada:** 18 de febrero de 2026  
**Ver:** [DOCUMENT_GENERATION_IMPLEMENTATION.md](../docs/DOCUMENT_GENERATION_IMPLEMENTATION.md)

### Fase 2: Documentos Básicos (Semana 2) ⏳ PENDIENTE
- [ ] Certificado de buena conducta
- [ ] Constancia de participación en talleres
- [ ] Reporte de incidente

### Fase 3: Documentos Legales (Semana 3) ⏳ PENDIENTE
- [ ] Acta de reunión de convivencia
- [ ] Resolución disciplinaria
- [ ] Constancia de derivación

### Fase 4: Integración (Semana 4) ⏳ PENDIENTE
- [ ] Agregar botones de exportación a vistas
- [ ] Previsualización en modal
- [ ] Mejoras de UX

---

## 8. Consideraciones Adicionales

### 8.1 Rendimiento
- Generar PDF de forma asíncrona para no bloquear UI
- Cachear datos de branding
- Usar web workers para PDFs grandes

### 8.2 Estilos
- Mantener consistencia con Tailwind del proyecto
- Soporte para impresión
- Responsive para previsualización

### 8.3 Seguridad
- Sanitizar HTML antes de generar PDF
- Validar datos del documento
- Control de acceso por roles

---

## 9. Próximos Pasos

1. Aprobar esta especificación
2. Iniciar implementación de Fase 1
3. Revisión de prototipos
4. Iteración basada en feedback
