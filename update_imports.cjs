
const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

// Map of old paths (relative to src/components usually) to new paths
const mappings = [
  // Context
  { old: /['"].*\/context\/ConvivenciaContext['"]/g, new: "'@/shared/context/ConvivenciaContext'" },
  { old: /['"].*\/utils\/useLocalDraft['"]/g, new: "'@/shared/utils/useLocalDraft'" },
  { old: /['"]\.\.\/types['"]/g, new: "'@/types'" },
  { old: /['"]\.\/types['"]/g, new: "'@/types'" },
  
  // Sidebar & Shared
  { old: /['"].*\/components\/Sidebar['"]/g, new: "'@/shared/components/Sidebar'" },
  { old: /['"].*\/components\/NormativeBadge['"]/g, new: "'@/shared/components/NormativeBadge'" },
  
  // Features
  { old: /['"].*\/components\/Dashboard['"]/g, new: "'@/features/dashboard/Dashboard'" },
  { old: /['"].*\/components\/DashboardAuditoriaSIE['"]/g, new: "'@/features/dashboard/DashboardAuditoriaSIE'" },
  { old: /['"].*\/components\/ExpedienteDetalle['"]/g, new: "'@/features/expedientes/ExpedienteDetalle'" },
  { old: /['"].*\/components\/ExpedienteWizard['"]/g, new: "'@/features/expedientes/ExpedienteWizard'" },
  { old: /['"].*\/components\/LegalAssistant['"]/g, new: "'@/features/legal/LegalAssistant'" },
  { old: /['"].*\/components\/CentroMediacionGCC['"]/g, new: "'@/features/mediacion/CentroMediacionGCC'" },
  { old: /['"].*\/components\/CalendarioPlazosLegales['"]/g, new: "'@/features/legal/CalendarioPlazosLegales'" },
  { old: /['"].*\/components\/BitacoraPsicosocial['"]/g, new: "'@/features/bitacora/BitacoraPsicosocial'" },
  { old: /['"].*\/components\/GestionEvidencias['"]/g, new: "'@/features/evidencias/GestionEvidencias'" },
  { old: /['"].*\/components\/SeguimientoApoyo['"]/g, new: "'@/features/apoyo/SeguimientoApoyo'" },
  { old: /['"].*\/components\/ExpedientesList['"]/g, new: "'@/features/expedientes/ExpedientesList'" },
  { old: /['"].*\/components\/BitacoraSalida['"]/g, new: "'@/features/bitacora/BitacoraSalida'" },
  { old: /['"].*\/components\/ArchivoDocumental['"]/g, new: "'@/features/archivo/ArchivoDocumental'" },
  { old: /['"].*\/components\/ReportePatio['"]/g, new: "'@/features/patio/ReportePatio'" },
  
  // Fix imports relative to new location
  // e.g. inside features/expedientes/ExpedienteWizard.tsx, it imports '../components/NormativeBadge'
  // which is now '../../shared/components/NormativeBadge' OR just use alias.
  // The regex above handles '../components/NormativeBadge' -> '@/shared/components/NormativeBadge'
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const mapping of mappings) {
        if (mapping.old.test(content)) {
          content = content.replace(mapping.old, mapping.new);
          changed = true;
        }
      }
      
      // Generic Fixes for relative imports that might be broken
      // e.g. import ... from '../context/...' inside a feature folder
      // Replace '../context/' with '@/shared/context/'
      if (content.match(/['"]\.\.\/context\//)) {
          content = content.replace(/['"]\.\.\/context\//g, "'@/shared/context/");
          changed = true;
      }
       if (content.match(/['"]\.\.\/utils\//)) {
          content = content.replace(/['"]\.\.\/utils\//g, "'@/shared/utils/");
          changed = true;
      }
      
      if (changed) {
        console.log(`Updating imports in ${fullPath}`);
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(srcDir);
