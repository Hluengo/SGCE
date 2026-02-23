/**
 * Template para Oficio de Derivación a Red de Protección
 * Following the format required by Chilean Education authorities
 * and Circular 781/782 guidelines
 */

import { DocumentBranding, escapeHtml } from './baseTemplate';

export interface OficioDerivacionData {
  nombreEstablecimiento: string;
  direccionEstablecimiento: string;
  telefonoEstablecimiento: string;
  emailEstablecimiento: string;
  rbd?: string;
  nombreEstudiante: string;
  rutEstudiante?: string;
  curso?: string;
  fechaNacimiento?: string;
  numeroOficio: string;
  fechaDerivacion: string;
  institucionDestino: 'OPD' | 'COSAM' | ' TRIBUNAL' | 'SALUD';
  nombreInstitucionDestino: string;
  motivoDerivacion: string;
  urgencia: 'BAJA' | 'MEDIA' | 'ALTA';
  observaciones?: string;
  nombreProfesional: string;
  cargoProfesional?: string;
}

const INSTITUCION_LABELS: Record<string, string> = {
  'OPD': 'Oficina de Proteccion de Derechos',
  'COSAM': 'Centro de Salud Mental',
  'SALUD': 'Servicio de Salud',
  ' TRIBUNAL': 'Tribunal de Familia'
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getUrgenciaLabel(urgencia: string): string {
  switch (urgencia) {
    case 'ALTA': return 'URGENTE';
    case 'MEDIA': return 'Prioritaria';
    case 'BAJA': return 'Programable';
    default: return '';
  }
}

export function oficioDerivacionTemplate(
  branding: DocumentBranding | null,
  data: OficioDerivacionData
): string {
  const b = branding || {};
  const colorPrimario = b.color_primario ?? '#0b5cff';
  const colorTexto = b.color_texto ?? '#111827';
  const logo = b.logo_url ? `<img src="${b.logo_url}" class="logo" alt="logo"/>` : '';
  
  const institucionLabel = INSTITUCION_LABELS[data.institucionDestino] || data.nombreInstitucionDestino;
  const urgenciaLabel = getUrgenciaLabel(data.urgencia);
  const fechaFormateada = formatDate(data.fechaDerivacion);
  
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Oficio de Derivacion - ${escapeHtml(data.numeroOficio)}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    :root{
      --color-primario: ${colorPrimario};
      --color-texto: ${colorTexto};
    }
    * { box-sizing: border-box; }
    body{ 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      color: var(--color-texto); 
      font-size: 12px;
      line-height: 1.5;
    }
    .documento{ max-width: 190mm; margin: 0 auto; padding: 0; }
    .encabezado{ display: flex; align-items: center; border-bottom: 4px solid var(--color-primario); padding-bottom: 15px; margin-bottom: 25px; }
    .logo{ max-height: 70px; margin-right: 20px; }
    .titulo-institucion{ margin: 0; font-size: 18px; color: var(--color-primario); font-weight: 700; }
    .subtitulo{ margin: 0; font-size: 11px; color: rgba(0,0,0,0.6); }
    .numero-oficio { text-align: right; margin-bottom: 20px; }
    .numero-oficio .label { font-size: 10px; text-transform: uppercase; color: rgba(0,0,0,0.5); letter-spacing: 1px; }
    .numero-oficio .value { font-size: 16px; font-weight: 700; color: var(--color-primario); }
    .titulo-documento{ color: var(--color-primario); font-size: 16px; text-transform: uppercase; margin: 25px 0; text-align: center; font-weight: 700; letter-spacing: 2px; }
    .seccion { margin-bottom: 20px; }
    .seccion-titulo { font-size: 11px; text-transform: uppercase; color: var(--color-primario); font-weight: 700; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
    .seccion-contenido { padding-left: 10px; }
    .campo { display: flex; margin-bottom: 8px; }
    .campo-label { font-weight: 600; min-width: 140px; color: rgba(0,0,0,0.7); }
    .campo-valor { flex: 1; }
    .urgencia-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .urgencia-alta { background-color: #fee2e2; color: #dc2626; }
    .urgencia-media { background-color: #fef3c7; color: #d97706; }
    .urgencia-baja { background-color: #dcfce7; color: #16a34a; }
    .sello { border: 2px solid var(--color-primario); border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0; background-color: rgba(0,0,0,0.02); }
    .sello-texto { font-size: 12px; font-weight: 600; color: var(--color-primario); text-transform: uppercase; letter-spacing: 1px; }
    .firma { margin-top: 40px; display: flex; justify-content: space-between; gap: 40px; }
    .firma-bloque { flex: 1; text-align: center; padding-top: 50px; border-top: 1px solid #374151; }
    .firma-nombre { font-weight: 600; font-size: 11px; margin-top: 8px; }
    .firma-cargo { font-size: 10px; color: rgba(0,0,0,0.6); }
    .pie-pagina{ margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 9px; text-align: center; color: rgba(0,0,0,0.5); }
    .footer-legal { font-size: 8px; color: rgba(0,0,0,0.4); margin-top: 5px; text-align: justify; }
  </style>
</head>
<body>
  <div class="documento">
    <div class="encabezado">
      ${logo}
      <div>
        <h1 class="titulo-institucion">${escapeHtml(b.nombre_publico || data.nombreEstablecimiento)}</h1>
        <p class="subtitulo">Departamento de Convivencia Escolar</p>
      </div>
    </div>
    <div class="numero-oficio">
      <div class="label">Numero de Oficio</div>
      <div class="value">${escapeHtml(data.numeroOficio)}</div>
    </div>
    <h2 class="titulo-documento">Oficio de Derivacion</h2>
    <div class="seccion">
      <div class="seccion-titulo">I. Identificacion del Establecimiento</div>
      <div class="seccion-contenido">
        <div class="campo"><span class="campo-label">Establecimiento:</span><span class="campo-valor"><strong>${escapeHtml(data.nombreEstablecimiento)}</strong></span></div>
        <div class="campo"><span class="campo-label">Direccion:</span><span class="campo-valor">${escapeHtml(data.direccionEstablecimiento)}</span></div>
        <div class="campo"><span class="campo-label">Telefono:</span><span class="campo-valor">${escapeHtml(data.telefonoEstablecimiento)}</span></div>
        <div class="campo"><span class="campo-label">Email:</span><span class="campo-valor">${escapeHtml(data.emailEstablecimiento)}</span></div>
        ${data.rbd ? `<div class="campo"><span class="campo-label">RBD:</span><span class="campo-valor">${escapeHtml(data.rbd)}</span></div>` : ''}
      </div>
    </div>
    <div class="seccion">
      <div class="seccion-titulo">II. Identificacion del Nino/Nina o Adolescente</div>
      <div class="seccion-contenido">
        <div class="campo"><span class="campo-label">Nombre:</span><span class="campo-valor"><strong>${escapeHtml(data.nombreEstudiante)}</strong></span></div>
        ${data.rutEstudiante ? `<div class="campo"><span class="campo-label">RUT:</span><span class="campo-valor">${escapeHtml(data.rutEstudiante)}</span></div>` : ''}
        ${data.curso ? `<div class="campo"><span class="campo-label">Curso:</span><span class="campo-valor">${escapeHtml(data.curso)}</span></div>` : ''}
        ${data.fechaNacimiento ? `<div class="campo"><span class="campo-label">Fecha de Nacimiento:</span><span class="campo-valor">${formatDate(data.fechaNacimiento)}</span></div>` : ''}
      </div>
    </div>
    <div class="seccion">
      <div class="seccion-titulo">III. Detalle de la Derivacion</div>
      <div class="seccion-contenido">
        <div class="campo"><span class="campo-label">Fecha de Derivacion:</span><span class="campo-valor">${fechaFormateada}</span></div>
        <div class="campo"><span class="campo-label">Institucion Destino:</span><span class="campo-valor"><strong>${institucionLabel}</strong></span></div>
        <div class="campo"><span class="campo-label">Nivel de Urgencia:</span><span class="campo-valor"><span class="urgencia-badge ${data.urgencia === 'ALTA' ? 'urgencia-alta' : data.urgencia === 'MEDIA' ? 'urgencia-media' : 'urgencia-baja'}">${urgenciaLabel}</span></span></div>
        <div class="campo"><span class="campo-label">Motivo:</span><span class="campo-valor">${escapeHtml(data.motivoDerivacion)}</span></div>
        ${data.observaciones ? `<div class="campo"><span class="campo-label">Observaciones:</span><span class="campo-valor">${escapeHtml(data.observaciones)}</span></div>` : ''}
      </div>
    </div>
    <div class="sello">
      <div class="sello-texto">Documento generado conforme a normativa vigente</div>
      <div style="font-size: 9px; color: rgba(0,0,0,0.5); margin-top: 5px;">Circulares N 781 y N 782 - Superintendencia de Educacion</div>
    </div>
    <div class="firma">
      <div class="firma-bloque"><div class="firma-nombre">${escapeHtml(data.nombreProfesional)}</div><div class="firma-cargo">${escapeHtml(data.cargoProfesional || 'Profesional de Convivencia Escolar')}</div></div>
      <div class="firma-bloque"><div class="firma-nombre"> </div><div class="firma-cargo">Receptor/a</div></div>
    </div>
    <div class="pie-pagina">
      <div>${escapeHtml(data.direccionEstablecimiento)} | ${escapeHtml(data.telefonoEstablecimiento)} | ${escapeHtml(data.emailEstablecimiento)}</div>
      <div class="footer-legal">Este documento contiene informacion sensible y reservada conforme a la Ley N 21.430 sobre garantias de la infancia y adolescencia. Su distribucion esta restringida a los profesionales autorizados.</div>
    </div>
  </div>
</body>
</html>`;
}

export default oficioDerivacionTemplate;
