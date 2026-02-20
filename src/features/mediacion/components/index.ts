/**
 * Exports de componentes GCC
 */

// Regular exports - Componentes principales
export { GccCasosPanel } from './GccCasosPanel';
export { GccSalaMediacion } from './GccSalaMediacion';
export { GccCompromisos } from './GccCompromisos';
export { GccResolucion } from './GccResolucion';
export { WizardModal } from './WizardModal';

// Nuevos componentes reutilizables
export { GccMetricsBar } from './GccMetricsBar';
export { GccMechanismSelector } from './GccMechanismSelector';
export { GccDashboard } from './GccDashboard';
export { LazyComponentLoading } from './LazyComponentLoading';
export { GccDerivacionForm } from './GccDerivacionForm';
export { GccResultadoForm } from './GccResultadoForm';
export type { DerivacionCompletaPayload, ResultadoCompletoPayload } from '../types';

// Nuevos paneles por mecanismo (Phase 8)
export { GccNegociacionPanel } from './GccNegociacionPanel';
export { GccMediacionPanel } from './GccMediacionPanel';
export { GccConciliacionPanel } from './GccConciliacionPanel';
export { GccArbitrajePanel } from './GccArbitrajePanel';

// Router de paneles - Enrutamiento inteligente por mecanismo
export { GccPanelRouter, type Compromiso, type NuevoCompromiso, type MecanismoGCC } from './GccPanelRouter';

// Sección de Conformidad Circular 782 (reutilizable)
export { GccCircular782Section, type EscenarioProcedencia } from './GccCircular782Section';

// Nota: wrappers lazy removidos del barrel porque no se usan en runtime.
// Mantenerlos exportados aquí forzaba mezcla static+dynamic imports y anulaba el code-splitting.
