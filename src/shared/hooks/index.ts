 // Custom Hooks - Hooks reutilizables
export { default as useAuth } from './useAuth';
export { default as useExpedientes } from './useExpedientes';
export { default as useOverflowDetection } from './useOverflowDetection';
export { default as usePagination } from './usePagination';
export { default as useDebounce, useDebouncedCallback } from './useDebounce';
export { useExpedienteHistorial } from './useExpedienteHistorial';
export { default as useGccMetrics } from './useGccMetrics';
export { useGccDashboardMetrics, type GccDashboardMetrics, type MecanismStats } from './useGccDashboardMetrics';
export { useGccForm, type GccFormState, type MecanismoGCC, type Compromiso } from './useGccForm';
export { useGccDerivacion, type DerivacionPayload } from './useGccDerivacion';
export { useGccCierre, type CierrePayload } from './useGccCierre';

// Tenant Hooks (Multi-Tenancy)
export {
  useTenantClient,
  useTenantAccess,
  useTenantQuery,
  useTenantSwitcher
} from './useTenantClient';

// Branding Hooks
export {
  useTenantBranding,
  useApplyBrandingStyles
} from './useTenantBranding';
