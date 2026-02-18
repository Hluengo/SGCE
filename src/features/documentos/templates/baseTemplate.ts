export interface DocumentBranding {
  nombre_publico?: string;
  logo_url?: string | null;
  color_primario?: string;
  color_secundario?: string;
  color_texto?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  web?: string;
}

export function baseTemplate(branding: DocumentBranding | null, title: string, contentHtml: string) {
  const b = branding || {};
  const colorPrimario = b.color_primario ?? '#0b5cff';
  const colorTexto = b.color_texto ?? '#111827';
  const logo = b.logo_url ? `<img src="${b.logo_url}" class="logo" alt="logo"/>` : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    :root{
      --color-primario: ${colorPrimario};
      --color-texto: ${colorTexto};
    }
    body{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: var(--color-texto); }
    .documento{ max-width: 180mm; margin: 0 auto; padding: 0; }
    .encabezado{ display:flex; align-items:center; border-bottom: 3px solid var(--color-primario); padding-bottom: 12px; margin-bottom: 18px; }
    .logo{ max-height: 72px; margin-right: 16px; }
    .titulo-institucion{ margin:0; font-size:18px; color:var(--color-primario); }
    .subtitulo{ margin:0; font-size:12px; color:rgba(0,0,0,0.6); }
    .titulo-documento{ color:var(--color-primario); font-size:20px; text-transform:uppercase; margin:18px 0; }
    .contenido{ line-height:1.6; text-align:justify; font-size:12.5px; }
    .firma{ margin-top:36px; display:flex; justify-content:space-between; }
    .pie-pagina{ margin-top:28px; border-top:1px solid #e5e7eb; padding-top:8px; font-size:10px; text-align:center; color:rgba(0,0,0,0.6); }
  </style>
</head>
<body>
  <div class="documento">
    <div class="encabezado">
      ${logo}
      <div>
        <h1 class="titulo-institucion">${escapeHtml(b.nombre_publico ?? '')}</h1>
        <p class="subtitulo">Dirección de Convivencia Escolar</p>
      </div>
    </div>

    <h2 class="titulo-documento">${escapeHtml(title)}</h2>

    <div class="contenido">
      ${contentHtml}
    </div>

    <div class="firma">
      <div class="firma-bloque">&nbsp;</div>
      <div class="firma-bloque">&nbsp;</div>
    </div>

    <div class="pie-pagina">
      <div>${escapeHtml(b.direccion ?? '')} | ${escapeHtml(b.telefono ?? '')} | ${escapeHtml(b.email ?? '')}</div>
      <div>Página <!-- page numbers injected by PDF processor --> </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default baseTemplate;
