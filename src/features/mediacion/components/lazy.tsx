/**
 * lazy.ts - Dynamic imports con React.lazy() y Suspense
 * 
 * Proporciona componentes lazy-loaded para optimizar performance
 * Code splitting automático de componentes pesados
 */

import React, { Suspense } from 'react';
import { LazyComponentLoading } from './LazyComponentLoading';
import type { GccCompromisosProps } from './GccCompromisos';
import type { GccResolucionProps } from './GccResolucion';
import type { WizardModalProps } from './WizardModal';
import type { GccCasosPanelProps } from './GccCasosPanel';

// ==================== LAZY COMPONENTS ====================

/**
 * GccCompromisos - Lazy loaded
 * ~6KB (gzip)
 */
const GccCompromisosLazy = React.lazy(() =>
  import('./GccCompromisos').then(m => ({ default: m.GccCompromisos }))
);

export const GccCompromisosWithSuspense: React.FC<GccCompromisosProps> = (props) => (
  <Suspense fallback={<LazyComponentLoading label="Cargando compromisos..." />}>
    <GccCompromisosLazy {...props} />
  </Suspense>
);

/**
 * GccResolucion - Lazy loaded
 * ~4KB (gzip)
 */
const GccResolucionLazy = React.lazy(() =>
  import('./GccResolucion').then(m => ({ default: m.GccResolucion }))
);

export const GccResolucionWithSuspense: React.FC<GccResolucionProps> = (props) => (
  <Suspense fallback={<LazyComponentLoading label="Cargando acciones..." />}>
    <GccResolucionLazy {...props} />
  </Suspense>
);

/**
 * WizardModal - Lazy loaded (solo se carga cuando se necesita)
 * ~8KB (gzip)
 */
const WizardModalLazy = React.lazy(() =>
  import('./WizardModal').then(m => ({ default: m.WizardModal }))
);

export const WizardModalWithSuspense: React.FC<WizardModalProps> = (props) => (
  <Suspense fallback={<LazyComponentLoading label="Abriendo asistente..." />}>
    <WizardModalLazy {...props} />
  </Suspense>
);

/**
 * GccCasosPanel - Lazy loaded
 * ~7KB (gzip)
 */
const GccCasosPanelLazy = React.lazy(() =>
  import('./GccCasosPanel').then(m => ({ default: m.GccCasosPanel }))
);

export const GccCasosPanelWithSuspense: React.FC<GccCasosPanelProps> = (props) => (
  <Suspense fallback={<LazyComponentLoading label="Cargando casos..." />}>
    <GccCasosPanelLazy {...props} />
  </Suspense>
);

/**
 * GccSalaMediacion - NO lazy (es el componente principal)
 * NOTA: Este componente NO se lazy-load ya que es el orquestador
 * y necesita renderizarse inmediatamente
 */

// ==================== RE-EXPORTS ====================

export { LazyComponentLoading };
