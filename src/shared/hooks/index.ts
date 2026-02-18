 // Custom Hooks - Hooks reutilizables
export { default as useAuth } from './useAuth';
export { default as useExpedientes } from './useExpedientes';
export { default as useOverflowDetection } from './useOverflowDetection';
export { default as usePagination } from './usePagination';
export { default as useDebounce, useDebouncedCallback } from './useDebounce';
export { useExpedienteHistorial } from './useExpedienteHistorial';
export { default as useGccMetrics } from './useGccMetrics';

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
